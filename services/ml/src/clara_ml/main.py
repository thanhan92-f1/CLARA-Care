from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, WebSocket

from clara_ml.nlp.pii_filter import redact_pii
from clara_ml.prompts.loader import PromptLoader
from clara_ml.rag.pipeline import RagPipelineP0
from clara_ml.streaming.ws import token_stream

app = FastAPI(title="CLARA ML Service", version="0.1.0")

prompt_loader = PromptLoader(
    Path(__file__).resolve().parent / "prompts" / "templates"
)
rag_pipeline = RagPipelineP0()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "clara-ml"}


@app.post("/v1/rag/poc")
def rag_poc(payload: dict) -> dict:
    query = str(payload.get("query", "")).strip()
    pii = redact_pii(query)
    result = rag_pipeline.run(pii.redacted_text)
    return {
        "query": query,
        "redacted_query": pii.redacted_text,
        "pii_flags": pii.flags,
        "retrieved_ids": result.retrieved_ids,
        "answer": result.answer,
    }


@app.get("/v1/prompts/{role}/{intent}")
def get_prompt(role: str, intent: str) -> dict:
    return prompt_loader.load(role, intent)


@app.websocket("/ws/stream")
async def ws_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    incoming = await websocket.receive_text()
    async for token in token_stream(incoming):
        await websocket.send_json({"token": token})
    await websocket.send_json({"event": "done"})
    await websocket.close()
