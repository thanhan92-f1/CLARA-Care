from clara_ml.rag.retrieval.domain import Document
from clara_ml.rag.retrieval.score_engine import DocumentScorer


class _StubEmbedder:
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        # Deterministic vectors for unit tests; ranking relies mainly on lexical/policy logic.
        return [[1.0, 0.0] for _ in texts]


def test_score_engine_filters_ddi_irrelevant_documents() -> None:
    scorer = DocumentScorer(embedder=_StubEmbedder())
    query = "Tương tác warfarin với ibuprofen"

    docs = [
        Document(
            id="pubmed-warfarin-diet",
            text="Warfarin diet management and nutrition counseling for stable INR.",
            metadata={"source": "pubmed", "url": "https://pubmed.ncbi.nlm.nih.gov/1/"},
        ),
        Document(
            id="openfda-warfarin-label",
            text="Warfarin sodium labeling information and major safety warnings.",
            metadata={"source": "openfda", "url": "https://open.fda.gov/apis/drug/label/"},
        ),
        Document(
            id="pubmed-warfarin-ibuprofen-ddi",
            text=(
                "Warfarin and ibuprofen interaction increases bleeding risk. "
                "Clinical monitoring of INR is recommended."
            ),
            metadata={"source": "pubmed", "url": "https://pubmed.ncbi.nlm.nih.gov/2/"},
        ),
    ]

    ranked = scorer.score_documents(query, docs, top_k=5)
    ranked_ids = [item.id for item in ranked]

    assert "pubmed-warfarin-diet" not in ranked_ids
    assert "openfda-warfarin-label" in ranked_ids
    assert "pubmed-warfarin-ibuprofen-ddi" in ranked_ids
