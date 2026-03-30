from __future__ import annotations

import re
from dataclasses import dataclass, field
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
    fide_report: dict[str, Any] = field(default_factory=dict)

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
            "fide_report": self.fide_report,
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


def _build_fide_report(
    *,
    claims_count: int,
    evidence_count: int,
    supported_claims: int,
    verdict: str,
    severity: str,
    confidence: float,
    note: str,
    unsupported_claims: list[str],
    citation_present: bool,
    mode: str,
) -> dict[str, Any]:
    coverage = supported_claims / max(claims_count, 1) if claims_count > 0 else 0.0
    contradiction_count = sum(1 for item in unsupported_claims if item.startswith("[contradiction]"))
    return {
        "framework": "fide-v1",
        "mode": mode,
        "stages": [
            {
                "id": "foundation",
                "status": "completed" if claims_count >= 0 else "failed",
                "claims_count": claims_count,
                "note": "Extracted atomic claims from answer.",
            },
            {
                "id": "integrity",
                "status": "completed" if evidence_count > 0 else "warning",
                "evidence_count": evidence_count,
                "citation_present": citation_present,
                "coverage": round(float(coverage), 4),
                "contradiction_count": contradiction_count,
            },
            {
                "id": "decision",
                "status": verdict,
                "severity": severity,
                "confidence": round(float(confidence), 4),
            },
            {
                "id": "explanation",
                "status": "completed",
                "note": note,
                "unsupported_claims": unsupported_claims[:3],
            },
        ],
        "summary": {
            "claims_count": claims_count,
            "supported_claims": supported_claims,
            "coverage": round(float(coverage), 4),
            "evidence_count": evidence_count,
            "citation_present": citation_present,
            "verdict": verdict,
            "severity": severity,
            "confidence": round(float(confidence), 4),
        },
    }


def run_fides_lite(
    *,
    answer: str,
    retrieved_context: list[dict[str, Any]],
    mode: str = "lite",
) -> FactCheckResult:
    normalized_mode = mode.strip().lower() if isinstance(mode, str) else "lite"
    if normalized_mode not in {"lite", "strict"}:
        normalized_mode = "lite"

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
            fide_report=_build_fide_report(
                claims_count=0,
                evidence_count=len(evidence_texts),
                supported_claims=0,
                verdict="pass",
                severity="low",
                confidence=0.55,
                note="Khong co atomic claim de kiem chung.",
                unsupported_claims=[],
                citation_present=_has_citations(answer, context_ids),
                mode=normalized_mode,
            ),
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
            fide_report=_build_fide_report(
                claims_count=len(claims),
                evidence_count=0,
                supported_claims=0,
                verdict="warn",
                severity="high",
                confidence=0.35,
                note="Khong co evidence retrieval de fact-check.",
                unsupported_claims=claims[:3],
                citation_present=_has_citations(answer, context_ids),
                mode=normalized_mode,
            ),
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

    pass_threshold = 0.8 if normalized_mode == "strict" else 0.75
    warn_threshold = 0.55 if normalized_mode == "strict" else 0.4

    if contradicted_claims:
        verdict = "fail"
        severity = "high"
        note = "Phat hien claim co dau hieu mau thuan voi evidence truy xuat."
    elif support_ratio >= pass_threshold:
        verdict = "pass"
        severity = "low"
        if citation_present:
            note = "Da doi chieu voi evidence retrieval va dat nguong ho tro cao."
        else:
            note = "Claim duoc ho tro tot, nhung cau tra loi chua ghi ro citation."
    elif support_ratio >= warn_threshold:
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
        fide_report=_build_fide_report(
            claims_count=len(claims),
            evidence_count=len(evidence_texts),
            supported_claims=supported_claims,
            verdict=verdict,
            severity=severity,
            confidence=confidence,
            note=note,
            unsupported_claims=unsupported_bundle,
            citation_present=citation_present,
            mode=normalized_mode,
        ),
    )
