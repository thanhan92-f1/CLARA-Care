# CLARA Workflow Architecture

**Document Version:** 2.0
**Last Updated:** 2024
**Status:** Proposal

---

## Overview

This document details CLARA's workflow architecture with emphasis on:
- Two-layer intent routing system
- Role-specific workflows (normal users, researchers, doctors)
- Cache strategy (UPDATE not ADD approach)
- Coding agent as tool orchestrator (NOT code generation)
- Synthesis and verification as separate nodes

---

## 1. Two-Layer Intent Router


### Architecture Overview

```
                              ┌───────────────┐
                              │  User Query   │
                              └───────┬───────┘
                                      │
                       ┌──────────────▼───────────────┐
                       │  Emergency Keyword Check     │
                       │  (Fast-path bypass)          │
                       │  Keywords: chest pain,       │
                       │  stroke, anaphylaxis, etc.   │
                       └──────────────┬───────────────┘
                                      │
                               No Emergency
                                      │
                ┌─────────────────────▼──────────────────────┐
                │   Layer 1: Role Classifier                 │
                │   Model: Qwen2.5-0.5B (50-100ms)           │
                │   Output: normal_user | researcher | doctor│
                └─────────────────────┬──────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
   ┌────▼─────┐              ┌────────▼────────┐           ┌───────▼──────┐
   │ Normal   │              │   Researcher    │           │    Doctor    │
   │  User    │              │                 │           │              │
   └────┬─────┘              └────────┬────────┘           └───────┬──────┘
        │                             │                            │
   ┌────▼──────────┐          ┌───────▼─────────┐         ┌────────▼──────┐
   │ Layer 2       │          │ Layer 2         │         │ Layer 2       │
   │ Intent        │          │ Intent          │         │ Intent        │
   │ - general_info│          │ - deep_research │         │ - diagnosis   │
   │ - symptom_chk │          │ - drug_analysis │         │ - treatment   │
   │ - med_query   │          │ - clinical_trial│         │ - peer_consult│
   │ - emergency   │          │ - evidence_synth│         │ - ai_council  │
   └───────┬───────┘          └────────┬────────┘         └────────┬──────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  Route to       │
                              │  Workflow       │
                              └─────────────────┘
```

### Layer 1: Role Classification

**Model:** Qwen2.5-0.5B
**Latency:** 50-100ms
**Output:** `normal_user` | `researcher` | `doctor`

**Classification Features:**
- Language patterns and terminology complexity
- Medical jargon density
- Query structure and formality
- Session history (if available)

### Layer 2: Intent Classification (Role-Specific)

Each role has specialized intents:

**Normal User:**
- `general_info` - Basic medical information
- `symptom_check` - Symptom assessment
- `med_question` - Medication questions
- `emergency` - Urgent health concerns

**Researcher:**
- `deep_research` - Comprehensive literature review
- `drug_analysis` - Pharmacological analysis
- `clinical_trial` - Trial data exploration
- `evidence_synthesis` - Cross-study synthesis

**Doctor:**
- `diagnosis` - Differential diagnosis support
- `treatment` - Treatment recommendations
- `peer_consult` - Complex case consultation
- `ai_council` - Multi-specialist deliberation (Hội chẩn)

### Emergency Fast-Path

**Bypass Mechanism:** Keyword-based detection skips all routing

```
User Query: "ngừng tim" / "cardiac arrest"
     │
     ▼
Emergency Keywords Detected → IMMEDIATE PROTOCOL DISPLAY
     │
     └─→ Skip L1/L2 routing
         Show emergency instructions
         Display emergency contacts (115)
```

---

## 2. Simple Workflow (Normal Users)

**Target Time:** < 2 minutes
**Use Cases:** Basic health questions, medication lookups, simple DDI checks

### Flow Diagram

```
┌──────────────┐
│  User Query  │
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│ L1: Role = normal  │
│ L2: Intent = med_q │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────┐
│  Cache Check (Redis) │
└──────┬───────────────┘
       │
       ├── HIT ──────────────────┐
       │                         │
       │ MISS                    │
       ▼                         │
┌─────────────────────┐          │
│ Single Source Query │          │
│ (Most relevant)     │          │
│ - BYT               │          │
│ - Dược thư QG       │          │
│ - RxNorm            │          │
└──────┬──────────────┘          │
       │                         │
       ▼                         │
┌─────────────────────┐          │
│ Quick Synthesis     │          │
│ (Qwen2.5-7B)        │          │
└──────┬──────────────┘          │
       │                         │
       ▼                         │
┌─────────────────────┐          │
│ Basic Check         │          │
│ - Contraindications │          │
│ - Dosage ranges     │          │
└──────┬──────────────┘          │
       │                         │
       ▼                         │
┌─────────────────────┐          │
│ Cache UPDATE        │          │
└──────┬──────────────┘          │
       │                         │
       └─────────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Response (Vi/En)    │
│ - Simple language   │
│ - Clear actions     │
└─────────────────────┘
```

**Characteristics:**
- Single-pass processing
- One source retrieval (fastest relevant)
- Basic keyword-level verification
- Cache-optimized for common queries
---

## 3. Research Workflow (Researchers) - Perplexity-style

**Target Time:** 5-20 minutes (Progressive phases)
**Use Cases:** Literature reviews, clinical trials, drug information, evidence synthesis
**Style:** Progressive display - show results as they arrive

### Flow Diagram

```
┌──────────────────┐
│ Researcher Query │
│ (Complex topic)  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────┐
│ L1: Role = researcher  │
│ L2: Intent = deep_rsrch│
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Query Decomposition    │
│ Break into sub-queries │
│ Example:               │
│  "Metformin + T2D VN"  │
│  → 1. Metformin RCTs   │
│  → 2. T2D prevalence   │
│  → 3. VN trials        │
└────────┬───────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│         PROGRESSIVE MULTI-SOURCE RETRIEVAL               │
│         (Show results incrementally)                     │
└──────────────────────────────────────────────────────────┘

         │
         │  PHASE 1 (2 min)
         ▼
┌─────────────────────┐
│ PubMed Quick Search │
│ - Top 10 abstracts  │
│ - Recent papers     │
│ - High-impact only  │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Show Preliminary     │ ◄─── USER SEES RESULTS
    │ Results (Phase 1)    │      (Can start reading)
    └──────────┬───────────┘
               │
               │  PHASE 2 (5 min)
               ▼
┌──────────────────────────┐
│ + ClinicalTrials.gov     │
│ + RxNorm                 │
│ - Trial protocols        │
│ - Drug interactions      │
└──────────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Update Results       │ ◄─── USER SEES UPDATE
    │ (Phase 1 + Phase 2)  │      (Expanded)
    └──────────┬───────────┘
               │
               │  PHASE 3 (10 min)
               ▼
┌──────────────────────────┐
│ + BYT                    │
│ + Dược thư QG            │
│ + Cross-reference        │
│ - Local guidelines       │
│ - Vietnamese studies     │
└──────────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Show Comprehensive   │ ◄─── USER SEES UPDATE
    │ Results (P1+P2+P3)   │      (Nearly complete)
    └──────────┬───────────┘
               │
               │  PHASE 4 (20 min - Optional full FIDES)
               ▼
┌──────────────────────────┐
│ Deep Analysis            │
│ - Full-text retrieval    │
│ - Meta-analysis          │
│ - Citation network       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ SYNTHESIS NODE           │
│ (Separate stage)         │
│ - Aggregate findings     │
│ - Identify patterns      │
│ - Resolve conflicts      │
│ - Grade evidence         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ VERIFICATION NODE        │
│ (FIDES-inspired)         │
│ - Claim extraction       │
│ - Evidence matching      │
│ - Confidence scoring     │
│ - Citation validation    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Cache UPDATE             │
│ (Merge new findings)     │
│ (UPDATE not ADD)         │
└──────────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Final Results with   │ ◄─── USER SEES FINAL
    │ Sources & Citations  │      (All phases done)
    └──────────────────────┘
```

### Progressive Display Example

```markdown
## Metformin Efficacy in Type 2 Diabetes (Vietnam Context)

### Phase 1 Results (2 min) ✓
📊 **PubMed:** 10 abstracts retrieved
- [PMID:12345678] Metformin reduces HbA1c by 1.5-2%
- [PMID:87654321] Cardiovascular outcomes study...

🔄 Continuing search... (Phase 2 in progress)

### Phase 2 Results (5 min) ✓
📊 **PubMed:** 47 studies total
📊 **ClinicalTrials.gov:** 12 trials found
- [NCT:98765432] Vietnamese population trial (n=450)
- [NCT:11223344] Ongoing study in Hanoi...

🔄 Adding local sources... (Phase 3 in progress)

### Phase 3 Results (10 min) ✓
📊 **BYT Guidelines:** 2023 Edition
📊 **Dược thư QG:** Metformin monograph
- First-line for T2DM in Vietnam
- Dosing: 500mg BID, titrate to 2000mg/day

### Phase 4 Final Analysis (20 min) ✓
✅ **Evidence Grade:** HIGH
✅ **Confidence:** 95%
✅ **FIDES Verified:** 15/15 claims

[Complete synthesis with citations...]
```

**Characteristics:**
- Progressive display (Perplexity-style)
- Multi-source integration
- Staged retrieval (2min → 5min → 10min → 20min)
- Separate synthesis and verification nodes
- Citation-rich output (PMID, NCT, RxCUI, DOI)
- Cache UPDATE (merge new findings into existing cache)

---

## 4. Doctor Workflow - Clinical Decision Support

**Target Time:** 10-20 minutes
**Use Cases:** Clinical decision support, complex DDI, differential diagnosis, AI council

CLARA offers **two specialized modes** for doctors:

### Option A: Sub-Agent Architecture (Parallel Branching)

**Inspired by:** Augment's multi-agent system

```
┌───────────────────┐
│ Clinical Scenario │
│ (Doctor input)    │
└────────┬──────────┘
         │
         ▼
┌────────────────────────┐
│ L1: Role = doctor      │
│ L2: Intent = clinical_ │
│     decision           │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Case Analysis          │
│ Extract:               │
│ - Patient data         │
│ - Key questions        │
│ - Required analyses    │
└────────┬───────────────┘
         │
         ▼
┌───────────────────────────────────────────┐
│  PARALLEL SUB-AGENT ACTIVATION            │
└───────────────────────────────────────────┘
         │
         ├─────────┬──────────┬──────────┬────────────┐
         │         │          │          │            │
         ▼         ▼          ▼          ▼            ▼
   ┌─────────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌──────────┐
   │Sub-Agent│ │ SA2  │ │  SA3  │ │  SA4   │ │   SA5    │
   │  DDI    │ │Proto-│ │Eviden │ │  Lab   │ │ Dosage   │
   │ Analysis│ │ col  │ │  ce   │ │Interp. │ │  Calc    │
   └────┬────┘ └──┬───┘ └───┬───┘ └───┬────┘ └─────┬────┘
        │         │         │         │            │
        └─────────┴─────────┴─────────┴────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │  Merge & Consolidate   │
               │  - Resolve conflicts   │
               │  - Integrate findings  │
               └────────┬───────────────┘
                        │
                        ▼
               ┌────────────────────────┐
               │ Comprehensive Synthesis│
               │ - Integrated analysis  │
               │ - Risk assessment      │
               └────────┬───────────────┘
                        │
                        ▼
               ┌────────────────────────┐
               │ Full FIDES Fact-Check  │
               │ - Verify all claims    │
               │ - Evidence grading     │
               └────────┬───────────────┘
                        │
                        ▼
               ┌────────────────────────┐
               │ Response with Logs     │
               │ (Processing visible)   │
               └────────────────────────┘
```

**Sub-Agent Examples:**

- **SA1 - DDI Agent**: RxNorm/DrugBank queries, mechanism analysis, severity classification
- **SA2 - Protocol Agent**: Match guidelines (BYT, WHO, local protocols), check contraindications
- **SA3 - Evidence Agent**: PubMed for RCTs, meta-analyses, local studies
- **SA4 - Lab Agent**: Compare reference ranges, identify abnormalities, suggest follow-ups
- **SA5 - Dosage Agent**: Calculate dosing based on renal/hepatic function, weight, age

**Characteristics:**
- Parallel execution (faster)
- Specialized domain expertise per agent
- Transparent reasoning logs visible to doctor
- Full FIDES verification
- Conflict identification and resolution

---

### Option B: AI Council / Hội chẩn (Multi-Specialist Deliberation)

**Use Case:** Complex cases requiring multi-specialty input

```
┌───────────────────────┐
│ Council Request       │
│ + Structured Case Data│
└──────────┬────────────┘
           │
           ▼
┌────────────────────────┐
│ Case Presentation      │
│ Required fields:       │
│ - Demographics         │
│ - Chief complaint      │
│ - Medical history      │
│ - Current medications  │
│ - Lab results          │
│ - Imaging findings     │
│ - Specific question    │
└──────────┬─────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│   SPECIALIST AGENT ACTIVATION (Parallel)     │
└──────────────────────────────────────────────┘
           │
    ┌──────┴──────┬──────────┬──────────┬──────┐
    │             │          │          │      │
    ▼             ▼          ▼          ▼      ▼
┌───────────┐ ┌──────┐ ┌─────────┐ ┌──────┐ ┌──────┐
│Cardiology │ │Neuro │ │ Pharmaco│ │Gen   │ │Endo  │
│  Agent    │ │ logy │ │  logy   │ │ Med  │ │crino │
└─────┬─────┘ └──┬───┘ └────┬────┘ └──┬───┘ └──┬───┘
      │          │          │         │        │
      │  Each specialist agent has:           │
      │  - Specialty knowledge base           │
      │  - Specialty guidelines access        │
      │  - Journal-specific retrieval         │
      │  - Confidence scoring                 │
      │                                       │
      └───────────┬───────┬──────────┬────────┘
                  │       │          │
                  ▼       ▼          ▼
      ┌────────────────────────────────────┐
      │    COUNCIL MODERATOR AGENT         │
      │                                    │
      │  Tasks:                            │
      │  1. Collect specialist inputs      │
      │  2. Identify consensus areas       │
      │  3. Flag disagreements             │
      │  4. Synthesize recommendation      │
      │  5. Assign confidence level        │
      │  6. Highlight areas needing        │
      │     human judgment                 │
      └──────────────┬─────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────────┐
      │   HỘI CHẨN REPORT OUTPUT         │
      │                                  │
      │   - Executive summary            │
      │   - Specialist opinions (each)   │
      │   - Consensus areas              │
      │   - Disagreements (flagged)      │
      │   - Recommended actions          │
      │   - Processing logs (visible)    │
      └──────────────────────────────────┘
```

**Hội Chẩn Report Structure:**

```markdown
## AI Hội Chẩn Report

**Case ID:** [UUID]
**Generated:** [Timestamp]
**Specialties Consulted:** Cardiology, Neurology, Pharmacology, General Medicine

### Executive Summary
[Moderator's integrated recommendation]
**Consensus Level:** High/Medium/Low
**Recommended Action:** [Action]

### Specialist Opinions

#### 1. Cardiology (Confidence: High)
**Analysis:**
- Patient has moderate CV risk (Framingham 15%)
- Current BP control adequate with ramipril

**Recommendations:**
- Continue ramipril 5mg daily
- Consider low-dose aspirin
- Monitor lipid panel q6mo

**Evidence:**
- [PMID:123456] - Ramipril in moderate CV risk
- [BYT 2023] - Hypertension guidelines

#### 2. Pharmacology (Confidence: High)
**Analysis:**
- DDI check: Ramipril + Metformin - No significant interaction
- Renal function (eGFR 65) - acceptable for both drugs

**Recommendations:**
- Current regimen safe
- Monitor renal function q3-6mo

**Evidence:**
- [RxNorm CUI:123] - Interaction database

### Areas of Consensus
✓ Current medication regimen appropriate
✓ No urgent changes needed
✓ Regular monitoring plan

### Areas of Disagreement
⚠ Cardiology suggests aspirin, General Med uncertain (borderline indication)

**Moderator Note:** Consider aspirin based on individual CV risk vs bleeding risk

### Processing Log (Visible)
```
[10:23:45] Case parsed, 4 specialists activated
[10:23:48] Cardiology analysis complete
[10:23:50] Neurology analysis complete
[10:23:51] Pharmacology analysis complete
[10:23:52] General Medicine analysis complete
[10:23:55] Moderator synthesis complete
[10:23:57] FIDES verification: 12/12 claims verified
```
```

**Characteristics:**
- Multi-specialty perspectives
- Consensus-driven recommendations
- Transparent deliberation logs
- Disagreement flagging
- Human judgment areas highlighted

---

## 5. Coding Agent Explanation

⚠️ **IMPORTANT CLARIFICATION:**

The "Coding Agent" is **NOT a code-generation agent**. It does NOT write software code.

**The Coding Agent is a tool orchestration agent** that:

1. Receives structured intent from the Intent Router
2. Determines which data sources/tools to call based on intent
3. Generates API call parameters in correct format
4. Orchestrates retrieval pipeline (sequential or parallel)
5. Handles errors and retries

**It "codes" the retrieval strategy, not software.**

### Architecture

```
┌────────────────────────┐
│ Intent Router Output   │
│ {                      │
│   role: "researcher",  │
│   intent: "lit_review",│
│   params: {...}        │
│ }                      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  CODING AGENT          │
│  (Tool Orchestrator)   │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Tool Selection Logic   │
│                        │
│ IF intent == "ddi":    │
│   → RxNorm + DrugBank  │
│                        │
│ IF intent == "lit_rev":│
│   → PubMed + Trials    │
│     + BYT (sequential) │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Parameter Generation   │
│                        │
│ Build API queries:     │
│ - PubMed search string │
│ - RxNorm RxCUI lookup  │
│ - Filter parameters    │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Execution Plan         │
│                        │
│ Sequential:            │
│  Tool1 → Tool2 → Tool3 │
│                        │
│ Parallel:              │
│  [Tool1, Tool2, Tool3] │
│         ↓              │
│   Merge Results        │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Tool Execution         │
│ - Make API calls       │
│ - Handle rate limits   │
│ - Retry on failure     │
│ - Parse responses      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Return to Synthesis    │
└────────────────────────┘
```

### Example: Coding a DDI Check

**Input:**
```json
{
  "role": "normal_user",
  "intent": "ddi_check",
  "params": {
    "drug1": "warfarin",
    "drug2": "aspirin"
  }
}
```

**Coding Agent Process:**

1. **Tool Selection:**
   - Primary: RxNorm Interaction API
   - Secondary: DrugBank (mechanism)
   - Tertiary: BYT (Vietnamese guidance)

2. **Parameter Generation:**
   ```python
   rxcui1 = get_rxcui("warfarin")  # → 11289
   rxcui2 = get_rxcui("aspirin")   # → 1191

   query = {
     "rxcui": [11289, 1191],
     "sources": ["DrugBank", "ONCHigh"]
   }
   ```

3. **Execution Plan:**
   ```
   Step 1: RxNorm API → Get interaction data
   Step 2: DrugBank → Get mechanism (parallel)
   Step 3: BYT → Get VN recommendations (parallel)
   Merge results
   ```

4. **Output:**
   ```json
   {
     "interaction_found": true,
     "severity": "major",
     "mechanism": "Increased bleeding risk",
     "evidence_level": "high",
     "sources": {
       "rxnorm": {...},
       "drugbank": {...},
       "byt": {...}
     }
   }
   ```

---

## 6. Cache Strategy

**Key Principle:** UPDATE not ADD

### Architecture

```
┌──────────────────────┐
│   Cache Layer        │
└──────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌─────────┐
│ Redis  │  │Postgres │
│ (Hot)  │  │ (Warm)  │
│        │  │         │
│ <1ms   │  │ JSONB   │
│ TTL    │  │ Query   │
└────────┘  └─────────┘
```

### What Gets Cached?

✅ **Cached:**
- Synthesized information (not raw API responses)
- Common drug information
- Frequently asked health questions
- DDI results for common drug pairs
- Popular literature searches (researcher workflow)

❌ **NOT Cached:**
- Patient-specific data
- Personalized medical advice
- Real-time emergency protocols
- Doctor council deliberations

### Cache Operations

**UPDATE Strategy (Not ADD):**

```python
# When new information arrives
if cache.exists(query_hash):
    cached_data = cache.get(query_hash)

    # MERGE new findings with existing
    updated_data = merge_findings(
        existing=cached_data,
        new=new_findings,
        strategy="keep_latest_evidence"
    )

    # UPDATE timestamp
    updated_data['last_updated'] = now()
    updated_data['version'] += 1

    cache.set(query_hash, updated_data)
else:
    cache.set(query_hash, new_findings)
```

### Time-based Invalidation

```
Redis (Hot Cache):
- TTL: 24 hours for general queries
- TTL: 6 hours for drug information
- TTL: 1 hour for clinical trials

PostgreSQL (Warm Cache):
- Periodic update: Weekly for stable information
- Immediate invalidation: When source data changes
- Version tracking: Keep last 3 versions
```

---

## 7. Synthesis Node (Separate Stage)

The Synthesis Node is a **separate processing stage** that combines multi-source results.

### Function

```
┌─────────────────────────┐
│  Multi-Source Results   │
│  - PubMed: 47 articles  │
│  - Trials: 12 studies   │
│  - BYT: 2 guidelines    │
│  - RxNorm: Drug data    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   SYNTHESIS NODE        │
│                         │
│  Tasks:                 │
│  1. Aggregate findings  │
│  2. Identify patterns   │
│  3. Resolve conflicts   │
│  4. Grade evidence      │
│  5. Generate summary    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Coherent Response      │
└─────────────────────────┘
```

**NOT just concatenation** - it:
- Identifies contradictions
- Weights evidence by quality
- Generates unified narrative
- Creates hierarchical summary

---

## 8. Verification Node (Separate Stage, FIDES-inspired)

The Verification Node performs **cross-reference checking** and **confidence scoring**.

### FIDES-Inspired Architecture

```
┌─────────────────────────┐
│  Synthesized Response   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  VERIFICATION NODE      │
│  (FIDES-inspired)       │
└─────────────────────────┘
            │
   ┌────────┼────────┐
   │        │        │
   ▼        ▼        ▼
┌──────┐ ┌─────┐ ┌──────┐
│Claim │ │Evid.│ │Conf. │
│Extra │ │Match│ │Score │
└──┬───┘ └──┬──┘ └───┬──┘
   │        │        │
   └────────┼────────┘
            ▼
┌─────────────────────────┐
│  Verified Response      │
│  + Confidence Scores    │
│  + Citations            │
└─────────────────────────┘
```

### Process

1. **Claim Extraction:**
   - Parse synthesized response
   - Identify factual claims
   - Extract medical statements

2. **Evidence Matching:**
   - Match each claim to source evidence
   - Check citation validity (PMID, NCT exists?)
   - Verify claim-evidence alignment

3. **Confidence Scoring:**
   ```
   HIGH (✓✓✓): Multiple high-quality sources agree
   MEDIUM (✓✓): Some sources, or lower quality
   LOW (✓): Single source or weak evidence
   UNVERIFIED (⚠): No supporting evidence found
   ```

4. **Citation Validation:**
   - Verify PMID exists in PubMed
   - Check NCT number in ClinicalTrials.gov
   - Validate RxCUI in RxNorm
   - Check DOI resolution

### Output Example

```markdown
**Claim:** Metformin reduces HbA1c by 1.5-2% in T2DM patients
**Confidence:** HIGH ✓✓✓
**Evidence:**
- [PMID:12345678] - RCT (n=1,200): 1.8% reduction
- [PMID:87654321] - Meta-analysis: 1.5% average
- [BYT 2023] - Vietnamese guidelines confirm

**Claim:** Metformin causes vitamin B12 deficiency
**Confidence:** MEDIUM ✓✓
**Evidence:**
- [PMID:11223344] - Long-term use (>2 years) shows correlation
**Note:** Causation not definitively established
```

---

## Summary: Key Workflow Distinctions

| User Type   | Time    | Approach           | Verification |
|-------------|---------|--------------------| -------------|
| Normal User | <2 min  | Single-source      | Basic check  |
| Researcher  | 5-20 min| Progressive multi-source | Full FIDES |
| Doctor      | 10-20 min| Sub-agents or Council | Full FIDES |

**Common Elements Across All:**
- Two-layer intent routing
- Cache UPDATE strategy (not ADD)
- Separate synthesis node
- Separate verification node (depth varies)
- Emergency fast-path bypass

---

**End of Document**

