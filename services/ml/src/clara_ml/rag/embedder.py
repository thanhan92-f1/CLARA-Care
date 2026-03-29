from __future__ import annotations

import hashlib
import json
from threading import Lock
from typing import Any, List, Sequence
from urllib.request import Request, urlopen

from clara_ml.config import settings


class BgeM3EmbedderStub:
    """Adapter stub cho BGE-M3: tao vector gia dinh tu hash de fallback an toan."""

    def embed(self, text: str) -> List[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        # 16 chieu gia lap de test flow
        return [b / 255.0 for b in digest[:16]]

    def embed_batch(self, texts: Sequence[str]) -> List[List[float]]:
        return [self.embed(text) for text in texts]


class HttpEmbeddingClient:
    """HTTP embedding client with transparent fallback to local stub."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout_seconds: float | None = None,
        fallback_embedder: BgeM3EmbedderStub | None = None,
    ) -> None:
        self._api_key = (settings.embedding_api_key if api_key is None else api_key).strip()
        self._base_url = (settings.embedding_base_url if base_url is None else base_url).strip()
        self._model = (settings.embedding_model if model is None else model).strip()
        self._timeout_seconds = (
            settings.embedding_timeout_seconds if timeout_seconds is None else timeout_seconds
        )
        self._fallback = fallback_embedder or BgeM3EmbedderStub()
        self._cache: dict[str, list[float]] = {}
        self._lock = Lock()

    def _endpoint(self) -> str:
        base = self._base_url.rstrip("/")
        return f"{base}/embeddings"

    def _normalize(self, text: str) -> str:
        return " ".join(str(text or "").split()).strip()

    def _extract_vectors(self, payload: Any) -> list[list[float]]:
        if not isinstance(payload, dict):
            raise ValueError("Invalid embedding response payload")
        data = payload.get("data")
        if not isinstance(data, list):
            raise ValueError("Embedding response missing data")

        vectors: list[list[float]] = []
        for item in data:
            if not isinstance(item, dict):
                raise ValueError("Embedding item is not an object")
            embedding = item.get("embedding")
            if not isinstance(embedding, list) or not embedding:
                raise ValueError("Embedding vector missing")
            vector: list[float] = []
            for value in embedding:
                try:
                    vector.append(float(value))
                except (TypeError, ValueError) as exc:
                    raise ValueError("Embedding vector contains non-numeric value") from exc
            vectors.append(vector)
        return vectors

    def _request_remote_embeddings(self, texts: Sequence[str]) -> list[list[float]]:
        payload = json.dumps({"model": self._model, "input": list(texts)}).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "CLARA-ML/0.1",
        }
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        req = Request(self._endpoint(), data=payload, headers=headers, method="POST")
        with urlopen(req, timeout=max(float(self._timeout_seconds), 0.2)) as response:
            raw = response.read().decode("utf-8", errors="ignore")
        parsed = json.loads(raw)
        vectors = self._extract_vectors(parsed)
        if len(vectors) != len(texts):
            raise ValueError("Embedding response size mismatch")
        return vectors

    def _fallback_vectors(self, texts: Sequence[str]) -> list[list[float]]:
        return self._fallback.embed_batch(texts)

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []

        normalized = [self._normalize(text) for text in texts]
        pending_indices: list[int] = []
        pending_values: list[str] = []
        vectors: list[list[float] | None] = [None] * len(normalized)

        with self._lock:
            for idx, text in enumerate(normalized):
                cached = self._cache.get(text)
                if cached is not None:
                    vectors[idx] = list(cached)
                else:
                    pending_indices.append(idx)
                    pending_values.append(text)

        if pending_values:
            remote_vectors: list[list[float]] | None = None
            if self._api_key:
                try:
                    remote_vectors = self._request_remote_embeddings(pending_values)
                except Exception:
                    remote_vectors = None

            if remote_vectors is None:
                # Fallback must be deterministic so retriever behavior stays stable when API is down.
                remote_vectors = self._fallback_vectors(pending_values)

            with self._lock:
                for idx, text, vector in zip(pending_indices, pending_values, remote_vectors):
                    safe_vector = [float(item) for item in vector]
                    self._cache[text] = safe_vector
                    vectors[idx] = list(safe_vector)

        return [vector if vector is not None else self._fallback.embed(text) for vector, text in zip(vectors, normalized)]

    def embed(self, text: str) -> List[float]:
        return self.embed_batch([text])[0]
