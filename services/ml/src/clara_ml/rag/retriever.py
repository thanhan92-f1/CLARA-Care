from __future__ import annotations

from dataclasses import dataclass
from typing import List

from clara_ml.rag.embedder import BgeM3EmbedderStub


@dataclass
class Document:
    id: str
    text: str


class InMemoryRetriever:
    def __init__(self, documents: List[Document]) -> None:
        self.documents = documents
        self.embedder = BgeM3EmbedderStub()

    def retrieve(self, query: str, top_k: int = 3) -> List[Document]:
        qvec = self.embedder.embed(query)
        scored = []
        for doc in self.documents:
            dvec = self.embedder.embed(doc.text)
            # dot product đơn giản
            score = sum(a * b for a, b in zip(qvec, dvec))
            scored.append((score, doc))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored[:top_k]]
