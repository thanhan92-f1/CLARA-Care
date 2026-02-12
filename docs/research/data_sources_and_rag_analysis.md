# CLARA — Data Sources, RAG Processing Pipeline & Vietnamese Medical Knowledge Integration

> **Document Type:** Technical Research & Analysis
> **Project:** CLARA (Clinical Agent for Retrieval & Analysis)
> **Last Updated:** 2025
> **Status:** Active Research Document
> **Cross-References:** `technical_architecture_deep_dive.md`, `market_research_global.md`, `product_proposal.md`

---

## Table of Contents

1. [Data Source Analysis](#1-data-source-analysis)
   - [1.1 International Medical APIs](#11-international-medical-apis)
   - [1.2 Vietnamese-Specific Sources](#12-vietnamese-specific-sources)
   - [1.3 Source Registry Summary](#13-source-registry-summary)
2. [RAG Processing Pipeline](#2-rag-processing-pipeline)
   - [2.1 Document Ingestion & Preprocessing](#21-document-ingestion--preprocessing)
   - [2.2 Chunking Strategy](#22-chunking-strategy)
   - [2.3 Embedding Model Selection](#23-embedding-model-selection)
   - [2.4 Vector Database Analysis](#24-vector-database-analysis)
   - [2.5 Hybrid Search Architecture](#25-hybrid-search-architecture)
   - [2.6 Cross-Encoder Reranking](#26-cross-encoder-reranking)
   - [2.7 Context Window Optimization](#27-context-window-optimization)
   - [2.8 Citation Extraction & Validation](#28-citation-extraction--validation)
3. [Cache Strategy](#3-cache-strategy)
   - [3.1 Design Philosophy](#31-design-philosophy)
   - [3.2 Four-Layer Cache Architecture](#32-four-layer-cache-architecture)
   - [3.3 Update vs Add Logic](#33-update-vs-add-logic)
   - [3.4 Medical Data Invalidation](#34-medical-data-invalidation)
   - [3.5 Database Schema for Cache Layer](#35-database-schema-for-cache-layer)
4. [Synthesis & Verification Nodes](#4-synthesis--verification-nodes)
   - [4.1 Synthesis Node](#41-synthesis-node)
   - [4.2 Verification Node](#42-verification-node)
   - [4.3 FIDES-Inspired Fact-Checking](#43-fides-inspired-fact-checking)
5. [Vietnamese Medical NLP Challenges](#5-vietnamese-medical-nlp-challenges)
   - [5.1 Vietnamese Medical Terminology Mapping](#51-vietnamese-medical-terminology-mapping)
   - [5.2 Diacritics Handling](#52-diacritics-handling)
   - [5.3 Medical Abbreviations in Vietnamese](#53-medical-abbreviations-in-vietnamese)
   - [5.4 Cross-Language Entity Linking](#54-cross-language-entity-linking)
6. [Implementation Recommendations](#6-implementation-recommendations)

---

## 1. Data Source Analysis

CLARA integrates **10+ medical data sources** spanning international APIs, Vietnamese-specific databases, and ontological systems. Each source serves a distinct role in the knowledge pipeline and has unique access patterns, update frequencies, and integration requirements.

### 1.1 International Medical APIs

#### 1.1.1 PubMed / PMC (NCBI E-Utilities)

| Attribute | Detail |
|-----------|--------|
| **Endpoint** | `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/` |
| **Authentication** | API key (free registration at NCBI) |
| **Rate Limit** | 3 requests/second (without key); **10 requests/second** (with API key) |
| **Data Format** | XML (default), JSON (via `retmode=json`) |
| **PMID Structure** | 1-8 digit unique identifier (e.g., `PMID:12345678`) |

**Core E-Utilities Used by CLARA:**

| API | Endpoint | CLARA Use Case |
|-----|----------|----------------|
| **ESearch** | `esearch.fcgi` | Search PubMed for relevant PMIDs using MeSH-enriched queries |
| **EFetch** | `efetch.fcgi` | Retrieve full abstracts, metadata, and citation details by PMID |
| **ELink** | `elink.fcgi` | Find related articles, cited-by chains for evidence expansion |

**CLARA Query Construction Strategy:**

```
User Query: "SGLT2 inhibitors in heart failure with preserved EF"

→ MeSH-enriched query:
  "Sodium-Glucose Transporter 2 Inhibitors"[MeSH] AND
  "Heart Failure"[MeSH] AND "preserved ejection fraction"

→ Filters applied:
  - Humans only
  - English OR Vietnamese language
  - Last 5 years (date priority)
  - Publication types: Clinical Trial, Meta-Analysis, Systematic Review

→ Retrieval: Top 20 abstracts per sub-query
→ Cross-reference with locally cached PubMed index (updated weekly)
```

**Key Considerations:**
- **MeSH Term Mapping:** CLARA's NER pipeline extracts medical entities and maps them to MeSH terms for precision retrieval
- **Date Prioritization:** Last 5 years weighted higher; older landmark studies included via citation chain analysis
- **Vietnamese Content Gap:** PubMed has limited Vietnamese-language content (~0.1% of total); CLARA compensates with Vietnamese source integration
- **Bulk Download:** PubMed Baseline (annual XML dumps) used for local index; daily update files applied incrementally

#### 1.1.2 ClinicalTrials.gov API

| Attribute | Detail |
|-----------|--------|
| **Endpoint** | `https://clinicaltrials.gov/api/v2/` |
| **Authentication** | None required (public API) |
| **Rate Limit** | Not strictly published; responsible use expected |
| **NCT Format** | `NCT` prefix + 8-digit number (e.g., `NCT04375397`) |
| **Data Format** | JSON (v2 API default) |

**Key v2 API Endpoints:**

| Endpoint | Purpose |
|----------|---------|
| `/studies` | Search studies by condition, intervention, status |
| `/studies/{nctId}` | Get single study by NCT ID |
| `/stats/size` | Get count of matching studies |
| `/stats/field/values` | Get enumerated field values |

**CLARA Integration Strategy:**

```
Pipeline:
  1. Query by condition + intervention from decomposed query
  2. Filter by status: RECRUITING, ACTIVE_NOT_RECRUITING, COMPLETED
  3. Return: NCT ID, title, phase, enrollment, primary outcome
  4. Cache completed trial results for RAG corpus enrichment
  5. Track status changes for ongoing trials cited in responses

NCT Verification (FIDES Step 4):
  - API call: clinicaltrials.gov/api/v2/studies/{NCT}
  - Check: trial exists and status is as claimed
  - Check: results match claimed outcomes
  - Flag: withdrawn/terminated trials cited as evidence
```

**Search Capabilities:**
- Full-text search across all study fields
- Structured queries by condition, intervention, sponsor, location
- Geographic filtering (important for Vietnam-relevant trials)
- Phase filtering (Phase I–IV)
- Date range filtering for temporal relevance



#### 1.1.3 WHO ICD-11 API

| Attribute | Detail |
|-----------|--------|
| **Endpoint** | `https://id.who.int/icd/` |
| **Authentication** | OAuth2 (Client Credentials flow) |
| **Rate Limit** | Reasonable use; token-based access |
| **Classification Structure** | Hierarchical tree: Chapters → Blocks → Categories → Subcategories |
| **Languages** | 19+ languages available; Vietnamese translation partially available |

**ICD-11 Hierarchical Structure:**

```
Chapter (e.g., 05 — Endocrine, nutritional or metabolic diseases)
  └── Block (e.g., 5A10-5A2Z — Diabetes mellitus)
       └── Category (e.g., 5A11 — Type 2 diabetes mellitus)
            └── Subcategory (e.g., 5A11.0 — with kidney complications)
                 └── Extension codes (severity, laterality, etc.)
```

**CLARA Integration Pattern:**

```
1. Extract disease entities from query via NER
2. Search ICD-11 for matching codes (multilingual search endpoint)
3. Use hierarchical structure to expand/narrow search scope
   - Parent traversal: Find broader disease categories
   - Child traversal: Find specific subtypes
4. Cross-language disease name resolution (English ↔ Vietnamese)
5. Store ICD-11 mappings in local cache for offline use
6. Update frequency: Annual full refresh + incremental via API
```

**Vietnamese Translation Considerations:**
- ICD-11 supports Vietnamese in its Coding Tool (ICD-11 MMS)
- Vietnamese translations follow BYT's official localization (Thông tư 46/2016/TT-BYT for ICD-10; ICD-11 adoption in progress)
- CLARA maintains a custom Vietnamese ↔ ICD-11 mapping table for terms not yet officially translated
- Mapping priority: Official WHO Vietnamese → BYT mappings → CLARA's AI-assisted translation (reviewed by physicians)

#### 1.1.4 RxNorm API (NLM)

| Attribute | Detail |
|-----------|--------|
| **Endpoint** | `https://rxnav.nlm.nih.gov/REST/` |
| **Authentication** | None required (public API) |
| **Rate Limit** | 20 requests/second |
| **Identifier** | RxCUI (RxNorm Concept Unique Identifier) — numeric |
| **Data Format** | JSON or XML |

**Key Endpoints:**

| Endpoint | Purpose | CLARA Use Case |
|----------|---------|----------------|
| `/rxcui?name={drugName}` | Get RxCUI for drug name | Normalize brand → generic → RxCUI |
| `/interaction/list?rxcuis={ids}` | Check drug-drug interactions | DDI safety checks in CareGuard |
| `/drugs?conceptId={rxcui}` | Get drug details by RxCUI | Drug monograph enrichment |
| `/rxclass/class/byDrugName` | Get drug classification | Pharmacological grouping |
| `/approximateTerm?term={term}` | Fuzzy name matching | Handle Vietnamese drug name variants |

**Drug Normalization Pipeline:**

```
Vietnamese Drug Name Input: "Glucofast 500mg"
  │
  ├── Step 1: Local Vietnamese drug name lookup (Dược thư mapping table)
  │            → Maps to: "Metformin 500mg"
  │
  ├── Step 2: RxNorm API: /rxcui?name=Metformin
  │            → RxCUI: 6809
  │
  ├── Step 3: Verify: /drugs?conceptId=6809
  │            → Confirms: Metformin Hydrochloride
  │
  ├── Step 4: Drug class: /rxclass/class/byDrugName?drugName=metformin
  │            → Class: Biguanides, Antihyperglycemics
  │
  └── Step 5: Interactions: /interaction/list?rxcuis=6809
               → Returns known DDIs with severity levels
```

**Vietnamese Drug Name Challenges:**
- Many Vietnamese-market drugs have local brand names with no direct RxNorm mapping
- CLARA maintains a curated `vn_brand_to_rxcui` mapping table (~5,000 entries from Dược thư)
- Drugs unique to Vietnamese market are flagged with `rxcui_status: "VN_ONLY"` and verified against Dược thư Quốc gia

#### 1.1.5 openFDA API

| Attribute | Detail |
|-----------|--------|
| **Endpoint** | `https://api.fda.gov/` |
| **Authentication** | API key (optional; higher rate limits with key) |
| **Rate Limit** | 40 requests/minute (without key); **240 requests/minute** (with key) |
| **Data Source** | FAERS (FDA Adverse Event Reporting System) |
| **Data Format** | JSON |

**Key Endpoints:**

| Endpoint | Purpose | CLARA Use Case |
|----------|---------|----------------|
| `/drug/event.json` | Adverse event reports | Post-market safety signals |
| `/drug/label.json` | Drug labeling information | Official prescribing info |
| `/drug/recall.json` | Drug recalls | Safety alerts for cited drugs |
| `/drug/enforcement.json` | Enforcement actions | Regulatory compliance checking |

**CLARA Integration:**

```
Use Case 1 — ADR Signal Detection:
  Query: "What are reported adverse effects of empagliflozin?"
  → API: /drug/event.json?search=patient.drug.openfda.generic_name:"empagliflozin"
  → Aggregate: Top adverse reactions by frequency
  → Cross-reference with Dược thư ADR section for Vietnamese context

Use Case 2 — Drug Recall Checking:
  When CLARA recommends a drug:
  → Background check: /drug/recall.json?search=openfda.generic_name:"drug_name"
  → If active recall found → flag in response with warning
  → Check Vietnamese DAV (Cục Quản lý Dược) for local recall status

Use Case 3 — Label Verification:
  For dosage fact-checking (FIDES Step 4):
  → /drug/label.json for official FDA-approved dosing
  → Cross-reference with Dược thư dosing
  → Flag discrepancies for physician review
```

**FAERS Data Considerations:**
- Voluntary reporting system — not all adverse events captured
- Reports do not prove causation; CLARA must present as "reported associations"
- Geographic bias toward US market; supplemented by Vietnamese pharmacovigilance data from DAV
- Used primarily for Tier 2/3 (researcher/doctor) responses; simplified for Tier 1 (normal users)

### 1.2 Vietnamese-Specific Sources

#### 1.2.1 Dược thư Quốc gia Việt Nam (National Drug Formulary)

| Attribute | Detail |
|-----------|--------|
| **Publisher** | Vietnamese Ministry of Health (Bộ Y tế — BYT) |
| **Format** | PDF-based publication |
| **Current Edition** | Xuất bản lần 3 (3rd edition) |
| **Update Frequency** | Every 2-3 years (new edition) + monthly BYT circulars |
| **Estimated Drug Entries** | ~15,000 |
| **Language** | Vietnamese (with international drug names) |

**Ingestion Strategy:**

```
1. OCR + Structured Extraction from official PDF
   └── Tool: PaddleOCR / Tesseract with Vietnamese language pack

2. Parse drug monographs into structured schema:
   ┌─────────────────────────────────────────────────────┐
   │  Structured Drug Monograph Schema                    │
   ├─────────────────────────────────────────────────────┤
   │  Tên thuốc         │ Drug name (Vietnamese + Intl)  │
   │  Nhóm dược lý      │ Pharmacological group          │
   │  Chỉ định           │ Indications                    │
   │  Chống chỉ định     │ Contraindications              │
   │  Liều dùng          │ Dosage (adult, pediatric,      │
   │                     │         renal adjustment)       │
   │  Tác dụng KMM       │ Adverse effects                │
   │  Tương tác thuốc    │ Drug interactions              │
   │  Thận trọng         │ Precautions                    │
   │  Bảo quản           │ Storage conditions             │
   │  Dạng bào chế       │ Dosage forms                   │
   └─────────────────────────────────────────────────────┘

3. Store in structured drug database with Vietnamese + English fields
4. Map each drug to RxNorm RxCUI where possible
5. Flag drugs unique to Vietnamese market (no RxNorm mapping)
```

**Data Quality Challenges:**
- PDF-based source requires high-quality OCR with Vietnamese diacritics support
- Table structures in PDF are often complex and require custom parsing
- Some older entries may not reflect current medical consensus
- Cross-edition change tracking needed for cache invalidation

#### 1.2.2 BYT Monthly Publications & Circulars

**Sources to Crawl:**

| Source URL | Organization | Content Focus |
|-----------|-------------|---------------|
| `https://moh.gov.vn` | Ministry of Health (BYT) | Policy, guidelines, circulars |
| `https://kcb.vn` | Cục Quản lý Khám chữa bệnh | Medical examination & treatment dept |
| `https://dav.gov.vn` | Cục Quản lý Dược (DAV) | Drug administration, approvals, recalls |
| Vietnamese medical journals | Tạp chí Y học Việt Nam, Y học TP.HCM | Research articles, clinical reports |

**Crawler Architecture:**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Scrapy /    │───▶│  Document    │───▶│  Structured  │
│  Playwright  │    │  Processor   │    │  Storage     │
│  Crawler     │    │  (PDF/HTML   │    │  (PostgreSQL │
│              │    │   → Text)    │    │   + Vector)  │
└──────────────┘    └──────────────┘    └──────────────┘
      │                    │                    │
      │               ┌────▼──────┐        ┌────▼─────┐
      │               │ Vietnamese│        │ Embedding│
      │               │ Medical   │        │ Index    │
      │               │ NER       │        │ (FAISS)  │
      │               └───────────┘        └──────────┘
      │
Schedule: Weekly crawl, daily for urgent circulars
```

**Content Types to Extract:**

| Vietnamese Term | English | Priority | Crawl Frequency |
|----------------|---------|----------|-----------------|
| **Thông tư** | Circulars | Critical | Daily check |
| **Quyết định** | Decisions | High | Weekly |
| **Công văn** | Official letters | Critical (if safety-related) | Daily check |
| **Hướng dẫn chẩn đoán và điều trị** | Diagnosis & treatment guidelines | Critical | Weekly |
| **Thông báo thu hồi thuốc** | Drug recall notices | Critical | Daily check |

#### 1.2.3 Vietnamese Clinical Guidelines & Protocols

Vietnamese clinical guidelines are issued by BYT and serve as the **authoritative standard** for treatment in Vietnam. They often differ from international guidelines due to:
- Different drug availability (some international drugs not registered in Vietnam)
- Different disease prevalence patterns (tropical diseases, specific hepatitis strains)
- Different healthcare resource levels (primary vs tertiary care access)
- Cultural factors in patient-physician interaction

**Key Protocol Categories:**

| Specialty (Vietnamese) | English | Example Protocol |
|----------------------|---------|-----------------|
| Nội khoa | Internal Medicine | Phác đồ điều trị đái tháo đường type 2 |
| Ngoại khoa | Surgery | Hướng dẫn phẫu thuật nội soi |
| Sản khoa | Obstetrics | Phác đồ xử trí tiền sản giật |
| Nhi khoa | Pediatrics | Hướng dẫn điều trị viêm phổi trẻ em |
| Tim mạch | Cardiology | Phác đồ điều trị suy tim |
| Truyền nhiễm | Infectious Disease | Hướng dẫn điều trị COVID-19 |

**TCVN (Tiêu chuẩn Việt Nam) Integration:**
- TCVN standards define Vietnamese national standards for medical terminology
- CLARA maps TCVN medical terminology to UMLS/SNOMED concepts where applicable
- Vietnamese-specific disease classifications (e.g., Vietnamese hepatitis B treatment protocols differ from AASLD guidelines) are prioritized in responses to Vietnamese doctors
- BYT-issued treatment protocols take precedence over international guidelines when advising on Vietnamese clinical practice

#### 1.2.4 Additional Vietnamese Sources

| Source | Type | Access Method | Update Frequency |
|--------|------|--------------|------------------|
| **UMLS/SNOMED CT** | Medical ontology | Local DB (bulk download from NLM) | Biannual |
| **Local Knowledge Graph** | Entity relationships | Neo4j graph DB | Continuous (AI-enriched) |
| **Vietnamese medical forums** | Real-world queries | Crawled (HoiYTe, Webtretho health) | Training data only |
| **Vietnamese medical textbooks** | Academic content | OCR + extraction (Nội khoa, Ngoại khoa, etc.) | Per new edition |
| **Vietnamese medical exams** | Assessment Q&A | Curated (Bác sĩ Nội trú, CK I/II) | Annual |

### 1.3 Source Registry Summary

```
┌────────────────┬───────────┬────────────┬──────────────────────────────┐
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

---

## 2. RAG Processing Pipeline

CLARA implements a **modular agentic RAG** architecture where autonomous sub-agents manage different stages of the retrieval-synthesis pipeline. Unlike simple RAG (retrieve → generate), CLARA's pipeline supports iterative reasoning, multi-source triangulation, and self-correction.

### 2.1 Document Ingestion & Preprocessing

**Pipeline Overview:**

```
Raw Sources → Acquisition → Preprocessing → Chunking → Embedding → Indexing
     │              │              │             │           │          │
     │         ┌────┴────┐   ┌────┴────┐   ┌────┴───┐  ┌───┴───┐  ┌──┴───┐
     │         │ API     │   │ Clean   │   │ Hier-  │  │ BGE-  │  │FAISS/│
     │         │ Crawlers│   │ Normalize│  │ archical│ │ M3    │  │Milvus│
     │         │ OCR     │   │ NER Tag │   │ Split  │  │ BM25  │  │ES/OS │
     │         └─────────┘   └─────────┘   └────────┘  └───────┘  └──────┘
```

**Preprocessing Steps:**

1. **Language Detection:** Classify content as `vi`, `en`, or `mixed`
2. **Text Cleaning:** Remove boilerplate, headers/footers, page numbers
3. **Vietnamese Text Normalization:**
   - Unicode NFC normalization for diacritics consistency
   - Compound word boundary detection (Vietnamese word segmentation via VnCoreNLP/PhoBERT tokenizer)
   - Medical abbreviation expansion using custom dictionary
4. **Medical NER Tagging:** Extract and tag medical entities (diseases, drugs, symptoms, procedures, lab values)
5. **Structural Parsing:** Identify document sections (for section-aware chunking)
6. **Metadata Extraction:** PMID, DOI, authors, journal, publication date, evidence level

### 2.2 Chunking Strategy

CLARA uses a **hierarchical, medical-aware chunking** approach that preserves document structure and clinical meaning rather than naive fixed-size splitting.

**Three-Level Hierarchical Chunking:**

```
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
```

**Semantic Chunking vs Fixed-Size — CLARA's Decision:**

| Approach | Pros | Cons | CLARA Use |
|----------|------|------|-----------|
| **Fixed-size (512 tokens)** | Simple, consistent | Breaks semantic units, splits tables | ❌ Not used alone |
| **Sentence-based** | Respects natural boundaries | Variable size, may be too small | ✅ Used at Level 3 |
| **Section-based** | Preserves document structure | Sections may be too large | ✅ Used at Level 2 |
| **Semantic (topic shift detection)** | Best meaning preservation | Computationally expensive | ✅ Used for guidelines |
| **Hierarchical (CLARA's approach)** | Best of all approaches | More complex pipeline | ✅ **Primary strategy** |

**Chunk Metadata Enrichment:**

Every chunk carries rich metadata for retrieval precision and citation tracking:

```json
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
  "total_chunks": 12,
  "source_type": "research_article",
  "journal": "NEJM",
  "embedding_model": "bge-m3"
}
```

### 2.3 Embedding Model Selection

**CLARA's Primary Choice: BGE-M3 (BAAI)**

| Property | Detail |
|----------|--------|
| **Model** | `BAAI/bge-m3` |
| **Dimensions** | 1024 |
| **Max Tokens** | 8192 |
| **Languages** | 100+ languages including **native Vietnamese support** |
| **Retrieval Modes** | Dense, Sparse, AND Multi-vector (ColBERT-style) simultaneously |

**Why BGE-M3 for CLARA:**

1. **Vietnamese Native Support:** Unlike PubMedBERT or Med-BERT (English-only), BGE-M3 was trained on multilingual data including Vietnamese text
2. **Multi-Functionality:** Single model produces dense, sparse, AND multi-vector representations — enabling hybrid search without separate models
3. **Medical Terminology Handling:** Strong performance on domain-specific terminology despite not being medical-specific
4. **Long Context:** 8192 token support allows embedding larger chunks without truncation
5. **MTEB Benchmark Performance:** Top-ranked on multilingual retrieval benchmarks

**Alternative Models for Specific Use Cases:**

| Model | Use Case | When to Use |
|-------|----------|-------------|
| **PubMedBERT** | English medical content only | When English precision > multilingual breadth |
| **Med-BERT** | English clinical NLP tasks | Clinical NER, relation extraction |
| **PhoBERT** | Vietnamese NLP tasks | Vietnamese NER, word segmentation |
| **BGE-Reranker-v2-m3** | Cross-encoder reranking | Stage 2 reranking (see Section 2.6) |

### 2.4 Vector Database Analysis

**CLARA's Decision: Milvus (production) / FAISS (local development)**

| Feature | Qdrant | Pinecone | Weaviate | ChromaDB | **Milvus** | FAISS |
|---------|--------|----------|----------|----------|-----------|-------|
| **Deployment** | Self-hosted / Cloud | Cloud-only (managed) | Self-hosted / Cloud | Self-hosted | Self-hosted / Cloud | Library (in-process) |
| **Hybrid Search** | ✅ Dense + Sparse | ✅ Sparse vectors | ✅ BM25 + Dense | ❌ Dense only | ✅ **Dense + Sparse** | ❌ Dense only |
| **Scalability** | Good (horizontal) | Excellent (managed) | Good | Limited | **Excellent** | Limited |
| **Vietnamese Support** | Neutral | Neutral | Has tokenizer plugins | Neutral | **Neutral** | Neutral |
| **Filtering** | Advanced | Good | GraphQL-based | Basic | **Advanced** | Manual |
| **Open Source** | ✅ Apache 2.0 | ❌ Proprietary | ✅ BSD-3 | ✅ Apache 2.0 | ✅ **Apache 2.0** | ✅ MIT |
| **Production Ready** | ✅ | ✅ | ✅ | ⚠️ (dev-focused) | ✅ | ⚠️ (library) |
| **Multi-tenancy** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Cost** | Self-hosted | $70+/month | Self-hosted | Free | **Self-hosted** | Free |
| **Max Vectors** | Billions | Billions | Billions | Millions | **Billions** | Billions |

**Why Milvus for CLARA Production:**
1. **Hybrid Search Native:** Supports both dense (BGE-M3) and sparse (BM25) retrieval in a single query
2. **Distributed Architecture:** Scales horizontally for growing medical corpus
3. **Open Source:** No vendor lock-in; self-hosted for data privacy (critical for medical data)
4. **Metadata Filtering:** Advanced filtering by publication date, source type, evidence grade, language
5. **GPU Acceleration:** IVF-PQ index with GPU support for fast nearest-neighbor search

**Why FAISS for Development:**
- Zero infrastructure overhead for local development
- In-memory speed for rapid prototyping
- IVF-PQ indexing for development-scale datasets (<1M vectors)

### 2.5 Hybrid Search Architecture

CLARA implements a **dual-path retrieval** combining dense semantic search with sparse keyword matching:

```
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

**Why Hybrid Search for Medical RAG:**

| Scenario | Dense Only | Sparse (BM25) Only | **Hybrid** |
|----------|-----------|-------------------|-----------|
| "Treatment for diabetes" | ✅ Good semantic match | ✅ Good keyword match | ✅ Best of both |
| "SGLT2i in HFpEF" (abbreviations) | ⚠️ May miss abbreviations | ✅ Exact acronym match | ✅ Catches both |
| "How does metformin work?" | ✅ Understands intent | ⚠️ Misses paraphrased content | ✅ Combined strength |
| "Liều metformin cho BN suy thận" (VN) | ✅ Multilingual embedding | ⚠️ Needs VN tokenizer | ✅ Both paths contribute |
| Drug name: "Glucophage XR 500mg" | ⚠️ May match generically | ✅ Exact brand match | ✅ Precise + contextual |

**Custom Vietnamese Medical BM25 Analyzer:**
- Custom tokenizer that preserves Vietnamese compound words (e.g., "đái tháo đường" as single token, not three)
- Medical synonym dictionary: `thuốc ≈ dược phẩm`, `bệnh nhân ≈ người bệnh`
- Medical entity boosting: Drug names, disease names, lab values receive 2x BM25 weight

### 2.6 Cross-Encoder Reranking

After initial hybrid retrieval, CLARA applies a **multi-stage reranking pipeline** to maximize precision:

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

**Why BGE-Reranker-v2-m3:**
- Multilingual cross-encoder — handles Vietnamese + English medical queries
- Higher precision than bi-encoder alone (cross-attention between query and document)
- Computationally feasible for top-100 → top-20 reranking (not full corpus)

### 2.7 Context Window Optimization

CLARA optimizes context window usage for 128K context window models (Qwen2.5-72B):

```
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

### 2.8 Citation Extraction & Validation

Every CLARA response includes **traceable citations** that are validated before delivery:

**Citation Types Supported:**

| Citation Type | Format | Validation Method |
|--------------|--------|-------------------|
| PubMed | `PMID:12345678` | EFetch API → verify existence + content match |
| Clinical Trials | `NCT04375397` | ClinicalTrials.gov API → verify trial status |
| Drug Reference | `RxCUI:6809` | RxNorm API → verify drug identity |
| BYT Protocol | `Thông tư 30/2018/TT-BYT` | Local DB → verify document exists and is current |
| Dược thư | `DTQG:Metformin` | Local drug DB → verify monograph content |
| WHO ICD-11 | `ICD-11:5A11` | ICD-11 API → verify code validity |

**Citation Validation Pipeline:**

```
For each citation in synthesized response:
  1. Extract citation identifier (PMID, NCT, RxCUI, etc.)
  2. Verify identifier exists via respective API/DB
  3. Check: cited content matches actual source content
  4. Check: source is current (not retracted, superseded, or expired)
  5. Flag: retracted papers, withdrawn trials, outdated guidelines
  6. Score: citation_confidence = f(existence, content_match, currency)
  7. If citation_confidence < 0.5 → remove citation, add uncertainty note
```

---

## 3. Cache Strategy

### 3.1 Design Philosophy

**Core Principle:** Cache stores *relevant knowledge*, not just raw query-response pairs. When new information arrives, the cache **updates existing entries** rather than accumulating duplicates.

This is critical for medical AI because:
- Medical knowledge changes (new guidelines supersede old ones)
- Drug safety profiles evolve (new adverse events discovered)
- Blindly appending creates contradictory information in the cache
- Stale medical information can be dangerous

### 3.2 Four-Layer Cache Architecture

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
│  │   Example: "metformin:CKD_dosing"                             │
│  ├── Value: synthesized knowledge snippet + sources              │
│  ├── UPDATE LOGIC (not append) — see Section 3.3                 │
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
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Update vs Add Logic

**Core Rule: UPDATE, not APPEND**

When new evidence arrives for an existing cached medical entity, CLARA uses intelligent update logic rather than blindly appending:

```
┌──────────────────────────────────────────────────────────────────┐
│              KNOWLEDGE ENTITY UPDATE DECISION TREE                │
│                                                                   │
│  Trigger: New evidence found for entity+context already in cache │
│                                                                   │
│  Step 1: Compare new vs cached evidence quality                  │
│  ├── Quality factors:                                            │
│  │   ├── Evidence level (Meta-analysis > RCT > Case report)      │
│  │   ├── Recency (newer publication date = higher weight)        │
│  │   ├── Source authority (BYT protocol > journal article)       │
│  │   └── Vietnamese relevance (VN-specific > international)     │
│  │                                                                │
│  Step 2: Decision Matrix                                         │
│  │                                                                │
│  │  IF new evidence is higher quality AND more recent:           │
│  │    → ACTION: REPLACE cached knowledge entirely                │
│  │    → Archive old entry with timestamp                         │
│  │    → Invalidate all Layer 1 cache entries that used this data │
│  │                                                                │
│  │  IF new evidence CONTRADICTS cached evidence:                 │
│  │    → ACTION: FLAG FOR REVIEW                                  │
│  │    → Store both versions with conflict_status: "CONTESTED"    │
│  │    → Alert medical review team                                │
│  │    → Add uncertainty marker to any response using this entity │
│  │    → Auto-resolve if one source is definitively authoritative │
│  │      (e.g., BYT protocol supersedes older journal article)    │
│  │                                                                │
│  │  IF new evidence SUPPLEMENTS (doesn't contradict):            │
│  │    → ACTION: MERGE into existing entry                        │
│  │    → Append new source citations                              │
│  │    → Update confidence score upward (more corroboration)      │
│  │    → Update last_verified timestamp                           │
│  │                                                                │
│  │  NEVER blindly append — medical knowledge must stay current   │
│  │  Stale or contradictory medical info can endanger patients    │
└──────────────────────────────────────────────────────────────────┘
```

**Conflict Resolution Priority Order:**

| Priority | Source Type | Rationale |
|----------|-----------|-----------|
| 1 (Highest) | BYT Protocol / Thông tư | Official Vietnamese regulatory authority |
| 2 | Clinical Practice Guideline (AHA, ESC, KDIGO) | International expert consensus |
| 3 | Meta-analysis / Systematic Review | Highest evidence level |
| 4 | RCT (Randomized Controlled Trial) | Gold standard for individual studies |
| 5 | Dược thư Quốc gia | Official Vietnamese drug reference |
| 6 | Observational study | Lower evidence level |
| 7 | Expert opinion / Case report | Lowest evidence level |

### 3.4 Medical Data Invalidation

**Invalidation Strategy: TTL-based + Event-based**

```
┌────────────────────────────────────────────────────────────────┐
│              CACHE INVALIDATION TRIGGERS                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIME-BASED (TTL) INVALIDATION:                                │
│  ├── Layer 1 (Query-Response):    TTL = 24 hours               │
│  ├── Layer 2 (Knowledge Entity):  TTL = 7 days                 │
│  ├── Layer 3 (Embedding Cache):   TTL = 30 days                │
│  └── Layer 4 (Freshness Tracker): Continuous monitoring        │
│                                                                 │
│  EVENT-BASED INVALIDATION:                                      │
│  ├── BYT Circular Checker:                                      │
│  │   ├── Frequency: Daily crawl of moh.gov.vn, dav.gov.vn     │
│  │   ├── Trigger: New Thông tư, Quyết định, drug recall        │
│  │   └── Action: Invalidate all cache entries for affected     │
│  │              drugs/conditions + re-crawl + re-embed          │
│  │                                                              │
│  ├── PubMed New Articles:                                       │
│  │   ├── Frequency: Weekly scan via E-utilities (esearch)       │
│  │   ├── Trigger: New systematic reviews, meta-analyses,       │
│  │   │            guideline updates for cached entities          │
│  │   └── Action: Flag affected cache entries for re-synthesis   │
│  │                                                              │
│  ├── Drug Database Updates:                                     │
│  │   ├── Frequency: Monthly (Dược thư), Weekly (RxNorm)        │
│  │   ├── Trigger: New drug approvals, interaction updates,      │
│  │   │            safety alerts, recalls                         │
│  │   └── Action: Invalidate drug-related cache entries +        │
│  │              update structured drug DB                       │
│  │                                                              │
│  └── Guideline Version Checker:                                 │
│      ├── Frequency: Quarterly                                   │
│      ├── Trigger: New editions of major guidelines              │
│      │   (ADA, ESC, KDIGO, BYT protocols)                      │
│      └── Action: Full re-synthesis for affected conditions      │
│                                                                 │
│  CACHE WARMING STRATEGY:                                        │
│  ├── Pre-cache top 500 medical conditions in Vietnamese        │
│  ├── Pre-cache all drugs in Dược thư Quốc gia                 │
│  ├── Pre-cache BYT treatment protocols (all specialties)       │
│  └── Nightly job to refresh stale entries                      │
└────────────────────────────────────────────────────────────────┘

### 3.5 Database Schema for Cache Layer

**PostgreSQL JSONB Schema for Knowledge Entity Cache (Layer 2):**

```sql
-- Knowledge Entity Cache Table
CREATE TABLE knowledge_entity_cache (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_key          VARCHAR(255) NOT NULL,        -- e.g., "metformin"
    context_type        VARCHAR(100) NOT NULL,         -- e.g., "CKD_dosing"
    composite_key       VARCHAR(500) GENERATED ALWAYS AS (entity_key || ':' || context_type) STORED,

    -- Synthesized Knowledge (JSONB for flexibility)
    knowledge_data      JSONB NOT NULL,
    -- Example structure:
    -- {
    --   "summary": "Metformin should be dose-adjusted in CKD...",
    --   "key_facts": ["Discontinue at eGFR <30", "Reduce dose at eGFR 30-45"],
    --   "dosage_info": {"adult": "500-2000mg/day", "ckd_stage3": "max 1000mg/day"},
    --   "evidence_grade": "Level 1A",
    --   "language": "vi"
    -- }

    -- Source Tracking
    sources             JSONB NOT NULL DEFAULT '[]',
    -- Example: [
    --   {"type": "PMID", "id": "34567890", "title": "...", "date": "2024-03-15"},
    --   {"type": "BYT", "id": "TT-30/2018", "title": "...", "date": "2018-06-01"},
    --   {"type": "DTQG", "id": "Metformin", "edition": 3}
    -- ]

    -- Metadata
    confidence_score    DECIMAL(3,2) NOT NULL DEFAULT 0.50,  -- 0.00 to 1.00
    conflict_status     VARCHAR(20) DEFAULT 'CLEAN',         -- CLEAN, CONTESTED, RESOLVED
    conflict_details    JSONB,                                -- details if CONTESTED

    -- Temporal tracking
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    version             INTEGER NOT NULL DEFAULT 1,

    -- Indexing
    UNIQUE(entity_key, context_type)
);

-- Archive table for replaced entries (audit trail)
CREATE TABLE knowledge_entity_archive (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id         UUID NOT NULL REFERENCES knowledge_entity_cache(id),
    entity_key          VARCHAR(255) NOT NULL,
    context_type        VARCHAR(100) NOT NULL,
    knowledge_data      JSONB NOT NULL,
    sources             JSONB NOT NULL,
    replaced_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    replaced_reason     VARCHAR(50),    -- UPDATE, CONFLICT_RESOLUTION, EXPIRY
    version             INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_kec_composite ON knowledge_entity_cache(composite_key);
CREATE INDEX idx_kec_entity ON knowledge_entity_cache(entity_key);
CREATE INDEX idx_kec_expires ON knowledge_entity_cache(expires_at);
CREATE INDEX idx_kec_conflict ON knowledge_entity_cache(conflict_status) WHERE conflict_status != 'CLEAN';
CREATE INDEX idx_kec_knowledge_gin ON knowledge_entity_cache USING GIN (knowledge_data);
CREATE INDEX idx_kec_sources_gin ON knowledge_entity_cache USING GIN (sources);
```

**Redis Schema for Query-Response Cache (Layer 1):**

```
Key Pattern:   clara:qr:{role}:{normalized_query_hash}
Value:         JSON string of complete response + metadata
TTL:           86400 seconds (24 hours)
Eviction:      LRU (Least Recently Used)

Example:
  Key:   clara:qr:doctor:sha256_abc123def456
  Value: {
    "response_text": "...",
    "citations": [...],
    "confidence": 0.92,
    "generated_at": "2024-11-15T10:30:00Z",
    "source_entities_used": ["metformin:CKD_dosing", "eGFR:thresholds"],
    "tier": 2,
    "fact_check_status": "VERIFIED"
  }
  TTL: 86400
```

---

## 4. Synthesis and Verification Nodes

### 4.1 Synthesis Node

The Synthesis Agent is the core generation component of CLARA's pipeline. It takes reranked evidence chunks and produces a comprehensive, cited medical response.

**Architecture:**

```
┌──────────────────────────────────────────────────────────────────┐
│                    SYNTHESIS AGENT (NODE 1)                       │
│                                                                   │
│  Model: Qwen2.5-72B-Instruct (primary) or Claude API (fallback) │
│                                                                   │
│  INPUT:                                                          │
│  ├── Reranked evidence chunks (top-20 per sub-query)             │
│  ├── Original user query (Vietnamese or English)                 │
│  ├── User role context (normal user / researcher / doctor)       │
│  ├── Conversation history (if multi-turn)                        │
│  └── Domain-specific system prompt (per role)                    │
│                                                                   │
│  PROCESSING:                                                      │
│  ├── 1. Evidence integration: merge chunks into coherent answer  │
│  ├── 2. Citation assignment: tag each claim to its source        │
│  ├── 3. Uncertainty flagging: mark claims with weak evidence     │
│  ├── 4. Language adaptation: match user's language (VN/EN)       │
│  └── 5. Role-appropriate formatting:                             │
│      ├── Normal user: Simple Vietnamese, key takeaways           │
│      ├── Researcher: Full citations, methodology details         │
│      └── Doctor: Clinical precision, dosage tables, protocols    │
│                                                                   │
│  OUTPUT FORMAT:                                                   │
│  {                                                                │
│    "response_text": "Comprehensive answer in markdown...",       │
│    "claims": [                                                    │
│      {                                                            │
│        "claim": "Metformin should be stopped at eGFR <30",       │
│        "sources": ["PMID:34567890", "KDIGO 2024"],               │
│        "confidence": 0.95,                                        │
│        "claim_type": "dosage"                                     │
│      },                                                           │
│      ...                                                          │
│    ],                                                             │
│    "uncertainty_flags": ["Insufficient VN-specific data"],       │
│    "evidence_quality": "Level 1A",                                │
│    "sources_used": 12,                                            │
│    "language": "vi"                                               │
│  }                                                                │
│                                                                   │
│  IMPORTANT: Synthesis does NOT self-verify                       │
│  → Output goes directly to Verification Agent (Node 2)           │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Verification Node

The Verification Agent operates as an **independent checker** — a separate model instance that receives the Synthesis Agent's output and validates it against the original evidence. This separation is critical: LLMs that self-verify tend to confirm their own hallucinations.

**Architecture:**

```
┌──────────────────────────────────────────────────────────────────┐
│                 VERIFICATION AGENT (NODE 2)                       │
│                                                                   │
│  Model: Independent LLM instance OR specialized fact-checker     │
│  (NOT the same model instance as Synthesis Agent)                │
│                                                                   │
│  INPUT:                                                          │
│  ├── Synthesis Agent output (response + claims + citations)      │
│  └── Original retrieved evidence chunks (for ground truth)       │
│                                                                   │
│  VERIFICATION TASKS:                                              │
│  │                                                                │
│  │  Task 1: Claim Verification                                   │
│  │  ├── For each claim in synthesis output:                      │
│  │  ├── Check: Is this claim supported by the cited source?      │
│  │  ├── Check: Does the cited source actually say this?          │
│  │  └── Score: claim_verified (true/false) + confidence          │
│  │                                                                │
│  │  Task 2: Hallucination Detection                              │
│  │  ├── Identify claims NOT supported by ANY retrieved chunk     │
│  │  ├── Flag fabricated statistics, invented drug names          │
│  │  └── Flag fabricated PMIDs or citation identifiers            │
│  │                                                                │
│  │  Task 3: Citation Accuracy                                    │
│  │  ├── Verify PMID exists via EFetch API                        │
│  │  ├── Verify NCT number exists and trial status is correct     │
│  │  ├── Verify RxCUI matches claimed drug                        │
│  │  └── Verify BYT protocol number is current (not superseded)   │
│  │                                                                │
│  │  Task 4: Contradiction Check                                  │
│  │  ├── Check for internal contradictions within response        │
│  │  ├── Check for contradictions with known guidelines           │
│  │  └── Flag dosage conflicts with Dược thư / RxNorm            │
│  │                                                                │
│  │  Task 5: Dosage Verification (CRITICAL)                       │
│  │  ├── Extract all dosage mentions from response                │
│  │  ├── Cross-check against Dược thư structured DB               │
│  │  ├── Cross-check against RxNorm dosage data                   │
│  │  └── BLOCK response if dosage error detected                  │
│  │                                                                │
│  OUTPUT: Verification Report                                      │
│  {                                                                │
│    "overall_verdict": "VERIFIED | PARTIALLY | NEEDS_RESYNTHESIS | REJECTED",
│    "claim_results": [                                             │
│      {"claim": "...", "verified": true, "confidence": 0.95},     │
│      {"claim": "...", "verified": false, "reason": "hallucination"}
│    ],                                                             │
│    "critical_failures": [],                                       │
│    "warnings": ["Weak evidence for claim #3"],                   │
│    "corrections_needed": []                                       │
│  }                                                                │
│                                                                   │
│  IF ANY critical claim fails → REJECT, send back for re-synthesis│
│  Max 2 re-synthesis attempts before returning "insufficient data" │
└──────────────────────────────────────────────────────────────────┘
```

**Node 3: Response Formatter**

After verification passes, the Response Formatter adapts the output based on user role:

| User Role | Formatting | Language | Citations | Disclaimers |
|-----------|-----------|----------|-----------|-------------|
| Normal User (Tier 1) | Simple, key takeaway in bold | Simple Vietnamese | 1-2 trusted sources | "Tham khảo bác sĩ" |
| Researcher (Tier 2) | Full literature synthesis | Technical Vietnamese/English | Full PMID list, evidence grades | Methodology caveats |
| Doctor (Tier 3) | Clinical precision, protocol tables | Clinical Vietnamese | Complete with DOI links | Guideline version dates |

### 4.3 FIDES-Inspired Fact-Checking Pipeline

**FIDES** (Faithful Fact Decomposition and Evidence-based Scoring) is a paradigm for LLM fact-checking that CLARA adapts specifically for the medical domain. The pipeline decomposes complex claims into atomic, independently verifiable facts, retrieves evidence for each, and scores factual accuracy.

**5-Step FIDES-Medical Pipeline:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CLARA FACT CHECKER (FIDES-Medical)                     │
│                                                                          │
│  STEP 1: CLAIM DECOMPOSITION                                            │
│  ├── Model: BioMistral-7B (VN fine-tuned) or SLM for claim parsing     │
│  ├── Input: Complex medical statement from Synthesis Agent               │
│  ├── Output: Array of atomic, independently verifiable claims            │
│  │                                                                       │
│  │  Example:                                                             │
│  │  Complex: "Metformin should be discontinued when eGFR falls below    │
│  │           30 mL/min and replaced with a DPP-4 inhibitor which is     │
│  │           safe in advanced CKD"                                       │
│  │  Atomic Claims:                                                       │
│  │    AC1: "Metformin should be discontinued at eGFR <30"               │
│  │    AC2: "The eGFR threshold is 30 (not 25 or 15)"                   │
│  │    AC3: "DPP-4 inhibitors are safe in advanced CKD"                  │
│  │    AC4: "DPP-4 inhibitors can replace metformin in this context"     │
│  └──────────────────────────────────────────────────────────────────────│
│                              │                                           │
│                              ▼                                           │
│  STEP 2: PER-CLAIM EVIDENCE RETRIEVAL                                    │
│  ├── For each atomic claim:                                              │
│  │   ├── Search cited source(s) — does the citation support this?       │
│  │   ├── Search additional sources for corroboration                     │
│  │   ├── Search for contradicting evidence                               │
│  │   └── Check structured databases (RxNorm, Dược thư, ICD-11)         │
│  │                                                                       │
│  ├── Evidence Categories:                                                │
│  │   ├── SUPPORTED: ≥2 sources agree, no contradictions                 │
│  │   ├── PARTIALLY_SUPPORTED: 1 source agrees, no contradictions        │
│  │   ├── CONTESTED: Sources disagree (requires flagging)                │
│  │   ├── UNSUPPORTED: No evidence found (likely hallucination)          │
│  │   └── CONTRADICTED: Evidence directly opposes claim                  │
│  └──────────────────────────────────────────────────────────────────────│
│                              │                                           │
│                              ▼                                           │
│  STEP 3: CROSS-REFERENCE VERIFICATION                                    │
│  ├── Build verification matrix per claim:                                │
│  │                                                                       │
│  │   Source Type          │ Agrees │ Contradicts │ Silent │              │
│  │   ─────────────────────┼────────┼─────────────┼────────│              │
│  │   Cited PMID article   │  ✓     │             │        │              │
│  │   Clinical guideline   │  ✓     │             │        │              │
│  │   Drug database        │  ✓     │             │        │              │
│  │   BYT protocol         │        │             │   —    │              │
│  │   Knowledge graph      │  ✓     │             │        │              │
│  │                                                                       │
│  ├── Cross-Reference Score = (Agrees - Contradicts) / Total Sources     │
│  └── Threshold: CR_Score ≥ 0.6 for PASS                                │
│                              │                                           │
│                              ▼                                           │
│  STEP 4: CITATION VALIDATION                                             │
│  ├── PMID Verification:                                                  │
│  │   ├── API call: efetch(PMID) → verify paper exists                   │
│  │   ├── Check: paper title/topic matches claimed content               │
│  │   ├── Check: paper conclusions align with cited claim                │
│  │   └── Flag: retracted papers, errata, corrections                    │
│  ├── NCT Verification:                                                   │
│  │   ├── API: clinicaltrials.gov/api/v2/studies/{NCT}                   │
│  │   ├── Check: trial exists and status is as claimed                   │
│  │   └── Flag: withdrawn/terminated trials cited as evidence            │
│  ├── RxCUI Verification:                                                 │
│  │   ├── API: rxnav.nlm.nih.gov/REST/rxcui/{rxcui}                     │
│  │   ├── Check: drug name matches RxCUI                                 │
│  │   └── Cross-check with Dược thư Quốc gia entries                    │
│  └── BYT Protocol Verification:                                         │
│      ├── Check: cited Thông tư/Quyết định number exists                 │
│      ├── Check: cited content matches actual protocol text              │
│      └── Check: protocol is still current (not superseded)              │
│                              │                                           │
│                              ▼                                           │
│  STEP 5: VERDICT & ACTION                                                │
│  ├── ✅ VERIFIED: All critical claims pass, citations valid              │
│  │   → Deliver response to user                                         │
│  ├── ⚠️  PARTIALLY VERIFIED: Some non-critical claims weak              │
│  │   → Deliver with uncertainty markers on weak claims                  │
│  ├── 🔄 NEEDS RE-SYNTHESIS: Critical claim failed                       │
│  │   → Send back to Synthesis Agent with correction instructions        │
│  │   → Max 2 re-synthesis attempts before escalating                    │
│  └── ❌ REJECTED: Multiple critical failures or contradictions          │
│      → Return "insufficient evidence" response                          │
│      → Suggest user consult human medical professional                  │
│      → Log for engineering review                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Critical Claim Pattern Rules:**

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

**FIDES Performance Targets:**

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Fact-check precision | ≥ 85% | Manual audit of 500 verified claims |
| Hallucination rate | < 5% | Automated detection + manual review |
| Citation accuracy | ≥ 90% | Automated PMID/NCT/RxCUI verification |
| Critical claim catch rate | ≥ 95% | Dosage + interaction claims must be caught |
| False positive rate | < 10% | Valid claims incorrectly flagged as false |


---

## 5. Vietnamese Medical NLP Challenges

Vietnamese medical NLP presents unique challenges not found in English-language medical AI systems. CLARA must address these to deliver accurate, culturally appropriate medical information to Vietnamese users.

### 5.1 Vietnamese Medical Terminology Mapping

**Challenge:** Vietnamese medical terminology exists in a complex ecosystem where multiple naming conventions coexist:

```
┌──────────────────────────────────────────────────────────────────┐
│              VIETNAMESE MEDICAL TERMINOLOGY LAYERS                │
│                                                                   │
│  Layer 1: Official TCVN Terms (Tiêu chuẩn Việt Nam)             │
│  ├── Standardized by Vietnamese Standards Authority              │
│  ├── Used in official BYT documents and textbooks                │
│  └── Example: "Đái tháo đường" (Diabetes mellitus)              │
│                                                                   │
│  Layer 2: Sino-Vietnamese Medical Terms (Hán-Việt)               │
│  ├── Derived from Chinese medical terminology                    │
│  ├── Common in traditional medicine and academic texts           │
│  └── Example: "Tiểu đường" (also Diabetes, more colloquial)     │
│                                                                   │
│  Layer 3: International Terms (borrowed/transliterated)          │
│  ├── Direct borrowings from English/French medical terms         │
│  ├── Common in modern clinical practice                          │
│  └── Example: "insulin", "cortisol", "paracetamol"              │
│                                                                   │
│  Layer 4: Colloquial/Regional Terms                              │
│  ├── Informal terms used by patients                             │
│  ├── Regional variations (North/Central/South Vietnam)           │
│  └── Example: "bệnh tiểu đường" (patient-speak for diabetes)    │
│                                                                   │
│  CLARA Mapping Strategy:                                          │
│  ALL layers → Normalized TCVN term → UMLS/SNOMED CUI → ICD-11  │
└──────────────────────────────────────────────────────────────────┘
```

**TCVN to UMLS/SNOMED Mapping Table (Examples):**

| Vietnamese (TCVN) | Colloquial VN | English | UMLS CUI | SNOMED CT | ICD-11 |
|-------------------|--------------|---------|----------|-----------|--------|
| Đái tháo đường type 2 | Tiểu đường tuýp 2 | Type 2 Diabetes | C0011860 | 44054006 | 5A11 |
| Tăng huyết áp | Cao huyết áp / Cao máu | Hypertension | C0020538 | 38341003 | BA00 |
| Suy tim | Yếu tim | Heart failure | C0018801 | 84114007 | BD10 |
| Viêm phổi | — | Pneumonia | C0032285 | 233604007 | CA40 |
| Nhồi máu cơ tim | Đau tim (colloquial) | Myocardial infarction | C0027051 | 22298006 | BA41 |
| Đột quỵ | Tai biến mạch máu não | Stroke | C0038454 | 230690007 | 8B20 |
| Suy thận mạn | Thận yếu (colloquial) | Chronic kidney disease | C1561643 | 709044004 | GB61 |

**Mapping Pipeline:**

```
User Input (any Vietnamese variant)
  │
  ├── Step 1: VnCoreNLP word segmentation
  │            "bệnh tiểu đường tuýp 2" → ["bệnh", "tiểu_đường", "tuýp", "2"]
  │
  ├── Step 2: Medical NER (PhoNER / Custom BiLSTM-CRF)
  │            Identify: "tiểu_đường tuýp 2" → DISEASE entity
  │
  ├── Step 3: Synonym resolution (custom medical dictionary)
  │            "tiểu đường" → "đái tháo đường" (TCVN standard)
  │            "tuýp 2" → "type 2"
  │
  ├── Step 4: UMLS mapping
  │            "đái tháo đường type 2" → CUI: C0011860
  │
  └── Step 5: Cross-ontology linking
               CUI: C0011860 → SNOMED: 44054006 → ICD-11: 5A11
```

### 5.2 Diacritics Handling

Vietnamese uses an extensive diacritics system that is critical for meaning. Incorrect diacritics can change a medical term's meaning entirely.

**Vietnamese Diacritics System:**

```
Vietnamese has 12 vowels with up to 5 tone marks each:
  Base vowels: a, ă, â, e, ê, i, o, ô, ơ, u, ư, y
  Tone marks:  ◌̀ (huyền), ◌́ (sắc), ◌̉ (hỏi), ◌̃ (ngã), ◌̣ (nặng)

  Total possible combinations: 12 × 6 (including no tone) = 72 unique vowels

Medical Impact Examples:
  ├── "thuốc" (thuoc + sắc) = medicine
  │   "thuộc" (thuoc + nặng) = belongs to
  │
  ├── "bệnh" (benh + nặng) = disease
  │   "bênh" (benh + no diacritics match) = to defend
  │
  ├── "gan" = liver
  │   "gân" = tendon
  │   "gần" = near
  │
  └── "mạch" = pulse/vessel
      "mách" = to tell/report
```

**CLARA's Diacritics Normalization Pipeline:**

```
Input Text
  │
  ├── Step 1: Unicode NFC Normalization
  │   ├── Normalize all Vietnamese characters to NFC (Canonical Decomposition + Composition)
  │   ├── Reason: Same character can be represented in multiple Unicode forms
  │   │   Example: "ệ" can be U+1EC7 (precomposed) OR U+0065+U+0323+U+0302 (decomposed)
  │   └── NFC ensures consistent comparison and storage
  │
  ├── Step 2: Diacritics Correction (for user input)
  │   ├── Handle common input errors:
  │   │   ├── "benh tieu duong" (no diacritics) → "bệnh tiểu đường"
  │   │   ├── "thuoc ha huyet ap" → "thuốc hạ huyết áp"
  │   │   └── Telex/VNI input method residue: "beenh" → "bệnh"
  │   ├── Use trained diacritics restoration model (BERT-based)
  │   └── Medical dictionary fallback for ambiguous restorations
  │
  ├── Step 3: Search Index Handling
  │   ├── Store both diacritics and non-diacritics forms in BM25 index
  │   ├── Query with automatic diacritics expansion
  │   └── Embedding model (BGE-M3) handles diacritics natively
  │
  └── Step 4: Output Consistency
      ├── ALL output text uses proper NFC-normalized Vietnamese
      ├── Drug names: Vietnamese + international spelling
      └── Medical terms: TCVN-standard diacritics
```

**Diacritics Restoration for Medical Queries:**

| Input (no diacritics) | Restored (medical context) | Non-medical meaning |
|----------------------|--------------------------|-------------------|
| "thuoc ha duong huyet" | "thuốc hạ đường huyết" (hypoglycemic drug) | Could be multiple interpretations |
| "benh suy than man" | "bệnh suy thận mạn" (chronic kidney disease) | — |
| "lieu dung paracetamol" | "liều dùng paracetamol" (paracetamol dosage) | — |
| "viem gan B" | "viêm gan B" (hepatitis B) | — |
| "tang huyet ap" | "tăng huyết áp" (hypertension) | — |

### 5.3 Medical Abbreviations in Vietnamese

Vietnamese medical practice uses a unique set of abbreviations that are essential for understanding clinical queries from healthcare professionals.

**Vietnamese Medical Abbreviation Dictionary:**

| Abbreviation | Full Vietnamese | English | Category |
|-------------|----------------|---------|----------|
| **BN** | Bệnh nhân | Patient | General |
| **ĐTĐ** | Đái tháo đường | Diabetes mellitus | Disease |
| **THA** | Tăng huyết áp | Hypertension | Disease |
| **NMCT** | Nhồi máu cơ tim | Myocardial infarction | Disease |
| **XN** | Xét nghiệm | Laboratory test | Procedure |
| **ĐTĐ2** | Đái tháo đường type 2 | Type 2 Diabetes | Disease |
| **COPD** | Bệnh phổi tắc nghẽn mạn tính | COPD | Disease (intl.) |
| **HA** | Huyết áp | Blood pressure | Measurement |
| **ECG/ĐTĐ** | Điện tâm đồ | Electrocardiogram | Procedure |
| **SA** | Siêu âm | Ultrasound | Procedure |
| **CLS** | Cận lâm sàng | Paraclinical | Category |
| **LS** | Lâm sàng | Clinical | Category |
| **BS** | Bác sĩ | Doctor | Personnel |
| **ĐD** | Điều dưỡng | Nurse | Personnel |
| **KMM** | Không mong muốn | Unwanted (adverse) | ADR |
| **TDKMM** | Tác dụng không mong muốn | Adverse drug reaction | ADR |
| **CĐ** | Chỉ định | Indication | Prescribing |
| **CCĐ** | Chống chỉ định | Contraindication | Prescribing |
| **PĐ** | Phác đồ | Protocol/Regimen | Treatment |
| **BYT** | Bộ Y tế | Ministry of Health | Organization |
| **BHYT** | Bảo hiểm y tế | Health insurance | Administrative |

**CLARA Abbreviation Handling Strategy:**

```
1. Input Processing:
   ├── Detect abbreviations via regex + dictionary lookup
   ├── Expand abbreviations before embedding (for search accuracy)
   ├── Maintain both forms in query representation
   └── Context-aware disambiguation:
       "ĐTĐ" in cardiology context → "Điện tâm đồ" (ECG)
       "ĐTĐ" in endocrinology context → "Đái tháo đường" (Diabetes)

2. Output Formatting:
   ├── Tier 1 (normal users): Always use full terms, avoid abbreviations
   ├── Tier 2 (researchers): Use standard abbreviations with first-use expansion
   └── Tier 3 (doctors): Use clinical abbreviations familiar to Vietnamese physicians
```

### 5.4 Cross-Language Entity Linking (Vietnamese ↔ English)

**Challenge:** CLARA must seamlessly link medical entities across Vietnamese and English because:
- International research literature is primarily in English
- Vietnamese clinical practice uses a mix of Vietnamese and English terms
- Drug names exist in Vietnamese brand names, international generic names, and chemical names
- ICD-11 codes, RxNorm identifiers, and UMLS CUIs are language-agnostic bridges

**Cross-Language Entity Linking Architecture:**

```
┌──────────────────────────────────────────────────────────────────┐
│            CROSS-LANGUAGE ENTITY LINKING PIPELINE                 │
│                                                                   │
│  INPUT: Medical entity in any language/form                      │
│                                                                   │
│  ┌─────────────┐      ┌──────────────┐      ┌──────────────┐    │
│  │ Vietnamese   │─────▶│ Normalization│─────▶│ Language-    │    │
│  │ Entity       │      │ Layer        │      │ Agnostic ID  │    │
│  │              │      │              │      │              │    │
│  │ "thuốc hạ   │      │ Diacritics   │      │ RxCUI: 6809  │    │
│  │  đường      │      │ NFC norm     │      │ CUI: C0025598│    │
│  │  metformin"  │      │ Synonym map  │      │ ATC: A10BA02 │    │
│  └─────────────┘      └──────────────┘      └──────────────┘    │
│         ▲                                          │             │
│         │                                          │             │
│         │              ┌──────────────┐             │             │
│         └──────────────│ Bidirectional│◀────────────┘             │
│                        │ Mapping DB   │                           │
│                        │              │                           │
│  ┌─────────────┐      │ VN ↔ EN      │      ┌──────────────┐    │
│  │ English      │─────▶│ mapping table│─────▶│ Language-    │    │
│  │ Entity       │      │ ~50K entries │      │ Agnostic ID  │    │
│  │ "metformin   │      │              │      │ (same IDs)   │    │
│  │  hydrochloride"│    └──────────────┘      └──────────────┘    │
│  └─────────────┘                                                  │
│                                                                   │
│  LINKING STRATEGIES:                                              │
│  ├── 1. Dictionary-based: curated VN↔EN medical dictionary       │
│  ├── 2. UMLS-based: UMLS Metathesaurus has VN entries (limited)  │
│  ├── 3. ICD-11 multilingual: WHO provides VN translations        │
│  ├── 4. RxNorm mapping: VN brand → international generic → RxCUI │
│  └── 5. Embedding-based: BGE-M3 cross-lingual similarity        │
│                                                                   │
│  FALLBACK CHAIN:                                                  │
│  Dictionary → UMLS → ICD-11 → RxNorm → Embedding similarity    │
│  → Manual review queue (if no match found with confidence >0.8)  │
└──────────────────────────────────────────────────────────────────┘
```

**Vietnamese ↔ English Drug Name Mapping Examples:**

| Vietnamese Brand | Vietnamese Generic | English Generic | RxCUI | ATC Code |
|-----------------|-------------------|----------------|-------|----------|
| Glucofast 500mg | Metformin 500mg | Metformin HCl 500mg | 6809 | A10BA02 |
| Hapacol 500 | Paracetamol 500mg | Acetaminophen 500mg | 161 | N02BE01 |
| Augbidil | Amoxicillin/Clavulanate | Amoxicillin/Clavulanate | 19711 | J01CR02 |
| Hasanbest | Losartan 50mg | Losartan Potassium 50mg | 52175 | C09CA01 |
| Staclazide | Gliclazide 30mg MR | Gliclazide 30mg MR | VN_ONLY | A10BB09 |

**Cross-Language Search Strategy:**

```
User Query: "Liều metformin cho bệnh nhân suy thận"
  │
  ├── Entity Extraction:
  │   ├── "metformin" → Drug entity (already international name)
  │   └── "suy thận" → Disease entity → "chronic kidney disease" / "renal impairment"
  │
  ├── Bilingual Query Generation:
  │   ├── Vietnamese query: "liều metformin suy thận"
  │   ├── English query: "metformin dosage renal impairment"
  │   └── Structured query: RxCUI:6809 + ICD-11:GB61
  │
  ├── Parallel Retrieval:
  │   ├── Vietnamese sources: Dược thư, BYT protocols → VN results
  │   ├── English sources: PubMed, KDIGO guidelines → EN results
  │   └── Structured DB: RxNorm drug info → Universal results
  │
  └── Result Merging:
      ├── Synthesize across languages (BGE-M3 handles cross-lingual)
      ├── Prioritize Vietnamese sources for VN-specific dosing
      ├── Supplement with international evidence
      └── Present in user's preferred language (Vietnamese)
```

**Key NLP Tools for Vietnamese Medical Processing:**

| Tool | Purpose | Integration Point |
|------|---------|------------------|
| **VnCoreNLP** | Word segmentation, POS tagging, dependency parsing | Preprocessing (Step 1) |
| **PhoBERT** | Vietnamese language model for NER, classification | Medical NER, intent classification |
| **PhoNER** | Vietnamese Named Entity Recognition | Medical entity extraction |
| **underthesea** | Vietnamese NLP toolkit (tokenization, NER) | Alternative to VnCoreNLP |
| **BGE-M3** | Cross-lingual embeddings | Cross-language entity similarity |
| **Custom BiLSTM-CRF** | Vietnamese medical NER (fine-tuned) | Medical-specific entity recognition |

---

## 6. Implementation Recommendations

### 6.1 Priority Ordering

Based on the analysis above, the following implementation order is recommended:

```
Phase 1 — Foundation (Months 1-3):
  ├── Set up vector database (FAISS for dev, Milvus for staging)
  ├── Implement BGE-M3 embedding pipeline
  ├── Build PubMed + RxNorm API integrations
  ├── Implement basic hybrid search (dense + BM25)
  ├── Build Vietnamese text preprocessing pipeline
  │   (VnCoreNLP + NFC normalization + abbreviation expansion)
  └── Deploy basic RAG pipeline (retrieve → generate → respond)

Phase 2 — Vietnamese Knowledge (Months 3-6):
  ├── Ingest Dược thư Quốc gia (OCR + structured extraction)
  ├── Build BYT circular crawler (Scrapy + Playwright)
  ├── Create VN ↔ EN medical terminology mapping DB (~50K entries)
  ├── Fine-tune PhoNER for medical NER
  ├── Implement Vietnamese medical abbreviation dictionary
  └── Build cross-language entity linking pipeline

Phase 3 — Safety & Verification (Months 6-9):
  ├── Implement FIDES fact-checking pipeline (5 steps)
  ├── Build Synthesis → Verification node separation
  ├── Implement critical claim pattern rules (dosage, interactions)
  ├── Deploy citation validation (PMID, NCT, RxCUI verification)
  ├── Implement cache strategy (4-layer architecture)
  └── Build cache update logic (UPDATE not APPEND)

Phase 4 — Optimization & Scale (Months 9-12):
  ├── Fine-tune SLMs for Vietnamese medical tasks (QLoRA)
  ├── Optimize hybrid search α parameter on VN medical QA benchmark
  ├── Implement cross-encoder reranking with medical domain boosts
  ├── Build knowledge graph (Neo4j) for entity relationships
  ├── Scale Milvus cluster for production workloads
  └── Comprehensive evaluation against FIDES targets
```

### 6.2 Critical Success Factors

| Factor | Requirement | Risk if Not Met |
|--------|-----------|----------------|
| **Vietnamese diacritics handling** | 99%+ NFC normalization accuracy | Incorrect medical term matching |
| **Drug name resolution** | Map 95%+ of Dược thư entries to RxCUI | Missing drug interactions |
| **FIDES fact-checking** | ≥85% precision on medical claims | Dangerous hallucinations |
| **BYT protocol currency** | Daily crawler for new circulars | Outdated medical guidance |
| **Cross-language linking** | Vietnamese↔English mapping for top 5000 terms | Incomplete evidence retrieval |
| **Cache invalidation** | Event-driven + TTL-based | Stale medical information |

### 6.3 Key Technical Decisions Summary

| Decision Area | Choice | Primary Rationale |
|--------------|--------|------------------|
| Embedding Model | BGE-M3 (BAAI) | Native Vietnamese + multilingual + multi-vector |
| Vector Database | Milvus (prod) / FAISS (dev) | Hybrid search + open source + scalable |
| Hybrid Search α | 0.6 (dense-weighted) | Tuned on medical QA benchmarks |
| Reranker | BGE-Reranker-v2-m3 | Multilingual cross-encoder |
| Synthesis Model | Qwen2.5-72B / Claude API | Best Vietnamese support at scale |
| Claim Decomposition | BioMistral-7B (VN fine-tuned) | Medical reasoning for claim parsing |
| Intent Router | Phi-3-mini + Qwen2.5-0.5B | Ultra-fast classification |
| Word Segmentation | VnCoreNLP / PhoBERT tokenizer | Vietnamese-specific segmentation |
| Medical NER | PhoNER + Custom BiLSTM-CRF | Vietnamese medical entity recognition |
| Cache Layer 1 | Redis (24h TTL) | Hot cache for repeated queries |
| Cache Layer 2 | PostgreSQL JSONB (7d TTL) | Knowledge entity store with update logic |
| Agent Framework | LangGraph | Stateful multi-agent orchestration |

---

*Document generated for the CLARA (Clinical Agent for Retrieval & Analysis) project.*
*Cross-references: [Technical Architecture Deep Dive](./technical_architecture_deep_dive.md) | [Product Proposal](../proposal/product_proposal.md) | [Market Research](./market_research_global.md)*