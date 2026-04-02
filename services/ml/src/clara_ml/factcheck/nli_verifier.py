from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


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
_DOSAGE_TERMS = {"liều", "lieu", "dose", "dosage", "mg", "viên", "vien", "uống", "uong"}
_INTERACTION_TERMS = {"tương", "tac", "interaction", "ddi", "dùng", "cùng", "warfarin", "aspirin"}
_CONTRAINDICATION_TERMS = {"chống", "chong", "contraindication", "contraindicated", "không nên", "avoid"}


@dataclass
class ClaimVerdict:
    claim: str
    claim_type: str
    nli_label: str
    support_status: str
    confidence: float
    overlap_score: float
    evidence_ref: str | None
    evidence_snippet: str
    rationale: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "claim": self.claim,
            "claim_type": self.claim_type,
            "nli_label": self.nli_label,
            "support_status": self.support_status,
            "confidence": round(float(self.confidence), 4),
            "overlap_score": round(float(self.overlap_score), 4),
            "evidence_ref": self.evidence_ref,
            "evidence_snippet": self.evidence_snippet,
            "rationale": self.rationale,
        }


NliClaimVerdict = ClaimVerdict


def _tokenize(text: str) -> set[str]:
    lowered = str(text or "").lower()
    return {token for token in re.findall(r"[0-9a-zA-ZÀ-ỹ]{2,}", lowered) if token}


def _compact_snippet(text: str, *, max_len: int = 180) -> str:
    snippet = " ".join(str(text or "").split()).strip()
    if not snippet:
        return ""
    if len(snippet) <= max_len:
        return snippet
    return f"{snippet[: max_len - 3]}..."


def infer_claim_type(claim: str) -> str:
    claim_tokens = _tokenize(claim)
    if claim_tokens.intersection(_DOSAGE_TERMS):
        return "dosage"
    if claim_tokens.intersection(_CONTRAINDICATION_TERMS):
        return "contraindication"
    if claim_tokens.intersection(_INTERACTION_TERMS):
        return "interaction"
    return "general"


def _best_overlap_match(
    claim: str,
    evidence_rows: list[dict[str, str]],
) -> tuple[float, dict[str, str] | None]:
    claim_tokens = _tokenize(claim)
    if not claim_tokens:
        return 0.0, None

    best_ratio = 0.0
    best_row: dict[str, str] | None = None
    for row in evidence_rows:
        text = row.get("text", "")
        doc_tokens = _tokenize(text)
        if not doc_tokens:
            continue
        overlap = len(claim_tokens.intersection(doc_tokens))
        ratio = overlap / max(len(claim_tokens), 1)
        if ratio > best_ratio:
            best_ratio = ratio
            best_row = row
    return best_ratio, best_row


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


def _claim_confidence(*, overlap_ratio: float, support_status: str) -> float:
    bounded_ratio = max(0.0, min(float(overlap_ratio), 1.0))
    if support_status == "contradicted":
        score = 0.2 + (0.28 * bounded_ratio)
    elif support_status == "supported":
        score = 0.56 + (0.4 * bounded_ratio)
    else:
        score = 0.2 + (0.3 * bounded_ratio)
    return max(0.05, min(0.98, score))


def _status_rationale(*, support_status: str, overlap_ratio: float, evidence_ref: str | None) -> str:
    if support_status == "supported":
        return f"Claim được evidence hỗ trợ (overlap={overlap_ratio:.2f}, ref={evidence_ref or 'n/a'})."
    if support_status == "contradicted":
        return f"Claim có dấu hiệu mâu thuẫn với evidence (overlap={overlap_ratio:.2f}, ref={evidence_ref or 'n/a'})."
    return "Chưa đủ bằng chứng hỗ trợ claim trong tập evidence hiện tại."


def classify_claim(
    claim: str,
    *,
    evidence_rows: list[dict[str, str]],
    support_threshold: float = 0.2,
) -> ClaimVerdict:
    overlap_ratio, matched_evidence = _best_overlap_match(claim, evidence_rows)
    evidence_text = matched_evidence.get("text", "") if matched_evidence else ""
    contradiction = _has_contradiction(claim, evidence_text, overlap_ratio)
    if contradiction:
        nli_label = "contradicted"
        support_status = "contradicted"
    elif overlap_ratio >= support_threshold:
        nli_label = "supported"
        support_status = "supported"
    else:
        nli_label = "insufficient"
        support_status = "insufficient"

    evidence_ref = matched_evidence.get("ref") if matched_evidence and overlap_ratio > 0 else None
    evidence_snippet = _compact_snippet(evidence_text, max_len=180) if evidence_ref else ""
    confidence = _claim_confidence(overlap_ratio=overlap_ratio, support_status=support_status)
    rationale = _status_rationale(
        support_status=support_status,
        overlap_ratio=overlap_ratio,
        evidence_ref=evidence_ref,
    )
    return ClaimVerdict(
        claim=claim,
        claim_type=infer_claim_type(claim),
        nli_label=nli_label,
        support_status=support_status,
        confidence=confidence,
        overlap_score=round(float(overlap_ratio), 4),
        evidence_ref=evidence_ref,
        evidence_snippet=evidence_snippet,
        rationale=rationale,
    )


def summarize_verdicts(rows: list[dict[str, Any]]) -> dict[str, Any]:
    total_claims = len(rows)
    supported_claims = 0
    contradicted_claims = 0
    unsupported_claims = 0
    for row in rows:
        status = str(row.get("support_status") or "").strip().lower()
        if status == "supported":
            supported_claims += 1
        elif status == "contradicted":
            contradicted_claims += 1
        else:
            unsupported_claims += 1

    support_ratio = supported_claims / max(total_claims, 1) if total_claims > 0 else 0.0
    return {
        "version": "claim-v2-nli",
        "total_claims": total_claims,
        "supported_claims": supported_claims,
        "unsupported_claims": unsupported_claims,
        "contradicted_claims": contradicted_claims,
        "support_ratio": round(float(support_ratio), 4),
    }


def contradiction_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    contradicted_rows = [
        row
        for row in rows
        if str(row.get("support_status") or "").strip().lower() == "contradicted"
    ]
    details = [
        {
            "claim": row.get("claim", ""),
            "claim_type": row.get("claim_type", "general"),
            "evidence_ref": row.get("evidence_ref"),
            "evidence_snippet": row.get("evidence_snippet", ""),
            "overlap_score": row.get("overlap_score", 0.0),
            "confidence": row.get("confidence", 0.0),
            "rationale": row.get("rationale", ""),
        }
        for row in contradicted_rows[:5]
    ]
    return {
        "version": "claim-v2-nli",
        "has_contradiction": bool(contradicted_rows),
        "contradiction_count": len(contradicted_rows),
        "claims": [str(item.get("claim") or "") for item in contradicted_rows[:5]],
        "details": details,
        "note": (
            "Phát hiện claim mâu thuẫn với evidence retrieval."
            if contradicted_rows
            else "Không phát hiện claim mâu thuẫn."
        ),
    }


def build_verification_matrix(
    claims: list[str],
    *,
    evidence_rows: list[dict[str, str]],
) -> dict[str, Any]:
    rows = [classify_claim(claim, evidence_rows=evidence_rows).as_dict() for claim in claims]
    summary = summarize_verdicts(rows)
    contradiction = contradiction_summary(rows)
    return {
        "version": "claim-v2-nli",
        "rows": rows,
        "summary": summary,
        "contradiction_summary": contradiction,
}


def verify_claims(*, claims: list[str], evidence_rows: list[dict[str, str]]) -> list[ClaimVerdict]:
    return [classify_claim(claim, evidence_rows=evidence_rows) for claim in claims]


def summarize_verification_matrix(
    *,
    rows: list[dict[str, Any]],
    total_claims: int | None = None,
) -> dict[str, Any]:
    summary = summarize_verdicts(rows)
    if total_claims is not None:
        inferred_total = max(int(total_claims), int(summary.get("total_claims") or 0))
        supported = int(summary.get("supported_claims") or 0)
        contradicted = int(summary.get("contradicted_claims") or 0)
        unsupported = max(inferred_total - supported - contradicted, int(summary.get("unsupported_claims") or 0))
        support_ratio = supported / max(inferred_total, 1) if inferred_total > 0 else 0.0
        summary = {
            **summary,
            "total_claims": inferred_total,
            "unsupported_claims": unsupported,
            "support_ratio": round(float(support_ratio), 4),
        }
    return summary


def build_contradiction_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return contradiction_summary(rows)
