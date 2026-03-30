from __future__ import annotations

from typing import Sequence

from clara_ml.rag.embedder import HttpEmbeddingClient

from .domain import Document, SOURCE_SCORE_BIAS
from .text_utils import normalize_tags, safe_weight, tag_relevance_factor, trust_tier_factor


class DocumentScorer:
    def __init__(self, embedder: HttpEmbeddingClient | None = None) -> None:
        self.embedder = embedder or HttpEmbeddingClient()

    @staticmethod
    def _normalize_document(doc: Document, *, default_source: str = "internal") -> Document:
        metadata = dict(doc.metadata or {})
        metadata.setdefault("source", str(default_source).strip().lower() or "internal")
        metadata.setdefault("url", "")
        metadata.setdefault("score", 0.0)
        metadata["weight"] = safe_weight(metadata.get("weight", 1.0), default=1.0)
        metadata["tags"] = normalize_tags(metadata.get("tags"))
        metadata.setdefault("trust_tier", "tier_3")
        metadata.setdefault("file_type", "")
        return Document(id=doc.id, text=doc.text, metadata=metadata)

    def score_documents(
        self,
        query: str,
        documents: Sequence[Document],
        top_k: int,
        *,
        source_policies: dict[str, dict[str, float | bool]] | None = None,
    ) -> list[Document]:
        if top_k <= 0:
            return []

        normalized_docs = [self._normalize_document(doc) for doc in documents]
        if not normalized_docs:
            return []

        vectors = self.embedder.embed_batch([query] + [doc.text for doc in normalized_docs])
        if not vectors:
            return []

        query_vector = vectors[0]
        doc_vectors = vectors[1:]

        source_policies = source_policies or {}
        scored: list[tuple[float, Document]] = []

        for doc, doc_vector in zip(normalized_docs, doc_vectors):
            base_score = sum(a * b for a, b in zip(query_vector, doc_vector))
            source_key = str(doc.metadata.get("source") or "").strip().lower()
            policy = source_policies.get(source_key, {"enabled": True, "weight": 1.0})
            if not bool(policy.get("enabled", True)):
                continue

            policy_weight = safe_weight(policy.get("weight", 1.0), default=1.0)
            doc_weight = safe_weight(doc.metadata.get("weight", 1.0), default=1.0)
            source_bias = max(0.5, min(1.6, float(SOURCE_SCORE_BIAS.get(source_key, 1.0))))
            trust_factor = trust_tier_factor(doc.metadata.get("trust_tier"))
            tag_factor = tag_relevance_factor(query, doc.metadata.get("tags"))
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

        scored.sort(key=lambda item: item[0], reverse=True)
        return [doc for _, doc in scored[:top_k]]
