from __future__ import annotations

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

    def retrieve_external_scientific(
        self,
        query: str,
        top_k: int = 3,
        *,
        timeout_seconds: float = 1.2,
        rag_sources: object = None,
    ) -> list[Document]:
        source_policies = self.builder.parse_source_policies(rag_sources)
        docs = self.external_gateway.retrieve_scientific(
            query,
            top_k=top_k,
            timeout_seconds=timeout_seconds,
        )
        deduped = dedupe_documents(docs)
        return self.scorer.score_documents(
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
    ) -> list[Document]:
        if top_k <= 0:
            return []

        source_policies = self.builder.parse_source_policies(rag_sources)
        candidates = list(self.documents)
        if file_retrieval_enabled:
            candidates.extend(self.builder.build_uploaded_documents(uploaded_documents))
            candidates.extend(self.builder.build_rag_source_documents(rag_sources))

        return self.scorer.score_documents(
            query,
            dedupe_documents(candidates),
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
    ) -> list[Document]:
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
                    self.external_gateway.retrieve_searxng(
                        query,
                        top_k=max(top_k, 1),
                        timeout_seconds=settings.searxng_timeout_seconds,
                    )
                )
            except Exception:
                pass

        return self.scorer.score_documents(
            query,
            dedupe_documents(staged_docs),
            top_k=top_k,
            source_policies=self.builder.parse_source_policies(rag_sources),
        )
