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

    def _audio_transcriptions_url(self) -> str:
        base = self._base_url
        if base.endswith("/v1"):
            return f"{base}/audio/transcriptions"
        return f"{base}/v1/audio/transcriptions"

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

        content = choices[0].get("message", {}).get("content", "").strip()
        if not content:
            raise RuntimeError("DeepSeek response content is empty")

        model = str(data.get("model", self._model))
        return DeepSeekResponse(content=content, model=model)

    def transcribe_audio(
        self,
        *,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        model: str,
        language: str | None = None,
        prompt: str | None = None,
    ) -> str:
        if not self._api_key:
            raise ValueError("Missing DEEPSEEK_API_KEY")
        if not audio_bytes:
            raise ValueError("Audio payload is empty")

        data: dict[str, str] = {"model": model}
        if language:
            data["language"] = language
        if prompt:
            data["prompt"] = prompt

        with httpx.Client(timeout=self._timeout_seconds) as client:
            response = client.post(
                self._audio_transcriptions_url(),
                headers={"Authorization": f"Bearer {self._api_key}"},
                data=data,
                files={
                    "file": (
                        filename,
                        audio_bytes,
                        content_type or "application/octet-stream",
                    )
                },
            )
            response.raise_for_status()

        payload = response.json()
        if not isinstance(payload, dict):
            raise RuntimeError("DeepSeek transcription payload has invalid format")
        text = str(payload.get("text", "")).strip()
        if not text:
            raise RuntimeError("DeepSeek transcription result is empty")
        return text
