# CLARA API (P0)

FastAPI backend skeleton for CLARA P0.

## Run

```bash
uv pip install -e ".[dev]"
uvicorn clara_api.main:app --reload --host 0.0.0.0 --port 8000
```

## Alembic

```bash
alembic upgrade head
```
