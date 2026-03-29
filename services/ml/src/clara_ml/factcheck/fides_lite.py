from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


@dataclass
class FactCheckResult:
    enabled: bool
    stage: str
    verdict: str
    confidence: float
    supported_claims: int
    total_claims: int
    unsupported_claims: list[str]
    evidence_count: int
    severity: str
    note: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "stage": self.stage,
            "verdict": self.verdict,
            "confidence": round(self.confidence, 4),
            "supported_claims": self.supported_claims,
            "total_claims": self.total_claims,
            "unsupported_claims": self.unsupported_claims,
            "evidence_count": self.evidence_count,
            "severity": self.severity,
            "note": self.note,
        }


_NEGATION_TERMS = {
    "khong",
    "không",
    "chua",
    "chưa",
    "no",
    "not",
    "never",
    "without",
    "tranh",
    "avoid",
    "contraindicated",
}
_INCREASE_TERMS = {"tang", "tăng", "increase", "increased", "higher", "cao"}
_DECREASE_TERMS = {"giam", "giảm", "decrease", "reduced", "lower", "thap"}
_CITATION_PATTERNS = [
    re.compile(r"\[[^\]]+\]"),
    re.compile(r"\(source[^)]*\)", re.IGNORECASE),
    re.compile(r"\(nguon[^)]*\)", re.IGNORECASE),
]


def _tokenize(text: str) -> set[str]:
    lowered = text.lower()
    return {token for token in re.findall(r"[0-9a-zA-ZÀ-ỹ]{2,}", lowered) if token}


def _split_claims(answer: str) -> list[str]:
    raw_chunks = re.split(r"[.!?\n\r•\-]+", answer)
    claims: list[str] = []
    seen: set[str] = set()
    for chunk in raw_chunks:
        claim = " ".join(chunk.split()).strip()
        if len(claim) < 20:
            continue
        dedupe_key = claim.lower()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        claims.append(claim)
        if len(claims) >= 10:
            break
    return claims


def _best_overlap_ratio(claim: str, evidence_texts: list[str]) -> tuple[float, str]:
    claim_tokens = _tokenize(claim)
    if not claim_tokens:
        return 0.0, ""
    best_ratio = 0.0
    best_text = ""
    for text in evidence_texts:
        doc_tokens = _tokenize(text)
        if not doc_tokens:
            continue
        overlap = len(claim_tokens.intersection(doc_tokens))
        ratio = overlap / max(len(claim_tokens), 1)
        if ratio > best_ratio:
            best_ratio = ratio
            best_text = text
    return best_ratio, best_text


def _contains_any(tokens: set[str], lexicon: set[str]) -> bool:
    return bool(tokens.intersection(lexicon))


def _has_contradiction(claim: str, evidence: str, overlap_ratio: float) -> bool:
    if not evidence or overlap_ratio < 0.16:
        return False

    claim_tokens = _tokenize(claim)
    evidence_tokens = _tokenize(evidence)

    claim_has_negation = _contains_any(claim_tokens, _NEGATION_TERMS)
    evidence_has_negation = _contains_any(evidence_tokens, _NEGATION_TERMS)
    if claim_has_negation != evidence_has_negation and overlap_ratio >= 0.2:
        return True

    claim_increase = _contains_any(claim_tokens, _INCREASE_TERMS)
    evidence_increase = _contains_any(evidence_tokens, _INCREASE_TERMS)
    claim_decrease = _contains_any(claim_tokens, _DECREASE_TERMS)
    evidence_decrease = _contains_any(evidence_tokens, _DECREASE_TERMS)

    if claim_increase and evidence_decrease and overlap_ratio >= 0.24:
        return True
    if claim_decrease and evidence_increase and overlap_ratio >= 0.24:
        return True

    return False


def _has_citations(answer: str, context_ids: list[str]) -> bool:
    lowered = answer.lower()
    if any(pattern.search(answer) for pattern in _CITATION_PATTERNS):
        return True
    for source_id in context_ids:
        if source_id and source_id.lower() in lowered:
            return True
    return False


def run_fides_lite(
    *,
    answer: str,
    retrieved_context: list[dict[str, Any]],
) -> FactCheckResult:
    evidence_texts = [str(item.get("text", "")) for item in retrieved_context if item.get("text")]
    context_ids = [str(item.get("id", "")) for item in retrieved_context if item.get("id")]
    claims = _split_claims(answer)

    if not claims:
        return FactCheckResult(
            enabled=True,
            stage="fides-lite-v1.1",
            verdict="pass",
            confidence=0.55,
            supported_claims=0,
            total_claims=0,
            unsupported_claims=[],
            evidence_count=len(evidence_texts),
            severity="low",
            note="Khong co atomic claim de kiem chung.",
        )

    if not evidence_texts:
        return FactCheckResult(
            enabled=True,
            stage="fides-lite-v1.1",
            verdict="warn",
            confidence=0.35,
            supported_claims=0,
            total_claims=len(claims),
            unsupported_claims=claims[:3],
            evidence_count=0,
            severity="high",
            note="Khong co evidence retrieval de fact-check.",
        )

    supported_claims = 0
    unsupported_claims: list[str] = []
    contradicted_claims: list[str] = []

    for claim in claims:
        ratio, matched_evidence = _best_overlap_ratio(claim, evidence_texts)
        contradiction = _has_contradiction(claim, matched_evidence, ratio)

        if contradiction:
            contradicted_claims.append(claim)
            continue

        if ratio >= 0.2:
            supported_claims += 1
        else:
            unsupported_claims.append(claim)

    support_ratio = supported_claims / max(len(claims), 1)
    citation_present = _has_citations(answer, context_ids)

    confidence = 0.45 + (0.45 * support_ratio)
    if contradicted_claims:
        confidence -= 0.25 * min(1.0, len(contradicted_claims) / max(len(claims), 1))
    if not citation_present:
        confidence -= 0.08
    confidence = max(0.25, min(0.95, confidence))

    if contradicted_claims:
        verdict = "fail"
        severity = "high"
        note = "Phat hien claim co dau hieu mau thuan voi evidence truy xuat."
    elif support_ratio >= 0.75:
        verdict = "pass"
        severity = "low"
        if citation_present:
            note = "Da doi chieu voi evidence retrieval va dat nguong ho tro cao."
        else:
            note = "Claim duoc ho tro tot, nhung cau tra loi chua ghi ro citation."
    elif support_ratio >= 0.4:
        verdict = "warn"
        severity = "medium"
        note = "Mot phan claim chua du bang chung, can hien thi canh bao."
    else:
        verdict = "warn"
        severity = "high"
        note = "Da so claim khong duoc ho tro boi evidence retrieval."

    unsupported_bundle = unsupported_claims + [
        f"[contradiction] {claim}" for claim in contradicted_claims
    ]

    return FactCheckResult(
        enabled=True,
        stage="fides-lite-v1.1",
        verdict=verdict,
        confidence=confidence,
        supported_claims=supported_claims,
        total_claims=len(claims),
        unsupported_claims=unsupported_bundle[:3],
        evidence_count=len(evidence_texts),
        severity=severity,
        note=note,
    )
