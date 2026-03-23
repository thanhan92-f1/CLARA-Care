from __future__ import annotations

from dataclasses import dataclass

import httpx


@dataclass
class DeepSeekResponse:
    content: str
    model: str


class DeepSeekClient:
    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        timeout_seconds: float = 30.0,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout_seconds = timeout_seconds

    @property
    def model(self) -> str:
        return self._model

    def _chat_completions_url(self) -> str:
        base = self._base_url
        if base.endswith("/v1"):
            return f"{base}/chat/completions"
        return f"{base}/v1/chat/completions"

    def generate(self, prompt: str, system_prompt: str | None = None) -> DeepSeekResponse:
        if not self._api_key:
            raise ValueError("Missing DEEPSEEK_API_KEY")

        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self._model,
            "stream": False,
            "temperature": 0.2,
            "messages": messages,
        }

        with httpx.Client(timeout=self._timeout_seconds) as client:
            response = client.post(
                self._chat_completions_url(),
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()

        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("DeepSeek response has no choices")

        content = (
            choices[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        if not content:
            raise RuntimeError("DeepSeek response content is empty")

        model = str(data.get("model", self._model))
        return DeepSeekResponse(content=content, model=model)
