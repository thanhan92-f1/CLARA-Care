from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import Any, Sequence
import re

from clara_ml.config import settings

from .domain import Document


@dataclass
class RerankResult:
    documents: list[Document]
    metadata: dict[str, Any]


class NeuralReranker:
    """Phase-1 reranker skeleton for retrieval candidates.

    This implementation intentionally stays lightweight: it exposes a stable
    contract and telemetry shape before wiring a model-backed reranker.
    """

    def __init__(
        self,
        *,
        enabled: bool | None = None,
        model_name: str | None = None,
        top_n: int | None = None,
        timeout_ms: int | None = None,
    ) -> None:
        self.enabled = bool(settings.rag_reranker_enabled if enabled is None else enabled)
        self.model_name = str(model_name or settings.rag_reranker_model)
        self.top_n = max(1, int(settings.rag_reranker_top_n if top_n is None else top_n))
        self.timeout_ms = max(1, int(settings.rag_reranker_timeout_ms if timeout_ms is None else timeout_ms))

    def rerank(
        self,
        query: str,
        documents: Sequence[Document],
        *,
        top_k: int | None = None,
    ) -> RerankResult:
        started = perf_counter()
        candidates = [self._copy_document(doc) for doc in documents]

        if top_k is not None and top_k <= 0:
            latency_ms = round((perf_counter() - started) * 1000.0, 3)
            return RerankResult(
                documents=[],
                metadata={
                    "rerank_enabled": self.enabled,
                    "rerank_model": self.model_name,
                    "rerank_latency_ms": latency_ms,
                    "rerank_topn": 0,
                    "rerank_timeout_ms": self.timeout_ms,
                    "rerank_input_count": len(candidates),
                    "rerank_output_count": 0,
                    "rerank_applied_count": 0,
                    "rerank_reason": "top_k_non_positive",
                },
            )

        if not self.enabled or not candidates:
            output_docs = candidates
            if top_k is not None:
                output_docs = output_docs[:top_k]
            latency_ms = round((perf_counter() - started) * 1000.0, 3)
            return RerankResult(
                documents=output_docs,
                metadata={
                    "rerank_enabled": self.enabled,
                    "rerank_model": self.model_name,
                    "rerank_latency_ms": latency_ms,
                    "rerank_topn": 0,
                    "rerank_timeout_ms": self.timeout_ms,
                    "rerank_input_count": len(candidates),
                    "rerank_output_count": len(output_docs),
                    "rerank_applied_count": 0,
                    "rerank_reason": "disabled_or_empty",
                },
            )

        rerank_topn = min(self.top_n, len(candidates))
        rerank_pool = candidates[:rerank_topn]
        remainder = candidates[rerank_topn:]
        timeout_seconds = max(float(self.timeout_ms) / 1000.0, 0.001)
        timed_out = False
        error_name = ""

        try:
            scored_pool: list[tuple[float, int, Document]] = []
            for original_index, doc in enumerate(rerank_pool):
                if (perf_counter() - started) > timeout_seconds:
                    timed_out = True
                    raise TimeoutError("reranker_timeout")
                score = self._placeholder_score(query, doc)
                scored_pool.append((score, original_index, doc))
            scored_pool.sort(key=lambda row: (float(row[0]), -int(row[1])), reverse=True)

            reranked: list[Document] = []
            for rank, (score, _, doc) in enumerate(scored_pool, start=1):
                metadata = doc.metadata or {}
                metadata["rerank_score"] = float(score)
                metadata["rerank_rank"] = rank
                metadata["rerank_applied"] = True
                reranked.append(doc)

            for doc in remainder:
                metadata = doc.metadata or {}
                metadata["rerank_applied"] = False

            output_docs = reranked + remainder
            if top_k is not None:
                output_docs = output_docs[:top_k]

            latency_ms = round((perf_counter() - started) * 1000.0, 3)
            return RerankResult(
                documents=output_docs,
                metadata={
                    "rerank_enabled": self.enabled,
                    "rerank_model": self.model_name,
                    "rerank_latency_ms": latency_ms,
                    "rerank_topn": rerank_topn,
                    "rerank_timeout_ms": self.timeout_ms,
                    "rerank_input_count": len(candidates),
                    "rerank_output_count": len(output_docs),
                    "rerank_applied_count": len(reranked),
                    "rerank_timed_out": False,
                    "rerank_reason": "ok",
                },
            )
        except TimeoutError:
            timed_out = True
            error_name = "TimeoutError"
        except Exception as exc:  # pragma: no cover - defensive fallback
            error_name = type(exc).__name__

        for doc in candidates:
            metadata = doc.metadata or {}
            metadata["rerank_applied"] = False
        output_docs = candidates
        if top_k is not None:
            output_docs = output_docs[:top_k]
        latency_ms = round((perf_counter() - started) * 1000.0, 3)
        return RerankResult(
            documents=output_docs,
            metadata={
                "rerank_enabled": self.enabled,
                "rerank_model": self.model_name,
                "rerank_latency_ms": latency_ms,
                "rerank_topn": 0,
                "rerank_timeout_ms": self.timeout_ms,
                "rerank_input_count": len(candidates),
                "rerank_output_count": len(output_docs),
                "rerank_applied_count": 0,
                "rerank_timed_out": timed_out,
                "rerank_reason": "timeout_fallback" if timed_out else "error_fallback",
                "rerank_error": error_name or None,
            },
        )

    @staticmethod
    def _copy_document(doc: Document) -> Document:
        return Document(id=doc.id, text=doc.text, metadata=dict(doc.metadata or {}))

    @classmethod
    def _placeholder_score(cls, query: str, doc: Document) -> float:
        metadata = doc.metadata or {}
        base_score = cls._safe_float(metadata.get("score"), default=0.0)
        overlap = cls._lexical_overlap(query, doc.text)
        source_bonus = 0.05 if str(metadata.get("source") or "").strip().lower() else 0.0
        return base_score + overlap + source_bonus

    @staticmethod
    def _safe_float(value: object, *, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return float(default)

    @classmethod
    def _lexical_overlap(cls, query: str, text: str) -> float:
        query_tokens = cls._tokens(query)
        if not query_tokens:
            return 0.0
        doc_tokens = cls._tokens(text)
        if not doc_tokens:
            return 0.0
        return len(query_tokens.intersection(doc_tokens)) / float(len(query_tokens))

    @staticmethod
    def _tokens(text: str) -> set[str]:
        tokens = re.findall(r"[0-9a-zA-ZÀ-ỹ]{2,}", str(text or "").lower())
        return {token for token in tokens if token}
