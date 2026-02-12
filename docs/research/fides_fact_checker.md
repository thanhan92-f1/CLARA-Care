# FIDES-Inspired Fact Checker for CLARA

## Document Metadata
- **Project**: CLARA (Clinical Agent for Retrieval & Analysis) — Vietnamese Medical AI Assistant
- **Document Type**: Technical Research & Architecture Analysis
- **Last Updated**: 2025
- **References**: Yan et al. (2025) "Decomposing and Revising What Language Models Generate" (arXiv:2509.00765); Zheng et al. (2025) AFEV (arXiv:2506.07446); Min et al. (2023) FActScore; Wei et al. (2024) SAFE

---

## Table of Contents
1. [FIDES Framework Overview](#1-fides-framework-overview)
2. [Adapting FIDES for Medical AI](#2-adapting-fides-for-medical-ai)
3. [Implementation for CLARA](#3-implementation-for-clara)
4. [Medical Claim Patterns](#4-medical-claim-patterns)
5. [Cross-Reference Verification](#5-cross-reference-verification)
6. [Hallucination Detection](#6-hallucination-detection)
7. [Confidence Scoring](#7-confidence-scoring)
8. [Integration Architecture](#8-integration-architecture)

---

## 1. FIDES Framework Overview

### 1.1 What is FIDES?

**FIDES** (Faithful Fact Decomposition and Evidence-based Scoring) is a paradigm for systematic verification of LLM-generated content. The term encompasses a family of approaches rooted in the paper "Decomposing and Revising What Language Models Generate" by Zhichao Yan, Jiaoyan Chen, Jiapu Wang, Xiaoli Li, Ru Li, and Jeff Z. Pan (arXiv:2509.00765, August 2025).

The core philosophy of FIDES is: **decompose complex generated text into atomic, independently verifiable facts, then score each fact against authoritative evidence sources**.

### 1.2 Core Pipeline Architecture

FIDES operates as a two-stage pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIDES VERIFICATION PIPELINE                  │
│                                                                 │
│  Stage 1: DECOMPOSITION                                        │
│  ┌───────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │ Input Text    │───▶│ Sentence         │───▶│ Atomic Fact  │ │
│  │ (LLM Output)  │    │ Segmentation +   │    │ Decomposition│ │
│  │               │    │ Coreference Res. │    │              │ │
│  └───────────────┘    └──────────────────┘    └──────────────┘ │
│                                                                 │
│  Stage 2: VERIFICATION                                         │
│  ┌───────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │ Atomic Facts  │───▶│ Evidence         │───▶│ Conflict     │ │
│  │ as Queries    │    │ Retrieval        │    │ Detection &  │ │
│  │               │    │ (Multi-source)   │    │ Scoring      │ │
│  └───────────────┘    └──────────────────┘    └──────────────┘ │
│                                                                 │
│  Stage 3: REVISION (Optional)                                   │
│  ┌───────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │ Conflict      │───▶│ Iterative        │───▶│ Revised      │ │
│  │ Report        │    │ Factual Editing  │    │ Output       │ │
│  └───────────────┘    └──────────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Innovations of FIDES

1. **Coreference-Aware Segmentation**: Before decomposing into atomic facts, FIDES resolves coreferences (pronouns, abbreviations) to ensure each atomic fact is self-contained and independently verifiable.

2. **Atomic Sub-Fact Granularity**: Each sentence is decomposed into the smallest possible independently verifiable claims. For example:
   - Original: "Metformin, a first-line treatment for type 2 diabetes, reduces HbA1c by 1-1.5%"
   - Atomic Facts:
     - "Metformin is a treatment for type 2 diabetes"
     - "Metformin is a first-line treatment for type 2 diabetes"
     - "Metformin reduces HbA1c"
     - "Metformin reduces HbA1c by 1-1.5%"

3. **Evidence-as-Query**: Each atomic fact serves as a search query against evidence databases, enabling precise retrieval rather than broad document matching.

4. **Conflict Detection**: Systematic comparison between atomic facts and retrieved evidence to identify contradictions, partial support, or complete support.

5. **Iterative Factual Editing**: When conflicts are detected, FIDES supports iterative revision of the generated text to align with evidence.

### 1.4 Related Frameworks

| Framework | Key Feature | Relationship to FIDES |
|-----------|------------|----------------------|
| **FActScore** (Min et al., 2023) | Atomic fact scoring against Wikipedia | Precursor; FIDES extends to multi-source |
| **SAFE** (Wei et al., 2024) | Multi-step LLM-issued verification | Complementary; uses LLM as verifier |
| **AFEV** (Zheng et al., 2025) | Dynamic atomic fact extraction + refined retrieval | Closely related; adds adaptive verification |
| **MiniCheck** | Lightweight NLI-based claim verification | Can serve as fast pre-filter in FIDES |
| **Loki** | Long-form fact verification | Addresses document-level verification |
| **DnDScore** | Decompose-and-Discover scoring | Alternative decomposition strategy |

### 1.5 Why FIDES for Medical AI?

Medical applications demand the highest accuracy standards. FIDES is particularly suited because:

- **Granular verification**: Medical claims often contain multiple sub-claims (drug + dosage + indication + contraindication) that each require independent verification
- **Multi-source evidence**: Medical facts must be cross-referenced against clinical guidelines, drug databases, and peer-reviewed literature
- **Safety-critical revision**: When medical misinformation is detected, the system must correct or block the response rather than simply flagging it
- **Auditability**: The decomposition trace provides a clear audit trail showing exactly which facts were verified, against which sources, with what confidence

---

## 2. Adapting FIDES for Medical AI

### 2.1 The FIDES-Medical Pipeline

For CLARA, the standard FIDES pipeline is adapted into a **5-step FIDES-Medical pipeline** specifically designed for Vietnamese medical AI:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    FIDES-MEDICAL PIPELINE FOR CLARA                    │
│                                                                        │
│  Step 1: CLAIM DECOMPOSITION (BioMistral-7B VN fine-tuned)            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Vietnamese medical text → Sentence segmentation →               │  │
│  │ Coreference resolution (VN-specific) → Atomic medical claims    │  │
│  │ Categories: Drug, Dosage, Diagnosis, Treatment, Statistical     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  Step 2: PER-CLAIM EVIDENCE RETRIEVAL                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Source A: Cited sources (from RAG pipeline)                     │  │
│  │ Source B: Additional PubMed / ClinicalTrials.gov retrieval      │  │
│  │ Source C: Structured DBs (RxNorm, WHO ICD-11, Dược thư QG)     │  │
│  │ Source D: BYT protocols (Vietnamese Ministry of Health)         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  Step 3: CROSS-REFERENCE VERIFICATION                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Verification Matrix: Each claim × Each source → Support score   │  │
│  │ Conflict detection across sources                               │  │
│  │ Vietnamese ↔ International guideline reconciliation             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  Step 4: CITATION VALIDATION                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ PMID verification (PubMed E-utilities API)                      │  │
│  │ NCT ID verification (ClinicalTrials.gov API)                    │  │
│  │ RxCUI verification (RxNorm/NLM API)                             │  │
│  │ ICD-11 code validation (WHO API)                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  Step 5: VERDICT & ACTION                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ VERIFIED            → Pass through                              │  │
│  │ PARTIALLY_VERIFIED  → Add uncertainty notes                     │  │
│  │ NEEDS_RE_SYNTHESIS  → Return to Synthesis Agent                 │  │
│  │ REJECTED            → Block response + alert                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Claim Decomposition for Medical Vietnamese

Medical Vietnamese text presents unique challenges for claim decomposition:

- **Mixed-language terminology**: Vietnamese medical text frequently interleaves Vietnamese and English/Latin terms (e.g., "viêm phổi do Streptococcus pneumoniae")
- **Diacritical sensitivity**: Vietnamese diacritics are semantically critical — "thuốc" (medicine) vs. "thuộc" (belonging to)
- **Abbreviated drug names**: Clinicians often use abbreviated or brand names that require normalization
- **Compound claims**: Vietnamese sentence structure often embeds multiple medical claims in a single clause

**Decomposition Strategy**:

1. **Sentence segmentation** using Vietnamese NLP tokenizers (VnCoreNLP / PhoBERT-based)
2. **Medical entity recognition** (drugs, diseases, procedures, dosages) using BioMistral-7B fine-tuned on Vietnamese medical corpora
3. **Coreference resolution** with special handling for Vietnamese pronoun patterns and medical abbreviations
4. **Atomic fact extraction** with category tagging: `DRUG_CLAIM`, `DOSAGE_CLAIM`, `DIAGNOSIS_CLAIM`, `TREATMENT_CLAIM`, `STATISTICAL_CLAIM`, `INTERACTION_CLAIM`

### 2.3 Evidence Retrieval Adaptation

For medical AI, evidence retrieval must be:

- **Authoritative**: Only peer-reviewed, government-approved, or standardized database sources
- **Current**: Medical guidelines change; evidence must reflect the latest publications
- **Jurisdiction-aware**: Vietnamese BYT protocols may differ from WHO or US FDA guidelines
- **Bilingual**: Queries may need to be issued in both Vietnamese and English to maximize recall

### 2.4 Verdict Generation

Unlike general-purpose fact-checking which produces binary true/false, medical verdict generation requires nuanced categorization:

| Verdict | Definition | Action |
|---------|-----------|--------|
| `VERIFIED` | ≥2 independent authoritative sources confirm the claim | Pass through with citations |
| `PARTIALLY_VERIFIED` | 1 source confirms; no contradictions found | Add uncertainty language + citations |
| `CONTESTED` | Sources disagree on the claim | Present both perspectives with sources |
| `UNSUPPORTED` | No evidence found for or against | Flag as unverified; add disclaimer |
| `CONTRADICTED` | ≥1 authoritative source directly contradicts | Block or revise; escalate if critical |

---

## 3. Implementation for CLARA

### 3.1 Python Pseudocode: FIDES-Medical Fact-Checking Pipeline

```python
# ============================================================
# FIDES-Medical Fact-Checking Pipeline for CLARA
# ============================================================
# NOTE: This is architectural pseudocode for implementation
# guidance — not production-ready code.
# ============================================================

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional, Tuple

# ─── Data Models ─────────────────────────────────────────────

class ClaimCategory(Enum):
    DRUG_INTERACTION = "drug_interaction"
    DOSAGE = "dosage"
    DIAGNOSIS = "diagnosis"
    TREATMENT = "treatment"
    STATISTICAL = "statistical"
    CONTRAINDICATION = "contraindication"

class CriticalityLevel(Enum):
    CRITICAL = "critical"      # Errors could cause patient harm
    HIGH = "high"              # Errors could mislead clinical decisions
    MEDIUM = "medium"          # Errors affect information quality
    LOW = "low"                # Minor factual issues

class Verdict(Enum):
    VERIFIED = "verified"
    PARTIALLY_VERIFIED = "partially_verified"
    CONTESTED = "contested"
    UNSUPPORTED = "unsupported"
    CONTRADICTED = "contradicted"

class Action(Enum):
    PASS_THROUGH = "pass_through"
    ADD_UNCERTAINTY_NOTE = "add_uncertainty_note"
    FLAG_AND_WARN = "flag_and_warn"
    NEEDS_RE_SYNTHESIS = "needs_re_synthesis"
    BLOCK_RESPONSE = "block_response"

@dataclass
class AtomicClaim:
    text: str
    category: ClaimCategory
    criticality: CriticalityLevel
    source_sentence: str
    entities: Dict[str, str] = field(default_factory=dict)

@dataclass
class EvidenceItem:
    source_name: str           # e.g., "PubMed", "BYT", "RxNorm"
    source_id: str             # e.g., PMID, NCT ID, RxCUI
    content: str
    relevance_score: float
    support_type: str          # "supports", "contradicts", "neutral"

@dataclass
class VerificationResult:
    claim: AtomicClaim
    evidence: List[EvidenceItem]
    verdict: Verdict
    confidence: float
    action: Action
    explanation: str

# ─── Step 1: Claim Decomposition ────────────────────────────

class ClaimDecomposer:
    """
    Uses BioMistral-7B (fine-tuned on Vietnamese medical text)
    to decompose generated text into atomic medical claims.
    """
    def __init__(self, model_name="BioMistral-7B-VN-medical"):
        self.model = load_model(model_name)
        self.vn_tokenizer = load_vietnamese_tokenizer()

    def decompose(self, text: str) -> List[AtomicClaim]:
        # 1. Segment into sentences (Vietnamese-aware)
        sentences = self.vn_tokenizer.segment(text)

        # 2. Resolve coreferences
        resolved = self.resolve_coreferences(sentences)

        # 3. Extract atomic claims from each sentence
        claims = []
        for sentence in resolved:
            atomic_facts = self.model.extract_atomic_facts(
                sentence,
                prompt_template=MEDICAL_DECOMPOSITION_PROMPT
            )
            for fact in atomic_facts:
                claim = AtomicClaim(
                    text=fact["text"],
                    category=self.classify_claim(fact["text"]),
                    criticality=self.assess_criticality(fact["text"]),
                    source_sentence=sentence,
                    entities=fact.get("entities", {})
                )
                claims.append(claim)
        return claims

    def classify_claim(self, text: str) -> ClaimCategory:
        """Classify claim using pattern matching + LLM."""
        # Pattern-based fast classification
        if matches_drug_interaction_pattern(text):
            return ClaimCategory.DRUG_INTERACTION
        if matches_dosage_pattern(text):
            return ClaimCategory.DOSAGE
        # Fall back to LLM classification
        return self.model.classify(text)

    def assess_criticality(self, text: str) -> CriticalityLevel:
        """Assess patient safety impact of claim."""
        category = self.classify_claim(text)
        criticality_map = {
            ClaimCategory.DRUG_INTERACTION: CriticalityLevel.CRITICAL,
            ClaimCategory.DOSAGE: CriticalityLevel.CRITICAL,
            ClaimCategory.CONTRAINDICATION: CriticalityLevel.CRITICAL,
            ClaimCategory.DIAGNOSIS: CriticalityLevel.HIGH,
            ClaimCategory.TREATMENT: CriticalityLevel.HIGH,
            ClaimCategory.STATISTICAL: CriticalityLevel.MEDIUM,
        }
        return criticality_map.get(category, CriticalityLevel.LOW)

# ─── Step 2: Evidence Retrieval ──────────────────────────────

class MedicalEvidenceRetriever:
    """
    Multi-source evidence retrieval across medical databases.
    """
    def __init__(self):
        self.pubmed_client = PubMedClient()        # E-utilities API
        self.rxnorm_client = RxNormClient()         # NLM RxNorm API
        self.clinicaltrials_client = ClinTrialsClient()
        self.byt_retriever = BYTProtocolRetriever()  # Vietnamese MOH
        self.duoc_thu_retriever = DuocThuRetriever()  # Nat'l Drug Formulary
        self.icd11_client = ICD11Client()            # WHO API

    def retrieve_evidence(
        self, claim: AtomicClaim
    ) -> List[EvidenceItem]:
        evidence = []

        # Route to appropriate sources based on claim category
        if claim.category in [
            ClaimCategory.DRUG_INTERACTION,
            ClaimCategory.DOSAGE,
            ClaimCategory.CONTRAINDICATION
        ]:
            evidence += self.rxnorm_client.query(claim.entities)
            evidence += self.duoc_thu_retriever.search(claim.text)
            evidence += self.pubmed_client.search(
                build_drug_query(claim), max_results=5
            )

        if claim.category == ClaimCategory.DIAGNOSIS:
            evidence += self.icd11_client.validate(claim.entities)
            evidence += self.byt_retriever.search(claim.text)

        if claim.category == ClaimCategory.TREATMENT:
            evidence += self.byt_retriever.search(claim.text)
            evidence += self.pubmed_client.search(
                build_treatment_query(claim), max_results=5
            )
            evidence += self.clinicaltrials_client.search(claim.text)

        if claim.category == ClaimCategory.STATISTICAL:
            evidence += self.pubmed_client.search(
                build_statistical_query(claim), max_results=10
            )

        # Score relevance and deduplicate
        evidence = self.rank_and_deduplicate(evidence, claim)
        return evidence

# ─── Step 3: Cross-Reference Verification ────────────────────

class CrossReferenceVerifier:
    """
    Builds a verification matrix: claims × sources → support scores.
    """
    def __init__(self, nli_model_name="cross-encoder/nli-deberta-v3"):
        self.nli_model = load_nli_model(nli_model_name)

    def verify(
        self, claim: AtomicClaim, evidence: List[EvidenceItem]
    ) -> Tuple[Verdict, float]:
        if not evidence:
            return Verdict.UNSUPPORTED, 0.0

        support_scores = []
        for item in evidence:
            # NLI-based entailment scoring
            score = self.nli_model.predict(
                premise=item.content, hypothesis=claim.text
            )
            item.support_type = self.classify_support(score)
            support_scores.append(score)

        # Aggregate across sources
        return self.aggregate_verdict(support_scores, evidence)

    def aggregate_verdict(
        self, scores: List[dict], evidence: List[EvidenceItem]
    ) -> Tuple[Verdict, float]:
        supporting = sum(
            1 for e in evidence if e.support_type == "supports"
        )
        contradicting = sum(
            1 for e in evidence if e.support_type == "contradicts"
        )

        if contradicting > 0 and supporting > 0:
            return Verdict.CONTESTED, 0.5
        if contradicting > 0:
            return Verdict.CONTRADICTED, 1.0 - (supporting / len(evidence))
        if supporting >= 2:
            return Verdict.VERIFIED, supporting / len(evidence)
        if supporting == 1:
            return Verdict.PARTIALLY_VERIFIED, 0.6
        return Verdict.UNSUPPORTED, 0.0

# ─── Step 4: Citation Validation ─────────────────────────────

class CitationValidator:
    """Validates that cited references actually exist and are relevant."""

    def validate_pmid(self, pmid: str) -> bool:
        """Check PMID exists via PubMed E-utilities."""
        response = pubmed_efetch(pmid)
        return response.status == "found"

    def validate_nct(self, nct_id: str) -> bool:
        """Check NCT ID exists via ClinicalTrials.gov."""
        response = clinicaltrials_api.fetch(nct_id)
        return response.status == "found"

    def validate_rxcui(self, rxcui: str) -> bool:
        """Check RxCUI exists via RxNorm API."""
        response = rxnorm_api.get_concept(rxcui)
        return response is not None

# ─── Step 5: Verdict & Action ────────────────────────────────

class VerdictEngine:
    """Maps verification results to actionable decisions."""

    VERDICT_ACTION_MAP = {
        (Verdict.VERIFIED, CriticalityLevel.CRITICAL): Action.PASS_THROUGH,
        (Verdict.VERIFIED, CriticalityLevel.HIGH): Action.PASS_THROUGH,
        (Verdict.VERIFIED, CriticalityLevel.MEDIUM): Action.PASS_THROUGH,
        (Verdict.PARTIALLY_VERIFIED, CriticalityLevel.CRITICAL): Action.FLAG_AND_WARN,
        (Verdict.PARTIALLY_VERIFIED, CriticalityLevel.HIGH): Action.ADD_UNCERTAINTY_NOTE,
        (Verdict.PARTIALLY_VERIFIED, CriticalityLevel.MEDIUM): Action.ADD_UNCERTAINTY_NOTE,
        (Verdict.CONTESTED, CriticalityLevel.CRITICAL): Action.BLOCK_RESPONSE,
        (Verdict.CONTESTED, CriticalityLevel.HIGH): Action.FLAG_AND_WARN,
        (Verdict.UNSUPPORTED, CriticalityLevel.CRITICAL): Action.BLOCK_RESPONSE,
        (Verdict.UNSUPPORTED, CriticalityLevel.HIGH): Action.NEEDS_RE_SYNTHESIS,
        (Verdict.CONTRADICTED, CriticalityLevel.CRITICAL): Action.BLOCK_RESPONSE,
        (Verdict.CONTRADICTED, CriticalityLevel.HIGH): Action.BLOCK_RESPONSE,
        (Verdict.CONTRADICTED, CriticalityLevel.MEDIUM): Action.NEEDS_RE_SYNTHESIS,
    }

    def decide(self, result: VerificationResult) -> Action:
        key = (result.verdict, result.claim.criticality)
        return self.VERDICT_ACTION_MAP.get(key, Action.ADD_UNCERTAINTY_NOTE)

# ─── Main Pipeline Orchestrator ──────────────────────────────

class FIDESMedicalPipeline:
    """
    Orchestrates the full FIDES-Medical fact-checking pipeline.
    """
    def __init__(self):
        self.decomposer = ClaimDecomposer()
        self.retriever = MedicalEvidenceRetriever()
        self.verifier = CrossReferenceVerifier()
        self.citation_validator = CitationValidator()
        self.verdict_engine = VerdictEngine()

    def check_facts(self, generated_text: str) -> List[VerificationResult]:
        results = []

        # Step 1: Decompose
        claims = self.decomposer.decompose(generated_text)

        for claim in claims:
            # Step 2: Retrieve evidence
            evidence = self.retriever.retrieve_evidence(claim)

            # Step 3: Cross-reference verify
            verdict, confidence = self.verifier.verify(claim, evidence)

            # Step 4: Validate citations in evidence
            for item in evidence:
                if item.source_id:
                    item.validated = self.citation_validator.validate(
                        item.source_name, item.source_id
                    )

            # Step 5: Determine action
            result = VerificationResult(
                claim=claim,
                evidence=evidence,
                verdict=verdict,
                confidence=confidence,
                action=Action.PASS_THROUGH,
                explanation=""
            )
            result.action = self.verdict_engine.decide(result)
            result.explanation = self.generate_explanation(result)
            results.append(result)

        return results

    def should_block(self, results: List[VerificationResult]) -> bool:
        """Check if any result requires blocking the response."""
        return any(r.action == Action.BLOCK_RESPONSE for r in results)

    def should_re_synthesize(
        self, results: List[VerificationResult]
    ) -> bool:
        """Check if response needs re-synthesis."""
        return any(
            r.action == Action.NEEDS_RE_SYNTHESIS for r in results
        )
```


---

## 4. Medical Claim Patterns

### 4.1 Pattern Categories and Criticality Matrix

Medical claims in CLARA's output are classified into pattern categories, each with an assigned criticality level that determines the verification stringency:

| Pattern Category | Criticality | Verification Action | Example |
|-----------------|-------------|-------------------|---------|
| Drug-Drug Interaction (DDI) | 🔴 CRITICAL | `BLOCK_RESPONSE` if unverified | "Warfarin tương tác với aspirin làm tăng nguy cơ xuất huyết" |
| Drug Dosage | 🔴 CRITICAL | `BLOCK_RESPONSE` if contradicted | "Liều metformin 500mg x 2 lần/ngày" |
| Contraindication | 🔴 CRITICAL | `BLOCK_RESPONSE` if unverified | "Chống chỉ định dùng ACE inhibitor khi có thai" |
| Diagnostic Criteria | 🟠 HIGH | `FLAG_AND_WARN` if uncertain | "Chẩn đoán đái tháo đường khi HbA1c ≥ 6.5%" |
| Treatment Protocol | 🟠 HIGH | `FLAG_AND_WARN` if uncertain | "Điều trị viêm phổi cộng đồng bằng amoxicillin" |
| Statistical Claims | 🟡 MEDIUM | `ADD_UNCERTAINTY_NOTE` | "Tỷ lệ sống sau 5 năm là 85%" |
| General Health Info | 🟢 LOW | Pass through with disclaimer | "Uống đủ nước giúp cải thiện sức khỏe" |

### 4.2 Pattern Detection Rules

```python
# ─── Medical Claim Pattern Definitions ───────────────────────
# Regex patterns for rapid classification of Vietnamese medical claims

import re

MEDICAL_CLAIM_PATTERNS = {
    # ── CRITICAL Patterns ──────────────────────────────────
    "drug_interaction": {
        "patterns": [
            r"tương tác\s+(thuốc|với|giữa)",
            r"(không|chống)\s+(được\s+)?dùng\s+(chung|cùng|kết hợp)",
            r"(interaction|DDI|drug.interaction)",
            r"(phối hợp|kết hợp).*(thuốc|dược)",
            r"(tăng|giảm)\s+(tác dụng|nồng độ|hiệu quả).*khi.*(dùng|phối hợp)",
        ],
        "criticality": "CRITICAL",
        "action": "BLOCK_RESPONSE",
        "required_sources": ["RxNorm", "Duoc_Thu_QG"],
    },
    "dosage": {
        "patterns": [
            r"\d+\s*(mg|g|mcg|µg|ml|UI|IU|mmol)\s*/?\s*(kg|ngày|lần|viên)?",
            r"liều\s+(dùng|lượng|tối đa|tối thiểu|khởi đầu|duy trì)",
            r"(uống|tiêm|truyền)\s+\d+",
            r"\d+\s*(lần|viên|ống|gói)\s*/\s*(ngày|tuần|tháng)",
        ],
        "criticality": "CRITICAL",
        "action": "BLOCK_RESPONSE",
        "required_sources": ["RxNorm", "Duoc_Thu_QG", "BYT"],
    },
    "contraindication": {
        "patterns": [
            r"chống\s+chỉ\s+định",
            r"(không|cấm)\s+(được\s+)?(dùng|sử dụng|chỉ định)",
            r"contraindication",
            r"(thận trọng|cẩn thận)\s+(khi|với|ở)",
        ],
        "criticality": "CRITICAL",
        "action": "BLOCK_RESPONSE",
        "required_sources": ["RxNorm", "Duoc_Thu_QG"],
    },

    # ── HIGH Patterns ──────────────────────────────────────
    "diagnostic_criteria": {
        "patterns": [
            r"chẩn đoán\s+(khi|nếu|dựa|theo)",
            r"(tiêu chuẩn|tiêu chí)\s+(chẩn đoán|xác định)",
            r"(xét nghiệm|chỉ số)\s*(≥|≤|>|<|=)\s*\d+",
            r"(dương tính|âm tính)\s+(khi|nếu|với)",
        ],
        "criticality": "HIGH",
        "action": "FLAG_AND_WARN",
        "required_sources": ["BYT", "PubMed", "ICD-11"],
    },
    "treatment_protocol": {
        "patterns": [
            r"(điều trị|chữa|xử trí)\s+(bằng|với|theo)",
            r"phác đồ\s+(điều trị|BYT|bộ y tế)",
            r"(first.line|second.line|đầu tay|bậc\s+\d)",
            r"(kháng sinh|hóa trị|xạ trị|phẫu thuật)\s+(cho|điều trị|khi)",
        ],
        "criticality": "HIGH",
        "action": "FLAG_AND_WARN",
        "required_sources": ["BYT", "PubMed"],
    },

    # ── MEDIUM Patterns ────────────────────────────────────
    "statistical_claim": {
        "patterns": [
            r"(tỷ lệ|tỉ lệ|xác suất)\s+.*\d+\s*%",
            r"\d+\s*%\s*(bệnh nhân|trường hợp|ca|người)",
            r"(nghiên cứu|thử nghiệm|trial).*cho thấy",
            r"(OR|RR|HR|NNT|NNH)\s*[=:]\s*\d+",
            r"(p\s*[<>=]\s*0\.\d+|CI\s*\d+\s*%)",
        ],
        "criticality": "MEDIUM",
        "action": "ADD_UNCERTAINTY_NOTE",
        "required_sources": ["PubMed"],
    },
}

def detect_claim_patterns(text: str) -> list:
    """Detect medical claim patterns in Vietnamese text."""
    detected = []
    for pattern_name, config in MEDICAL_CLAIM_PATTERNS.items():
        for pattern in config["patterns"]:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                detected.append({
                    "pattern": pattern_name,
                    "criticality": config["criticality"],
                    "action": config["action"],
                    "required_sources": config["required_sources"],
                    "match": re.search(
                        pattern, text, re.IGNORECASE | re.UNICODE
                    ).group()
                })
                break  # One match per category is sufficient
    return detected
```

### 4.3 Drug Interaction Verification Flow

Drug-drug interaction (DDI) claims require the most rigorous verification:

```
DDI Claim Detected
      │
      ├──▶ Extract drug names (Vietnamese + generic + brand)
      │         │
      │         ▼
      ├──▶ Normalize via RxNorm API → RxCUI pairs
      │         │
      │         ▼
      ├──▶ Query RxNorm Interaction API (RxCUI₁ × RxCUI₂)
      │         │
      │         ├── Known interaction → Verify severity matches claim
      │         ├── No known interaction → Flag as UNSUPPORTED
      │         └── API error → Fallback to Dược thư QG + PubMed
      │
      ├──▶ Cross-check against Dược thư Quốc gia (Vietnamese)
      │
      └──▶ Verdict:
            ├── Confirmed by ≥2 sources → VERIFIED
            ├── Confirmed by 1 source → PARTIALLY_VERIFIED
            ├── Severity mismatch → CONTESTED
            └── Not found anywhere → UNSUPPORTED → BLOCK if CRITICAL
```

### 4.4 Dosage Verification Flow

Dosage claims are verified against multiple reference ranges:

```
Dosage Claim Detected
      │
      ├──▶ Extract: drug_name, dose_value, dose_unit, frequency, route
      │
      ├──▶ Normalize drug → RxCUI → Standard dosage ranges
      │         │
      │         ▼
      ├──▶ Compare claimed dosage vs. reference ranges:
      │         ├── Within standard range → VERIFIED
      │         ├── Above max dose → CONTRADICTED → BLOCK_RESPONSE
      │         ├── Below therapeutic range → FLAG_AND_WARN
      │         └── Pediatric/geriatric dose check if age context available
      │
      ├──▶ Check against BYT protocol dosage (if applicable)
      │
      └──▶ Additional checks:
            ├── Renal/hepatic dose adjustment mentioned?
            ├── Weight-based dosing correct? (mg/kg calculations)
            └── Frequency within approved range?
```

---

## 5. Cross-Reference Verification

### 5.1 Verification Matrix Architecture

The cross-reference verification system constructs a **Claim × Source verification matrix** where each cell contains a support score:

```
                    ┌──────────┬────────────┬──────────┬──────────┬──────────┐
                    │  PubMed  │    BYT     │  RxNorm  │ Dược thư │  ICD-11  │
                    │          │ Protocols  │          │   QG     │          │
┌───────────────────┼──────────┼────────────┼──────────┼──────────┼──────────┤
│ Claim 1: Drug X   │  ✅ 0.92 │  ✅ 0.88   │  ✅ 0.95 │  ✅ 0.90 │   N/A    │
│ dosage 500mg/day  │          │            │          │          │          │
├───────────────────┼──────────┼────────────┼──────────┼──────────┼──────────┤
│ Claim 2: Drug X   │  ✅ 0.85 │   N/A      │  ✅ 0.91 │  ❌ 0.30 │   N/A    │
│ interacts w/ Y    │          │            │          │          │          │
├───────────────────┼──────────┼────────────┼──────────┼──────────┼──────────┤
│ Claim 3: Condition│  ✅ 0.78 │  ✅ 0.95   │   N/A    │   N/A    │  ✅ 0.99 │
│ diagnosed by ...  │          │            │          │          │          │
├───────────────────┼──────────┼────────────┼──────────┼──────────┼──────────┤
│ Claim 4: Treatment│  ⚠️ 0.55 │  ❌ 0.20   │   N/A    │   N/A    │   N/A    │
│ protocol is ...   │          │            │          │          │          │
└───────────────────┴──────────┴────────────┴──────────┴──────────┴──────────┘

Legend: ✅ Supports (≥0.7)  ⚠️ Uncertain (0.4-0.7)  ❌ Contradicts (<0.4)  N/A Not applicable
```

### 5.2 Source-Specific Verification Strategies

#### 5.2.1 PubMed Verification
- **API**: NCBI E-utilities (esearch + efetch)
- **Query Strategy**: Translate atomic claim → MeSH terms + free-text query
- **Verification**: NLI-based entailment between PubMed abstract and claim
- **Reliability Weight**: 0.85 (peer-reviewed, but may not reflect Vietnamese practice)

#### 5.2.2 BYT Protocol Verification
- **Source**: Vietnamese Ministry of Health (Bộ Y tế) clinical protocols
- **Access**: Pre-indexed local vector database (BYT protocols are not API-accessible)
- **Verification**: Semantic similarity + rule-based matching against protocol statements
- **Reliability Weight**: 0.95 (highest authority for Vietnamese clinical practice)
- **Special Handling**: BYT protocols may lag behind international guidelines; when BYT conflicts with PubMed, flag for human review rather than auto-resolving

#### 5.2.3 RxNorm Verification
- **API**: NLM RxNorm REST API
- **Query Strategy**: Drug name → RxCUI normalization → Interaction/property lookup
- **Verification**: Structured data comparison (exact match for dosage ranges, interaction pairs)
- **Reliability Weight**: 0.90 (standardized, comprehensive for US-approved drugs)
- **Limitation**: May not include all Vietnamese-market drugs; fallback to Dược thư QG

#### 5.2.4 Dược thư Quốc gia (National Drug Formulary) Verification
- **Source**: Vietnamese National Drug Formulary
- **Access**: Pre-indexed local database (not available via public API)
- **Verification**: Structured lookup for Vietnamese drug names, dosages, indications
- **Reliability Weight**: 0.92 (authoritative for Vietnamese market)
- **Special Value**: Contains Vietnamese-specific brand names, locally approved indications, and dosage guidelines adapted for Vietnamese population

#### 5.2.5 ICD-11 / WHO Verification
- **API**: WHO ICD-11 API
- **Query Strategy**: Disease/condition name → ICD-11 code validation
- **Verification**: Code existence + description matching
- **Reliability Weight**: 0.88 (international standard, but may not capture Vietnamese disease naming conventions)

### 5.3 Conflict Resolution Strategy

When sources disagree, CLARA applies a hierarchical conflict resolution:

```
CONFLICT RESOLUTION HIERARCHY
══════════════════════════════

Priority 1: Patient Safety
  │  If ANY authoritative source indicates safety risk
  │  → Escalate to CRITICAL, regardless of other sources
  │
Priority 2: Vietnamese Authority
  │  BYT protocols take precedence for Vietnamese clinical practice
  │  → BYT > International guidelines for local practice
  │
Priority 3: Recency
  │  More recent evidence > older evidence
  │  → Check publication dates; flag if guidelines > 3 years old
  │
Priority 4: Consensus
  │  Multiple agreeing sources > single disagreeing source
  │  → Weighted majority vote across all available sources
  │
Priority 5: Specificity
  │  More specific evidence > general evidence
  │  → Drug-specific study > class-level recommendation
```

### 5.4 Vietnamese ↔ International Guideline Reconciliation

A unique challenge for CLARA is reconciling Vietnamese and international guidelines:

| Scenario | Resolution | Action |
|----------|-----------|--------|
| BYT aligns with WHO/PubMed | High confidence | `VERIFIED` |
| BYT more conservative than international | Follow BYT for VN context | `VERIFIED` with note |
| BYT more permissive than international | Flag potential concern | `CONTESTED` + human review |
| BYT silent, international clear | Use international with disclaimer | `PARTIALLY_VERIFIED` |
| BYT and international contradict | Escalate | `CONTESTED` → human review |


---

## 6. Hallucination Detection

### 6.1 Types of Medical LLM Hallucinations

Medical hallucinations are particularly dangerous and can be categorized as:

| Type | Description | Example | Risk Level |
|------|------------|---------|------------|
| **Fabricated Citations** | LLM invents PubMed IDs or study references | "Theo nghiên cứu PMID:99999999..." | 🔴 Critical |
| **Dose Confabulation** | Correct drug, wrong dosage | "Metformin 5000mg/ngày" (actual max: ~2550mg) | 🔴 Critical |
| **Interaction Invention** | Claims non-existent drug interactions | Inventing DDI between drugs with no known interaction | 🔴 Critical |
| **Outdated Information** | Presents superseded guidelines as current | Recommending withdrawn drug as first-line | 🟠 High |
| **Entity Conflation** | Confuses similar drug/disease names | Mixing metformin with methotrexate properties | 🟠 High |
| **Statistical Fabrication** | Invents precise statistics | "Tỷ lệ thành công 97.3%" without source | 🟡 Medium |
| **Overconfident Claims** | States uncertain info as definitive fact | "Chắc chắn chữa khỏi" (definitely cures) | 🟡 Medium |

### 6.2 Multi-Layer Hallucination Detection

CLARA employs a multi-layer detection strategy:

```
Layer 1: PATTERN-BASED DETECTION (Fast, rule-based)
├── Citation format validation (PMID regex, NCT regex)
├── Dosage range sanity check (drug → max dose lookup)
├── Known entity validation (drug/disease name exists?)
└── Impossible claim detection (logical contradictions)

Layer 2: RETRIEVAL-BASED DETECTION (Medium, evidence-based)
├── Atomic fact → evidence retrieval → NLI verification
├── Citation existence check (PMID → PubMed API)
├── Cross-source consistency checking
└── Temporal validity check (guideline recency)

Layer 3: MODEL-BASED DETECTION (Slow, LLM-based)
├── Entropy/uncertainty estimation on generated tokens
├── Self-consistency check (generate multiple responses, compare)
├── LLM-as-judge evaluation of medical accuracy
└── Chain-of-verification prompting
```

### 6.3 Entropy-Based Uncertainty Estimation

Following approaches documented in Nature (2024), CLARA can estimate token-level uncertainty to flag potential hallucinations:

```python
# ─── Entropy-Based Hallucination Detection ───────────────────
# Conceptual pseudocode for uncertainty estimation

def estimate_claim_uncertainty(
    model, claim_text: str, context: str
) -> float:
    """
    Estimate uncertainty of a medical claim by analyzing
    token-level entropy during generation.

    High entropy on medical-critical tokens (drug names,
    dosages, diagnostic criteria) signals potential
    hallucination.
    """
    tokens = model.tokenize(claim_text)
    logits = model.forward(context + claim_text)

    # Calculate per-token entropy
    token_entropies = []
    for i, token in enumerate(tokens):
        probs = softmax(logits[i])
        entropy = -sum(p * log(p) for p in probs if p > 0)
        token_entropies.append({
            "token": token,
            "entropy": entropy,
            "is_medical_entity": is_medical_token(token),
        })

    # Weight medical entity tokens more heavily
    weighted_entropy = 0.0
    total_weight = 0.0
    for te in token_entropies:
        weight = 3.0 if te["is_medical_entity"] else 1.0
        weighted_entropy += te["entropy"] * weight
        total_weight += weight

    avg_uncertainty = weighted_entropy / total_weight

    # Threshold: high uncertainty → likely hallucination
    # Calibrated thresholds (to be tuned on validation set):
    #   < 0.3: Low uncertainty (likely factual)
    #   0.3-0.6: Medium uncertainty (needs verification)
    #   > 0.6: High uncertainty (likely hallucination)
    return avg_uncertainty
```

### 6.4 Self-Consistency Verification

Generate multiple responses to the same query and check for consistency:

```python
def self_consistency_check(
    model, query: str, n_samples: int = 5
) -> dict:
    """
    Generate n responses and check medical claim consistency.
    Inconsistency across samples indicates potential hallucination.
    """
    responses = [model.generate(query) for _ in range(n_samples)]

    # Decompose each response into atomic claims
    all_claims = [decompose(r) for r in responses]

    # Find claims that appear in most responses (consensus)
    claim_frequency = count_similar_claims(all_claims)

    consistent_claims = [
        c for c, freq in claim_frequency.items()
        if freq >= n_samples * 0.6  # Appears in ≥60% of samples
    ]
    inconsistent_claims = [
        c for c, freq in claim_frequency.items()
        if freq < n_samples * 0.4   # Appears in <40% of samples
    ]

    return {
        "consistent": consistent_claims,      # Likely factual
        "inconsistent": inconsistent_claims,   # Likely hallucinated
        "consistency_ratio": len(consistent_claims) / max(
            len(claim_frequency), 1
        )
    }
```

### 6.5 Citation Hallucination Detection

LLMs frequently fabricate academic citations. CLARA validates every citation:

```python
def detect_citation_hallucinations(text: str) -> list:
    """Detect fabricated citations in generated medical text."""
    hallucinated = []

    # Extract all PMID references
    pmids = re.findall(r'PMID[:\s]*(\d{7,8})', text)
    for pmid in pmids:
        if not pubmed_api.exists(pmid):
            hallucinated.append({
                "type": "fabricated_pmid",
                "value": pmid,
                "severity": "CRITICAL"
            })
        else:
            # PMID exists, but does the paper say what's claimed?
            paper = pubmed_api.fetch(pmid)
            claim_context = extract_claim_around_citation(text, pmid)
            if not nli_entails(paper.abstract, claim_context):
                hallucinated.append({
                    "type": "misattributed_citation",
                    "value": pmid,
                    "severity": "HIGH"
                })

    # Extract NCT IDs
    nct_ids = re.findall(r'NCT\d{8}', text)
    for nct_id in nct_ids:
        if not clinicaltrials_api.exists(nct_id):
            hallucinated.append({
                "type": "fabricated_nct",
                "value": nct_id,
                "severity": "CRITICAL"
            })

    return hallucinated
```

---

## 7. Confidence Scoring

### 7.1 Confidence Score Architecture

CLARA's confidence scoring system produces a composite score for each verified response, combining multiple dimensions:

```
COMPOSITE CONFIDENCE SCORE
══════════════════════════

Score = w₁·S_evidence + w₂·S_consensus + w₃·S_recency + w₄·S_source_quality + w₅·S_consistency

Where:
  S_evidence     = Evidence support score (NLI-based)         w₁ = 0.30
  S_consensus    = Cross-source agreement score               w₂ = 0.25
  S_recency      = Temporal relevance of evidence             w₃ = 0.10
  S_source_quality = Authority weight of sources used         w₄ = 0.20
  S_consistency  = Self-consistency / entropy score            w₅ = 0.15
```

### 7.2 Evidence Support Score (S_evidence)

```python
def compute_evidence_score(
    claim: AtomicClaim, evidence: list
) -> float:
    """
    NLI-based scoring: how strongly does retrieved evidence
    support the claim?
    """
    if not evidence:
        return 0.0

    entailment_scores = []
    for item in evidence:
        nli_result = nli_model.predict(
            premise=item.content,
            hypothesis=claim.text
        )
        # nli_result: {"entailment": 0.85, "neutral": 0.10,
        #              "contradiction": 0.05}
        score = (
            nli_result["entailment"]
            - nli_result["contradiction"]
        )
        entailment_scores.append(max(score, 0.0))

    # Use top-3 evidence items (most relevant)
    top_scores = sorted(entailment_scores, reverse=True)[:3]
    return sum(top_scores) / len(top_scores)
```

### 7.3 Cross-Source Consensus Score (S_consensus)

```python
def compute_consensus_score(
    verification_matrix: dict
) -> float:
    """
    Measure agreement across different authoritative sources.
    Higher score = more sources agree.
    """
    source_verdicts = []
    for source, result in verification_matrix.items():
        if result["applicable"]:
            source_verdicts.append(result["support_score"])

    if len(source_verdicts) < 2:
        return 0.5  # Insufficient sources for consensus

    # Calculate agreement ratio
    supporting = sum(1 for s in source_verdicts if s >= 0.7)
    contradicting = sum(1 for s in source_verdicts if s < 0.3)
    total = len(source_verdicts)

    if contradicting > 0:
        # Any contradiction significantly reduces consensus
        return max(0.0, (supporting - contradicting) / total)

    return supporting / total
```

### 7.4 Source Quality Score (S_source_quality)

Sources are weighted by their authority level:

| Source | Quality Weight | Justification |
|--------|---------------|---------------|
| BYT Protocol (current) | 0.95 | Highest Vietnamese clinical authority |
| Dược thư Quốc gia | 0.92 | Official Vietnamese drug reference |
| RxNorm / NLM | 0.90 | International standardized drug DB |
| PubMed (systematic review) | 0.90 | Highest evidence level |
| PubMed (RCT) | 0.85 | Strong evidence |
| PubMed (observational) | 0.75 | Moderate evidence |
| PubMed (case report) | 0.60 | Weak evidence |
| WHO ICD-11 | 0.88 | International diagnostic standard |
| ClinicalTrials.gov | 0.80 | Trial data (may be preliminary) |
| Textbook / Reference | 0.70 | May not reflect latest evidence |

### 7.5 Confidence Thresholds and Actions

| Composite Score | Confidence Level | Display | Action |
|----------------|-----------------|---------|--------|
| ≥ 0.85 | 🟢 High | "Thông tin đáng tin cậy cao" | Pass with full citations |
| 0.70 - 0.84 | 🟡 Moderate | "Thông tin có độ tin cậy trung bình" | Pass with uncertainty note |
| 0.50 - 0.69 | 🟠 Low | "Thông tin cần xác minh thêm" | Flag + suggest verification |
| < 0.50 | 🔴 Very Low | "Thông tin chưa được xác minh đầy đủ" | Block if critical; warn otherwise |

### 7.6 Confidence Score Display in Response

CLARA presents confidence information to users in a structured format:

```markdown
## Kết quả tư vấn

[Medical response content here]

---
### 📊 Độ tin cậy thông tin (Confidence Assessment)

| Nội dung | Độ tin cậy | Nguồn xác minh |
|----------|-----------|----------------|
| Liều dùng Metformin 500mg x 2/ngày | 🟢 Cao (0.92) | RxNorm, BYT, Dược thư QG |
| Tương tác với Glipizide | 🟡 Trung bình (0.75) | RxNorm, PubMed |
| Tỷ lệ hiệu quả 85% | 🟠 Thấp (0.55) | PubMed (1 nghiên cứu) |

⚠️ *Thông tin này chỉ mang tính chất tham khảo. Vui lòng tham khảo ý kiến
bác sĩ trước khi áp dụng.*
```

### 7.7 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Fact-check precision | ≥ 85% | % of flagged claims that are truly incorrect |
| Hallucination detection rate | ≥ 95% | % of hallucinations caught before delivery |
| Overall hallucination rate | < 5% | % of delivered responses containing hallucinations |
| Citation accuracy | ≥ 90% | % of citations that exist and support the claim |
| Critical claim catch rate | ≥ 95% | % of CRITICAL claims that undergo full verification |
| False positive rate | < 10% | % of correct claims incorrectly flagged |
| Verification latency (Tier 2) | < 3s | Time added by fact-checking to response |
| Verification latency (Tier 3) | < 8s | Time for full FIDES pipeline |

---

## 8. Integration Architecture

### 8.1 Fact Checker as Independent Pipeline Node

The FIDES-Medical fact checker integrates into CLARA's agentic RAG pipeline as an **independent verification node** positioned between the Synthesis Agent and Response Delivery:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CLARA AGENTIC RAG PIPELINE                          │
│                                                                         │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────────┐  │
│  │  Intent    │───▶│ Retrieval │───▶│ Synthesis │───▶│ FIDES FACT    │  │
│  │ Classifier │    │  Agent    │    │  Agent    │    │ CHECKER NODE  │  │
│  │  (Router)  │    │           │    │           │    │ (This module) │  │
│  └───────────┘    └───────────┘    └───────────┘    └───────┬───────┘  │
│       │                                                      │          │
│       │           ┌──────────────────────────────────────────┘          │
│       │           │                                                     │
│       │           ▼                                                     │
│       │    ┌─────────────┐                                              │
│       │    │  Decision   │                                              │
│       │    │  Gate       │                                              │
│       │    └──────┬──────┘                                              │
│       │           │                                                     │
│       │     ┌─────┼─────────┬──────────────┐                           │
│       │     ▼     ▼         ▼              ▼                           │
│       │   PASS  ADD_NOTE  RE-SYNTH     BLOCK                          │
│       │     │     │         │              │                           │
│       │     ▼     ▼         │              ▼                           │
│       │  ┌──────────┐      │        ┌──────────┐                      │
│       │  │ Response │◀─────┘        │ Safety   │                      │
│       │  │ Delivery │               │ Response │                      │
│       │  └──────────┘               └──────────┘                      │
│       │                                                                │
│  ┌────┘                                                                │
│  │  THREE-TIER ROUTING                                                 │
│  ├── Tier 1 (General health): SLM-only, basic pattern checks only     │
│  ├── Tier 2 (Clinical): Multi-model, Layers 1-2 fact-checking         │
│  └── Tier 3 (Deep clinical): Full FIDES pipeline (all 5 steps)        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Three-Tier Verification Strategy

Not all queries require full FIDES verification. CLARA routes queries through tiered verification:

| Tier | Query Type | Verification Level | Latency Budget | Example |
|------|-----------|-------------------|----------------|---------|
| **Tier 1** | General health info | Pattern-based only (Layer 1) | < 0.5s | "Uống nước bao nhiêu mỗi ngày?" |
| **Tier 2** | Clinical questions | Layers 1-2 (pattern + retrieval) | < 3s | "Liều dùng amoxicillin cho viêm họng?" |
| **Tier 3** | Complex clinical / drug interactions | Full FIDES pipeline (all layers) | < 8s | "Tương tác giữa warfarin và NSAIDs ở bệnh nhân suy thận?" |

### 8.3 API Interface Design

```python
# ─── Fact Checker Node API ───────────────────────────────────

class FactCheckerNode:
    """
    Independent fact-checker node in the CLARA pipeline.
    Receives synthesized responses, returns verified responses.
    """
    def __init__(self, tier: int = 2):
        self.pipeline = FIDESMedicalPipeline()
        self.tier = tier

    async def process(self, request: FactCheckRequest) -> FactCheckResponse:
        """
        Main entry point for the fact-checker node.

        Args:
            request: Contains synthesized_response, query_context,
                     tier_level, cited_sources

        Returns:
            FactCheckResponse with verified text, confidence scores,
            and action decisions
        """
        # Determine verification depth based on tier
        if request.tier_level == 1:
            results = self.quick_pattern_check(request.synthesized_response)
        elif request.tier_level == 2:
            results = self.standard_verification(request)
        else:  # Tier 3
            results = self.full_fides_verification(request)

        # Compile response
        return FactCheckResponse(
            original_text=request.synthesized_response,
            verification_results=results,
            overall_confidence=self.compute_overall_confidence(results),
            action=self.determine_action(results),
            modified_text=self.apply_modifications(request.synthesized_response, results),
            audit_trail=self.generate_audit_trail(results),
        )

    def determine_action(self, results: list) -> str:
        """Determine overall action based on all claim results."""
        if any(r.action == Action.BLOCK_RESPONSE for r in results):
            return "BLOCK"
        if any(r.action == Action.NEEDS_RE_SYNTHESIS for r in results):
            return "RE_SYNTHESIZE"
        if any(r.action == Action.FLAG_AND_WARN for r in results):
            return "WARN"
        if any(r.action == Action.ADD_UNCERTAINTY_NOTE for r in results):
            return "ADD_NOTES"
        return "PASS"
```

### 8.4 Interaction with Other CLARA Components

```
┌──────────────────────────────────────────────────────────────┐
│                  COMPONENT INTERACTIONS                       │
│                                                              │
│  Synthesis Agent ──────▶ Fact Checker ──────▶ Response       │
│       │                      │                  Delivery     │
│       │                      │                               │
│       │                      ├──▶ PubMed API (external)      │
│       │                      ├──▶ RxNorm API (external)      │
│       │                      ├──▶ ClinicalTrials API (ext.)  │
│       │                      ├──▶ WHO ICD-11 API (external)  │
│       │                      ├──▶ BYT Vector DB (internal)   │
│       │                      ├──▶ Dược thư QG DB (internal)  │
│       │                      └──▶ NLI Model (internal)       │
│       │                                                      │
│       │◀─── RE-SYNTHESIZE ───┘                               │
│       │     (feedback loop when facts fail verification)     │
│                                                              │
│  CareGuard Module ◀──── Shares DDI/dosage verification       │
│  (Drug Safety)          results with fact checker             │
│                                                              │
│  Logging / Audit ◀──── Every verification decision logged    │
│  System                 with full evidence trail              │
└──────────────────────────────────────────────────────────────┘
```

### 8.5 Implementation Phasing

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| **Phase 1** | Months 1-3 | Pattern-based detection (Layer 1): regex claim patterns, citation format validation, dosage range sanity checks |
| **Phase 2** | Months 3-6 | Retrieval-based verification (Layer 2): PubMed/RxNorm API integration, NLI-based entailment checking, citation existence validation |
| **Phase 3** | Months 6-9 | Full FIDES pipeline (Layer 3): BioMistral-7B claim decomposition, cross-reference verification matrix, confidence scoring system |
| **Phase 4** | Months 9-12 | Advanced features: Self-consistency checking, entropy-based uncertainty estimation, BYT/Dược thư QG integration, Vietnamese NLP optimization |
| **Phase 5** | Months 12+ | Continuous improvement: Performance monitoring, threshold tuning, false positive reduction, expanded source coverage |

### 8.6 Technology Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Claim Decomposition Model | BioMistral-7B (VN fine-tuned) | Best medical SLM for Vietnamese |
| NLI Verification | cross-encoder/nli-deberta-v3-base | Strong NLI performance, reasonable latency |
| Evidence Retrieval | NCBI E-utilities, NLM RxNorm API | Official medical data APIs |
| Vector Database (BYT) | Qdrant / ChromaDB | Fast semantic search for local protocols |
| Orchestration | LangGraph / custom async pipeline | Supports complex branching logic |
| Caching | Redis | Cache API responses, reduce latency |
| Logging / Audit | Structured JSON logging | Full traceability for medical compliance |

---

## References

1. Yan, Z., Chen, J., Wang, J., Li, X., Li, R., & Pan, J. Z. (2025). "Decomposing and Revising What Language Models Generate." arXiv:2509.00765.
2. Zheng, Z., et al. (2025). "AFEV: Atomic Fact Extraction and Verification." arXiv:2506.07446.
3. Min, S., Krishna, K., Lyu, X., Lewis, M., Yih, W., Koh, P. W., ... & Hajishirzi, H. (2023). "FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation."
4. Wei, J., et al. (2024). "SAFE: Search-Augmented Factuality Evaluator." Google DeepMind.
5. Nature Medicine (2024). "Large language models for preventing medication direction errors in online pharmacies."
6. Labrak, Y., et al. (2024). "BioMistral: A Collection of Open-Source Pretrained Large Language Models for Medical Domains."
7. CLIN-LLM (2025). "A Safety-Constrained Hybrid Framework for Clinical Decision Support." arXiv:2510.22609.

---

*This document is part of the CLARA project research documentation. It provides strategic analysis and architectural guidance for implementing a FIDES-inspired fact-checking system tailored to Vietnamese medical AI applications.*