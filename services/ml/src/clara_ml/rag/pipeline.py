from __future__ import annotations

from dataclasses import dataclass
from typing import List

from clara_ml.rag.retriever import Document, InMemoryRetriever


@dataclass
class RagResult:
    query: str
    retrieved_ids: List[str]
    answer: str


class RagPipelineP0:
    """PoC đơn giản: query -> embed -> retrieve -> generate (stub)."""

    def __init__(self) -> None:
        self.retriever = InMemoryRetriever(
            documents=[
                Document(id="byt-001", text="Hướng dẫn BYT về dùng thuốc an toàn cho người cao tuổi."),
                Document(id="duoc-thu-001", text="Dược thư quốc gia: cảnh báo tương tác nhóm NSAID."),
                Document(id="pubmed-001", text="PubMed: medication adherence improves with reminders."),
            ]
        )

    def run(self, query: str) -> RagResult:
        docs = self.retriever.retrieve(query)
        ids = [d.id for d in docs]
        synthesized = " | ".join(d.text for d in docs)
        answer = f"[PoC] Trả lời dựa trên nguồn: {ids}. Tóm tắt: {synthesized}"
        return RagResult(query=query, retrieved_ids=ids, answer=answer)
