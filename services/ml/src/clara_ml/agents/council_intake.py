from __future__ import annotations

import json
import re
from typing import Any

from clara_ml.config import settings
from clara_ml.llm.deepseek_client import DeepSeekClient


def _build_client() -> DeepSeekClient:
    return DeepSeekClient(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
        model=settings.deepseek_model,
        timeout_seconds=settings.deepseek_timeout_seconds,
    )


def _strip_code_fence(value: str) -> str:
    text = value.strip()
    text = re.sub(r"^```(?:json)?", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"```$", "", text).strip()
    return text


def _as_text(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return ""


def _normalize_text_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    normalized: list[str] = []
    seen: set[str] = set()
    for item in value:
        if isinstance(item, dict):
            candidate = _as_text(item.get("name") or item.get("value") or item.get("text"))
        else:
            candidate = _as_text(item)
        if not candidate:
            continue
        key = candidate.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(candidate)
    return normalized


def _normalize_labs(value: Any) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []

    if isinstance(value, dict):
        for key, raw in value.items():
            name = _as_text(key)
            val = _as_text(raw)
            if not name:
                continue
            rows.append(
                {
                    "name": name,
                    "value": val,
                    "unit": "",
                    "raw": f"{name}={val}" if val else name,
                }
            )
        return rows

    if not isinstance(value, list):
        return rows

    for item in value:
        if isinstance(item, dict):
            name = _as_text(item.get("name") or item.get("key") or item.get("lab"))
            val = _as_text(item.get("value") or item.get("result"))
            unit = _as_text(item.get("unit"))
            raw = _as_text(item.get("raw"))
            if not name and not raw:
                continue
            if not raw:
                raw = f"{name}={val} {unit}".strip()
            rows.append(
                {
                    "name": name,
                    "value": val,
                    "unit": unit,
                    "raw": raw,
                }
            )
            continue

        raw_line = _as_text(item)
        if not raw_line:
            continue
        key_match = re.match(r"^([A-Za-zÀ-ỹ0-9_/-]+)\s*[:=]\s*([0-9]+(?:[.,][0-9]+)?)\s*(.*)$", raw_line)
        if key_match:
            rows.append(
                {
                    "name": key_match.group(1).strip(),
                    "value": key_match.group(2).strip(),
                    "unit": key_match.group(3).strip(),
                    "raw": raw_line,
                }
            )
        else:
            rows.append({"name": "", "value": "", "unit": "", "raw": raw_line})

    return rows


def _format_labs_input(labs: list[dict[str, str]]) -> str:
    lines: list[str] = []
    for item in labs:
        name = _as_text(item.get("name"))
        value = _as_text(item.get("value"))
        unit = _as_text(item.get("unit"))
        raw = _as_text(item.get("raw"))
        if name and value:
            line = f"{name}={value}"
            if unit:
                line = f"{line} {unit}"
            lines.append(line)
            continue
        if raw:
            lines.append(raw)
    return "\n".join(lines)


def _heuristic_intake(transcript: str) -> dict[str, Any]:
    lines = [line.strip(" -\t") for line in transcript.splitlines() if line.strip()]
    if not lines:
        lines = [chunk.strip() for chunk in re.split(r"[.;]", transcript) if chunk.strip()]

    lab_rows: list[dict[str, str]] = []
    symptoms: list[str] = []
    medications: list[str] = []
    history: list[str] = []

    med_pattern = re.compile(
        r"\b(metformin|warfarin|aspirin|clopidogrel|insulin|atorvastatin|rosuvastatin|ibuprofen|naproxen|paracetamol|amoxicillin)\b",
        flags=re.IGNORECASE,
    )
    symptom_hint = re.compile(
        r"(đau|dau|sốt|sot|khó thở|kho tho|ho|mệt|met|chóng mặt|chong mat|buồn nôn|buon non|đau đầu|dau dau)",
        flags=re.IGNORECASE,
    )
    history_hint = re.compile(
        r"(tiền sử|tien su|history|bệnh nền|benh nen|tăng huyết áp|tang huyet ap|đái tháo đường|dai thao duong|ckd|suy thận|suy tim)",
        flags=re.IGNORECASE,
    )

    for line in lines:
        lab_match = re.search(r"([A-Za-zÀ-ỹ0-9_/-]+)\s*[:=]\s*([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-z%/0-9]*)", line)
        if lab_match:
            lab_rows.append(
                {
                    "name": lab_match.group(1).strip(),
                    "value": lab_match.group(2).strip(),
                    "unit": lab_match.group(3).strip(),
                    "raw": line,
                }
            )

        for med in med_pattern.findall(line):
            cleaned = med.strip()
            if cleaned and cleaned.lower() not in {item.lower() for item in medications}:
                medications.append(cleaned)

        if symptom_hint.search(line):
            symptoms.append(line)

        if history_hint.search(line):
            history.append(line)

    symptoms = _normalize_text_list(symptoms)
    medications = _normalize_text_list(medications)
    history = _normalize_text_list(history)

    return {
        "symptoms": symptoms,
        "labs": lab_rows,
        "medications": medications,
        "history": history,
    }


def _extract_with_deepseek(client: DeepSeekClient, transcript: str) -> dict[str, Any]:
    system_prompt = (
        "Bạn là trợ lý chuẩn hóa intake lâm sàng cho hội chẩn. "
        "Nhiệm vụ: trích xuất chính xác 4 phần từ transcript: symptoms, labs, medications, history. "
        "Chỉ trả về JSON hợp lệ, không markdown, không giải thích."
    )
    prompt = (
        "Hãy trích xuất dữ liệu từ transcript dưới đây và trả về JSON với đúng schema:\n"
        "{\n"
        '  "symptoms": ["..."],\n'
        '  "labs": [{"name": "", "value": "", "unit": "", "raw": ""}],\n'
        '  "medications": ["..."],\n'
        '  "history": ["..."]\n'
        "}\n"
        "Quy tắc:\n"
        "- symptoms: triệu chứng hiện tại, dấu hiệu cấp tính.\n"
        "- labs: chỉ số xét nghiệm hoặc sinh hiệu có giá trị định lượng.\n"
        "- medications: thuốc đang dùng hoặc mới dùng gần đây.\n"
        "- history: bệnh sử, bệnh nền, tiền sử liên quan.\n"
        "- Không chắc chắn thì để rỗng thay vì bịa.\n\n"
        f"Transcript:\n{transcript}"
    )

    response = client.generate(prompt=prompt, system_prompt=system_prompt)
    cleaned = _strip_code_fence(response.content)
    payload = json.loads(cleaned)
    if not isinstance(payload, dict):
        raise ValueError("DeepSeek intake output is not a JSON object")
    payload["_model_used"] = response.model
    return payload


def run_council_intake(
    *,
    transcript: str,
    audio_bytes: bytes | None = None,
    audio_filename: str = "audio.webm",
    audio_content_type: str = "audio/webm",
) -> dict[str, Any]:
    transcript_text = transcript.strip()
    warnings: list[str] = []

    client = _build_client()

    if not transcript_text:
        if not audio_bytes:
            raise ValueError("Missing transcript and audio input")
        try:
            transcript_text = client.transcribe_audio(
                audio_bytes=audio_bytes,
                filename=audio_filename,
                content_type=audio_content_type,
                model=settings.deepseek_audio_model,
                language=settings.deepseek_audio_language,
                prompt="Medical interview in Vietnamese. Return complete transcript.",
            )
        except Exception as exc:  # pragma: no cover - network and provider failures
            raise RuntimeError(
                f"DeepSeek audio transcription failed: {exc.__class__.__name__}"
            ) from exc

    extracted: dict[str, Any]
    model_used = client.model
    try:
        extracted = _extract_with_deepseek(client, transcript_text)
        model_used = _as_text(extracted.get("_model_used")) or client.model
    except Exception as exc:  # pragma: no cover - defensive fallback
        warnings.append(f"deepseek_extract_fallback:{exc.__class__.__name__}")
        extracted = _heuristic_intake(transcript_text)
        model_used = "heuristic-fallback-v1"

    symptoms = _normalize_text_list(extracted.get("symptoms"))
    labs = _normalize_labs(extracted.get("labs"))
    medications = _normalize_text_list(extracted.get("medications"))
    history = _normalize_text_list(extracted.get("history"))

    return {
        "transcript": transcript_text,
        "symptoms": symptoms,
        "labs": labs,
        "medications": medications,
        "history": history,
        "text_fields": {
            "symptoms_input": "\n".join(symptoms),
            "labs_input": _format_labs_input(labs),
            "medications_input": "\n".join(medications),
            "history_input": "\n".join(history),
        },
        "warnings": warnings,
        "model_used": model_used,
    }
