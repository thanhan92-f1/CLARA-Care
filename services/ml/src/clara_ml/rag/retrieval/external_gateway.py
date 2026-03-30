from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError, as_completed
from time import perf_counter
from typing import Any
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from clara_ml.config import settings

from .domain import Document
from .text_utils import clean_text, first_text, query_terms


class ExternalSourceGateway:
    PUBMED_ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    PUBMED_ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    EUROPEPMC_SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    OPENALEX_WORKS_URL = "https://api.openalex.org/works"
    CROSSREF_WORKS_URL = "https://api.crossref.org/works"
    CLINICALTRIALS_V2_URL = "https://clinicaltrials.gov/api/v2/studies"
    OPENFDA_LABEL_URL = "https://api.fda.gov/drug/label.json"
    DAILYMED_DRUGNAME_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v1/drugname"

    @staticmethod
    def _fetch_json(
        url: str,
        timeout_seconds: float,
        *,
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any] | list[Any] | None:
        merged_headers = {"User-Agent": "CLARA-ML/0.1"}
        if headers:
            merged_headers.update(headers)
        request = Request(url, headers=merged_headers)
        with urlopen(request, timeout=max(timeout_seconds, 0.1)) as response:
            payload = response.read().decode("utf-8", errors="ignore")
        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            return None

    def retrieve_pubmed(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        if top_k <= 0:
            return []

        search_url = f"{self.PUBMED_ESEARCH_URL}?" + urlencode(
            {
                "db": "pubmed",
                "retmode": "json",
                "retmax": str(top_k),
                "sort": "relevance",
                "term": query,
            }
        )
        search_payload = self._fetch_json(search_url, timeout_seconds)
        if not isinstance(search_payload, dict):
            return []

        id_list = search_payload.get("esearchresult", {}).get("idlist", [])
        if not isinstance(id_list, list) or not id_list:
            return []

        summary_url = f"{self.PUBMED_ESUMMARY_URL}?" + urlencode(
            {
                "db": "pubmed",
                "retmode": "json",
                "id": ",".join(str(pmid) for pmid in id_list),
            }
        )
        summary_payload = self._fetch_json(summary_url, timeout_seconds)
        if not isinstance(summary_payload, dict):
            return []

        records = summary_payload.get("result", {})
        if not isinstance(records, dict):
            return []

        docs: list[Document] = []
        for pmid in id_list:
            record = records.get(str(pmid), {})
            if not isinstance(record, dict):
                continue

            title = str(record.get("title") or "").strip()
            if not title:
                continue

            journal = str(record.get("fulljournalname") or record.get("source") or "").strip()
            pub_date = str(record.get("pubdate") or "").strip()
            text = ". ".join(part for part in [title, journal, pub_date] if part)
            docs.append(
                Document(
                    id=f"pubmed-{pmid}",
                    text=text,
                    metadata={
                        "source": "pubmed",
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                        "score": 0.0,
                    },
                )
            )

        return docs

    def retrieve_europe_pmc(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        if top_k <= 0:
            return []

        search_url = f"{self.EUROPEPMC_SEARCH_URL}?" + urlencode(
            {
                "query": query,
                "format": "json",
                "pageSize": str(top_k),
                "resultType": "core",
            }
        )
        payload = self._fetch_json(search_url, timeout_seconds)
        if not isinstance(payload, dict):
            return []

        result_list = payload.get("resultList", {}).get("result", [])
        if not isinstance(result_list, list):
            return []

        docs: list[Document] = []
        for item in result_list:
            if not isinstance(item, dict):
                continue

            source = str(item.get("source") or "europepmc").strip().lower()
            source_id = str(item.get("id") or "").strip()
            title = str(item.get("title") or "").strip()
            if not source_id or not title:
                continue

            journal = str(item.get("journalTitle") or "").strip()
            pub_year = str(item.get("pubYear") or "").strip()
            text = ". ".join(part for part in [title, journal, pub_year] if part)
            if source == "med":
                url = f"https://pubmed.ncbi.nlm.nih.gov/{source_id}/"
            else:
                url = f"https://europepmc.org/article/{source.upper()}/{source_id}"
            docs.append(
                Document(
                    id=f"europepmc-{source}-{source_id}",
                    text=text,
                    metadata={"source": "europepmc", "url": url, "score": 0.0},
                )
            )

        return docs

    def retrieve_openalex(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        if top_k <= 0:
            return []

        search_url = f"{self.OPENALEX_WORKS_URL}?" + urlencode(
            {
                "search": query,
                "per-page": str(top_k),
                "sort": "relevance_score:desc",
            }
        )
        payload = self._fetch_json(search_url, timeout_seconds)
        if not isinstance(payload, dict):
            return []

        results = payload.get("results", [])
        if not isinstance(results, list):
            return []

        docs: list[Document] = []
        for item in results:
            if not isinstance(item, dict):
                continue

            openalex_id = first_text(item.get("id"))
            title = first_text(item.get("display_name"), item.get("title"))
            if not openalex_id or not title:
                continue

            year = first_text(item.get("publication_year"))
            host = item.get("primary_location", {}) if isinstance(item.get("primary_location"), dict) else {}
            url = first_text(host.get("landing_page_url"), host.get("pdf_url"), openalex_id)
            text = ". ".join(part for part in [title, year] if part)
            docs.append(
                Document(
                    id=f"openalex-{openalex_id.rsplit('/', 1)[-1]}",
                    text=text,
                    metadata={
                        "source": "openalex",
                        "url": url or openalex_id,
                        "score": 0.0,
                    },
                )
            )

        return docs

    def retrieve_crossref(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        if top_k <= 0:
            return []

        search_url = f"{self.CROSSREF_WORKS_URL}?" + urlencode(
            {"query.bibliographic": query, "rows": str(top_k), "sort": "relevance"}
        )
        payload = self._fetch_json(search_url, timeout_seconds)
        if not isinstance(payload, dict):
            return []

        items = payload.get("message", {}).get("items", [])
        if not isinstance(items, list):
            return []

        docs: list[Document] = []
        for item in items:
            if not isinstance(item, dict):
                continue

            doi = first_text(item.get("DOI"))
            titles = item.get("title", [])
            title = first_text(titles[0] if isinstance(titles, list) and titles else "")
            if not doi or not title:
                continue

            container = item.get("container-title", [])
            journal = first_text(container[0] if isinstance(container, list) and container else "")
            url = first_text(item.get("URL"), f"https://doi.org/{doi}")
            text = ". ".join(part for part in [title, journal] if part)
            docs.append(
                Document(
                    id=f"crossref-{doi.lower()}",
                    text=text,
                    metadata={"source": "crossref", "url": url, "score": 0.0},
                )
            )

        return docs

    def retrieve_clinicaltrials(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        if top_k <= 0:
            return []

        search_url = f"{self.CLINICALTRIALS_V2_URL}?" + urlencode(
            {"query.term": query, "pageSize": str(top_k), "format": "json"}
        )
        payload = self._fetch_json(search_url, timeout_seconds)
        if not isinstance(payload, dict):
            return []

        studies = payload.get("studies", [])
        if not isinstance(studies, list):
            return []

        docs: list[Document] = []
        for item in studies:
            if not isinstance(item, dict):
                continue

            protocol = item.get("protocolSection", {})
            if not isinstance(protocol, dict):
                continue

            identification = protocol.get("identificationModule", {})
            status_module = protocol.get("statusModule", {})
            if not isinstance(identification, dict):
                continue

            nct_id = first_text(identification.get("nctId"))
            title = first_text(identification.get("briefTitle"))
            if not nct_id or not title:
                continue

            status = first_text(status_module.get("overallStatus")) if isinstance(status_module, dict) else ""
            text = ". ".join(part for part in [title, status] if part)
            docs.append(
                Document(
                    id=f"clinicaltrials-{nct_id.lower()}",
                    text=text,
                    metadata={
                        "source": "clinicaltrials",
                        "url": f"https://clinicaltrials.gov/study/{nct_id}",
                        "score": 0.0,
                    },
                )
            )

        return docs

    def retrieve_openfda(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        if top_k <= 0:
            return []

        terms = query_terms(query)
        if not terms:
            return []

        search_expr = " OR ".join(
            [f'openfda.generic_name:"{term}"' for term in terms]
            + [f'openfda.brand_name:"{term}"' for term in terms]
        )
        search_url = f"{self.OPENFDA_LABEL_URL}?" + urlencode(
            {"search": search_expr, "limit": str(top_k)}
        )
        payload = self._fetch_json(search_url, timeout_seconds)
        if not isinstance(payload, dict):
            return []

        results = payload.get("results", [])
        if not isinstance(results, list):
            return []

        docs: list[Document] = []
        for idx, item in enumerate(results, start=1):
            if not isinstance(item, dict):
                continue

            openfda = item.get("openfda", {}) if isinstance(item.get("openfda"), dict) else {}
            generic_names = openfda.get("generic_name", [])
            brand_names = openfda.get("brand_name", [])
            generic = first_text(generic_names[0] if isinstance(generic_names, list) and generic_names else "")
            brand = first_text(brand_names[0] if isinstance(brand_names, list) and brand_names else "")
            if not generic and not brand:
                continue

            usage = item.get("indications_and_usage", [])
            purpose = item.get("purpose", [])
            usage_text = first_text(
                usage[0] if isinstance(usage, list) and usage else "",
                purpose[0] if isinstance(purpose, list) and purpose else "",
            )
            label = first_text(generic, brand, f"openfda-{idx}")
            text = ". ".join(part for part in [label, usage_text] if part)
            docs.append(
                Document(
                    id=f"openfda-{idx}-{label.lower().replace(' ', '-')}",
                    text=text,
                    metadata={
                        "source": "openfda",
                        "url": "https://open.fda.gov/apis/drug/label/",
                        "score": 0.0,
                    },
                )
            )

        return docs

    def retrieve_dailymed(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        if top_k <= 0:
            return []

        query_value = clean_text(query)
        if not query_value:
            return []

        search_url = f"{self.DAILYMED_DRUGNAME_URL}/{quote(query_value)}/spls.json"
        payload = self._fetch_json(search_url, timeout_seconds)
        if not isinstance(payload, dict):
            return []

        rows = payload.get("data")
        if not isinstance(rows, list):
            rows = payload.get("DATA", [])
        if not isinstance(rows, list):
            return []

        docs: list[Document] = []
        for idx, item in enumerate(rows[:top_k], start=1):
            if not isinstance(item, list):
                continue

            set_id = first_text(item[0] if len(item) > 0 else "")
            title = first_text(item[1] if len(item) > 1 else "")
            version = first_text(item[2] if len(item) > 2 else "")
            published = first_text(item[3] if len(item) > 3 else "")
            if not set_id and not title:
                continue

            label = first_text(title, f"DailyMed-{idx}")
            text = ". ".join(part for part in [label, version, published] if part)
            docs.append(
                Document(
                    id=f"dailymed-{set_id or idx}",
                    text=text,
                    metadata={
                        "source": "dailymed",
                        "url": (
                            f"https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={set_id}"
                            if set_id
                            else "https://dailymed.nlm.nih.gov/"
                        ),
                        "score": 0.0,
                    },
                )
            )

        return docs

    def retrieve_searxng(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        if top_k <= 0:
            return []

        base_url = settings.searxng_base_url.strip().rstrip("/")
        if not base_url:
            return []

        query_params = {
            "q": query,
            "format": "json",
            "language": "vi",
            "categories": "general",
            "safesearch": 1,
        }
        candidate_urls = [
            f"{base_url}/search?{urlencode(query_params)}",
            f"{base_url}/?{urlencode(query_params)}",
        ]

        payload: dict[str, Any] | list[Any] | None = None
        for search_url in candidate_urls:
            payload = self._fetch_json(
                search_url,
                timeout_seconds,
                headers={"Accept": "application/json"},
            )
            if isinstance(payload, dict) and isinstance(payload.get("results"), list):
                break

        if not isinstance(payload, dict):
            return []

        results = payload.get("results", [])
        if not isinstance(results, list):
            return []

        docs: list[Document] = []
        for idx, item in enumerate(results[:top_k], start=1):
            if not isinstance(item, dict):
                continue

            title = first_text(item.get("title"))
            url = first_text(item.get("url"))
            if not title or not url:
                continue

            content = first_text(item.get("content"))
            engine = first_text(item.get("engine"), "searxng")
            text = ". ".join(part for part in [title, content] if part)
            docs.append(
                Document(
                    id=f"searxng-{idx}-{engine}",
                    text=text,
                    metadata={"source": "searxng", "url": url, "score": 0.0},
                )
            )

        return docs

    def retrieve_scientific(self, query: str, *, top_k: int, timeout_seconds: float) -> list[Document]:
        return self.retrieve_scientific_with_telemetry(
            query,
            top_k=top_k,
            timeout_seconds=timeout_seconds,
            telemetry=None,
        )

    def retrieve_scientific_with_telemetry(
        self,
        query: str,
        *,
        top_k: int,
        timeout_seconds: float,
        telemetry: dict[str, Any] | None,
    ) -> list[Document]:
        if top_k <= 0:
            if telemetry is not None:
                telemetry.clear()
                telemetry.update(
                    {
                        "query": query,
                        "requested_top_k": int(top_k),
                        "provider_events": [],
                        "total_documents": 0,
                        "timeout_seconds": float(timeout_seconds),
                    }
                )
            return []

        docs: list[Document] = []
        provider_events: list[dict[str, Any]] = []
        tasks: list[tuple[str, Any]] = [
            ("pubmed", lambda: self.retrieve_pubmed(query, top_k=top_k, timeout_seconds=timeout_seconds)),
            (
                "europe_pmc",
                lambda: self.retrieve_europe_pmc(query, top_k=top_k, timeout_seconds=timeout_seconds),
            ),
            ("openalex", lambda: self.retrieve_openalex(query, top_k=top_k, timeout_seconds=timeout_seconds)),
            ("crossref", lambda: self.retrieve_crossref(query, top_k=top_k, timeout_seconds=timeout_seconds)),
            (
                "clinicaltrials",
                lambda: self.retrieve_clinicaltrials(query, top_k=top_k, timeout_seconds=timeout_seconds),
            ),
            ("openfda", lambda: self.retrieve_openfda(query, top_k=top_k, timeout_seconds=timeout_seconds)),
            ("dailymed", lambda: self.retrieve_dailymed(query, top_k=top_k, timeout_seconds=timeout_seconds)),
        ]

        def _run_provider(provider_name: str, provider_task: Any) -> tuple[str, list[Document], str | None, float]:
            started = perf_counter()
            try:
                result = provider_task()
                if not isinstance(result, list):
                    return provider_name, [], "invalid_result_type", (perf_counter() - started) * 1000.0
                return provider_name, result, None, (perf_counter() - started) * 1000.0
            except Exception as exc:
                return provider_name, [], exc.__class__.__name__, (perf_counter() - started) * 1000.0

        with ThreadPoolExecutor(max_workers=len(tasks)) as executor:
            futures = {
                executor.submit(_run_provider, provider_name, provider_task): provider_name
                for provider_name, provider_task in tasks
            }
            try:
                for future in as_completed(futures, timeout=max(timeout_seconds * 3.0, 2.0)):
                    provider_name = futures[future]
                    try:
                        name, result, error_name, duration_ms = future.result(
                            timeout=max(timeout_seconds, 0.5)
                        )
                    except Exception as exc:  # pragma: no cover - defensive
                        provider_events.append(
                            {
                                "provider": provider_name,
                                "status": "error",
                                "error": exc.__class__.__name__,
                                "duration_ms": 0.0,
                                "documents": 0,
                            }
                        )
                        continue

                    docs.extend(result)
                    provider_events.append(
                        {
                            "provider": name,
                            "status": "error" if error_name else "completed",
                            "error": error_name,
                            "duration_ms": round(float(duration_ms), 3),
                            "documents": len(result),
                        }
                    )
            except FuturesTimeoutError:
                for future, provider_name in futures.items():
                    if future.done():
                        continue
                    provider_events.append(
                        {
                            "provider": provider_name,
                            "status": "timeout",
                            "error": "TimeoutError",
                            "duration_ms": round(max(timeout_seconds * 1000.0, 1.0), 3),
                            "documents": 0,
                        }
                    )

        if telemetry is not None:
            by_source: dict[str, int] = {}
            for doc in docs:
                source_name = str((doc.metadata or {}).get("source") or "unknown")
                by_source[source_name] = by_source.get(source_name, 0) + 1
            telemetry.clear()
            telemetry.update(
                {
                    "query": query,
                    "requested_top_k": int(top_k),
                    "provider_events": provider_events,
                    "provider_count": len(provider_events),
                    "documents_by_source": by_source,
                    "total_documents": len(docs),
                    "timeout_seconds": float(timeout_seconds),
                }
            )

        return docs
