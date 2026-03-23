from __future__ import annotations

from dataclasses import asdict, dataclass
from itertools import combinations

SUPPORTED_SPECIALISTS = (
    "cardiology",
    "neurology",
    "nephrology",
    "pharmacology",
    "endocrinology",
)

_TRIAGE_SCORE = {
    "routine_follow_up": 1,
    "same_day_review": 2,
    "emergency_escalation": 3,
}

_RED_FLAG_RULES = {
    "possible_acute_coronary_syndrome": (
        "chest pain",
        "dau nguc",
    ),
    "possible_stroke": (
        "one sided weakness",
        "slurred speech",
        "facial droop",
        "sudden vision loss",
    ),
    "severe_respiratory_distress": (
        "shortness of breath",
        "kho tho",
        "cannot breathe",
    ),
    "loss_of_consciousness": (
        "loss of consciousness",
        "fainting",
        "unresponsive",
    ),
    "severe_bleeding": (
        "severe bleeding",
        "vomiting blood",
        "black stool",
    ),
}


@dataclass(frozen=True)
class SpecialistAssessment:
    specialist: str
    reasoning_log: list[str]
    key_findings: list[str]
    triage: str
    recommendation: str


def _normalize_text_list(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        clean = value.strip().lower()
        return [clean] if clean else []
    if isinstance(value, list):
        normalized: list[str] = []
        for item in value:
            if isinstance(item, str) and item.strip():
                normalized.append(item.strip().lower())
        return normalized
    return []


def _normalize_labs(value: object) -> dict[str, float]:
    if not isinstance(value, dict):
        return {}
    normalized: dict[str, float] = {}
    for key, raw in value.items():
        lab_key = str(key).strip().lower()
        if not lab_key:
            continue
        if isinstance(raw, bool):
            continue
        if isinstance(raw, (int, float)):
            normalized[lab_key] = float(raw)
            continue
        if isinstance(raw, str):
            text = raw.strip()
            if not text:
                continue
            try:
                normalized[lab_key] = float(text)
            except ValueError:
                continue
    return normalized


def _normalize_history(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        clean = value.strip().lower()
        return [clean] if clean else []
    if isinstance(value, list):
        return _normalize_text_list(value)
    if isinstance(value, dict):
        chunks: list[str] = []
        for key, raw in sorted(value.items(), key=lambda item: str(item[0])):
            key_text = str(key).strip().lower()
            if key_text:
                chunks.append(key_text)
            if isinstance(raw, str):
                val = raw.strip().lower()
                if val:
                    chunks.append(val)
            elif isinstance(raw, list):
                chunks.extend(_normalize_text_list(raw))
            elif isinstance(raw, (int, float)) and not isinstance(raw, bool):
                chunks.append(str(raw))
        return chunks
    return []


def _contains_phrase(texts: list[str], phrases: tuple[str, ...]) -> bool:
    for text in texts:
        for phrase in phrases:
            if phrase in text:
                return True
    return False


def _med_present(medications: list[str], keyword: str) -> bool:
    for med in medications:
        if keyword in med:
            return True
    return False


def _resolve_specialists(requested: object) -> list[str]:
    if not isinstance(requested, list):
        return list(SUPPORTED_SPECIALISTS)

    selected: list[str] = []
    for raw in requested:
        if not isinstance(raw, str):
            continue
        specialist = raw.strip().lower()
        if specialist in SUPPORTED_SPECIALISTS and specialist not in selected:
            selected.append(specialist)

    if not selected:
        selected = list(SUPPORTED_SPECIALISTS)

    if len(selected) < 2:
        for default in SUPPORTED_SPECIALISTS:
            if default not in selected:
                selected.append(default)
            if len(selected) >= 2:
                break

    if len(selected) > 5:
        selected = selected[:5]
    return selected


def _detect_red_flags(symptoms: list[str]) -> list[str]:
    hits: list[str] = []
    for flag_name, phrases in _RED_FLAG_RULES.items():
        if _contains_phrase(symptoms, phrases):
            hits.append(flag_name)
    return hits


def _evaluate_cardiology(
    symptoms: list[str], labs: dict[str, float], medications: list[str], history: list[str]
) -> SpecialistAssessment:
    findings: list[str] = []
    log: list[str] = ["Reviewed cardiovascular symptoms, medications, labs, and history."]

    chest_pain = _contains_phrase(symptoms, ("chest pain", "dau nguc"))
    dyspnea = _contains_phrase(symptoms, ("shortness of breath", "kho tho"))
    palpitations = _contains_phrase(symptoms, ("palpitations", "tachycardia"))
    troponin = labs.get("troponin")
    bnp = labs.get("bnp")
    cardiac_history = _contains_phrase(
        history,
        ("coronary artery disease", "heart failure", "afib", "arrhythmia", "hypertension"),
    )
    anticoagulant = _med_present(medications, "warfarin") or _med_present(medications, "apixaban")

    if chest_pain:
        findings.append("chest_pain_reported")
        log.append("Detected chest pain symptom, which raises ACS concern.")
    if dyspnea:
        findings.append("dyspnea_reported")
        log.append("Detected shortness of breath symptom, requiring cardiac differential.")
    if palpitations:
        findings.append("palpitations_reported")
        log.append("Palpitations detected; rhythm instability is possible.")
    if isinstance(troponin, float) and troponin > 0.04:
        findings.append("troponin_elevated")
        log.append("Troponin exceeds 0.04 and supports immediate ischemic evaluation.")
    if isinstance(bnp, float) and bnp > 400:
        findings.append("bnp_elevated")
        log.append("BNP over 400 suggests possible decompensated heart failure.")
    if cardiac_history:
        findings.append("cardiac_history_present")
        log.append("Cardiac history increases baseline risk.")
    if anticoagulant:
        findings.append("on_anticoagulant")
        log.append("Anticoagulant exposure influences bleeding-vs-thrombotic risk balancing.")

    if chest_pain or (isinstance(troponin, float) and troponin > 0.04):
        triage = "emergency_escalation"
        recommendation = "Prioritize ED-level cardiac rule-out and continuous monitoring."
    elif dyspnea or palpitations or cardiac_history or (isinstance(bnp, float) and bnp > 400):
        triage = "same_day_review"
        recommendation = "Arrange same-day ECG and focused cardiology review."
    else:
        triage = "routine_follow_up"
        recommendation = "No immediate cardiac escalation signal; continue outpatient monitoring."
        log.append("No dominant high-acuity cardiovascular trigger found.")

    return SpecialistAssessment(
        specialist="cardiology",
        reasoning_log=log,
        key_findings=findings,
        triage=triage,
        recommendation=recommendation,
    )


def _evaluate_neurology(
    symptoms: list[str], labs: dict[str, float], medications: list[str], history: list[str]
) -> SpecialistAssessment:
    _ = (labs, medications)
    findings: list[str] = []
    log = ["Reviewed neurologic symptom pattern and neurologic history."]

    stroke_signs = _contains_phrase(
        symptoms,
        ("one sided weakness", "slurred speech", "facial droop", "sudden vision loss"),
    )
    seizure = _contains_phrase(symptoms, ("seizure", "convulsion"))
    confusion = _contains_phrase(symptoms, ("confusion", "altered mental status"))
    severe_headache = _contains_phrase(symptoms, ("severe headache", "worst headache"))
    neuro_history = _contains_phrase(history, ("stroke", "tia", "epilepsy", "migraine"))

    if stroke_signs:
        findings.append("focal_neurologic_deficit")
        log.append("Focal neurologic deficit signals possible acute stroke.")
    if seizure:
        findings.append("seizure_activity")
        log.append("Seizure activity is a high-acuity neurologic event.")
    if confusion:
        findings.append("acute_confusion")
        log.append("Acute confusion can indicate urgent neurologic or metabolic pathology.")
    if severe_headache:
        findings.append("severe_headache")
        log.append("Severe headache requires exclusion of secondary dangerous causes.")
    if neuro_history:
        findings.append("neurologic_history_present")
        log.append("Neurologic history increases risk of recurrence.")

    if stroke_signs or seizure or confusion:
        triage = "emergency_escalation"
        recommendation = "Escalate for immediate neurologic assessment and imaging."
    elif severe_headache or neuro_history:
        triage = "same_day_review"
        recommendation = "Arrange same-day neurologic exam and targeted diagnostics."
    else:
        triage = "routine_follow_up"
        recommendation = "No immediate neurologic emergency pattern identified."
        log.append("Neurologic risk signals are limited in this dataset.")

    return SpecialistAssessment(
        specialist="neurology",
        reasoning_log=log,
        key_findings=findings,
        triage=triage,
        recommendation=recommendation,
    )


def _evaluate_nephrology(
    symptoms: list[str], labs: dict[str, float], medications: list[str], history: list[str]
) -> SpecialistAssessment:
    _ = symptoms
    findings: list[str] = []
    log = ["Reviewed renal function markers, nephrotoxic exposure, and kidney history."]

    egfr = labs.get("egfr")
    creatinine = labs.get("creatinine")
    potassium = labs.get("potassium")
    ckd_history = _contains_phrase(history, ("ckd", "chronic kidney disease", "renal disease", "dialysis"))
    nsaid_exposure = any(_med_present(medications, med) for med in ("ibuprofen", "naproxen", "diclofenac"))

    if isinstance(egfr, float) and egfr < 30:
        findings.append("egfr_under_30")
        log.append("eGFR below 30 indicates advanced kidney impairment.")
    if isinstance(creatinine, float) and creatinine > 2.0:
        findings.append("creatinine_above_2")
        log.append("Creatinine above 2.0 suggests reduced renal clearance.")
    if isinstance(potassium, float) and potassium >= 6.0:
        findings.append("severe_hyperkalemia")
        log.append("Potassium >= 6.0 is a potentially life-threatening electrolyte finding.")
    if ckd_history:
        findings.append("kidney_history_present")
        log.append("Known CKD history increases sensitivity to nephrotoxic triggers.")
    if nsaid_exposure:
        findings.append("nsaid_exposure")
        log.append("NSAID exposure can worsen renal perfusion in vulnerable patients.")

    if (isinstance(egfr, float) and egfr < 15) or (isinstance(potassium, float) and potassium >= 6.0):
        triage = "emergency_escalation"
        recommendation = "Escalate immediately for acute renal/electrolyte stabilization."
    elif (
        (isinstance(egfr, float) and egfr < 30)
        or (isinstance(creatinine, float) and creatinine > 2.0)
        or (ckd_history and nsaid_exposure)
    ):
        triage = "same_day_review"
        recommendation = "Prioritize same-day nephrology review and medication adjustment."
    else:
        triage = "routine_follow_up"
        recommendation = "Renal profile does not require emergency escalation at this stage."
        log.append("No dominant severe kidney instability signal found.")

    return SpecialistAssessment(
        specialist="nephrology",
        reasoning_log=log,
        key_findings=findings,
        triage=triage,
        recommendation=recommendation,
    )


def _evaluate_pharmacology(
    symptoms: list[str], labs: dict[str, float], medications: list[str], history: list[str]
) -> SpecialistAssessment:
    _ = (labs, history)
    findings: list[str] = []
    log = ["Reviewed medication safety interactions and risk-amplifying symptom context."]

    on_warfarin = _med_present(medications, "warfarin")
    on_nsaid = any(_med_present(medications, med) for med in ("ibuprofen", "naproxen", "diclofenac"))
    on_aspirin = _med_present(medications, "aspirin")
    on_ace_or_arb = any(
        _med_present(medications, med)
        for med in ("lisinopril", "enalapril", "losartan", "valsartan", "ramipril")
    )
    on_diuretic = any(_med_present(medications, med) for med in ("furosemide", "hydrochlorothiazide"))
    bleeding_symptoms = _contains_phrase(symptoms, ("severe bleeding", "vomiting blood", "black stool"))

    if on_warfarin and on_nsaid:
        findings.append("warfarin_nsaid_interaction")
        log.append("Warfarin + NSAID combination elevates major bleeding risk.")
    if on_warfarin and on_aspirin:
        findings.append("warfarin_aspirin_interaction")
        log.append("Warfarin + aspirin combination requires strict indication and monitoring.")
    if on_ace_or_arb and on_diuretic and on_nsaid:
        findings.append("triple_whammy_risk")
        log.append("ACE/ARB + diuretic + NSAID pattern increases AKI risk.")
    if bleeding_symptoms:
        findings.append("active_bleeding_signal")
        log.append("Bleeding symptoms elevate urgency of interaction mitigation.")

    has_high_risk_combo = any(
        key in findings
        for key in ("warfarin_nsaid_interaction", "warfarin_aspirin_interaction", "triple_whammy_risk")
    )

    if bleeding_symptoms and has_high_risk_combo:
        triage = "emergency_escalation"
        recommendation = "Escalate immediately for bleeding risk stabilization and medication hold decisions."
    elif has_high_risk_combo:
        triage = "same_day_review"
        recommendation = "Conduct same-day medication reconciliation and risk mitigation changes."
    else:
        triage = "routine_follow_up"
        recommendation = "No high-severity interaction pattern detected in current medication list."
        log.append("Medication profile is not showing major deterministic DDI triggers.")

    return SpecialistAssessment(
        specialist="pharmacology",
        reasoning_log=log,
        key_findings=findings,
        triage=triage,
        recommendation=recommendation,
    )


def _evaluate_endocrinology(
    symptoms: list[str], labs: dict[str, float], medications: list[str], history: list[str]
) -> SpecialistAssessment:
    _ = medications
    findings: list[str] = []
    log = ["Reviewed endocrine markers, glycemic range, and diabetes-related symptom burden."]

    glucose = labs.get("glucose")
    hba1c = labs.get("hba1c")
    diabetes_history = _contains_phrase(history, ("diabetes", "t2dm", "t1dm"))
    hyperglycemia_symptoms = _contains_phrase(
        symptoms, ("polyuria", "polydipsia", "fatigue", "unintentional weight loss")
    )
    hypoglycemia_symptoms = _contains_phrase(symptoms, ("sweating", "tremor", "confusion"))

    if isinstance(glucose, float) and glucose >= 400:
        findings.append("glucose_above_400")
        log.append("Glucose >= 400 indicates severe hyperglycemia.")
    if isinstance(glucose, float) and glucose < 54:
        findings.append("glucose_below_54")
        log.append("Glucose < 54 indicates clinically significant hypoglycemia.")
    if isinstance(hba1c, float) and hba1c >= 9.0:
        findings.append("hba1c_above_9")
        log.append("HbA1c >= 9 indicates persistent poor glycemic control.")
    if diabetes_history:
        findings.append("diabetes_history_present")
        log.append("Known diabetes history contextualizes endocrine risk trajectory.")
    if hyperglycemia_symptoms:
        findings.append("hyperglycemia_symptoms")
        log.append("Symptoms align with uncontrolled glucose burden.")
    if hypoglycemia_symptoms:
        findings.append("hypoglycemia_symptoms")
        log.append("Symptoms suggest possible low-glucose episodes.")

    if (isinstance(glucose, float) and (glucose >= 400 or glucose < 54)) or (
        hypoglycemia_symptoms and isinstance(glucose, float) and glucose < 70
    ):
        triage = "emergency_escalation"
        recommendation = "Escalate urgently for acute glycemic stabilization."
    elif (
        (isinstance(glucose, float) and glucose >= 250)
        or (isinstance(hba1c, float) and hba1c >= 9.0)
        or (diabetes_history and hyperglycemia_symptoms)
    ):
        triage = "same_day_review"
        recommendation = "Schedule same-day endocrine review and treatment optimization."
    else:
        triage = "routine_follow_up"
        recommendation = "No immediate endocrine emergency trigger from available markers."
        log.append("Endocrine profile appears stable enough for routine follow-up.")

    return SpecialistAssessment(
        specialist="endocrinology",
        reasoning_log=log,
        key_findings=findings,
        triage=triage,
        recommendation=recommendation,
    )


_SPECIALIST_EVALUATORS = {
    "cardiology": _evaluate_cardiology,
    "neurology": _evaluate_neurology,
    "nephrology": _evaluate_nephrology,
    "pharmacology": _evaluate_pharmacology,
    "endocrinology": _evaluate_endocrinology,
}


def _build_conflicts(assessments: list[SpecialistAssessment]) -> list[dict[str, object]]:
    conflicts: list[dict[str, object]] = []
    for left, right in combinations(assessments, 2):
        left_score = _TRIAGE_SCORE[left.triage]
        right_score = _TRIAGE_SCORE[right.triage]
        if abs(left_score - right_score) >= 2:
            conflicts.append(
                {
                    "type": "triage_mismatch",
                    "specialists": [left.specialist, right.specialist],
                    "detail": (
                        f"{left.specialist} recommends {left.triage} while "
                        f"{right.specialist} recommends {right.triage}."
                    ),
                }
            )
    return conflicts


def _consensus_triage(assessments: list[SpecialistAssessment]) -> str:
    counts = {triage: 0 for triage in _TRIAGE_SCORE}
    for item in assessments:
        counts[item.triage] += 1
    return max(counts, key=lambda triage: (counts[triage], _TRIAGE_SCORE[triage]))


def _consensus_summary(assessments: list[SpecialistAssessment], consensus_triage: str) -> str:
    finding_counts: dict[str, int] = {}
    for item in assessments:
        for finding in item.key_findings:
            finding_counts[finding] = finding_counts.get(finding, 0) + 1

    shared_findings = sorted(
        [name for name, count in finding_counts.items() if count >= 2]
    )
    if shared_findings:
        shared_text = ", ".join(shared_findings)
    else:
        shared_text = "no repeated cross-specialty finding"

    return (
        f"Council consensus triage is {consensus_triage}; shared signals: {shared_text}. "
        "Highest-acuity specialist concern remains prioritized."
    )


def _divergence_notes(
    assessments: list[SpecialistAssessment], conflicts: list[dict[str, object]]
) -> list[str]:
    distribution = {
        "emergency_escalation": 0,
        "same_day_review": 0,
        "routine_follow_up": 0,
    }
    for item in assessments:
        distribution[item.triage] += 1

    notes = [
        (
            "Triage distribution: "
            f"emergency_escalation={distribution['emergency_escalation']}, "
            f"same_day_review={distribution['same_day_review']}, "
            f"routine_follow_up={distribution['routine_follow_up']}."
        )
    ]

    if conflicts:
        notes.append("Urgency divergence detected; keep highest-acuity pathway active until reconciled.")
    else:
        notes.append("No major divergence detected across selected specialists.")
    return notes


def _final_recommendation(
    consensus_triage: str,
    red_flags: list[str],
    assessments: list[SpecialistAssessment],
) -> str:
    if red_flags:
        return (
            "Emergency escalation triggered by red-flag symptoms. Direct patient to emergency "
            "services immediately while preparing rapid specialist handoff."
        )

    highest_score = max(_TRIAGE_SCORE[item.triage] for item in assessments)
    if highest_score >= _TRIAGE_SCORE["emergency_escalation"]:
        return (
            "At least one specialist indicates emergency escalation. Route to urgent in-person "
            "evaluation and stabilize before routine workup."
        )
    if highest_score >= _TRIAGE_SCORE["same_day_review"]:
        return (
            f"Consensus trend is {consensus_triage}. Arrange same-day multidisciplinary review "
            "with medication and lab reconciliation."
        )
    return (
        "Council indicates routine follow-up. Continue monitoring with return precautions and "
        "structured outpatient reassessment."
    )


def run_council(payload: dict) -> dict:
    symptoms = _normalize_text_list(payload.get("symptoms"))
    labs = _normalize_labs(payload.get("labs"))
    medications = _normalize_text_list(payload.get("medications"))
    history = _normalize_history(payload.get("history"))
    specialists = _resolve_specialists(payload.get("specialists"))

    assessments = [
        _SPECIALIST_EVALUATORS[specialist](symptoms, labs, medications, history)
        for specialist in specialists
    ]

    red_flags = _detect_red_flags(symptoms)
    conflicts = _build_conflicts(assessments)
    consensus_triage = _consensus_triage(assessments)
    consensus_summary = _consensus_summary(assessments, consensus_triage)
    divergence_notes = _divergence_notes(assessments, conflicts)
    final_recommendation = _final_recommendation(consensus_triage, red_flags, assessments)

    if red_flags:
        estimated_duration_minutes = 5
    else:
        estimated_duration_minutes = 12 + (len(assessments) * 8) + (len(conflicts) * 6)

    return {
        "requested_specialists": specialists,
        "per_specialist_reasoning_logs": [asdict(item) for item in assessments],
        "conflict_list": conflicts,
        "consensus_summary": consensus_summary,
        "divergence_notes": divergence_notes,
        "final_recommendation": final_recommendation,
        "estimated_duration_minutes": estimated_duration_minutes,
        "emergency_escalation": {
            "triggered": bool(red_flags),
            "red_flags": red_flags,
            "action": (
                "immediate_emergency_referral"
                if red_flags
                else "standard_multidisciplinary_pathway"
            ),
        },
    }
