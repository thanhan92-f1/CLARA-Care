# CLARA ML/NLP (P0)

Skeleton cho P0 gồm:
- LangGraph/LangChain orchestration nền
- BaseAgent + AgentRegistry
- Prompt templates YAML theo role/intent
- RAG PoC (query -> embed -> retrieve -> generate)
- WebSocket streaming handler skeleton
- Vietnamese NLP baseline (Unicode, tokenizer, PII, seed loader)

## Chạy nhanh

```bash
cd services/ml
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn clara_ml.main:app --reload --port 8101
pytest
```
