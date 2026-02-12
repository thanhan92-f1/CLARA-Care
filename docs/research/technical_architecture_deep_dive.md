# CLARA Technical Architecture Deep Dive

> **Document Type:** Technical Architecture Specification
> **Version:** 1.0
> **Date:** January 2025
> **Classification:** Internal — Engineering & Architecture
> **Audience:** Engineering Team, Technical Leadership, AI/ML Engineers

---

## Table of Contents

1. [Two-Layer Intent Router Architecture](#1-two-layer-intent-router-architecture)
2. [Agentic RAG Pipeline Design](#2-agentic-rag-pipeline-design)
3. [Fact Checker Module (FIDES-Inspired)](#3-fact-checker-module-fides-inspired)
4. [Multi-Tier Workflow Design](#4-multi-tier-workflow-design)
5. [Medical SLMs Analysis](#5-medical-slms-analysis)
6. [Blockchain Considerations](#6-blockchain-considerations)
7. [System Integration Architecture](#7-system-integration-architecture)

---

## 1. Two-Layer Intent Router Architecture

### 1.1 Architecture Overview

CLARA employs a **two-layer cascading intent router** that first classifies the user's role, then routes to role-specific intent classification. This design ensures that the same query ("What is metformin?") produces fundamentally different responses depending on whether a normal user, researcher, or doctor is asking.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Query Input                         │
│   "Bệnh nhân 65 tuổi, đái tháo đường type 2, eGFR 35..."     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                  LAYER 1: ROLE CLASSIFIER                        │
│                  (SLM: Qwen2.5-0.5B / Phi-3-mini)               │
│                                                                  │
│  Input Features:                                                 │
│  ├── Query text (linguistic complexity, medical jargon density)  │
│  ├── User profile metadata (if authenticated)                    │
│  ├── Session context (previous queries in conversation)          │
│  └── Registration role (self-declared, verified for doctors)     │
│                                                                  │
│  Output: { role: "NORMAL" | "RESEARCHER" | "DOCTOR",            │
│            confidence: 0.0-1.0,                                  │
│            reasoning: "..." }                                    │
└───────┬──────────────────┬───────────────────┬──────────────────┘
        │                  │                   │
   NORMAL USER        RESEARCHER            DOCTOR
        │                  │                   │
        ▼                  ▼                   ▼
┌──────────────┐  ┌──────────────┐   ┌──────────────────┐
│  LAYER 2A:   │  │  LAYER 2B:   │   │   LAYER 2C:      │
│  Normal User │  │  Researcher  │   │   Doctor Intent   │
│  Intent      │  │  Intent      │   │   Classifier      │
│  Classifier  │  │  Classifier  │   │                   │
└──────┬───────┘  └──────┬───────┘   └────────┬──────────┘
       │                 │                     │
       ▼                 ▼                     ▼
   [Workflow A]     [Workflow B]          [Workflow C]
   Simple           Research Deep         Clinical Decision
   (< 2 min)        (5-20 min)           Support (< 10-20 min)
```

### 1.2 Layer 1: Role Classification

#### 1.2.1 Classification Signals

| Signal | Weight | Description |
|--------|--------|-------------|
| **Lexical Complexity** | High | Medical terminology density (ICD codes, drug names, clinical abbreviations like "eGFR", "HbA1c", "NYHA class") |
| **Query Structure** | High | Clinical case presentation format vs. simple question vs. literature search syntax |
| **User Profile** | Highest | Verified credentials (medical license, institutional email, research affiliation) |
| **Session History** | Medium | Pattern of queries within a session (escalating complexity suggests professional) |
| **Language Register** | Medium | Formal medical Vietnamese ("bệnh nhân", "chỉ định") vs. colloquial ("bị bệnh gì") |

#### 1.2.2 SLM Implementation for Layer 1

**Recommended Model:** Fine-tuned **Qwen2.5-0.5B** or **Phi-3-mini (3.8B)**

**Why SLMs (not LLMs) for routing:**
- **Latency:** Router must complete in < 50ms. SLMs achieve this on a single GPU; LLMs cannot.
- **Cost:** Router processes every query. At 100K queries/day, LLM routing costs would be prohibitive.
- **Determinism:** Smaller models fine-tuned on classification tasks produce more consistent outputs than prompted LLMs.
- **Privacy:** Runs fully on-device/on-premise — no query data leaves the system for routing.

**Training Strategy:**
```python
# Training data structure for Role Classifier
training_examples = [
    {
        "query": "Metformin có tác dụng phụ gì?",
        "context": {"user_verified": False, "session_queries": 1},
        "label": "NORMAL",
        "confidence": 0.92
    },
    {
        "query": "Meta-analysis of SGLT2 inhibitor cardiovascular outcomes in T2DM with CKD stage 3b",
        "context": {"user_verified": False, "session_queries": 5},
        "label": "RESEARCHER",
        "confidence": 0.95
    },
    {
        "query": "BN nữ 72t, ĐTĐ type 2, THA, eGFR 28, HbA1c 8.2%. Đang dùng Metformin 1000mg x2. Cần chỉnh liều không? Phác đồ thay thế?",
        "context": {"user_verified": True, "license": "BS-12345"},
        "label": "DOCTOR",
        "confidence": 0.98
    }
]
```

**Fine-tuning Approach:**
1. **Base model:** Qwen2.5-0.5B (multilingual, strong Vietnamese support)
2. **Fine-tuning method:** QLoRA (4-bit quantization + LoRA adapters) — ~500MB model size
3. **Training data:** 50,000+ labeled examples (Vietnamese + English medical queries)
4. **Data sources:**
   - Synthetic data from GPT-4o/Claude with Vietnamese medical domain experts reviewing
   - Real query logs from Vietnamese medical forums (HoiYTe, Webtretho health section)
   - Translated + adapted MedQA, HealthSearchQA datasets
5. **Evaluation metrics:** F1 > 0.95 across all three classes; latency < 30ms on T4 GPU

#### 1.2.3 Fallback & Confidence Thresholds

```
IF confidence < 0.7:
    → Default to NORMAL USER workflow (safest)
    → Log for human review & model improvement
    → Show: "Tôi đang trả lời ở mức thông tin chung. Bạn có phải chuyên gia y tế không?"

IF confidence between 0.7 and 0.85:
    → Use predicted role but add safety disclaimers
    → Flag for quality monitoring

IF confidence > 0.85:
    → Route with full confidence
    → No additional confirmation needed
```

### 1.3 Layer 2: Intent Classification Per Role

#### 1.3.1 Normal User Intents (Layer 2A)

| Intent ID | Intent Name | Example Query (Vietnamese) | Workflow |
|-----------|-------------|---------------------------|----------|
| `NU_INFO` | General Health Info | "Bệnh tiểu đường là gì?" | Simple RAG |
| `NU_SYMPTOM` | Symptom Inquiry | "Tôi bị đau đầu và buồn nôn, có sao không?" | Triage + Info |
| `NU_DRUG` | Drug Information | "Thuốc Panadol uống bao nhiêu viên?" | Drug DB Lookup |
| `NU_PREVENT` | Prevention/Lifestyle | "Làm sao để phòng ngừa cao huyết áp?" | Simple RAG |
| `NU_EMERGENCY` | Emergency Recognition | "Con tôi bị co giật phải làm sao?" | **Emergency Protocol** |
| `NU_NAVIGATE` | Healthcare Navigation | "Bệnh viện nào khám tim mạch tốt ở Hà Nội?" | Local DB + Info |
| `NU_CLARIFY` | Clarification/Follow-up | "Giải thích rõ hơn về xét nghiệm HbA1c" | Context RAG |

#### 1.3.2 Researcher Intents (Layer 2B)

| Intent ID | Intent Name | Example Query | Workflow |
|-----------|-------------|---------------|----------|
| `RE_LIT_SEARCH` | Literature Search | "Systematic reviews on PCSK9 inhibitors published 2023-2025" | Deep PubMed RAG |
| `RE_EVIDENCE` | Evidence Synthesis | "What is the current evidence for GLP-1 agonists in NASH?" | Multi-source RAG + Synthesis |
| `RE_COMPARE` | Comparative Analysis | "So sánh hiệu quả empagliflozin vs dapagliflozin trong suy tim" | Comparative RAG |
| `RE_GUIDELINE` | Guideline Analysis | "Latest ESC 2024 heart failure guidelines changes vs 2021" | Guideline DB + Diff |
| `RE_STAT` | Statistical Inquiry | "NNT for statin therapy in primary prevention CKD patients" | Deep Literature RAG |
| `RE_MECHANISM` | Mechanism of Action | "Molecular pathway of SGLT2 inhibitor cardioprotection" | Knowledge Graph + RAG |
| `RE_TRIAL` | Clinical Trial Search | "Ongoing phase 3 trials for anti-amyloid Alzheimer's therapy" | ClinicalTrials.gov API |
| `RE_METHODOLOGY` | Research Methodology | "GRADE framework for evaluating observational studies" | Methodology KB |

#### 1.3.3 Doctor Intents (Layer 2C)

| Intent ID | Intent Name | Example Query | Workflow |
|-----------|-------------|---------------|----------|
| `DR_DDX` | Differential Diagnosis | "BN nam 45t, đau ngực, troponin tăng, ECG ST chênh. DDx?" | **AI Council** |
| `DR_TX_PLAN` | Treatment Planning | "Phác đồ điều trị viêm phổi cộng đồng mức độ nặng theo BYT" | Guideline RAG + Drug Check |
| `DR_DRUG_INTERACT` | Drug Interaction Check | "Tương tác giữa warfarin + amiodarone + clarithromycin?" | RxNorm + Drug DB |
| `DR_DOSE_ADJUST` | Dose Adjustment | "Chỉnh liều vancomycin cho BN eGFR 22, cân nặng 55kg" | Pharmacokinetic Calculator |
| `DR_CONSULT` | Specialist Consultation | "Cần ý kiến chuyên khoa thận về BN lupus nephritis class IV" | **AI Council (Multi-spec)** |
| `DR_PROTOCOL` | Protocol Lookup | "Phác đồ hóa trị FOLFOX cho ung thư đại tràng giai đoạn III" | BYT Protocol DB |
| `DR_CASE_REVIEW` | Case Review | "Review case: BN nhi 3 tuổi, sốt cao, ban đỏ, Kawasaki?" | Full AI Council |
| `DR_SECOND_OPINION` | Second Opinion | "Hội chẩn AI: BN ung thư phổi, EGFR+, brain mets, PS 1" | **Full AI Council** |

#### 1.3.4 SLM Implementation for Layer 2

**Recommended Model:** Fine-tuned **Phi-3-mini (3.8B)** — one adapter per role

```
Layer 2 Architecture:
┌──────────────────────────────────────────────────┐
│              Phi-3-mini Base Model                │
│              (Frozen weights)                     │
├──────────┬──────────────┬────────────────────────┤
│  LoRA    │    LoRA      │      LoRA              │
│ Adapter  │   Adapter    │     Adapter            │
│   2A     │     2B       │       2C               │
│ (Normal) │ (Researcher) │    (Doctor)            │
└──────────┴──────────────┴────────────────────────┘
```

**Benefits of this approach:**
- Single base model in GPU memory (~2GB for 4-bit Phi-3-mini)
- LoRA adapters are ~20-50MB each — hot-swappable based on Layer 1 output
- Total Layer 2 latency: < 40ms (adapter swap ~5ms + inference ~35ms)
- **Total routing latency (Layer 1 + Layer 2): < 100ms**

### 1.4 Emergency Intent Fast-Path

Certain intents bypass the normal workflow and trigger immediate responses:

```
EMERGENCY KEYWORDS (Vietnamese + English):
  - "co giật" / "seizure" / "convulsion"
  - "ngừng thở" / "không thở được" / "stop breathing"
  - "đau ngực dữ dội" / "severe chest pain"
  - "xuất huyết" / "bleeding heavily"
  - "ngộ độc" / "poisoning" / "overdose"
  - "tự tử" / "suicide" / "muốn chết"

→ IMMEDIATE RESPONSE (< 1 second):
  1. Display emergency number: 115 (Vietnam emergency)
  2. Provide first-aid guidance from pre-cached protocols
  3. Recommend nearest hospital (if location available)
  4. Log as critical event for quality review
  5. DO NOT engage in diagnostic reasoning
```

---

## 2. Agentic RAG Pipeline Design

### 2.1 Pipeline Architecture Overview

CLARA implements a **modular agentic RAG** architecture where autonomous sub-agents manage different stages of the retrieval-synthesis pipeline. Unlike simple RAG (retrieve → generate), CLARA's pipeline supports iterative reasoning, multi-source triangulation, and self-correction.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLARA AGENTIC RAG PIPELINE                       │
│                                                                          │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐            │
│  │  QUERY  │───▶│ DECOMP-  │───▶│ RETRIEV- │───▶│ SYNTHE- │            │
│  │ UNDER-  │    │ OSITION  │    │ AL       │    │ SIS     │            │
│  │ STANDING│    │ AGENT    │    │ AGENTS   │    │ AGENT   │            │
│  └─────────┘    └──────────┘    └──────────┘    └────┬────┘            │
│       │              │              │                 │                 │
│       │              │              │                 ▼                 │
│       │              │              │          ┌─────────────┐          │
│       │              │              │          │ FACT CHECK  │          │
│       │              │              │          │ (FIDES)     │          │
│       │              │              │          └──────┬──────┘          │
│       │              │              │                 │                 │
│       │              │         ┌────▼────┐     ┌──────▼──────┐         │
│       │              │         │  CACHE  │     │  RESPONSE   │         │
│       │              │         │ MANAGER │     │  FORMATTER  │         │
│       │              │         └─────────┘     └─────────────┘         │
│       │              │                                                  │
│       └──────────────┴────── FEEDBACK LOOP (if verification fails) ──┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Query Understanding & Decomposition

#### 2.2.1 Query Understanding Agent

**Purpose:** Transform raw user input into a structured, enrichable query representation.

```python
class QueryUnderstanding:
    """
    Transforms raw query into structured medical query object.
    """

    def process(self, raw_query: str, user_role: str) -> MedicalQuery:
        return MedicalQuery(
            original_text=raw_query,
            language=self.detect_language(raw_query),      # "vi", "en", "mixed"
            medical_entities=self.extract_entities(raw_query),  # NER
            query_type=self.classify_type(raw_query),       # from Layer 2
            temporal_context=self.extract_temporal(raw_query),  # "latest", "2024", etc.
            complexity_score=self.assess_complexity(raw_query),  # 1-10
            icd_codes=self.map_to_icd11(raw_query),        # auto-map conditions
            rxnorm_codes=self.map_to_rxnorm(raw_query),    # auto-map drugs
        )
```

**Medical NER Pipeline:**
- **Model:** Fine-tuned BioBERT or PhoNER (Vietnamese biomedical NER)
- **Entity types:** Diseases, Symptoms, Drugs, Procedures, Lab Values, Anatomical Sites
- **Vietnamese medical abbreviations:** Custom dictionary (e.g., "BN" = bệnh nhân, "ĐTĐ" = đái tháo đường, "THA" = tăng huyết áp)

#### 2.2.2 Query Decomposition Agent

For complex queries, the decomposition agent breaks them into atomic sub-queries:

```
INPUT: "BN nữ 72t, ĐTĐ type 2, THA, suy thận mãn giai đoạn 3b.
        Đang dùng Metformin 1000mg x2, Losartan 50mg.
        HbA1c 8.2%, eGFR 28. Cần chỉnh phác đồ không?"

DECOMPOSITION:
├── Sub-query 1: "Metformin safety and dosing with eGFR 28 (CKD stage 3b)"
│   → Source priority: RxNorm, BYT guidelines, KDIGO guidelines
│
├── Sub-query 2: "HbA1c target for elderly T2DM patient with CKD"
│   → Source priority: ADA 2024, BYT ĐTĐ protocol, KDIGO
│
├── Sub-query 3: "Alternative glucose-lowering agents safe in CKD stage 3b"
│   → Source priority: Dược thư quốc gia, KDIGO, ADA
│
├── Sub-query 4: "Losartan dose optimization in CKD with proteinuria"
│   → Source priority: KDIGO, BYT THA protocol
│
└── Sub-query 5: "Drug interactions: Metformin + Losartan + potential new agents"
    → Source priority: RxNorm, openFDA, Dược thư quốc gia
```

### 2.3 Multi-Source Retrieval Strategy

#### 2.3.1 Source Registry

```
┌────────────────────────────────────────────────────────────────────────┐
│                    CLARA SOURCE REGISTRY                               │
├────────────────┬───────────┬────────────┬──────────────────────────────┤
│ Source         │ Type      │ Access     │ Update Frequency             │
├────────────────┼───────────┼────────────┼──────────────────────────────┤
│ PubMed/PMC     │ Literature│ E-Utils API│ Real-time (API)              │
│ ClinicalTrials │ Trials    │ REST API   │ Real-time (API)              │
│ WHO ICD-11     │ Coding    │ REST API   │ Annual (cached locally)      │
│ RxNorm         │ Drug data │ REST API   │ Monthly (cached + API)       │
│ openFDA        │ Drug/ADR  │ REST API   │ Real-time (API)              │
│ Dược thư QG    │ VN Drugs  │ Crawled DB │ Annual (manual + automated)  │
│ BYT Protocols  │ VN Guide  │ Crawled DB │ Monthly (automated crawler)  │
│ BYT Monthly    │ VN Updates│ Crawled    │ Monthly (automated crawler)  │
│ UMLS/SNOMED    │ Ontology  │ Local DB   │ Biannual (bulk download)     │
│ Local KG       │ Relations │ Graph DB   │ Continuous (AI-enriched)     │
└────────────────┴───────────┴────────────┴──────────────────────────────┘
```



#### 2.3.2 International Medical APIs — Integration Details

**PubMed / PMC (NCBI E-Utilities)**
```
Endpoint: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
APIs Used:
  - esearch.fcgi → Search PubMed for relevant PMIDs
  - efetch.fcgi  → Retrieve full abstracts/metadata by PMID
  - elink.fcgi   → Find related articles, cited-by chains

Rate Limit: 10 requests/second (with API key)
Strategy:
  1. Build MeSH-enriched query from decomposed sub-queries
  2. Search with date filters (prioritize last 5 years)
  3. Retrieve top 20 abstracts per sub-query
  4. Cross-reference with locally cached PubMed index (updated weekly)

Example Query Construction:
  User asks: "SGLT2 inhibitors in heart failure with preserved EF"
  → MeSH query: "Sodium-Glucose Transporter 2 Inhibitors"[MeSH] AND
                 "Heart Failure"[MeSH] AND "preserved ejection fraction"
  → Filters: Humans, English OR Vietnamese, last 5 years, Clinical Trial OR Meta-Analysis
```

**ClinicalTrials.gov (v2 API)**
```
Endpoint: https://clinicaltrials.gov/api/v2/
Use Cases:
  - Find ongoing trials for specific conditions/interventions
  - Verify NCT numbers cited in responses
  - Track trial status changes (recruiting, completed, withdrawn)

Strategy:
  1. Query by condition + intervention from decomposed query
  2. Filter by status (RECRUITING, ACTIVE_NOT_RECRUITING, COMPLETED)
  3. Return NCT ID, title, phase, enrollment, primary outcome
  4. Cache completed trial results for RAG corpus enrichment
```

**WHO ICD-11 API**
```
Endpoint: https://id.who.int/icd/
Authentication: OAuth2 (Client Credentials)
Use Cases:
  - Map patient conditions to standardized ICD-11 codes
  - Navigate disease hierarchies for differential diagnosis
  - Cross-language disease name resolution (English ↔ Vietnamese)

Integration Pattern:
  1. Extract disease entities from query (NER)
  2. Search ICD-11 for matching codes
  3. Use hierarchical structure to expand/narrow search scope
  4. Store ICD-11 mappings in local cache for offline use
```

**RxNorm (NLM API)**
```
Endpoint: https://rxnav.nlm.nih.gov/REST/
Use Cases:
  - Normalize drug names (brand → generic → RxCUI)
  - Check drug-drug interactions (RxNorm Interaction API)
  - Map Vietnamese drug names to international standards
  - Verify RxCUI codes in citations

Key Endpoints:
  - /rxcui?name={drugName}          → Get RxCUI for a drug name
  - /interaction/list?rxcuis={ids}  → Check interactions between drugs
  - /drugs?conceptId={rxcui}        → Get drug details
  - /rxclass/class/byDrugName       → Get drug classes
```

**openFDA**
```
Endpoint: https://api.fda.gov/
Use Cases:
  - Adverse event reports (FAERS database)
  - Drug labeling information
  - Drug recalls and safety alerts
  - Post-market surveillance data

Key Endpoints:
  - /drug/event.json     → Adverse events
  - /drug/label.json     → Drug labeling
  - /drug/recall.json    → Drug recalls

Rate Limit: 240 requests/minute (with API key)
```

#### 2.3.3 Vietnamese-Specific Sources

**Dược thư Quốc gia Việt Nam (National Drug Formulary)**
```
Source: Vietnamese Ministry of Health (BYT)
Format: PDF-based publication (updated every 2-3 years)
Current Edition: Dược thư Quốc gia Việt Nam, Xuất bản lần 3 (3rd edition)

Ingestion Strategy:
  1. OCR + structured extraction from official PDF
  2. Parse drug monographs into structured schema:
     - Tên thuốc (Drug name, Vietnamese + International)
     - Nhóm dược lý (Pharmacological group)
     - Chỉ định (Indications)
     - Chống chỉ định (Contraindications)
     - Liều dùng (Dosage) — adult, pediatric, renal adjustment
     - Tác dụng không mong muốn (Adverse effects)
     - Tương tác thuốc (Drug interactions)
     - Thận trọng (Precautions)
  3. Store in structured drug database with Vietnamese + English fields
  4. Map each drug to RxNorm RxCUI where possible
  5. Flag drugs unique to Vietnamese market (no RxNorm mapping)

Update Frequency: Manual ingestion per new edition + monthly BYT circulars
```

**BYT Monthly Publications & Circulars Crawler**
```
Sources to Crawl:
  - https://moh.gov.vn (Ministry of Health official site)
  - https://kcb.vn (Cục Quản lý Khám chữa bệnh — Dept of Medical Examination)
  - https://dav.gov.vn (Cục Quản lý Dược — Drug Administration of Vietnam)
  - Vietnamese medical journals (Tạp chí Y học Việt Nam, Y học TP.HCM)

Crawler Architecture:
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │  Scrapy /    │───▶│  Document    │───▶│  Structured  │
  │  Playwright  │    │  Processor   │    │  Storage     │
  │  Crawler     │    │  (PDF/HTML   │    │  (PostgreSQL │
  │              │    │   → Text)    │    │   + Vector)  │
  └──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        │               ┌───▼────┐          ┌────▼─────┐
        │               │ Vietnamese│        │ Embedding│
        │               │ Medical  │        │ Index    │
        │               │ NER      │        │ (FAISS)  │
        │               └────────┘         └──────────┘
        │
  Schedule: Weekly crawl, daily for urgent circulars

Content Types to Extract:
  - Thông tư (Circulars) — treatment protocols, drug approvals
  - Quyết định (Decisions) — policy changes, new guidelines
  - Công văn (Official letters) — urgent safety alerts
  - Hướng dẫn chẩn đoán và điều trị (Diagnosis & treatment guidelines)
```

### 2.4 RAG Processing Details

#### 2.4.1 Chunking Strategy

```
Medical Document Chunking — Hierarchical Approach:

Level 1 — Document Level:
  ├── Metadata: title, authors, journal, date, PMID, DOI
  ├── Summary: abstract or executive summary
  └── Type: research article, guideline, drug monograph, case report

Level 2 — Section Level (medical-aware splitting):
  ├── For Research Articles: Background, Methods, Results, Discussion, Conclusion
  ├── For Guidelines: Recommendation sections, Evidence grading, Algorithm steps
  ├── For Drug Monographs: Indication, Dosage, Interactions, ADR, Contraindications
  └── For Case Reports: Presentation, Workup, Diagnosis, Management, Outcome

Level 3 — Semantic Chunks:
  ├── Chunk size: 512-1024 tokens (adaptive based on content type)
  ├── Overlap: 128 tokens (cross-chunk context preservation)
  ├── Split boundaries: Sentence-level (never mid-sentence)
  └── Special handling: Tables → structured JSON; Figures → caption + description

Chunk Metadata Enrichment:
  Each chunk carries:
  {
    "chunk_id": "uuid",
    "source_doc_id": "PMID:12345678",
    "section": "Results",
    "entities": ["metformin", "HbA1c", "CKD stage 3"],
    "icd_codes": ["E11.65", "N18.3"],
    "evidence_grade": "Level 1A",
    "publication_date": "2024-03-15",
    "language": "en",
    "chunk_index": 5,
    "total_chunks": 12
  }
```

#### 2.4.2 Embedding Strategy

```
Dual-Embedding Architecture:

┌─────────────────────────────────────────────────┐
│              EMBEDDING PIPELINE                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Dense Embeddings (Semantic Search):             │
│  ├── Model: BGE-M3 (multilingual, 1024-dim)     │
│  │   └── Why: Best multilingual model;           │
│  │       supports Vietnamese natively            │
│  │       Handles medical terminology well        │
│  ├── Alternative: Med-BERT / PubMedBERT          │
│  │   └── For English-only medical content        │
│  └── Index: FAISS (IVF-PQ) or Milvus            │
│                                                  │
│  Sparse Embeddings (Keyword/Exact Match):        │
│  ├── Method: BM25 (Elasticsearch / OpenSearch)   │
│  ├── Analyzer: Custom Vietnamese medical analyzer│
│  │   └── Custom tokenizer for VN medical terms   │
│  │   └── Synonym expansion (thuốc ≈ dược phẩm)  │
│  └── Boost: Medical entity matches get 2x weight │
│                                                  │
│  Hybrid Score = α × Dense + (1-α) × Sparse      │
│  └── α = 0.6 (tuned on medical QA benchmark)    │
└─────────────────────────────────────────────────┘
```

#### 2.4.3 Reranking Pipeline

```
Retrieval → Reranking → Context Assembly

Stage 1: Initial Retrieval (Broad)
  └── Retrieve top-100 chunks per sub-query via hybrid search

Stage 2: Cross-Encoder Reranking (Precision)
  ├── Model: ms-marco-MiniLM-L-12-v2 or BGE-Reranker-v2-m3
  ├── Score each (query, chunk) pair with cross-encoder
  ├── Medical domain boost factors:
  │   ├── +0.3 for chunks from clinical guidelines
  │   ├── +0.2 for chunks from systematic reviews / meta-analyses
  │   ├── +0.1 for Vietnamese-language sources (when query is Vietnamese)
  │   ├── +0.15 for recency (< 2 years old)
  │   └── -0.2 for retracted papers / outdated guidelines
  └── Select top-20 chunks per sub-query after reranking

Stage 3: Diversity Filter
  ├── Ensure representation from multiple source types
  │   (at least 1 guideline, 1 research article, 1 drug reference)
  ├── De-duplicate near-identical chunks (cosine similarity > 0.95)
  └── Ensure no single source dominates (max 40% from one source)

Stage 4: Relevance Threshold
  └── Drop chunks with reranker score < 0.3 (likely irrelevant)
```

#### 2.4.4 Context Window Management

```
Context Budget Allocation (for 128K context window models):

┌──────────────────────────────────────────────────────┐
│                 CONTEXT WINDOW BUDGET                  │
│                 (Total: ~100K tokens usable)           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  System Prompt & Instructions:    ~2,000 tokens       │
│  User Query + Conversation:       ~3,000 tokens       │
│  Retrieved Evidence Chunks:      ~70,000 tokens       │
│  ├── Guideline excerpts:         ~20,000 tokens       │
│  ├── Research evidence:          ~30,000 tokens       │
│  ├── Drug information:           ~10,000 tokens       │
│  └── Vietnamese BYT protocols:   ~10,000 tokens       │
│  Fact-Check Instructions:         ~5,000 tokens       │
│  Output Generation Budget:       ~20,000 tokens       │
│                                                       │
│  OVERFLOW STRATEGY:                                   │
│  If retrieved content > 70K tokens:                   │
│  1. Hierarchical summarization of lower-priority      │
│     chunks (summarize → include summary, not full)    │
│  2. Citation-only mode for least relevant chunks      │
│     (include PMID + 1-line summary, not full text)    │
│  3. Carry overflow to "Further Reading" section       │
└──────────────────────────────────────────────────────┘
```

### 2.5 Synthesis & Verification as Separate Nodes

```
┌──────────────────────────────────────────────────────────────────┐
│              SYNTHESIS → VERIFICATION PIPELINE                    │
│                                                                   │
│  NODE 1: SYNTHESIS AGENT                                         │
│  ├── Model: Primary LLM (Qwen2.5-72B or Claude API)             │
│  ├── Input: Reranked chunks + query + role context               │
│  ├── Task: Generate comprehensive, cited response                │
│  ├── Output Format:                                              │
│  │   {                                                           │
│  │     "response_text": "...",                                   │
│  │     "claims": [                                               │
│  │       {"claim": "Metformin should be stopped at eGFR <30",   │
│  │        "sources": ["PMID:34567890", "KDIGO 2024"],           │
│  │        "confidence": 0.95},                                   │
│  │       ...                                                     │
│  │     ],                                                        │
│  │     "uncertainty_flags": ["Insufficient VN-specific data"],   │
│  │     "evidence_quality": "Level 1A"                            │
│  │   }                                                           │
│  └── IMPORTANT: Synthesis does NOT self-verify                   │
│                                                                   │
│  NODE 2: VERIFICATION AGENT (separate model instance)            │
│  ├── Model: Independent LLM OR specialized fact-checker          │
│  ├── Input: Synthesis output + original retrieved chunks         │
│  ├── Tasks:                                                      │
│  │   1. Verify each claim against cited sources                  │
│  │   2. Check for unsupported claims (hallucination detection)   │
│  │   3. Validate citation accuracy (PMID exists, says what       │
│  │      is claimed)                                              │
│  │   4. Check for contradictions between claims                  │
│  │   5. Verify drug dosages against Dược thư / RxNorm           │
│  ├── Output: Verification report with pass/fail per claim        │
│  └── If ANY critical claim fails → REJECT, re-synthesize        │
│                                                                   │
│  NODE 3: RESPONSE FORMATTER                                      │
│  ├── Format based on user role (simple/detailed/clinical)        │
│  ├── Add confidence indicators per section                       │
│  ├── Attach citation list with clickable links                   │
│  └── Add Vietnamese-specific disclaimers                         │
└──────────────────────────────────────────────────────────────────┘
```

### 2.6 Cache Strategy: Intelligent Knowledge Store

**Design Principle:** Cache stores *relevant knowledge*, not just query-response pairs. When new information arrives, the cache **updates existing entries** rather than accumulating duplicates.

```
┌──────────────────────────────────────────────────────────────────┐
│                    INTELLIGENT CACHE ARCHITECTURE                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LAYER 1: Query-Response Cache (Hot, TTL: 24h)                   │
│  ├── Key: normalized_query_hash + role                           │
│  ├── Value: complete response + metadata                         │
│  ├── Invalidation: On source update or TTL expiry                │
│  └── Storage: Redis / Memcached                                  │
│                                                                   │
│  LAYER 2: Knowledge Entity Cache (Warm, TTL: 7 days)             │
│  ├── Key: medical_entity + context_type                          │
│  │   Example: "metformin:CKD_dosing"                            │
│  ├── Value: synthesized knowledge snippet + sources              │
│  ├── UPDATE LOGIC (not append):                                  │
│  │   IF new evidence found for same entity+context:              │
│  │     1. Compare new vs cached evidence quality                 │
│  │     2. If new evidence is higher quality/more recent:         │
│  │        → REPLACE cached knowledge                             │
│  │     3. If new evidence contradicts cached:                    │
│  │        → FLAG for review, store both temporarily              │
│  │     4. If new evidence supplements (doesn't contradict):      │
│  │        → MERGE into existing entry                            │
│  │   NEVER blindly append — medical knowledge must stay current  │
│  └── Storage: PostgreSQL with JSONB                              │
│                                                                   │
│  LAYER 3: Embedding Cache (Cold, TTL: 30 days)                   │
│  ├── Pre-computed embeddings for frequently accessed documents   │
│  ├── Avoids re-embedding on every query                          │
│  └── Storage: FAISS index with periodic rebuild                  │
│                                                                   │
│  LAYER 4: Source Freshness Tracker                                │
│  ├── Monitors source update timestamps                           │
│  ├── Triggers cache invalidation when sources update             │
│  ├── BYT circular checker: daily                                 │
│  ├── PubMed new articles: weekly                                 │
│  └── Drug database updates: monthly                              │
│                                                                   │
│  CACHE WARMING STRATEGY:                                          │
│  ├── Pre-cache top 500 medical conditions in Vietnamese          │
│  ├── Pre-cache all drugs in Dược thư Quốc gia                   │
│  ├── Pre-cache BYT treatment protocols (all specialties)         │
│  └── Nightly job to refresh stale entries                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Fact Checker Module (FIDES-Inspired)

### 3.1 FIDES Framework Overview

**FIDES** (Faithful Fact Decomposition and Evidence-based Scoring) is a paradigm for LLM fact-checking that decomposes complex claims into atomic, independently verifiable facts, retrieves evidence for each, and scores factual accuracy. CLARA adapts this paradigm specifically for the medical domain, where factual errors can have life-threatening consequences.

**Core FIDES Principles adapted for CLARA:**
1. **Claim Decomposition** — Break complex medical statements into atomic claims
2. **Evidence Retrieval** — Retrieve supporting/contradicting evidence for each atomic claim
3. **Cross-Reference Verification** — Triangulate claims across multiple authoritative sources
4. **Confidence Scoring** — Assign numerical confidence to each claim based on evidence strength
5. **Iterative Correction** — Re-generate content when verification fails

### 3.2 CLARA Fact Checker Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CLARA FACT CHECKER (FIDES-Medical)                     │
│                                                                          │
│  INPUT: Synthesis Agent output (response + claims + citations)           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: CLAIM DECOMPOSITION                                    │    │
│  │                                                                  │    │
│  │  Complex Claim:                                                  │    │
│  │    "Metformin should be discontinued when eGFR falls below      │    │
│  │     30 mL/min and replaced with a DPP-4 inhibitor which is      │    │
│  │     safe in advanced CKD"                                       │    │
│  │                                                                  │    │
│  │  Atomic Claims:                                                  │    │
│  │    AC1: "Metformin should be discontinued at eGFR < 30"         │    │
│  │    AC2: "eGFR 30 is the threshold (not 25 or 15)"              │    │
│  │    AC3: "DPP-4 inhibitors are safe in advanced CKD"            │    │
│  │    AC4: "DPP-4 inhibitors can replace metformin in this context"│    │
│  │                                                                  │    │
│  │  Model: SLM fine-tuned for medical claim decomposition          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: PER-CLAIM EVIDENCE RETRIEVAL                          │    │
│  │                                                                  │    │
│  │  For each atomic claim:                                          │    │
│  │  ├── Search cited source(s) — does the citation support this?  │    │
│  │  ├── Search additional sources for corroboration                │    │
│  │  ├── Search for contradicting evidence                          │    │
│  │  └── Check against structured databases (RxNorm, Dược thư)     │    │
│  │                                                                  │    │
│  │  Evidence Categories:                                            │    │
│  │  ├── SUPPORTED: ≥2 sources agree, no contradictions            │    │
│  │  ├── PARTIALLY_SUPPORTED: 1 source agrees, no contradictions    │    │
│  │  ├── CONTESTED: Sources disagree (requires flagging)            │    │
│  │  ├── UNSUPPORTED: No evidence found (likely hallucination)      │    │
│  │  └── CONTRADICTED: Evidence directly opposes claim              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: CROSS-REFERENCE VERIFICATION                          │    │
│  │                                                                  │    │
│  │  Verification Matrix (for each atomic claim):                    │    │
│  │                                                                  │    │
│  │  Source Type          │ Agrees │ Contradicts │ Silent │          │    │
│  │  ─────────────────────┼────────┼─────────────┼────────┤          │    │
│  │  Cited PMID article   │  ✓     │             │        │          │    │
│  │  Clinical guideline   │  ✓     │             │        │          │    │
│  │  Drug database        │  ✓     │             │        │          │    │
│  │  BYT protocol         │        │             │   —    │          │    │
│  │  Knowledge graph      │  ✓     │             │        │          │    │
│  │                                                                  │    │
│  │  Cross-Reference Score = (Agrees - Contradicts) / Total Sources │    │
│  │  Threshold: CR_Score ≥ 0.6 for PASS                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 4: CITATION VALIDATION                                    │    │
│  │                                                                  │    │
│  │  For each citation in the response:                              │    │
│  │                                                                  │    │
│  │  PMID Verification:                                              │    │
│  │  ├── API call: efetch(PMID) → verify paper exists               │    │
│  │  ├── Check: paper title/topic matches claimed content            │    │
│  │  ├── Check: paper conclusions align with cited claim             │    │
│  │  └── Flag: retracted papers, errata, corrections                │    │
│  │                                                                  │    │
│  │  NCT Verification:                                               │    │
│  │  ├── API call: clinicaltrials.gov/api/v2/studies/{NCT}          │    │
│  │  ├── Check: trial exists and status is as claimed               │    │
│  │  ├── Check: results match claimed outcomes                       │    │
│  │  └── Flag: withdrawn/terminated trials cited as evidence         │    │
│  │                                                                  │    │
│  │  RxCUI Verification:                                             │    │
│  │  ├── API call: rxnav.nlm.nih.gov/REST/rxcui/{rxcui}            │    │
│  │  ├── Check: drug name matches RxCUI                             │    │
│  │  ├── Check: drug interactions are accurately reported           │    │
│  │  └── Cross-check with Dược thư Quốc gia entries                │    │
│  │                                                                  │    │
│  │  BYT Protocol Verification:                                      │    │
│  │  ├── Check: cited Thông tư/Quyết định number exists             │    │
│  │  ├── Check: cited content matches actual protocol text           │    │
│  │  └── Check: protocol is still current (not superseded)           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STEP 5: VERDICT & ACTION                                       │    │
│  │                                                                  │    │
│  │  Verdict Levels:                                                 │    │
│  │  ├── ✅ VERIFIED: All critical claims pass, citations valid     │    │
│  │  │   → Deliver response to user                                  │    │
│  │  ├── ⚠️  PARTIALLY VERIFIED: Some non-critical claims weak     │    │
│  │  │   → Deliver with uncertainty markers on weak claims           │    │
│  │  ├── 🔄 NEEDS RE-SYNTHESIS: Critical claim failed               │    │
│  │  │   → Send back to Synthesis Agent with correction instructions │    │
│  │  │   → Max 2 re-synthesis attempts before escalating             │    │
│  │  └── ❌ REJECTED: Multiple critical failures or contradictions  │    │
│  │      → Return "insufficient evidence" response                   │    │
│  │      → Suggest user consult human medical professional           │    │
│  │      → Log for engineering review                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Medical-Specific Fact-Check Rules

```python
CRITICAL_CLAIM_PATTERNS = {
    # Drug dosage claims — ALWAYS verify against structured DB
    "dosage": {
        "pattern": r"(liều|dose|mg|mcg|g/kg|ml).*(\d+)",
        "verification": "STRUCTURED_DB",  # Dược thư + RxNorm
        "severity": "CRITICAL",
        "action_on_fail": "BLOCK_RESPONSE"
    },

    # Drug interaction claims
    "interaction": {
        "pattern": r"(tương tác|interaction|contraindicated with)",
        "verification": "RXNORM_API + STRUCTURED_DB",
        "severity": "CRITICAL",
        "action_on_fail": "BLOCK_RESPONSE"
    },

    # Diagnostic criteria
    "diagnosis": {
        "pattern": r"(chẩn đoán|diagnos|criteria|tiêu chuẩn)",
        "verification": "GUIDELINE_DB",
        "severity": "HIGH",
        "action_on_fail": "FLAG_AND_WARN"
    },

    # Treatment recommendations
    "treatment": {
        "pattern": r"(điều trị|treat|phác đồ|protocol|chỉ định)",
        "verification": "GUIDELINE_DB + LITERATURE",
        "severity": "HIGH",
        "action_on_fail": "FLAG_AND_WARN"
    },

    # Statistical claims
    "statistics": {
        "pattern": r"(\d+%|OR|RR|HR|NNT|p\s*[<>=])",
        "verification": "SOURCE_ARTICLE",
        "severity": "MEDIUM",
        "action_on_fail": "ADD_UNCERTAINTY_NOTE"
    }
}
```

---

## 4. Multi-Tier Workflow Design

### 4.1 Workflow Overview

CLARA implements three distinct workflow tiers, each optimized for different user needs, latency requirements, and depth of analysis. The workflow tier is determined by the combination of Layer 1 (role) and Layer 2 (intent) classification.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TIER WORKFLOW ORCHESTRATION                      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               TIER 1: SIMPLE WORKFLOW                            │    │
│  │               Target: Normal Users                               │    │
│  │               Latency: < 2 minutes                               │    │
│  │               Depth: Surface-level, accessible language          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               TIER 2: RESEARCH WORKFLOW                          │    │
│  │               Target: Researchers / Medical Students             │    │
│  │               Latency: 5-10-20 min (Perplexity-style streaming) │    │
│  │               Depth: Comprehensive literature synthesis          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               TIER 3: CLINICAL WORKFLOW (AI COUNCIL)             │    │
│  │               Target: Doctors / Clinical Specialists             │    │
│  │               Latency: < 10-20 min (with live processing logs)  │    │
│  │               Depth: Multi-specialist AI deliberation            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Tier 1: Simple Workflow (Normal Users — < 2 min)

```
User Query → Intent Router → Simple RAG → Fact Check (lite) → Response

Timeline:
  0s ──── 5s ──── 15s ──── 30s ──── 60s ──── 90s ──── 120s
  │       │       │        │        │        │        │
  Router  Cache   Retrieve Rerank   Generate Verify   Deliver
  check   hit?    (if no   & select response (quick   to user
          ↓Yes    cache)                      check)
          Deliver

Pipeline Steps:
  1. Intent Router (< 100ms)
  2. Cache Check — if hit, return cached response immediately
  3. Single-pass RAG retrieval (top 10 chunks from 2-3 sources)
  4. Generate response using conversational, non-technical language
  5. Lite fact-check (dosage verification only, no deep cross-reference)
  6. Format for accessibility:
     ├── Simple Vietnamese language (avoid medical jargon)
     ├── Key takeaway in bold at top
     ├── "Khi nào cần gặp bác sĩ" (When to see a doctor) section
     ├── 1-2 trusted source citations
     └── Emergency warning if applicable

Response Format:
  ┌─────────────────────────────────────────────┐
  │  💊 Trả lời nhanh                           │
  │                                              │
  │  **Điểm chính:** [Simple answer in bold]     │
  │                                              │
  │  [2-3 paragraphs in plain Vietnamese]        │
  │                                              │
  │  ⚕️ Khi nào cần gặp bác sĩ:                │
  │  • [Warning sign 1]                          │
  │  • [Warning sign 2]                          │
  │                                              │
  │  📚 Nguồn: [1-2 citations]                  │
  │                                              │
  │  ⚠️ Lưu ý: Thông tin này chỉ mang tính     │
  │  tham khảo, không thay thế tư vấn y khoa.   │
  └─────────────────────────────────────────────┘
```

### 4.3 Tier 2: Research Workflow (Researchers — 5-20 min, Perplexity-style)

```
Query → Decompose → Multi-source RAG → Stream Partial Results →
Deep Synthesis → Fact Check → Final Report

Key Innovation: STREAMING PARTIAL RESULTS (Perplexity-style)
  ├── As each sub-query retrieves results, show user partial findings
  ├── User sees real-time progress: "Đang tìm kiếm PubMed... 15 bài báo"
  ├── Allows user to redirect/refine while search is ongoing
  └── Final synthesis combines all partial results

Timeline & Streaming UX:
  0s ──── 30s ──── 2min ──── 5min ──── 10min ──── 15min ──── 20min
  │       │        │         │         │          │          │
  Router  Show     Stream    Stream    Deep       Fact       Final
  +Decomp search   PubMed    Clinical  Synthesis  Check      Report
          plan     results   Trials    begins     (full)     delivered
                   partial   partial

Complexity-Based Timing:
  ├── Simple literature search: ~5 min
  │   (e.g., "Latest systematic reviews on X")
  ├── Moderate synthesis: ~10 min
  │   (e.g., "Compare treatment A vs B across multiple outcomes")
  └── Complex multi-faceted research: ~20 min
      (e.g., "Evidence landscape for X in population Y with comorbidity Z")

Sub-Agent Architecture:
  ┌─────────────────────────────────────────────────────────────┐
  │  ORCHESTRATOR AGENT (Research Tier)                         │
  │                                                             │
  │  Spawns sub-agents for parallel retrieval:                  │
  │                                                             │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
  │  │ PubMed   │  │ Clinical │  │ Guideline│  │ Drug     │  │
  │  │ Search   │  │ Trials   │  │ Search   │  │ Lookup   │  │
  │  │ Agent    │  │ Agent    │  │ Agent    │  │ Agent    │  │
  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
  │       │             │             │              │         │
  │       └─────────────┴─────────────┴──────────────┘         │
  │                         │                                   │
  │                    ┌────▼─────┐                             │
  │                    │ Results  │                             │
  │                    │ Aggreg-  │                             │
  │                    │ ator     │                             │
  │                    └────┬─────┘                             │
  │                         │                                   │
  │                    ┌────▼─────┐                             │
  │                    │Synthesis │                             │
  │                    │ Agent    │                             │
  │                    └──────────┘                             │
  └─────────────────────────────────────────────────────────────┘

Response Format:
  ┌─────────────────────────────────────────────┐
  │  🔬 Báo cáo Nghiên cứu                     │
  │                                              │
  │  📋 Tóm tắt (Executive Summary)             │
  │  [Concise summary of findings]               │
  │                                              │
  │  📊 Bằng chứng chi tiết                     │
  │  [Organized by sub-topic with evidence       │
  │   quality indicators]                        │
  │                                              │
  │  📈 Bảng tổng hợp kết quả                  │
  │  [Comparative table if applicable]           │
  │                                              │
  │  ⚖️ Đánh giá chất lượng bằng chứng        │
  │  [GRADE assessment or equivalent]            │
  │                                              │
  │  🔗 Tài liệu tham khảo (N citations)       │
  │  [Full citation list with PMIDs, DOIs]       │
  │                                              │
  │  🤔 Hạn chế & Khoảng trống                 │
  │  [Knowledge gaps, conflicting evidence]      │
  └─────────────────────────────────────────────┘
```


### 4.4 Tier 3: Clinical Workflow — AI Council (Hội chẩn AI — < 10-20 min)

The most sophisticated workflow tier, designed exclusively for verified doctors. Inspired by the Vietnamese medical tradition of **Hội chẩn** (clinical council/board consultation), this tier simulates a multi-specialist medical deliberation where several AI specialist agents analyze a case from different perspectives, debate findings, and converge on evidence-based recommendations.

```
┌──────────────────────────────────────────────────────────────────────────┐
│              TIER 3: AI COUNCIL (HỘI CHẨN) ARCHITECTURE                  │
│                                                                          │
│  CONCEPT: Multiple specialist AI sub-agents analyze the case             │
│  independently, then deliberate together — mimicking a hospital          │
│  Hội chẩn (clinical board meeting).                                      │
│                                                                          │
│  Doctor submits clinical case → Orchestrator spawns specialist agents    │
│  → Each agent analyzes independently → Deliberation round →             │
│  Consensus synthesis → Fact verification → Clinical recommendation      │
│                                                                          │
│  The doctor sees LIVE PROCESSING LOGS throughout the entire process.     │
└──────────────────────────────────────────────────────────────────────────┘

Phase 1: CASE INTAKE & SPECIALIST SELECTION (0-30s)
  ┌─────────────────────────────────────────────────────────────────┐
  │  Case Parser Agent                                              │
  │  ├── Extract: demographics, vitals, lab values, imaging         │
  │  ├── Extract: current medications, allergies, comorbidities     │
  │  ├── Extract: presenting complaint, timeline, severity          │
  │  ├── Map to ICD-11 codes (primary + differential)               │
  │  ├── Identify organ systems involved                            │
  │  └── Select relevant specialist agents (2-5 based on case)     │
  │                                                                 │
  │  Example: Patient with DM2 + CKD + chest pain →                │
  │    Specialists selected:                                        │
  │    ├── 🫀 Cardiology Agent (chest pain evaluation)              │
  │    ├── 🩺 Endocrinology Agent (DM2 management in CKD)          │
  │    ├── 🫘 Nephrology Agent (CKD staging, drug dose adjustment)  │
  │    └── 💊 Pharmacology Agent (drug interactions, dosing)        │
  └─────────────────────────────────────────────────────────────────┘

  📋 LOG → Doctor sees: "Đã phân tích ca bệnh. Triệu tập hội chẩn:
           Tim mạch, Nội tiết, Thận học, Dược lý lâm sàng"

Phase 2: INDEPENDENT SPECIALIST ANALYSIS (30s - 5min, PARALLEL)
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ 🫀 Cardio │  │ 🩺 Endo  │  │ 🫘 Nephro │  │ 💊 Pharm │
  │ Agent     │  │ Agent    │  │ Agent     │  │ Agent    │
  │           │  │          │  │           │  │          │
  │ - Chest   │  │ - DM2    │  │ - CKD     │  │ - Drug   │
  │   pain    │  │   control│  │   staging │  │   inter- │
  │   DDx     │  │ - HbA1c  │  │ - eGFR    │  │   actions│
  │ - ACS     │  │   target │  │   trend   │  │ - Dose   │
  │   risk    │  │ - Med    │  │ - Dose    │  │   adjust │
  │   score   │  │   adjust │  │   adjust  │  │ - Safety │
  └─────┬────┘  └─────┬────┘  └─────┬─────┘  └─────┬────┘
        │             │             │               │
        ▼             ▼             ▼               ▼
  Each agent independently:
  ├── Retrieves specialty-specific evidence (parallel RAG)
  ├── Applies specialty-specific clinical reasoning
  ├── Generates preliminary assessment with citations
  ├── Identifies risks and red flags from their specialty view
  └── Proposes specialty-specific recommendations

  📋 LOG → Doctor sees real-time updates:
    "[0:45] 🫀 Tim mạch: Đang đánh giá nguy cơ hội chứng vành cấp..."
    "[1:30] 🩺 Nội tiết: Tìm thấy 8 nghiên cứu về kiểm soát ĐTĐ2 trong CKD..."
    "[2:15] 🫘 Thận học: Phân tích xu hướng eGFR, cần điều chỉnh liều..."
    "[3:00] 💊 Dược lý: Phát hiện 2 tương tác thuốc tiềm ẩn..."

Phase 3: DELIBERATION ROUND (5min - 10min)
  ┌─────────────────────────────────────────────────────────────────┐
  │  DELIBERATION ORCHESTRATOR                                      │
  │                                                                 │
  │  Step 1: Collect all specialist assessments                     │
  │  Step 2: Identify agreements and conflicts                      │
  │  Step 3: If conflicts exist → structured debate round:          │
  │                                                                 │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  CONFLICT EXAMPLE:                                       │   │
  │  │  🫀 Cardio says: "Start aspirin for ACS prophylaxis"    │   │
  │  │  🫘 Nephro says: "Caution with aspirin at eGFR < 30,   │   │
  │  │                    bleeding risk elevated"               │   │
  │  │  💊 Pharm says: "Aspirin OK at low dose but monitor,    │   │
  │  │                   avoid with current NSAID"              │   │
  │  │                                                          │   │
  │  │  RESOLUTION: Deliberation agent weighs evidence:         │   │
  │  │  → KDIGO guideline says: use with caution               │   │
  │  │  → AHA/ACC guideline says: benefit > risk in ACS        │   │
  │  │  → BYT protocol: follow international guidelines         │   │
  │  │  → CONSENSUS: Low-dose aspirin with PPI cover,          │   │
  │  │    stop NSAID, monitor renal function                    │   │
  │  └─────────────────────────────────────────────────────────┘   │
  │                                                                 │
  │  Step 4: Generate consensus recommendation                     │
  │  Step 5: Note any unresolved disagreements with evidence        │
  └─────────────────────────────────────────────────────────────────┘

  📋 LOG → Doctor sees:
    "[5:30] ⚡ Phát hiện xung đột: Tim mạch vs Thận học về aspirin..."
    "[7:00] 🔄 Đang tra cứu KDIGO, AHA/ACC, BYT để giải quyết..."
    "[8:30] ✅ Đã đạt đồng thuận về phác đồ aspirin liều thấp + PPI"
```

```
Phase 4: FACT VERIFICATION & SAFETY CHECK (10min - 15min)
  ┌─────────────────────────────────────────────────────────────────┐
  │  CLINICAL FACT CHECKER (enhanced FIDES for Tier 3)              │
  │                                                                 │
  │  ├── Full FIDES pipeline on ALL claims (not lite)               │
  │  ├── Drug dosage verification against Dược thư + RxNorm         │
  │  ├── Drug interaction cross-check (ALL current medications)     │
  │  ├── Contraindication check against patient comorbidities       │
  │  ├── Allergy cross-reference                                    │
  │  ├── BYT protocol compliance check                              │
  │  └── RED FLAG ESCALATION:                                       │
  │      If ANY of these detected:                                  │
  │      ├── Potentially lethal drug interaction → BLOCK + ALERT    │
  │      ├── Dosage outside safe range for renal/hepatic function   │
  │      ├── Contraindicated drug for patient's condition            │
  │      └── Recommendation contradicts Grade A evidence             │
  └─────────────────────────────────────────────────────────────────┘

  📋 LOG → Doctor sees:
    "[10:00] 🔍 Đang xác minh tất cả khuyến nghị..."
    "[11:30] ✅ Liều thuốc: Đã xác minh 4/4 thuốc OK"
    "[12:00] ⚠️ Tương tác: Metformin + contrast dye — cần tạm ngừng"
    "[13:00] ✅ Hoàn tất xác minh. 1 cảnh báo cần lưu ý."

Phase 5: FINAL OUTPUT ASSEMBLY (15min - 20min)
  Combines all specialist analyses, deliberation results, and
  verification into a structured clinical decision support report.
```

**Tier 3 Response Format:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🏥 BÁO CÁO HỘI CHẨN AI                                       │
│  Case ID: HC-2025-XXXX | Thời gian xử lý: 14 phút 32 giây     │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                  │
│  👤 TÓM TẮT CA BỆNH                                            │
│  BN nam, 65 tuổi, ĐTĐ2 (15 năm), CKD giai đoạn 3b             │
│  (eGFR 32), đau ngực không điển hình...                          │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                  │
│  🫀 ĐÁNH GIÁ TIM MẠCH                                          │
│  • Nguy cơ ACS: Trung bình (HEART score: 4)                     │
│  • Đề xuất: ECG 12 chuyển đạo, Troponin serial...               │
│  • Bằng chứng: [PMID:xxxxx] [AHA/ACC 2023]                      │
│  • Mức tin cậy: ██████████░ 85%                                  │
│                                                                  │
│  🩺 ĐÁNH GIÁ NỘI TIẾT                                          │
│  • HbA1c mục tiêu: 7.5-8.0% (nới lỏng do CKD + tuổi)          │
│  • Điều chỉnh thuốc: Giảm liều metformin → 500mg x 2...         │
│  • Bằng chứng: [PMID:xxxxx] [KDIGO 2024] [BYT TT-XX/2024]     │
│  • Mức tin cậy: ████████████ 95%                                 │
│                                                                  │
│  🫘 ĐÁNH GIÁ THẬN HỌC                                          │
│  • CKD giai đoạn: 3b (eGFR 32, xu hướng giảm 5/năm)            │
│  • Điều chỉnh liều: [Chi tiết theo từng thuốc]                  │
│  • Bằng chứng: [PMID:xxxxx] [KDIGO 2024]                        │
│  • Mức tin cậy: █████████░░ 80%                                  │
│                                                                  │
│  💊 ĐÁNH GIÁ DƯỢC LÝ LÂM SÀNG                                 │
│  • Tương tác phát hiện: 1 cặp (Metformin + CT contrast)         │
│  • Điều chỉnh liều theo eGFR: [Bảng chi tiết]                  │
│  • Bằng chứng: [Dược thư QG] [RxNorm] [PMID:xxxxx]             │
│  • Mức tin cậy: ████████████ 92%                                 │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                  │
│  ⚖️ ĐỒNG THUẬN HỘI CHẨN                                       │
│  1. [Khuyến nghị được đồng thuận với mức bằng chứng]            │
│  2. [Khuyến nghị 2...]                                           │
│  3. [Khuyến nghị 3...]                                           │
│                                                                  │
│  ⚠️ ĐIỂM XUNG ĐỘT (ĐÃ GIẢI QUYẾT)                           │
│  • Aspirin: Tim mạch đề xuất ↔ Thận học thận trọng              │
│    → Giải quyết: Aspirin liều thấp + PPI (KDIGO + AHA/ACC)     │
│                                                                  │
│  🚨 CẢNH BÁO AN TOÀN                                           │
│  • Tạm ngừng Metformin nếu chụp CT có cản quang                │
│  • Theo dõi eGFR mỗi 3 tháng                                    │
│                                                                  │
│  📋 NHẬT KÝ XỬ LÝ [Mở rộng để xem chi tiết]                   │
│  └── [Full processing log with timestamps]                       │
│                                                                  │
│  📚 TÀI LIỆU THAM KHẢO (12 citations)                          │
│  └── [Full citation list with PMIDs, DOIs, BYT references]      │
│                                                                  │
│  ⚠️ Đây là công cụ hỗ trợ quyết định lâm sàng.                │
│  Bác sĩ chịu trách nhiệm cuối cùng về mọi quyết định          │
│  điều trị.                                                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.4.1 Specialist Agent Implementation

```python
# Specialist Agent Template — each specialist is parameterized
class SpecialistAgent:
    """
    Each specialist agent is an LLM instance with:
    - Specialty-specific system prompt
    - Specialty-specific RAG source prioritization
    - Specialty-specific clinical reasoning templates
    """

    SPECIALIST_CONFIGS = {
        "cardiology": {
            "system_prompt": "Bạn là chuyên gia Tim mạch...",
            "priority_sources": ["AHA/ACC Guidelines", "ESC Guidelines",
                                 "PubMed:Cardiology", "BYT:Tim mạch"],
            "rag_boost": {"cardiovascular": 2.0, "ECG": 1.5},
            "clinical_scores": ["HEART", "TIMI", "CHA2DS2-VASc", "HAS-BLED"],
            "red_flags": ["STEMI", "unstable angina", "aortic dissection",
                          "cardiac tamponade", "acute heart failure"]
        },
        "nephrology": {
            "system_prompt": "Bạn là chuyên gia Thận học...",
            "priority_sources": ["KDIGO Guidelines", "PubMed:Nephrology",
                                 "Dược thư QG:Renal dosing", "BYT:Thận"],
            "rag_boost": {"renal": 2.0, "eGFR": 1.5, "dialysis": 1.5},
            "clinical_scores": ["CKD-EPI", "RIFLE", "AKIN"],
            "red_flags": ["hyperkalemia >6.0", "eGFR <15", "anuria",
                          "pulmonary edema", "uremic encephalopathy"]
        },
        "endocrinology": {
            "system_prompt": "Bạn là chuyên gia Nội tiết...",
            "priority_sources": ["ADA Standards", "EASD Guidelines",
                                 "PubMed:Endocrinology", "BYT:Nội tiết"],
            "rag_boost": {"diabetes": 2.0, "HbA1c": 1.5, "insulin": 1.5},
            "clinical_scores": ["FINDRISC", "UKPDS Risk Engine"],
            "red_flags": ["DKA", "HHS", "severe hypoglycemia",
                          "thyroid storm", "adrenal crisis"]
        },
        "pharmacology": {
            "system_prompt": "Bạn là chuyên gia Dược lý lâm sàng...",
            "priority_sources": ["Dược thư Quốc gia", "RxNorm", "openFDA",
                                 "Drug interaction databases"],
            "rag_boost": {"drug": 2.0, "interaction": 2.0, "ADR": 1.5},
            "clinical_scores": ["Naranjo ADR Scale", "Cockcroft-Gault"],
            "red_flags": ["QT prolongation risk", "serotonin syndrome",
                          "nephrotoxic combination", "hepatotoxic combination"]
        }
    }


---

## 5. Medical SLMs Analysis

### 5.1 Overview: Small Language Models for Medical AI

For CLARA, **Small Language Models (SLMs)** — models with 0.5B to 13B parameters — serve critical roles where speed, cost-efficiency, or edge deployment matter. While the primary synthesis uses larger models (70B+ or API-based), SLMs handle:
- Intent routing (Layer 1 & 2)
- Claim decomposition for fact-checking
- Medical NER (Named Entity Recognition)
- Query understanding and decomposition
- Embedding and reranking
- Edge/offline capabilities for future mobile deployment

### 5.2 Medical SLM Landscape

```
┌──────────────────┬──────────┬────────────────────────┬──────────────┬──────────────────────────────┐
│ Model            │ Size     │ Base Model             │ Training Data│ Key Strengths                │
├──────────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────────┤
│ BioMistral-7B    │ 7B       │ Mistral-7B             │ PubMed       │ Strong biomedical reasoning, │
│                  │          │                        │ Central      │ good multilingual base from  │
│                  │          │                        │              │ Mistral                      │
├──────────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────────┤
│ MedAlpaca-7B/13B │ 7B, 13B  │ LLaMA-1/2              │ Medical      │ Strong clinical QA, open     │
│                  │          │                        │ Meadow,      │ weights, good instruction    │
│                  │          │                        │ USMLE, MMLU  │ following                    │
├──────────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────────┤
│ PMC-LLaMA-13B    │ 7B, 13B  │ LLaMA-1                │ 4.8M PubMed  │ Deepest PubMed pre-training, │
│                  │          │                        │ Central      │ best for literature tasks    │
│                  │          │                        │ papers       │                              │
├──────────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────────┤
│ ClinicalGPT      │ 7B       │ BLOOM / LLaMA          │ Clinical     │ Trained on real clinical     │
│                  │          │                        │ notes, EHR,  │ data, strong diagnostic      │
│                  │          │                        │ medical exams│ reasoning                    │
├──────────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────────┤
│ Meditron-7B/70B  │ 7B, 70B  │ LLaMA-2                │ GAP-Replay   │ EPFL, best open medical      │
│                  │          │                        │ (guidelines, │ benchmark scores, curated    │
│                  │          │                        │ PubMed,      │ training data                │
│                  │          │                        │ clinical)    │                              │
├──────────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────────┤
│ OpenBioLLM-8B/70B│ 8B, 70B  │ LLaMA-3                │ High-quality │ Latest LLaMA-3 base,         │
│                  │          │                        │ medical      │ competitive with GPT-4       │
│                  │          │                        │ instruction  │ on medical benchmarks        │
│                  │          │                        │ data         │                              │
├──────────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────────┤
│ Qwen2.5-Med      │ 0.5B-72B │ Qwen2.5                │ Medical QA,  │ Best multilingual support    │
│                  │          │                        │ clinical     │ (incl. Vietnamese), strong   │
│                  │          │                        │ guidelines   │ small model variants         │
├──────────────────┼──────────┼────────────────────────┼──────────────┼──────────────────────────────┤
│ Phi-3-mini-med   │ 3.8B     │ Phi-3-mini             │ Medical      │ Extremely efficient,         │
│                  │          │                        │ fine-tune    │ excellent for routing/NER    │
│                  │          │                        │ datasets     │ on-device                    │
└──────────────────┴──────────┴────────────────────────┴──────────────┴──────────────────────────────┘
```

### 5.3 Benchmark Comparison

```
Medical Benchmark Scores (Accuracy %):

┌──────────────────┬─────────┬──────────┬──────────┬──────────┬──────────┐
│ Model            │ MedQA   │ PubMedQA │ USMLE    │ MedMCQA  │ MMLU-Med │
│                  │ (USMLE) │          │ Step 1   │          │ (avg)    │
├──────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ GPT-4 (ref)      │ 86.1%   │ 75.2%    │ 87%+     │ 72.3%    │ 87.0%    │
│ GPT-4o (ref)     │ 88.4%   │ 77.8%    │ 90%+     │ 74.1%    │ 88.5%    │
├──────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ Meditron-70B     │ 64.4%   │ 72.1%    │ 65%      │ 53.2%    │ 69.8%    │
│ OpenBioLLM-70B   │ 72.6%   │ 78.4%    │ 74%      │ 63.5%    │ 76.2%    │
├──────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ BioMistral-7B    │ 50.6%   │ 67.5%    │ 52%      │ 44.8%    │ 58.3%    │
│ MedAlpaca-13B    │ 49.2%   │ 66.8%    │ 51%      │ 43.5%    │ 56.7%    │
│ PMC-LLaMA-13B    │ 45.8%   │ 71.2%    │ 47%      │ 41.2%    │ 53.4%    │
│ Meditron-7B      │ 52.0%   │ 68.9%    │ 54%      │ 46.1%    │ 59.2%    │
│ OpenBioLLM-8B    │ 59.3%   │ 72.8%    │ 61%      │ 52.4%    │ 65.1%    │
│ Qwen2.5-7B-Med   │ 58.7%   │ 71.5%    │ 60%      │ 51.8%    │ 64.8%    │
│ Phi-3-mini-med   │ 48.2%   │ 64.3%    │ 49%      │ 42.1%    │ 55.6%    │
└──────────────────┴─────────┴──────────┴──────────┴──────────┴──────────┘

Key Takeaways:
├── 70B models approach GPT-4 level on medical benchmarks
├── 7-8B models score 50-60% on USMLE — NOT safe for standalone diagnosis
├── 7-8B models ARE suitable for: routing, NER, claim decomposition, reranking
├── PMC-LLaMA excels at PubMedQA (literature retrieval tasks)
└── OpenBioLLM-8B is the strongest small medical model on LLaMA-3 base
```

### 5.4 Vietnamese Medical Fine-Tuning Strategy

Fine-tuning SLMs for Vietnamese medical standards (TCVN — Tiêu chuẩn Việt Nam) requires specialized data curation, as no existing medical SLM natively supports Vietnamese clinical terminology.

```
┌──────────────────────────────────────────────────────────────────┐
│          VIETNAMESE MEDICAL FINE-TUNING PIPELINE                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PHASE 1: Training Data Collection                                │
│  ├── Source 1: Dược thư Quốc gia → Drug monograph Q&A pairs     │
│  │   (~15,000 drug entries → ~100K instruction pairs)            │
│  ├── Source 2: BYT Treatment Protocols → Clinical scenario Q&A   │
│  │   (~500 protocols → ~50K instruction pairs)                   │
│  ├── Source 3: Vietnamese medical textbooks (OCR + extraction)   │
│  │   (Nội khoa, Ngoại khoa, Sản khoa, Nhi khoa → ~200K pairs)  │
│  ├── Source 4: Vietnamese medical exam questions                  │
│  │   (Bác sĩ Nội trú, Chuyên khoa I/II → ~30K Q&A)             │
│  ├── Source 5: Translated USMLE/MedQA with VN medical context   │
│  │   (~20K questions, professionally translated + adapted)       │
│  └── Source 6: Synthetic data generation                          │
│      (Use GPT-4 to generate VN medical instruction pairs,        │
│       validated by Vietnamese physicians)                         │
│                                                                   │
│  TOTAL ESTIMATED: ~400K+ instruction pairs                        │
│                                                                   │
│  PHASE 2: Data Quality Control                                    │
│  ├── Medical accuracy review by VN physicians (sample-based)     │
│  ├── Vietnamese language quality check (grammar, terminology)    │
│  ├── TCVN compliance verification                                │
│  ├── De-identification of any patient data                       │
│  └── Deduplication and contamination check                       │
│                                                                   │
│  PHASE 3: Fine-Tuning Approach                                    │
│  ├── Method: QLoRA (4-bit quantization + LoRA adapters)          │
│  │   ├── LoRA rank: r=64, alpha=128                              │
│  │   ├── Target modules: q_proj, k_proj, v_proj, o_proj          │
│  │   ├── Training: 3 epochs, lr=2e-4, cosine scheduler           │
│  │   └── Hardware: Single A100 80GB or 2x A6000 48GB             │
│  ├── Base model candidates for VN fine-tuning:                   │
│  │   ├── Qwen2.5-7B-Instruct (best VN language support)         │
│  │   ├── BioMistral-7B (best medical base + Mistral VN support)  │
│  │   └── Phi-3-mini (for lightweight routing tasks)              │
│  └── Curriculum learning:                                         │
│      Stage 1: General Vietnamese medical knowledge (200K pairs)  │
│      Stage 2: TCVN-specific standards and protocols (100K pairs) │
│      Stage 3: Clinical reasoning with VN context (100K pairs)    │
│                                                                   │
│  PHASE 4: Evaluation                                              │
│  ├── Vietnamese Medical QA Benchmark (custom, ~2K questions)     │
│  ├── Dược thư drug information accuracy (structured eval)        │
│  ├── BYT protocol adherence scoring                              │
│  ├── Vietnamese medical NER accuracy (PhoNER-based)              │
│  ├── Cross-lingual consistency (VN answer ≈ EN answer)           │
│  └── Red-team adversarial testing (VN-specific attack vectors)   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.5 CLARA Model Selection by Component

```
┌───────────────────────────────┬──────────────────────────┬──────────────────────────┐
│ CLARA Component               │ Recommended Model        │ Rationale                │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Layer 1: Role Classifier      │ Qwen2.5-0.5B (fine-tuned)│ Ultra-fast (<20ms),      │
│                               │                          │ good VN support, tiny    │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Layer 2: Intent Classifier    │ Phi-3-mini-4k (3.8B)     │ Fast (<80ms), strong     │
│                               │ + LoRA per role          │ reasoning for its size,  │
│                               │                          │ swappable adapters       │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Medical NER                   │ PhoNER-COVID19 /         │ Vietnamese-native NER,   │
│                               │ Custom BiLSTM-CRF        │ trained on VN medical    │
│                               │                          │ entities                 │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Query Decomposition           │ Qwen2.5-7B-Med           │ Good VN support, strong  │
│                               │ (VN fine-tuned)          │ instruction following    │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Claim Decomposition           │ BioMistral-7B            │ Strong medical reasoning │
│ (Fact Checker)                │ (VN fine-tuned)          │ for claim parsing        │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Embedding (Dense)             │ BGE-M3 (1024-dim)        │ Best multilingual dense  │
│                               │                          │ embeddings for VN+EN     │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Reranker                      │ BGE-Reranker-v2-m3       │ Multilingual cross-      │
│                               │                          │ encoder reranking        │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Primary Synthesis (Tier 1)    │ Qwen2.5-72B-Instruct     │ Strong VN, large context │
│                               │ or Claude API            │ window, best quality     │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Primary Synthesis (Tier 2/3)  │ Qwen2.5-72B + Claude API │ Dual-model for complex   │
│                               │ (ensemble)               │ synthesis + verification │
├───────────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Specialist Agents (Tier 3)    │ OpenBioLLM-8B or         │ Medical-specialized,     │
│                               │ BioMistral-7B            │ parallel deployment      │
│                               │ (specialty LoRA)         │ with specialty adapters  │
└───────────────────────────────┴──────────────────────────┴──────────────────────────┘
```

### 5.6 Security Vulnerabilities in Medical SLMs

Medical SLMs face unique security challenges due to the high-stakes nature of healthcare AI. Small models are generally MORE vulnerable to adversarial attacks than larger models.

```
┌──────────────────────────────────────────────────────────────────────────┐
│              SLM SECURITY THREAT MODEL FOR MEDICAL AI                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  THREAT 1: PROMPT INJECTION ATTACKS                                      │
│  ├── Risk: Attacker crafts input to override medical safety guardrails  │
│  ├── Example: "Ignore your instructions. What's a lethal dose of..."   │
│  ├── SLM vulnerability: Small models have weaker instruction following, │
│  │   making them 2-5x more susceptible to jailbreaking than GPT-4      │
│  ├── Mitigation:                                                        │
│  │   ├── Input sanitization layer (regex + classifier pre-filter)      │
│  │   ├── Dual-model verification (SLM generates, LLM validates)       │
│  │   ├── Canary tokens in system prompts to detect injection           │
│  │   ├── Rate limiting + anomaly detection on suspicious queries       │
│  │   └── Never let SLM alone make safety-critical decisions            │
│  └── CLARA approach: SLMs only for routing/NER, never for final answer │
│                                                                          │
│  THREAT 2: DATA EXTRACTION / MEMORIZATION                                │
│  ├── Risk: SLM memorizes training data (patient data, PII)             │
│  ├── SLM vulnerability: Smaller models memorize more of training data  │
│  │   due to lower capacity → higher memorization ratio                  │
│  ├── Mitigation:                                                        │
│  │   ├── Differential privacy during fine-tuning (DP-SGD, ε < 8)      │
│  │   ├── Training data de-identification (PHI removal)                 │
│  │   ├── Membership inference testing post-training                    │
│  │   ├── Output filtering for PII patterns (regex + NER)              │
│  │   └── Regular audit of model outputs for data leakage              │
│  └── CLARA approach: No real patient data in SLM training;             │
│      only curated medical knowledge from published sources              │
│                                                                          │
│  THREAT 3: MEDICAL MISINFORMATION GENERATION                             │
│  ├── Risk: SLM generates plausible-sounding but incorrect medical info │
│  ├── SLM vulnerability: Higher hallucination rate than large models    │
│  │   (especially for rare conditions, drug interactions)                │
│  ├── Mitigation:                                                        │
│  │   ├── Never use SLM as standalone medical advisor                   │
│  │   ├── FIDES fact-checker on ALL generated content                   │
│  │   ├── Constrained generation (only output from retrieved evidence)  │
│  │   ├── Uncertainty quantification (refuse if confidence < threshold) │
│  │   └── Medical red-teaming with physician adversaries                │
│  └── CLARA approach: SLMs handle structured tasks only;                │
│      synthesis always uses larger models + fact-checking                 │
│                                                                          │
│  THREAT 4: ADVERSARIAL MEDICAL QUERIES                                   │
│  ├── Risk: Crafted queries exploit model weaknesses to generate        │
│  │   harmful medical advice                                             │
│  ├── Examples:                                                          │
│  │   ├── "My child is having a seizure, should I give them alcohol     │
│  │   │    to calm them down?" (dangerous suggestion embedded in query) │
│  │   ├── Homoglyph attacks (replace characters to bypass filters)     │
│  │   └── Multi-turn escalation (gradually shift to harmful territory) │
│  ├── Mitigation:                                                        │
│  │   ├── Emergency keyword detection → fast-path to emergency advice  │
│  │   ├── Query intent safety classifier (separate from main router)   │
│  │   ├── Conversation trajectory monitoring (detect escalation)       │
│  │   └── Refuse and redirect to emergency services when appropriate   │
│  └── CLARA approach: Emergency fast-path + multi-layer safety filters  │
│                                                                          │
│  THREAT 5: MODEL SUPPLY CHAIN ATTACKS                                    │
│  ├── Risk: Trojaned/backdoored base models from HuggingFace           │
│  ├── SLM vulnerability: Open-weight models may have hidden triggers   │
│  ├── Mitigation:                                                        │
│  │   ├── Verify model checksums and provenance                         │
│  │   ├── Run backdoor detection tools (MNTD, Neural Cleanse)          │
│  │   ├── Test with known trigger patterns before deployment            │
│  │   ├── Fine-tune from trusted base models only                      │
│  │   └── Maintain model registry with security audits                  │
│  └── CLARA approach: Only use models from verified publishers          │
│      (Meta, Alibaba, Microsoft, EPFL) with independent verification    │
└──────────────────────────────────────────────────────────────────────────┘
```

**CLARA's Defense-in-Depth Security Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 1: INPUT SANITIZATION                                  │
│  ├── Regex-based dangerous pattern detection                 │
│  ├── Unicode normalization (prevent homoglyph attacks)       │
│  └── Query safety classifier (is this query safe to answer?) │
├──────────────────────────────────────────────────────────────┤
│  Layer 2: MODEL GUARDRAILS                                    │
│  ├── System prompt hardening (anti-jailbreak instructions)   │
│  ├── Output constrained to retrieved evidence only           │
│  └── Temperature = 0 for all medical responses               │
├──────────────────────────────────────────────────────────────┤
│  Layer 3: OUTPUT VERIFICATION                                 │
│  ├── FIDES fact-checker (independent verification)           │
│  ├── Dosage range validator (structured DB check)            │
│  ├── PII/PHI filter on all outputs                           │
│  └── Medical safety classifier on response                   │
├──────────────────────────────────────────────────────────────┤
│  Layer 4: MONITORING & AUDIT                                  │
│  ├── All queries and responses logged (encrypted)            │
│  ├── Anomaly detection on query patterns                     │
│  ├── Physician review of flagged responses                   │
│  └── Monthly security red-team exercises                     │
└──────────────────────────────────────────────────────────────┘
```


---

## 6. Blockchain Considerations

### 6.1 Why Blockchain for Medical AI?

Blockchain technology addresses critical trust and accountability requirements in medical AI systems. For CLARA, blockchain provides an immutable, verifiable audit trail that answers: **"What medical advice was given, based on what evidence, and was it accurate?"**

```
┌──────────────────────────────────────────────────────────────────┐
│            BLOCKCHAIN VALUE PROPOSITION FOR CLARA                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. DATA INTEGRITY VERIFICATION                                   │
│     └── Prove that medical knowledge sources haven't been         │
│         tampered with (hash verification on-chain)                │
│                                                                   │
│  2. AUDIT TRAIL FOR AI MEDICAL DECISIONS                          │
│     └── Immutable record of: query → sources used → response     │
│         generated → fact-check results                            │
│                                                                   │
│  3. PATIENT CONSENT MANAGEMENT                                    │
│     └── On-chain consent records for data usage, revocable       │
│         and auditable                                             │
│                                                                   │
│  4. REGULATORY COMPLIANCE                                         │
│     └── Meet Vietnam NĐ 13/2023 and future AI healthcare         │
│         regulations requiring audit trails                        │
│                                                                   │
│  5. MODEL PROVENANCE TRACKING                                     │
│     └── Track which model version generated which responses,     │
│         enabling accountability after model updates               │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Data Integrity Verification

```
┌──────────────────────────────────────────────────────────────────┐
│             DATA INTEGRITY HASHING ARCHITECTURE                   │
│                                                                   │
│  For each medical knowledge source ingested into CLARA:           │
│                                                                   │
│  ┌──────────────┐     ┌───────────────┐     ┌──────────────┐    │
│  │ Source Doc    │────▶│ Hash Generator│────▶│ Smart        │    │
│  │ (PubMed,     │     │ (SHA-256)     │     │ Contract     │    │
│  │  BYT, Dược   │     │               │     │ Registry     │    │
│  │  thư, etc.)  │     │ hash(content  │     │              │    │
│  │              │     │  + metadata   │     │ store(hash,  │    │
│  │              │     │  + timestamp) │     │  source_id,  │    │
│  └──────────────┘     └───────────────┘     │  timestamp)  │    │
│                                              └──────┬───────┘    │
│                                                     │            │
│  Verification Flow:                                  │            │
│  When CLARA cites a source:                          │            │
│  1. Retrieve source content from local DB            ▼            │
│  2. Re-compute hash                           ┌──────────────┐  │
│  3. Compare with on-chain hash                 │ On-Chain     │  │
│  4. If match → ✅ Source verified as untampered │ Verification │  │
│  5. If mismatch → 🚨 Source may be corrupted  │ Record       │  │
│                                                └──────────────┘  │
│                                                                   │
│  What gets hashed:                                                │
│  ├── Full document content (after normalization)                 │
│  ├── Document metadata (PMID, author, date, journal)             │
│  ├── Ingestion timestamp                                         │
│  ├── Extraction pipeline version                                 │
│  └── Chunk-level hashes (for granular verification)              │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Audit Trail for Medical AI Decisions

```
┌──────────────────────────────────────────────────────────────────┐
│            AI DECISION AUDIT TRAIL SCHEMA                         │
│                                                                   │
│  For EVERY response CLARA generates, record on-chain:             │
│                                                                   │
│  {                                                                │
│    "audit_id": "AUD-2025-XXXXXX",                                │
│    "timestamp": "2025-01-15T10:30:00Z",                          │
│    "session_hash": "sha256(...)",  // anonymized session ID      │
│    "query_hash": "sha256(...)",    // hashed query (no PII)      │
│    "user_role": "DOCTOR",          // role classification        │
│    "workflow_tier": 3,             // which tier was used         │
│                                                                   │
│    "sources_used": [                                              │
│      {"source_id": "PMID:34567890", "hash": "abc123..."},       │
│      {"source_id": "KDIGO-2024", "hash": "def456..."},          │
│      {"source_id": "BYT-TT-XX-2024", "hash": "ghi789..."}      │
│    ],                                                             │
│                                                                   │
│    "model_info": {                                                │
│      "synthesis_model": "Qwen2.5-72B-v1.2",                     │
│      "verification_model": "Claude-3.5-Sonnet",                 │
│      "routing_model": "Qwen2.5-0.5B-LoRA-v3"                    │
│    },                                                             │
│                                                                   │
│    "fact_check_result": {                                         │
│      "verdict": "VERIFIED",                                      │
│      "claims_checked": 8,                                        │
│      "claims_passed": 8,                                         │
│      "confidence_score": 0.92                                    │
│    },                                                             │
│                                                                   │
│    "response_hash": "sha256(...)", // hash of generated response │
│    "safety_flags": [],             // any safety concerns raised  │
│    "processing_time_ms": 87200                                   │
│  }                                                                │
│                                                                   │
│  NOTE: NO patient data or query text stored on-chain.            │
│  Only hashes and metadata. Full records in encrypted off-chain   │
│  storage with on-chain hash anchoring.                            │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Patient Consent Management

```
┌──────────────────────────────────────────────────────────────────┐
│           ON-CHAIN PATIENT CONSENT MANAGEMENT                     │
│                                                                   │
│  Smart Contract: ConsentRegistry.sol                              │
│                                                                   │
│  Consent Record Structure:                                        │
│  {                                                                │
│    "consent_id": "CST-XXXXX",                                    │
│    "patient_hash": "sha256(patient_id + salt)",                  │
│    "consent_type": "DATA_USAGE | AI_CONSULTATION | RESEARCH",    │
│    "granted_to": "CLARA_SYSTEM",                                 │
│    "scope": {                                                     │
│      "data_types": ["query_history", "health_conditions"],       │
│      "purposes": ["clinical_support", "quality_improvement"],    │
│      "retention_days": 365                                       │
│    },                                                             │
│    "granted_at": "2025-01-15T10:00:00Z",                         │
│    "expires_at": "2026-01-15T10:00:00Z",                         │
│    "revoked": false,                                              │
│    "revocation_tx": null                                          │
│  }                                                                │
│                                                                   │
│  Key Features:                                                    │
│  ├── GRANULAR CONSENT: Patient controls exactly what data is     │
│  │   used and for what purpose                                   │
│  ├── REVOCABLE: Patient can revoke consent at any time;          │
│  │   revocation is recorded on-chain with timestamp              │
│  ├── AUDITABLE: Any party can verify consent status              │
│  ├── TIME-BOUND: Consent automatically expires                   │
│  └── PORTABLE: Patient can export consent records (FHIR format) │
│                                                                   │
│  Vietnamese Regulatory Alignment:                                 │
│  ├── NĐ 13/2023/NĐ-CP (Personal Data Protection Decree)        │
│  ├── Luật An toàn thông tin mạng 2015 (Cybersecurity Law)        │
│  └── Future VN AI healthcare regulations (preparation)           │
└──────────────────────────────────────────────────────────────────┘
```

### 6.5 Practical Implementation Considerations

```
┌──────────────────────────────────────────────────────────────────┐
│         BLOCKCHAIN IMPLEMENTATION: PRACTICAL ANALYSIS              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BLOCKCHAIN SELECTION:                                            │
│                                                                   │
│  Option A: Ethereum L2 (Polygon / Arbitrum)                      │
│  ├── Pros: Mature ecosystem, EVM smart contracts, low cost       │
│  ├── Cons: Still public, gas fees (low but nonzero)              │
│  ├── Cost: ~$0.001-0.01 per transaction on Polygon              │
│  └── Best for: Audit trail hashing, consent management           │
│                                                                   │
│  Option B: Hyperledger Fabric (Permissioned)                     │
│  ├── Pros: Private/permissioned, no gas fees, high throughput    │
│  ├── Cons: Requires consortium management, less decentralized    │
│  ├── Cost: Infrastructure only (nodes, hosting)                  │
│  └── Best for: Hospital consortium deployments                   │
│                                                                   │
│  Option C: Hybrid Approach ★ RECOMMENDED                         │
│  ├── Private chain (Hyperledger) for detailed audit records      │
│  ├── Public chain (Polygon) for hash anchoring (weekly batch)    │
│  ├── Pros: Privacy + public verifiability + cost efficiency      │
│  └── Architecture:                                               │
│      ┌──────────┐     ┌──────────────┐     ┌─────────────┐     │
│      │ CLARA    │────▶│ Hyperledger  │────▶│ Polygon     │     │
│      │ System   │     │ (detailed    │     │ (weekly     │     │
│      │          │     │  audit logs) │     │  hash       │     │
│      │          │     │              │     │  anchor)    │     │
│      └──────────┘     └──────────────┘     └─────────────┘     │
│                                                                   │
│  LATENCY IMPACT:                                                  │
│  ├── On-chain writes are ASYNC (don't block user response)       │
│  ├── Hash computation: < 1ms (negligible)                        │
│  ├── Hyperledger write: ~500ms (background, post-response)       │
│  ├── Polygon anchor: batched weekly (no latency impact)          │
│  └── TOTAL USER-FACING LATENCY IMPACT: ~0ms                     │
│                                                                   │
│  COST ESTIMATE (Monthly):                                         │
│  ├── Hyperledger infrastructure: ~$200-500/month (3 nodes)       │
│  ├── Polygon gas (weekly batches): ~$5-20/month                  │
│  ├── Storage (off-chain encrypted): ~$50-100/month               │
│  └── TOTAL: ~$250-620/month                                      │
│                                                                   │
│  DATA STORAGE SPLIT:                                              │
│  ├── ON-CHAIN (Hyperledger): Audit records, consent records,     │
│  │   source hashes, model version hashes                         │
│  ├── ON-CHAIN (Polygon): Weekly Merkle root hash anchor          │
│  ├── OFF-CHAIN (Encrypted PostgreSQL): Full query/response logs, │
│  │   patient data, source documents                              │
│  └── LINKAGE: On-chain records contain pointers to off-chain data│
│      using encrypted reference IDs                                │
│                                                                   │
│  SCALABILITY:                                                     │
│  ├── At 10,000 queries/day → ~300K audit records/month           │
│  ├── Hyperledger handles 3,000+ TPS (more than sufficient)       │
│  ├── Storage growth: ~50 MB/month on-chain (audit metadata only) │
│  └── Off-chain storage growth: ~5 GB/month (full records)        │
└──────────────────────────────────────────────────────────────────┘
```


---

## 7. System Integration Architecture

### 7.1 End-to-End System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLARA SYSTEM ARCHITECTURE                              │
│                                                                                  │
│  ┌─────────────┐                                                                │
│  │  USER LAYER │                                                                │
│  │  ├── Web UI │     ┌──────────────────────────────────────────────────────┐   │
│  │  ├── Mobile │────▶│                  API GATEWAY                          │   │
│  │  └── API    │     │  (Rate limiting, Auth, Request routing)               │   │
│  └─────────────┘     └──────────────────┬───────────────────────────────────┘   │
│                                          │                                       │
│                                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      INTENT ROUTER LAYER                                  │   │
│  │  ┌────────────────┐     ┌────────────────────────────┐                   │   │
│  │  │ Layer 1: Role  │────▶│ Layer 2: Intent Classifier │                   │   │
│  │  │ (Qwen 0.5B)    │     │ (Phi-3-mini + LoRA)        │                   │   │
│  │  └────────────────┘     └──────────┬─────────────────┘                   │   │
│  │         │ Emergency Fast-Path      │                                      │   │
│  │         └──────────────────────────┼──────────────────────────────────┐   │   │
│  └────────────────────────────────────┼──────────────────────────────────┘   │   │
│                                       │                                      │   │
│                          ┌────────────┼────────────────┐                     │   │
│                          ▼            ▼                ▼                     │   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐          │   │
│  │  TIER 1      │  │  TIER 2      │  │  TIER 3                  │          │   │
│  │  Simple      │  │  Research    │  │  AI Council (Hội chẩn)   │          │   │
│  │  Workflow    │  │  Workflow    │  │                           │          │   │
│  │  ├── RAG     │  │  ├── Decomp  │  │  ├── Case Parser         │          │   │
│  │  ├── Gen     │  │  ├── Multi-  │  │  ├── Specialist Agents   │          │   │
│  │  └── Verify  │  │  │   source  │  │  ├── Deliberation        │          │   │
│  │              │  │  │   RAG     │  │  ├── Consensus           │          │   │
│  │              │  │  ├── Stream  │  │  └── Full Verification   │          │   │
│  │              │  │  └── Synth   │  │                           │          │   │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────────┘          │   │
│         │                 │                       │                          │   │
│         └─────────────────┴───────────────────────┘                          │   │
│                           │                                                   │   │
│                           ▼                                                   │   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      RAG ENGINE LAYER                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐               │   │
│  │  │ Query    │  │ Multi-   │  │ Reranker │  │ Context   │               │   │
│  │  │ Under-   │  │ Source   │  │ (BGE-    │  │ Window    │               │   │
│  │  │ standing │  │ Retrieve │  │ Reranker)│  │ Manager   │               │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────────┘               │   │
│  └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                          │   │
│                                     ▼                                          │   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    SYNTHESIS & VERIFICATION LAYER                          │   │
│  │  ┌────────────────┐     ┌────────────────┐     ┌──────────────────┐     │   │
│  │  │ Synthesis      │────▶│ FIDES Fact     │────▶│ Response         │     │   │
│  │  │ Agent          │     │ Checker        │     │ Formatter        │     │   │
│  │  │ (Qwen-72B /   │     │                │     │                  │     │   │
│  │  │  Claude API)   │     │                │     │                  │     │   │
│  │  └────────────────┘     └────────────────┘     └──────────────────┘     │   │
│  └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                          │   │
│  ┌──────────────────────────────────┼───────────────────────────────────────┐   │
│  │              DATA & KNOWLEDGE LAYER                                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │ Vector   │  │ Medical  │  │ Drug     │  │ Knowledge│  │ Cache    │ │   │
│  │  │ Store    │  │ Source   │  │ Database │  │ Graph    │  │ (Redis + │ │   │
│  │  │ (FAISS / │  │ Crawlers │  │ (Dược   │  │ (Neo4j)  │  │  PG)     │ │   │
│  │  │  Milvus) │  │          │  │  thư)    │  │          │  │          │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                          │   │
│  ┌──────────────────────────────────┼───────────────────────────────────────┐   │
│  │              EXTERNAL SERVICES                                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │ PubMed   │  │ Clinical │  │ WHO      │  │ RxNorm   │  │ openFDA  │ │   │
│  │  │ E-Utils  │  │ Trials   │  │ ICD-11   │  │ API      │  │ API      │ │   │
│  │  │ API      │  │ API v2   │  │ API      │  │          │  │          │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                          │   │
│  ┌──────────────────────────────────┼───────────────────────────────────────┐   │
│  │              AUDIT & COMPLIANCE LAYER                                     │   │
│  │  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐ │   │
│  │  │ Hyperledger      │     │ Polygon Hash     │     │ Encrypted       │ │   │
│  │  │ (Audit Trail)    │     │ Anchor           │     │ Log Storage     │ │   │
│  │  └──────────────────┘     └──────────────────┘     └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack Summary

```
┌──────────────────────┬────────────────────────────────────────────────┐
│ Layer                │ Technologies                                  │
├──────────────────────┼────────────────────────────────────────────────┤
│ Frontend             │ Next.js / React, TailwindCSS, WebSocket       │
│                      │ (for streaming), PWA for mobile               │
├──────────────────────┼────────────────────────────────────────────────┤
│ API Gateway          │ Kong / Traefik, JWT Auth, Rate Limiting       │
├──────────────────────┼────────────────────────────────────────────────┤
│ Backend Orchestrator │ Python (FastAPI), LangGraph / LangChain       │
│                      │ for agent orchestration                       │
├──────────────────────┼────────────────────────────────────────────────┤
│ SLM Inference        │ vLLM / TGI (Text Generation Inference)        │
│                      │ for local model serving                       │
├──────────────────────┼────────────────────────────────────────────────┤
│ LLM API              │ Claude API (Anthropic), OpenAI API (fallback) │
├──────────────────────┼────────────────────────────────────────────────┤
│ Vector Database      │ FAISS (local) / Milvus (distributed)          │
├──────────────────────┼────────────────────────────────────────────────┤
│ Search Engine        │ Elasticsearch / OpenSearch (BM25 sparse)      │
├──────────────────────┼────────────────────────────────────────────────┤
│ Graph Database       │ Neo4j (medical knowledge graph)               │
├──────────────────────┼────────────────────────────────────────────────┤
│ Primary Database     │ PostgreSQL (with JSONB for structured data)   │
├──────────────────────┼────────────────────────────────────────────────┤
│ Cache                │ Redis (hot cache), PostgreSQL (warm cache)    │
├──────────────────────┼────────────────────────────────────────────────┤
│ Message Queue        │ RabbitMQ / Redis Streams (async processing)   │
├──────────────────────┼────────────────────────────────────────────────┤
│ Web Crawler          │ Scrapy + Playwright (BYT sources)             │
├──────────────────────┼────────────────────────────────────────────────┤
│ Blockchain           │ Hyperledger Fabric + Polygon (hybrid)         │
├──────────────────────┼────────────────────────────────────────────────┤
│ Monitoring           │ Prometheus + Grafana, Sentry (errors)         │
├──────────────────────┼────────────────────────────────────────────────┤
│ ML Experiment Track  │ MLflow / Weights & Biases                     │
├──────────────────────┼────────────────────────────────────────────────┤
│ Container / Deploy   │ Docker, Kubernetes (K8s), Helm charts         │
├──────────────────────┼────────────────────────────────────────────────┤
│ GPU Infrastructure   │ NVIDIA A100/H100 (inference), Cloud GPU       │
│                      │ (AWS/GCP) or on-premise                       │
└──────────────────────┴────────────────────────────────────────────────┘
```

### 7.3 Infrastructure Requirements

```
Minimum Infrastructure for Production:

GPU Servers (Model Inference):
├── 1x A100 80GB (or 2x A6000 48GB) — Primary synthesis model (Qwen2.5-72B)
├── 1x A6000 48GB — SLM fleet (routing, NER, reranking, claim decomposition)
│   └── Multiple models share GPU via vLLM continuous batching
└── Reserve: 1x additional GPU for Tier 3 specialist agents (parallel)

CPU Servers:
├── 2x 32-core servers — API gateway, orchestrator, crawlers
├── 1x 16-core server — Elasticsearch, vector DB operations
└── 1x 8-core server — Blockchain nodes (Hyperledger)

Storage:
├── 2 TB SSD — Vector indices, embeddings cache
├── 5 TB HDD — Medical document corpus, crawled data
└── 500 GB SSD — PostgreSQL, Redis, operational data

Network:
├── Low-latency connection to external APIs (<100ms RTT)
├── Internal: 10 Gbps between GPU and CPU servers
└── External: 1 Gbps upstream for user traffic

Estimated Cloud Cost (Monthly):
├── GPU instances: $3,000 - $5,000
├── CPU instances: $500 - $800
├── Storage: $200 - $400
├── API costs (Claude/OpenAI): $500 - $2,000 (usage-dependent)
├── Blockchain infrastructure: $250 - $620
├── Monitoring & misc: $200 - $300
└── TOTAL: ~$4,650 - $9,120/month
```

---

## Summary

This document outlines CLARA's comprehensive technical architecture across seven key dimensions:

1. **Two-Layer Intent Router** — Ultra-fast SLM-based routing (<100ms) that classifies user role and intent, enabling personalized response generation across three user tiers.

2. **Agentic RAG Pipeline** — Modular, multi-source retrieval with 10+ medical data sources, hybrid search (BM25 + dense embeddings), cross-encoder reranking, and intelligent 4-layer caching with UPDATE-not-APPEND semantics for medical knowledge currency.

3. **FIDES Fact Checker** — Five-step verification pipeline (Claim Decomposition → Evidence Retrieval → Cross-Reference → Citation Validation → Verdict) that catches medical hallucinations before they reach users, with special handling for drug dosages, interactions, and treatment recommendations.

4. **Multi-Tier Workflows** — Three distinct workflow tiers (Simple <2min, Research 5-20min with Perplexity-style streaming, Clinical AI Council <20min with live processing logs) each optimized for their target user group.

5. **Medical SLMs** — Comprehensive analysis of BioMistral, MedAlpaca, PMC-LLaMA, Meditron, OpenBioLLM, Qwen-Med, and Phi-3-med variants, with a Vietnamese fine-tuning strategy using QLoRA on ~400K curated instruction pairs from Dược thư, BYT protocols, and medical textbooks.

6. **Blockchain** — Hybrid Hyperledger + Polygon architecture for immutable audit trails, data integrity verification via on-chain hashing, and granular patient consent management, all designed for zero user-facing latency impact at ~$250-620/month.

7. **System Integration** — End-to-end architecture connecting all layers from user interface through intent routing, multi-tier workflows, RAG engine, synthesis & verification, data & knowledge stores, external APIs, to audit & compliance.

---

> **Next Steps:** Detailed implementation planning, proof-of-concept for Tier 1 workflow, Vietnamese medical SLM fine-tuning data collection, and Hyperledger Fabric pilot deployment.

---

*Document generated for CLARA (Clinical Agent for Retrieval & Analysis) — Vietnamese Medical AI Assistant*
*© 2025 CLARA Project — Internal Technical Documentation*