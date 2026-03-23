from __future__ import annotations

from dataclasses import dataclass
from typing import List

from clara_ml.rag.embedder import BgeM3EmbedderStub


@dataclass
class EmbeddingResult:
    text: str
    vector: List[float]


class BgeM3Pipeline:
    """Interface pipeline cho BGE-M3, P0 dùng stub adapter."""

    def __init__(self) -> None:
        self._embedder = BgeM3EmbedderStub()

    def embed_batch(self, texts: List[str]) -> List[EmbeddingResult]:
        return [EmbeddingResult(text=t, vector=self._embedder.embed(t)) for t in texts]
