"""Compatibility facade for retriever.

Clean architecture layout:
- `rag/retrieval/domain.py`: domain model
- `rag/retrieval/document_builder.py`: ingestion/build policy
- `rag/retrieval/score_engine.py`: ranking logic
- `rag/retrieval/external_gateway.py`: infrastructure connectors
- `rag/retrieval/in_memory.py`: use-case orchestrator
"""

from .retrieval import Document, InMemoryRetriever

__all__ = ["Document", "InMemoryRetriever"]
