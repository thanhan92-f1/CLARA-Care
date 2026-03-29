# RAG Retrieval Architecture

This folder follows a clean-layer split for easier maintenance and demo explanation.

- `domain.py`
  - Core entity (`Document`) and stable scoring constants.
- `text_utils.py`
  - Pure normalization and parsing helpers (no I/O).
- `document_builder.py`
  - Build and normalize retrieval candidates from uploaded docs and configured RAG sources.
- `score_engine.py`
  - Embedding-based ranking and source-policy weighting.
- `external_gateway.py`
  - Infrastructure integrations (PubMed, Europe PMC, OpenAlex, Crossref, ClinicalTrials, openFDA, DailyMed, SearXNG).
- `in_memory.py`
  - Use-case orchestrator (`InMemoryRetriever`) combining internal retrieval, external retrieval, and final re-ranking.

`rag/retriever.py` is now a compatibility facade so existing imports remain unchanged.
