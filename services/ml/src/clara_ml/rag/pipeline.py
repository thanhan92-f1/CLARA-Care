from __future__ import annotations

from dataclasses import dataclass
from typing import List, Protocol

from clara_ml.config import settings
from clara_ml.llm.deepseek_client import DeepSeekClient, DeepSeekResponse
from clara_ml.rag.retriever import Document, InMemoryRetriever


@dataclass
class RagResult:
    query: str
    retrieved_ids: List[str]
    answer: str
    model_used: str


class LlmGenerator(Protocol):
    @property
    def model(self) -> str: ...

    def generate(self, prompt: str, system_prompt: str | None = None) -> DeepSeekResponse: ...


class RagPipelineP1:
    """P1 pipeline: retrieve -> LLM answer (if available) -> deterministic fallback."""

    def __init__(
        self,
        retriever: InMemoryRetriever | None = None,
        llm_client: LlmGenerator | None = None,
        deepseek_api_key: str | None = None,
        deepseek_base_url: str | None = None,
        deepseek_model: str | None = None,
        deepseek_timeout_seconds: float | None = None,
    ) -> None:
        self.retriever = retriever or InMemoryRetriever(
            documents=[
                Document(id="byt-001", text="Bo Y Te guidance on safe medicine use in older adults."),
                Document(id="duoc-thu-001", text="National drug handbook warning for NSAID interactions."),
                Document(id="pubmed-001", text="PubMed: medication adherence improves with reminders."),
            ]
        )
        self._deepseek_api_key = (
            settings.deepseek_api_key if deepseek_api_key is None else deepseek_api_key
        )
        self._llm_client = llm_client
        if self._llm_client is None and self._deepseek_api_key:
            self._llm_client = DeepSeekClient(
                api_key=self._deepseek_api_key,
                base_url=deepseek_base_url or settings.deepseek_base_url,
                model=deepseek_model or settings.deepseek_model,
                timeout_seconds=(
                    settings.deepseek_timeout_seconds
                    if deepseek_timeout_seconds is None
                    else deepseek_timeout_seconds
                ),
            )

    @staticmethod
    def _local_synthesis(query: str, docs: List[Document]) -> str:
        sources = ", ".join(doc.id for doc in docs) if docs else "none"
        snippets = " | ".join(f"{doc.id}: {doc.text}" for doc in docs)
        return (
            f"Tra loi tam thoi (local): query='{query}'. "
            f"Sources=[{sources}]. Summary={snippets}"
        )

    @staticmethod
    def _build_prompt(query: str, docs: List[Document]) -> str:
        context = "\n".join(f"- ({doc.id}) {doc.text}" for doc in docs)
        return (
            "Answer using only retrieved context.\n"
            "If context is insufficient, say what is missing.\n"
            f"User query: {query}\n"
            f"Retrieved context:\n{context}"
        )

    def run(self, query: str) -> RagResult:
        docs = self.retriever.retrieve(query)
        ids = [d.id for d in docs]
        if self._llm_client and self._deepseek_api_key:
            try:
                response = self._llm_client.generate(
                    prompt=self._build_prompt(query, docs),
                    system_prompt=(
                        "You are CLARA clinical assistant. Be concise, safe, and cite source ids."
                    ),
                )
                return RagResult(
                    query=query,
                    retrieved_ids=ids,
                    answer=response.content,
                    model_used=response.model or self._llm_client.model,
                )
            except Exception:
                pass

        return RagResult(
            query=query,
            retrieved_ids=ids,
            answer=self._local_synthesis(query, docs),
            model_used="local-synth-v1",
        )


RagPipelineP0 = RagPipelineP1
