from __future__ import annotations

from copy import deepcopy
from time import perf_counter
from typing import Any

from clara_ml.config import settings
from clara_ml.rag.embedder import HttpEmbeddingClient

from .document_builder import DocumentBuilder
from .domain import Document
from .external_gateway import ExternalSourceGateway
from .score_engine import DocumentScorer
from .text_utils import dedupe_documents


class InMemoryRetriever:
    def __init__(
        self,
        documents: list[Document],
        embedder: HttpEmbeddingClient | None = None,
    ) -> None:
        self.builder = DocumentBuilder()
        self.external_gateway = ExternalSourceGateway()
        self.scorer = DocumentScorer(embedder=embedder)
        self.documents = [
            self.builder.normalized_document(doc, default_source="internal")
            for doc in documents
        ]
        self.last_trace: dict[str, Any] = {}

    @staticmethod
    def _trace_top_docs(docs: list[Document], *, limit: int = 5) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for doc in docs[: max(int(limit), 1)]:
            metadata = doc.metadata or {}
            raw_score = metadata.get("score", 0.0)
            try:
                parsed_score = float(raw_score)
            except (TypeError, ValueError):
                parsed_score = 0.0
            rows.append(
                {
                    "id": doc.id,
                    "source": str(metadata.get("source") or "unknown"),
                    "score": parsed_score,
                    "url": str(metadata.get("url") or ""),
                }
            )
        return rows

    def retrieve_external_scientific(
        self,
        query: str,
        top_k: int = 3,
        *,
        timeout_seconds: float = 1.2,
        rag_sources: object = None,
    ) -> list[Document]:
        started = perf_counter()
        source_policies = self.builder.parse_source_policies(rag_sources)
        gateway_trace: dict[str, Any] = {}
        docs = self.external_gateway.retrieve_scientific_with_telemetry(
            query=query,
            top_k=top_k,
            timeout_seconds=timeout_seconds,
            telemetry=gateway_trace,
        )
        deduped = dedupe_documents(docs)
        score_trace: list[dict[str, Any]] = []
        ranked = self.scorer.score_documents(
            query,
            deduped,
            top_k=max(top_k, 1),
            source_policies=source_policies,
            score_trace=score_trace,
        )
        self.last_trace = {
            "mode": "external_scientific",
            "query": query,
            "requested_top_k": int(top_k),
            "source_policies_count": len(source_policies),
            "raw_documents_count": len(docs),
            "deduped_documents_count": len(deduped),
            "selected_documents_count": len(ranked),
            "gateway": gateway_trace,
            "score_trace": score_trace,
            "top_documents": self._trace_top_docs(ranked),
            "duration_ms": round((perf_counter() - started) * 1000.0, 3),
        }
        return ranked

    def retrieve_internal(
        self,
        query: str,
        top_k: int = 3,
        *,
        file_retrieval_enabled: bool = True,
        rag_sources: object = None,
        uploaded_documents: object = None,
    ) -> list[Document]:
        started = perf_counter()
        if top_k <= 0:
            self.last_trace = {
                "mode": "internal",
                "query": query,
                "requested_top_k": int(top_k),
                "selected_documents_count": 0,
                "duration_ms": round((perf_counter() - started) * 1000.0, 3),
            }
            return []

        source_policies = self.builder.parse_source_policies(rag_sources)
        candidates = list(self.documents)
        uploaded_candidates: list[Document] = []
        source_candidates: list[Document] = []
        if file_retrieval_enabled:
            uploaded_candidates = self.builder.build_uploaded_documents(uploaded_documents)
            source_candidates = self.builder.build_rag_source_documents(rag_sources)
            candidates.extend(uploaded_candidates)
            candidates.extend(source_candidates)

        deduped = dedupe_documents(candidates)
        score_trace: list[dict[str, Any]] = []
        ranked = self.scorer.score_documents(
            query,
            deduped,
            top_k=top_k,
            source_policies=source_policies,
            score_trace=score_trace,
        )
        self.last_trace = {
            "mode": "internal",
            "query": query,
            "requested_top_k": int(top_k),
            "file_retrieval_enabled": bool(file_retrieval_enabled),
            "source_policies_count": len(source_policies),
            "candidate_counts": {
                "seed_documents": len(self.documents),
                "uploaded_documents": len(uploaded_candidates),
                "rag_source_documents": len(source_candidates),
                "total_before_dedupe": len(candidates),
                "total_after_dedupe": len(deduped),
            },
            "selected_documents_count": len(ranked),
            "score_trace": score_trace,
            "top_documents": self._trace_top_docs(ranked),
            "duration_ms": round((perf_counter() - started) * 1000.0, 3),
        }
        return ranked

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
    ) -> list[Document]:
        started = perf_counter()
        if top_k <= 0:
            self.last_trace = {
                "mode": "hybrid",
                "query": query,
                "requested_top_k": int(top_k),
                "selected_documents_count": 0,
                "duration_ms": round((perf_counter() - started) * 1000.0, 3),
            }
            return []

        trace: dict[str, Any] = {
            "mode": "hybrid",
            "query": query,
            "requested_top_k": int(top_k),
            "scientific_retrieval_enabled": bool(scientific_retrieval_enabled),
            "web_retrieval_enabled": bool(web_retrieval_enabled),
            "file_retrieval_enabled": bool(file_retrieval_enabled),
            "source_errors": {},
        }
        self.last_trace = trace

        staged_docs = self.retrieve_internal(
            query,
            top_k=max(top_k, 1),
            file_retrieval_enabled=file_retrieval_enabled,
            rag_sources=rag_sources,
            uploaded_documents=uploaded_documents,
        )
        trace["internal_trace"] = deepcopy(self.last_trace)
        trace["candidate_counts"] = {"after_internal": len(staged_docs)}

        if scientific_retrieval_enabled:
            external_docs = self.retrieve_external_scientific(
                query,
                top_k=max(
                    top_k,
                    min(settings.pubmed_esearch_max_results, settings.europe_pmc_max_results),
                ),
                timeout_seconds=settings.pubmed_connector_timeout_seconds,
                rag_sources=rag_sources,
            )
            trace["external_scientific_trace"] = deepcopy(self.last_trace)
            staged_docs.extend(external_docs)
            trace["candidate_counts"]["after_external_scientific"] = len(staged_docs)

        if web_retrieval_enabled:
            web_started = perf_counter()
            try:
                web_docs = self.external_gateway.retrieve_searxng(
                    query,
                    top_k=max(top_k, 1),
                    timeout_seconds=settings.searxng_timeout_seconds,
                )
                staged_docs.extend(web_docs)
                trace["web_trace"] = {
                    "status": "completed",
                    "documents": len(web_docs),
                    "duration_ms": round((perf_counter() - web_started) * 1000.0, 3),
                }
            except Exception as exc:
                trace["source_errors"]["searxng"] = [exc.__class__.__name__]
                trace["web_trace"] = {
                    "status": "error",
                    "documents": 0,
                    "error": exc.__class__.__name__,
                    "duration_ms": round((perf_counter() - web_started) * 1000.0, 3),
                }
            trace["candidate_counts"]["after_web"] = len(staged_docs)

        deduped = dedupe_documents(staged_docs)
        final_score_trace: list[dict[str, Any]] = []
        ranked = self.scorer.score_documents(
            query,
            deduped,
            top_k=top_k,
            source_policies=self.builder.parse_source_policies(rag_sources),
            score_trace=final_score_trace,
        )
        trace["candidate_counts"]["before_final_dedupe"] = len(staged_docs)
        trace["candidate_counts"]["after_final_dedupe"] = len(deduped)
        trace["final_score_trace"] = final_score_trace
        trace["selected_documents_count"] = len(ranked)
        trace["top_documents"] = self._trace_top_docs(ranked)
        trace["duration_ms"] = round((perf_counter() - started) * 1000.0, 3)
        self.last_trace = trace
        return ranked
