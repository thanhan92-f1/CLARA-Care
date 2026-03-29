from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Any, List, Sequence
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from clara_ml.config import settings
from clara_ml.rag.embedder import HttpEmbeddingClient


@dataclass
class Document:
    id: str
    text: str
    metadata: dict[str, Any] = field(default_factory=dict)


class InMemoryRetriever:
    _PUBMED_ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    _PUBMED_ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    _EUROPEPMC_SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    _OPENALEX_WORKS_URL = "https://api.openalex.org/works"
    _CROSSREF_WORKS_URL = "https://api.crossref.org/works"
    _CLINICALTRIALS_V2_URL = "https://clinicaltrials.gov/api/v2/studies"
    _OPENFDA_LABEL_URL = "https://api.fda.gov/drug/label.json"
    _DAILYMED_DRUGNAME_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v1/drugname"
    _SOURCE_SCORE_BIAS: dict[str, float] = {
        "pubmed": 1.12,
        "europepmc": 1.1,
        "clinicaltrials": 1.08,
        "openfda": 1.35,
        "dailymed": 1.35,
        "searxng": 1.0,
        "openalex": 0.92,
        "crossref": 0.7,
        "byt": 1.2,
        "dav": 1.18,
        "vn_source_registry": 1.15,
        "vn_pdf": 1.17,
    }
    _TRUST_TIER_FACTOR: dict[str, float] = {
        "tier_1": 1.25,
        "tier_2": 1.12,
        "tier_3": 1.0,
        "tier_4": 0.88,
    }

    def __init__(self, documents: List[Document], embedder: HttpEmbeddingClient | None = None) -> None:
        self.documents = [
            self._normalized_document(doc, default_source="internal") for doc in documents
        ]
        self.embedder = embedder or HttpEmbeddingClient()

    @staticmethod
    def _safe_float(value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    @classmethod
    def _safe_weight(cls, value: Any, default: float = 1.0) -> float:
        return max(0.0, min(2.0, cls._safe_float(value, default)))

    @staticmethod
    def _normalize_tags(tags: Any) -> list[str]:
        if isinstance(tags, str):
            normalized = [tag.strip().lower() for tag in re.split(r"[,;|]", tags) if tag.strip()]
            return list(dict.fromkeys(normalized))
        if isinstance(tags, list):
            normalized = [str(tag).strip().lower() for tag in tags if str(tag).strip()]
            return list(dict.fromkeys(normalized))
        return []

    @classmethod
    def _normalized_document(cls, doc: Document, *, default_source: str) -> Document:
        metadata = dict(doc.metadata or {})
        metadata.setdefault("source", str(default_source).strip().lower() or "internal")
        metadata.setdefault("url", "")
        metadata.setdefault("score", 0.0)
        metadata["weight"] = cls._safe_weight(metadata.get("weight", 1.0), default=1.0)
        metadata["tags"] = cls._normalize_tags(metadata.get("tags"))
        metadata.setdefault("trust_tier", "tier_3")
        metadata.setdefault("file_type", "")
        return Document(id=doc.id, text=doc.text, metadata=metadata)

    @staticmethod
    def _dedupe_documents(documents: Sequence[Document]) -> List[Document]:
        deduped: list[Document] = []
        seen: set[str] = set()
        for doc in documents:
            if doc.id in seen:
                continue
            deduped.append(doc)
            seen.add(doc.id)
        return deduped

    @classmethod
    def _parse_source_policies(cls, rag_sources: object) -> dict[str, dict[str, float | bool]]:
        if not isinstance(rag_sources, list):
            return {}
        policies: dict[str, dict[str, float | bool]] = {}
        for item in rag_sources:
            if not isinstance(item, dict):
                continue
            keys = [
                str(item.get("id") or "").strip().lower(),
                str(item.get("source") or "").strip().lower(),
                str(item.get("name") or "").strip().lower(),
                str(item.get("type") or "").strip().lower(),
            ]
            keys = [key for key in keys if key]
            if not keys:
                continue
            enabled = bool(item.get("enabled", True))
            weight = cls._safe_weight(item.get("weight", 1.0), default=1.0)
            for key in keys:
                policies[key] = {"enabled": enabled, "weight": weight}
        return policies

    @classmethod
    def _normalize_trust_tier(cls, value: Any) -> str:
        raw = str(value or "").strip().lower().replace(" ", "_")
        if not raw:
            return "tier_3"
        aliases = {
            "1": "tier_1",
            "t1": "tier_1",
            "a": "tier_1",
            "official": "tier_1",
            "gov": "tier_1",
            "government": "tier_1",
            "2": "tier_2",
            "t2": "tier_2",
            "b": "tier_2",
            "clinical": "tier_2",
            "3": "tier_3",
            "t3": "tier_3",
            "c": "tier_3",
            "community": "tier_3",
            "4": "tier_4",
            "t4": "tier_4",
            "d": "tier_4",
            "low": "tier_4",
        }
        normalized = aliases.get(raw, raw)
        if normalized not in cls._TRUST_TIER_FACTOR:
            return "tier_3"
        return normalized

    @classmethod
    def _trust_tier_factor(cls, trust_tier: Any) -> float:
        normalized = cls._normalize_trust_tier(trust_tier)
        return cls._TRUST_TIER_FACTOR.get(normalized, 1.0)

    @classmethod
    def _tag_relevance_factor(cls, query: str, tags: Any) -> float:
        tag_values = cls._normalize_tags(tags)
        if not tag_values:
            return 1.0
        query_tokens = set(cls._query_terms(query))
        if not query_tokens:
            return 1.0
        matches = 0
        for tag in tag_values:
            tag_tokens = {token for token in re.findall(r"[0-9a-zA-ZÀ-ỹ]{3,}", tag)}
            if query_tokens.intersection(tag_tokens):
                matches += 1
        if matches == 0:
            return 1.0
        return min(1.2, 1.0 + (0.06 * matches))

    def _score_documents(
        self,
        query: str,
        documents: Sequence[Document],
        top_k: int,
        *,
        source_policies: dict[str, dict[str, float | bool]] | None = None,
    ) -> List[Document]:
        if top_k <= 0:
            return []
        normalized_docs = [self._normalized_document(doc, default_source="internal") for doc in documents]
        if not normalized_docs:
            return []

        vectors = self.embedder.embed_batch([query] + [doc.text for doc in normalized_docs])
        if not vectors:
            return []
        qvec = vectors[0]
        doc_vectors = vectors[1:]

        scored: list[tuple[float, Document]] = []
        source_policies = source_policies or {}
        for doc, dvec in zip(normalized_docs, doc_vectors):
            base_score = sum(a * b for a, b in zip(qvec, dvec))
            source_key = str(doc.metadata.get("source") or "").strip().lower()
            policy = source_policies.get(source_key, {"enabled": True, "weight": 1.0})
            if not bool(policy.get("enabled", True)):
                continue

            policy_weight = self._safe_weight(policy.get("weight", 1.0), default=1.0)
            doc_weight = self._safe_weight(doc.metadata.get("weight", 1.0), default=1.0)
            source_bias = max(0.5, min(1.6, float(self._SOURCE_SCORE_BIAS.get(source_key, 1.0))))
            trust_factor = self._trust_tier_factor(doc.metadata.get("trust_tier"))
            tag_factor = self._tag_relevance_factor(query, doc.metadata.get("tags"))
            file_type = str(doc.metadata.get("file_type") or "").strip().lower()
            pdf_factor = 1.05 if file_type == "pdf" else 1.0

            score = (
                base_score
                * max(policy_weight, 0.05)
                * max(doc_weight, 0.05)
                * source_bias
                * trust_factor
                * tag_factor
                * pdf_factor
            )
            doc.metadata["weight"] = doc_weight
            doc.metadata["policy_weight"] = policy_weight
            doc.metadata["source_bias"] = source_bias
            doc.metadata["trust_factor"] = trust_factor
            doc.metadata["tag_factor"] = tag_factor
            doc.metadata["pdf_factor"] = pdf_factor
            doc.metadata["score"] = float(score)
            scored.append((score, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored[:top_k]]

    @staticmethod
    def _build_uploaded_documents(uploaded_documents: object) -> List[Document]:
        if not isinstance(uploaded_documents, list):
            return []
        docs: list[Document] = []
        for idx, item in enumerate(uploaded_documents, start=1):
            if isinstance(item, str):
                text = item.strip()
                if not text:
                    continue
                docs.append(
                    Document(
                        id=f"uploaded-{idx}",
                        text=text,
                        metadata={"source": "uploaded", "url": "", "score": 0.0},
                    )
                )
                continue
            if not isinstance(item, dict):
                continue
            text = str(item.get("text") or item.get("content") or "").strip()
            if not text:
                continue
            doc_id = str(item.get("id") or f"uploaded-{idx}")
            docs.append(
                Document(
                    id=doc_id,
                    text=text,
                    metadata={
                        "source": str(item.get("source") or "uploaded"),
                        "url": str(item.get("url") or ""),
                        "score": 0.0,
                        "weight": InMemoryRetriever._safe_weight(item.get("weight", 1.0), default=1.0),
                        "tags": InMemoryRetriever._normalize_tags(item.get("tags")),
                        "trust_tier": InMemoryRetriever._normalize_trust_tier(item.get("trust_tier")),
                    },
                )
            )
        return docs

    @staticmethod
    def _extract_pdf_metadata(source_cfg: dict[str, Any]) -> dict[str, Any]:
        raw_pdf = source_cfg.get("pdf")
        if isinstance(raw_pdf, dict):
            return raw_pdf
        raw_pdf_meta = source_cfg.get("pdf_metadata")
        if isinstance(raw_pdf_meta, dict):
            return raw_pdf_meta
        return {}

    @classmethod
    def _build_registry_entry_documents(
        cls,
        source_cfg: dict[str, Any],
        *,
        source_idx: int,
    ) -> list[Document]:
        registry_blocks: list[Any] = []
        for key in ("vn_registry", "registry", "entries", "source_registry"):
            value = source_cfg.get(key)
            if isinstance(value, list):
                registry_blocks.extend(value)

        if not registry_blocks:
            return []

        default_source = str(
            source_cfg.get("id") or source_cfg.get("source") or source_cfg.get("name") or "vn_source_registry"
        ).strip().lower() or "vn_source_registry"
        default_weight = cls._safe_weight(source_cfg.get("weight", 1.0), default=1.0)
        default_tier = cls._normalize_trust_tier(source_cfg.get("trust_tier") or source_cfg.get("tier"))
        default_tags = cls._normalize_tags(source_cfg.get("tags"))

        docs: list[Document] = []
        for entry_idx, entry in enumerate(registry_blocks, start=1):
            if not isinstance(entry, dict):
                continue
            if not bool(entry.get("enabled", True)):
                continue

            title = str(entry.get("title") or entry.get("name") or "").strip()
            summary = str(entry.get("summary") or entry.get("description") or "").strip()
            text = str(entry.get("text") or entry.get("content") or "").strip()
            entry_source = str(entry.get("source") or default_source).strip().lower() or default_source

            entry_pdf = entry.get("pdf") if isinstance(entry.get("pdf"), dict) else {}
            url = str(entry.get("url") or entry_pdf.get("url") or "").strip()
            tags = cls._normalize_tags(default_tags + cls._normalize_tags(entry.get("tags") or entry_pdf.get("tags")))
            tier = cls._normalize_trust_tier(entry.get("trust_tier") or entry.get("tier") or default_tier)
            weight = cls._safe_weight(entry.get("weight", default_weight), default=default_weight)
            file_type = "pdf" if (".pdf" in url.lower() or entry_pdf) else str(entry.get("file_type") or "")

            body = ". ".join(part for part in [title, summary, text, " ".join(tags)] if part).strip()
            if not body:
                continue

            doc_id = str(entry.get("id") or f"{entry_source}-registry-{source_idx}-{entry_idx}")
            docs.append(
                Document(
                    id=doc_id,
                    text=body,
                    metadata={
                        "source": entry_source,
                        "url": url,
                        "score": 0.0,
                        "weight": weight,
                        "tags": tags,
                        "title": title,
                        "trust_tier": tier,
                        "file_type": file_type,
                        "registry_type": "vn-medical",
                    },
                )
            )
        return docs

    @classmethod
    def _build_rag_source_documents(cls, rag_sources: object) -> List[Document]:
        if not isinstance(rag_sources, list):
            return []
        docs: list[Document] = []
        for idx, source_cfg in enumerate(rag_sources, start=1):
            if not isinstance(source_cfg, dict):
                continue
            if not bool(source_cfg.get("enabled", True)):
                continue

            source_id = str(source_cfg.get("id") or "").strip().lower()
            source_name = str(
                source_cfg.get("source")
                or source_cfg.get("type")
                or source_id
                or source_cfg.get("name")
                or f"rag-source-{idx}"
            )
            source_url = str(source_cfg.get("url") or "")
            source_weight = cls._safe_weight(source_cfg.get("weight", 1.0), default=1.0)
            source_tags = cls._normalize_tags(source_cfg.get("tags"))
            source_tier = cls._normalize_trust_tier(source_cfg.get("trust_tier") or source_cfg.get("tier"))

            inline_text = str(source_cfg.get("text") or source_cfg.get("content") or "").strip()
            if inline_text:
                docs.append(
                    Document(
                        id=str(source_cfg.get("id") or f"{source_name}-{idx}"),
                        text=inline_text,
                        metadata={
                            "source": (source_id or source_name).lower(),
                            "url": source_url,
                            "score": 0.0,
                            "weight": source_weight,
                            "tags": source_tags,
                            "trust_tier": source_tier,
                        },
                    )
                )

            pdf_meta = cls._extract_pdf_metadata(source_cfg)
            pdf_title = str(pdf_meta.get("title") or source_cfg.get("title") or "").strip()
            pdf_url = str(pdf_meta.get("url") or source_url or "").strip()
            pdf_tags = cls._normalize_tags(source_tags + cls._normalize_tags(pdf_meta.get("tags")))
            if pdf_title:
                docs.append(
                    Document(
                        id=str(source_cfg.get("id") or f"{source_name}-{idx}-pdf"),
                        text=". ".join(part for part in [pdf_title, " ".join(pdf_tags)] if part),
                        metadata={
                            "source": (source_id or source_name or "vn_pdf").lower(),
                            "url": pdf_url,
                            "score": 0.0,
                            "weight": source_weight,
                            "tags": pdf_tags,
                            "title": pdf_title,
                            "trust_tier": source_tier,
                            "file_type": "pdf",
                            "registry_type": "vn-medical",
                        },
                    )
                )

            docs.extend(cls._build_registry_entry_documents(source_cfg, source_idx=idx))

            nested_docs = source_cfg.get("documents")
            if not isinstance(nested_docs, list):
                continue
            for doc_idx, nested in enumerate(nested_docs, start=1):
                if isinstance(nested, str):
                    nested_text = nested.strip()
                    if not nested_text:
                        continue
                    docs.append(
                        Document(
                            id=f"{source_name}-{idx}-{doc_idx}",
                            text=nested_text,
                            metadata={
                                "source": (source_id or source_name).lower(),
                                "url": source_url,
                                "score": 0.0,
                                "weight": source_weight,
                                "tags": source_tags,
                                "trust_tier": source_tier,
                            },
                        )
                    )
                    continue
                if not isinstance(nested, dict):
                    continue
                nested_text = str(nested.get("text") or nested.get("content") or "").strip()
                if not nested_text:
                    continue
                nested_url = str(nested.get("url") or source_url)
                nested_tags = cls._normalize_tags(source_tags + cls._normalize_tags(nested.get("tags")))
                nested_tier = cls._normalize_trust_tier(nested.get("trust_tier") or nested.get("tier") or source_tier)
                docs.append(
                    Document(
                        id=str(nested.get("id") or f"{source_name}-{idx}-{doc_idx}"),
                        text=nested_text,
                        metadata={
                            "source": str(nested.get("source") or source_id or source_name).lower(),
                            "url": nested_url,
                            "score": 0.0,
                            "weight": cls._safe_weight(nested.get("weight", source_weight), default=source_weight),
                            "tags": nested_tags,
                            "trust_tier": nested_tier,
                            "file_type": str(nested.get("file_type") or "").lower(),
                        },
                    )
                )
        return docs

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
        req = Request(url, headers=merged_headers)
        with urlopen(req, timeout=max(timeout_seconds, 0.1)) as response:
            payload = response.read().decode("utf-8", errors="ignore")
        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            return None

    @staticmethod
    def _clean_text(value: Any) -> str:
        return " ".join(str(value or "").split()).strip()

    @staticmethod
    def _first_text(*values: Any) -> str:
        for value in values:
            text = InMemoryRetriever._clean_text(value)
            if text:
                return text
        return ""

    @staticmethod
    def _query_terms(query: str) -> list[str]:
        tokens = re.findall(r"[0-9a-zA-ZÀ-ỹ]{3,}", query.lower())
        stopwords = {
            "cho",
            "cua",
            "voi",
            "nhung",
            "benh",
            "tim",
            "mach",
            "dieu",
            "tri",
            "nguoi",
            "sanh",
        }
        filtered = [token for token in tokens if token not in stopwords]
        filtered.sort(key=len, reverse=True)
        return filtered[:3]

    def _retrieve_pubmed(self, query: str, *, top_k: int, timeout_seconds: float) -> List[Document]:
        if top_k <= 0:
            return []
        search_url = f"{self._PUBMED_ESEARCH_URL}?" + urlencode(
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

        summary_url = f"{self._PUBMED_ESUMMARY_URL}?" + urlencode(
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

    def _retrieve_europe_pmc(
        self, query: str, *, top_k: int, timeout_seconds: float
    ) -> List[Document]:
        if top_k <= 0:
            return []
        search_url = f"{self._EUROPEPMC_SEARCH_URL}?" + urlencode(
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

    def _retrieve_openalex(
        self, query: str, *, top_k: int, timeout_seconds: float
    ) -> List[Document]:
        if top_k <= 0:
            return []
        search_url = f"{self._OPENALEX_WORKS_URL}?" + urlencode(
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
            openalex_id = self._first_text(item.get("id"))
            title = self._first_text(item.get("display_name"), item.get("title"))
            if not openalex_id or not title:
                continue
            year = self._first_text(item.get("publication_year"))
            host = (
                item.get("primary_location", {})
                if isinstance(item.get("primary_location"), dict)
                else {}
            )
            url = self._first_text(
                host.get("landing_page_url"),
                host.get("pdf_url"),
                openalex_id,
            )
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

    def _retrieve_crossref(
        self, query: str, *, top_k: int, timeout_seconds: float
    ) -> List[Document]:
        if top_k <= 0:
            return []
        search_url = f"{self._CROSSREF_WORKS_URL}?" + urlencode(
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
            doi = self._first_text(item.get("DOI"))
            titles = item.get("title", [])
            title = self._first_text(titles[0] if isinstance(titles, list) and titles else "")
            if not doi or not title:
                continue
            container = item.get("container-title", [])
            journal = self._first_text(
                container[0] if isinstance(container, list) and container else ""
            )
            url = self._first_text(item.get("URL"), f"https://doi.org/{doi}")
            text = ". ".join(part for part in [title, journal] if part)
            docs.append(
                Document(
                    id=f"crossref-{doi.lower()}",
                    text=text,
                    metadata={"source": "crossref", "url": url, "score": 0.0},
                )
            )
        return docs

    def _retrieve_clinicaltrials(
        self, query: str, *, top_k: int, timeout_seconds: float
    ) -> List[Document]:
        if top_k <= 0:
            return []
        search_url = f"{self._CLINICALTRIALS_V2_URL}?" + urlencode(
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
            nct_id = self._first_text(identification.get("nctId"))
            title = self._first_text(identification.get("briefTitle"))
            if not nct_id or not title:
                continue
            status = (
                self._first_text(status_module.get("overallStatus"))
                if isinstance(status_module, dict)
                else ""
            )
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

    def _retrieve_openfda(
        self, query: str, *, top_k: int, timeout_seconds: float
    ) -> List[Document]:
        if top_k <= 0:
            return []
        terms = self._query_terms(query)
        if not terms:
            return []

        search_expr = " OR ".join(
            [f'openfda.generic_name:"{term}"' for term in terms]
            + [f'openfda.brand_name:"{term}"' for term in terms]
        )
        search_url = f"{self._OPENFDA_LABEL_URL}?" + urlencode(
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
            generic = self._first_text(
                generic_names[0] if isinstance(generic_names, list) and generic_names else ""
            )
            brand = self._first_text(
                brand_names[0] if isinstance(brand_names, list) and brand_names else ""
            )
            if not generic and not brand:
                continue
            usage = item.get("indications_and_usage", [])
            purpose = item.get("purpose", [])
            usage_text = self._first_text(
                usage[0] if isinstance(usage, list) and usage else "",
                purpose[0] if isinstance(purpose, list) and purpose else "",
            )
            label = self._first_text(generic, brand, f"openfda-{idx}")
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

    def _retrieve_dailymed(
        self, query: str, *, top_k: int, timeout_seconds: float
    ) -> List[Document]:
        if top_k <= 0:
            return []
        query_value = self._clean_text(query)
        if not query_value:
            return []
        search_url = f"{self._DAILYMED_DRUGNAME_URL}/{quote(query_value)}/spls.json"
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
            set_id = self._first_text(item[0] if len(item) > 0 else "")
            title = self._first_text(item[1] if len(item) > 1 else "")
            version = self._first_text(item[2] if len(item) > 2 else "")
            published = self._first_text(item[3] if len(item) > 3 else "")
            if not set_id and not title:
                continue
            label = self._first_text(title, f"DailyMed-{idx}")
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

    def _retrieve_searxng(
        self, query: str, *, top_k: int, timeout_seconds: float
    ) -> List[Document]:
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
            title = self._first_text(item.get("title"))
            url = self._first_text(item.get("url"))
            if not title or not url:
                continue
            content = self._first_text(item.get("content"))
            engine = self._first_text(item.get("engine"), "searxng")
            text = ". ".join(part for part in [title, content] if part)
            docs.append(
                Document(
                    id=f"searxng-{idx}-{engine}",
                    text=text,
                    metadata={"source": "searxng", "url": url, "score": 0.0},
                )
            )
        return docs

    def retrieve_external_scientific(
        self,
        query: str,
        top_k: int = 3,
        *,
        timeout_seconds: float = 1.2,
        rag_sources: object = None,
    ) -> List[Document]:
        source_policies = self._parse_source_policies(rag_sources)
        docs: list[Document] = []
        scientific_tasks = [
            lambda: self._retrieve_pubmed(query, top_k=top_k, timeout_seconds=timeout_seconds),
            lambda: self._retrieve_europe_pmc(query, top_k=top_k, timeout_seconds=timeout_seconds),
            lambda: self._retrieve_openalex(query, top_k=top_k, timeout_seconds=timeout_seconds),
            lambda: self._retrieve_crossref(query, top_k=top_k, timeout_seconds=timeout_seconds),
            lambda: self._retrieve_clinicaltrials(
                query, top_k=top_k, timeout_seconds=timeout_seconds
            ),
            lambda: self._retrieve_openfda(query, top_k=top_k, timeout_seconds=timeout_seconds),
            lambda: self._retrieve_dailymed(query, top_k=top_k, timeout_seconds=timeout_seconds),
        ]

        with ThreadPoolExecutor(max_workers=len(scientific_tasks)) as executor:
            futures = [executor.submit(task) for task in scientific_tasks]
            for future in as_completed(futures, timeout=max(timeout_seconds * 3.0, 2.0)):
                try:
                    result = future.result(timeout=max(timeout_seconds, 0.5))
                    docs.extend(result)
                except Exception:
                    continue

        deduped = self._dedupe_documents(docs)
        return self._score_documents(
            query,
            deduped,
            top_k=max(top_k, 1),
            source_policies=source_policies,
        )

    def retrieve_internal(
        self,
        query: str,
        top_k: int = 3,
        *,
        file_retrieval_enabled: bool = True,
        rag_sources: object = None,
        uploaded_documents: object = None,
    ) -> List[Document]:
        if top_k <= 0:
            return []
        source_policies = self._parse_source_policies(rag_sources)
        candidates = list(self.documents)
        if file_retrieval_enabled:
            candidates.extend(self._build_uploaded_documents(uploaded_documents))
            candidates.extend(self._build_rag_source_documents(rag_sources))
        return self._score_documents(
            query,
            self._dedupe_documents(candidates),
            top_k=top_k,
            source_policies=source_policies,
        )

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
        *,
        scientific_retrieval_enabled: bool = False,
        web_retrieval_enabled: bool = False,
        file_retrieval_enabled: bool = True,
        rag_sources: object = None,
        uploaded_documents: object = None,
    ) -> List[Document]:
        if top_k <= 0:
            return []

        staged_docs = self.retrieve_internal(
            query,
            top_k=max(top_k, 1),
            file_retrieval_enabled=file_retrieval_enabled,
            rag_sources=rag_sources,
            uploaded_documents=uploaded_documents,
        )

        if scientific_retrieval_enabled:
            staged_docs.extend(
                self.retrieve_external_scientific(
                    query,
                    top_k=max(
                        top_k,
                        min(settings.pubmed_esearch_max_results, settings.europe_pmc_max_results),
                    ),
                    timeout_seconds=settings.pubmed_connector_timeout_seconds,
                    rag_sources=rag_sources,
                )
            )

        if web_retrieval_enabled:
            try:
                staged_docs.extend(
                    self._retrieve_searxng(
                        query,
                        top_k=max(top_k, 1),
                        timeout_seconds=settings.searxng_timeout_seconds,
                    )
                )
            except Exception:
                pass

        return self._score_documents(
            query,
            self._dedupe_documents(staged_docs),
            top_k=top_k,
            source_policies=self._parse_source_policies(rag_sources),
        )
