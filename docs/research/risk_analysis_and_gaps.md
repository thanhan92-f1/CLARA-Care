# CLARA — Risk Analysis, Gaps & Recommendations

> **Document Type:** Independent Risk Assessment
> **Scope:** All documentation in `docs/` directory
> **Date:** January 2025
> **Status:** For Developer Review

---

## Executive Summary

CLARA (Clinical Agent for Retrieval & Analysis) is an ambitious AI-powered medical platform targeting the Vietnamese market with Agentic RAG architecture, clinical decision support, and a consumer health app. After systematic review of **~9,000+ lines of documentation** across 8 files, this analysis identifies **42 specific risks and gaps** across 5 categories.

**Critical Finding:** The project as documented has a **fundamental feasibility gap** — a 4-person team is attempting to deliver 65-67 features across 6 modules in 6 months, while the project's own documentation recommends 10-12 people for Phase 1 alone. The TCVN fine-tuning pipeline alone requires ~20 weeks — nearly the entire project timeline.

### Risk Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Technical Risks | 3 | 5 | 4 | 1 | 13 |
| Architecture Gaps | 2 | 4 | 3 | 0 | 9 |
| Product Gaps | 1 | 3 | 3 | 0 | 7 |
| Regulatory Risks | 1 | 3 | 2 | 0 | 6 |
| Team Risks | 2 | 3 | 2 | 0 | 7 |
| **TOTAL** | **9** | **18** | **14** | **1** | **42** |

---

## 1. Technical Risks

### 1.1 🔴 CRITICAL — SLM Accuracy Insufficient for Medical Use

**Source:** `medical_slms_research.md` (lines 1346-1376), `technical_architecture_deep_dive.md`

**Finding:** The SLMs chosen for CLARA score **44-60% on USMLE-style benchmarks**:
- BioMistral-7B: **50.6%** MedQA (used for claim decomposition in FIDES)
- OpenBioLLM-8B: **59.3%** MedQA (used for specialist agents)
- Phi-3-mini-med: **48.2%** MedQA (used for Layer 2 intent routing)
- Even the primary synthesis model (Qwen2.5-72B) has no published Vietnamese medical benchmark scores

**Impact:** 40-56% of medical reasoning by these models may be incorrect. In a clinical context, this creates patient safety risk. The documentation itself states: *"7-8B models score 50-60% on USMLE — NOT safe for standalone diagnosis"* (line 1372).

**Severity:** 🔴 CRITICAL — Patient safety implication

**Mitigation:**
1. **Never use SLMs for standalone clinical reasoning** — restrict to routing, NER, and classification only (as partially documented)
2. Implement mandatory **confidence thresholds** — any SLM output below 80% confidence triggers escalation to 70B+ model or API fallback
3. Create a **Vietnamese medical benchmark** (does not exist today) to evaluate actual performance on Vietnamese clinical scenarios
4. Implement **human-in-the-loop** for all clinical recommendations — no automated clinical advice without physician review
5. Add **prominent disclaimers** on every response: "This is decision support, not diagnosis"

---

### 1.2 🔴 CRITICAL — Vietnamese Medical NLP Gap

**Source:** `medical_slms_research.md` (lines 1378-1400), `data_sources_and_rag_analysis.md`

**Finding:** Multiple critical gaps exist for Vietnamese medical NLP:
- **No generative Vietnamese medical model exists** — none of the SLMs natively support Vietnamese clinical terminology
- **No Vietnamese medical instruction dataset** — must be created from scratch (~400K+ instruction pairs needed)
- **No Vietnamese medical benchmark** — cannot evaluate model performance on Vietnamese clinical tasks
- **Diacritics have semantic significance** — e.g., "thuốc" (medicine) vs "thuoc" (belongs to) — incorrect handling changes medical meaning
- **Code-switching** — Vietnamese clinicians frequently mix Vietnamese and English medical terminology
- **Compound word segmentation** — Vietnamese word boundaries are ambiguous and affect meaning in medical context
- **Vietnamese drug name mapping** — many local brands have no RxNorm mapping; requires curated `vn_brand_to_rxcui` table (~5,000 entries)

**Impact:** The entire value proposition of CLARA ("Vietnamese-native medical AI") rests on NLP capabilities that do not yet exist and must be built from scratch.

**Severity:** 🔴 CRITICAL — Core value proposition at risk

**Mitigation:**
1. **Prioritize Vietnamese medical dataset creation** in Sprint 1-2 — this is the foundation for everything else
2. Partner with **Vietnamese medical schools** (17+ exist) for data collection and validation
3. Start with **bilingual mode** (Vietnamese query → English RAG → Vietnamese response) as interim solution
4. Use **BGE-M3 embeddings** (already chosen) which have multilingual support including Vietnamese
5. Build a **curated Vietnamese-English medical dictionary** (~10,000 terms) before fine-tuning
6. Implement **diacritics normalization + restoration pipeline** as a preprocessing step
7. Budget **$15-25K and 20 weeks** for TCVN fine-tuning (per project documentation estimates)

---

### 1.3 🔴 CRITICAL — Fine-Tuning Timeline Exceeds Project Duration

**Source:** `medical_slms_research.md` (lines 1382-1400), `project_structure_and_sprints.md`

**Finding:** The TCVN fine-tuning pipeline requires:
- **Phase 1 (Training Data Collection):** ~400K instruction pairs from 6 sources
- **Phase 2-4:** Fine-tuning, evaluation, deployment
- **Total estimated time:** ~20 weeks
- **Total estimated cost:** ~$15-25K
- **Required personnel:** 5 Vietnamese physicians (part-time) — not on team
- **Project total duration:** 24 weeks (6 months, 12 sprints)

The fine-tuning pipeline alone consumes **83% of the total project timeline**, leaving effectively zero time for the rest of the 65-67 features.

**Severity:** 🔴 CRITICAL — Timeline infeasibility

**Mitigation:**
1. **De-scope fine-tuning from MVP** — use RAG-only approach with pre-trained multilingual models for Phase 1
2. Run fine-tuning as a **parallel workstream** starting Month 1 with a separate budget/team
3. Use **GPT-4o/Claude API** as primary synthesis engine for Phase 1 (accept higher per-query cost)
4. Begin **physician recruitment** immediately — 5 physicians needed for data validation
5. Consider **outsourcing dataset creation** to a Vietnamese medical NLP contractor
6. Set realistic expectation: Vietnamese fine-tuned models available **Phase 2 at earliest**


---

### 1.4 🟠 HIGH — API Rate Limits as System Bottleneck

**Source:** `data_sources_and_rag_analysis.md`, `technical_architecture_deep_dive.md`

**Finding:** CLARA depends on multiple external APIs with strict rate limits:

| API | Rate Limit | CLARA Usage | Bottleneck Risk |
|-----|-----------|-------------|-----------------|
| PubMed E-utilities | 10 req/s (with API key) | Every research query, RAG retrieval | 🟠 High |
| openFDA | 240 req/min (with key) | Drug safety checks, adverse events | 🟡 Medium |
| RxNorm | 20 req/s | Drug normalization, every DDI query | 🟠 High |
| ClinicalTrials.gov | Unspecified | Trial matching, cohort building | 🟡 Unknown |
| UMLS | Unspecified | Medical ontology lookups | 🟡 Unknown |

**Scenario:** With 100 concurrent users, each triggering a multi-source RAG query (3-5 API calls per source × 3-5 sources = 9-25 API calls per query), the system would need **900-2,500 API calls** in burst — far exceeding PubMed's 10 req/s limit.

**Severity:** 🟠 HIGH — System throughput bottleneck

**Mitigation:**
1. Implement **API request queuing** with priority-based scheduling (emergency queries first)
2. Build **aggressive caching** — the 4-layer cache is well-designed but must be implemented before scaling
3. Create a **local PubMed mirror** for the most-accessed articles (top 100K medical papers)
4. Implement **batch API requests** where APIs support it (PubMed E-utilities supports batch)
5. Add **circuit breakers** per API — graceful degradation when rate limits are hit
6. Consider **NCBI FTP bulk download** for baseline PubMed data to reduce live API dependency

---

### 1.5 🟠 HIGH — BioMistral-7B Context Limit (2,048 tokens)

**Source:** `medical_slms_research.md`, `data_sources_and_rag_analysis.md`

**Finding:** BioMistral-7B, selected for claim decomposition in the FIDES fact-checker, has a **2,048 token context window**. This is severely limiting:
- A typical PubMed abstract: ~300-500 tokens
- A clinical guideline section: ~1,000-3,000 tokens
- A drug monograph from Dược thư Quốc gia: ~2,000-5,000 tokens
- CLARA's documented context budget: **70K tokens for evidence**

BioMistral-7B cannot process even a single drug monograph without truncation.

**Severity:** 🟠 HIGH — Core FIDES pipeline component is inadequate

**Mitigation:**
1. **Replace BioMistral-7B** with OpenBioLLM-8B (4,096+ token context) for claim decomposition
2. Alternatively, use **Qwen2.5-7B** (32K context) for claim decomposition tasks
3. Implement **hierarchical claim decomposition** — break complex claims into atomic claims processable within 2K context
4. Reserve BioMistral-7B only for short-context tasks like NER or classification

---

### 1.6 🟠 HIGH — Latency Risk for KPI Targets

**Source:** `product_proposal.md` (lines 894-909), `technical_architecture_deep_dive.md`, `fides_fact_checker.md`

**Finding:** CLARA's multi-stage pipeline adds cumulative latency:

| Pipeline Stage | Estimated Latency |
|---------------|-------------------|
| Intent Router (Layer 1 + Layer 2) | ~100ms |
| Multi-source RAG retrieval (3-5 sources, parallel) | 1-5s |
| Cross-encoder reranking (BGE-Reranker-v2-m3) | 500ms-2s |
| LLM synthesis (Qwen2.5-72B, 70K context) | 10-60s |
| FIDES fact-check (5-step pipeline) | 5-30s |
| Self-consistency check (5× generation) | 50-300s |

**Total estimated:** 67-398 seconds (1.1-6.6 minutes) for a **normal user query** (KPI target: <2 minutes). The self-consistency check alone (generating 5 responses and comparing) **multiplies synthesis latency by 5×**.

**Severity:** 🟠 HIGH — KPI targets likely unachievable with full pipeline

**Mitigation:**
1. **Remove self-consistency check** from real-time pipeline — run asynchronously for quality monitoring only
2. Implement **streaming responses** — start showing results while fact-checking runs in background
3. Use **tiered verification** — FIDES-lite for normal users (3-step), full FIDES for researchers/doctors
4. **Parallelize** RAG retrieval across all sources
5. Pre-compute and **cache** frequently asked medical questions
6. Set **realistic KPI targets**: <2 min for cached/simple queries, <5 min for novel queries

---

### 1.7 🟡 MEDIUM — Vector DB Operational Complexity

**Source:** `data_sources_and_rag_analysis.md`, `project_structure_and_sprints.md`

**Finding:** Milvus requires dedicated infrastructure (etcd, MinIO, Pulsar for distributed mode), index tuning, partition management, backup/recovery, and monitoring. This is a significant operational burden for a 4-person team where one person (Duy) handles both backend development and DevOps.

**Severity:** 🟡 MEDIUM — Operational risk with limited team

**Mitigation:**
1. **Use Milvus Cloud (Zilliz)** or start with **FAISS in production** for Phase 1
2. Migrate to Milvus only when scaling requires it (>100K vectors, multi-node)
3. Consider **Qdrant** as alternative — simpler operational model

---

### 1.8 🟡 MEDIUM — Cache Coherence for Medical Data

**Source:** `data_sources_and_rag_analysis.md`

**Finding:** The 4-layer cache (Redis → PostgreSQL JSONB → FAISS → Source Freshness Tracker) uses medical-specific UPDATE-not-APPEND logic. Serving stale medical information (e.g., outdated DDI data) is a **patient safety risk**. Cache invalidation for medical data is inherently more dangerous than for general knowledge.

**Severity:** 🟡 MEDIUM — Patient safety + engineering complexity

**Mitigation:**
1. **Start with single-layer cache** (Redis only) for MVP
2. Implement **cache versioning** — every response tagged with source data version
3. **Critical safety updates bypass cache** — DDI updates, drug recalls trigger immediate invalidation
4. Add **"Last verified" timestamp** on every cached response

---

### 1.9 🟡 MEDIUM — GPU Cost Escalation

**Source:** `product_proposal.md` (lines 1011-1026), `project_structure_and_sprints.md`

**Finding:** Running Qwen2.5-72B requires 2× A100 80GB GPUs ($3,000-6,000/month). The AI Council (Tier 3) spawns 2-5 specialist agents in parallel, each running their own LLM inference. During peak usage, GPU costs could escalate rapidly. Estimated infra costs: $5,200-$10,100/month — **significant for a pre-revenue startup**.

**Severity:** 🟡 MEDIUM — Financial sustainability risk

**Mitigation:**
1. Use **model quantization** (GPTQ/AWQ) to reduce GPU requirements by 50-75%
2. **Start with API-based models** (GPT-4o/Claude) for Phase 1 — pay per query, not per GPU-hour
3. Implement **intelligent routing** — use 7B models for simple queries, 72B only for complex ones
4. Use **spot/preemptible instances** for non-real-time workloads (batch processing, fine-tuning)

---

### 1.10 🟡 MEDIUM — Context Window Budget Assumptions

**Source:** `technical_architecture_deep_dive.md`

**Finding:** The documented context window budget allocates 70K tokens for evidence out of 100K usable (128K model capacity). This assumes:
- Every query needs near-maximum context
- The model can effectively reason over 70K tokens of evidence
- Cost per inference is proportional to context length

Research shows LLM performance degrades on very long contexts ("lost in the middle" phenomenon). The cost of processing 70K tokens per query is also substantial.

**Severity:** 🟡 MEDIUM — Performance and cost assumptions may be incorrect

**Mitigation:**
1. Implement **dynamic context budgeting** — allocate context proportional to query complexity
2. Use **summarization** to compress retrieved evidence before feeding to synthesis model
3. Benchmark actual retrieval needs — most queries likely need <10K tokens of evidence

---

## 2. Architecture Gaps

### 2.1 🔴 CRITICAL — No Error Handling / Circuit Breaker Patterns

**Source:** All architecture documents reviewed

**Finding:** Despite the complex multi-service architecture (FastAPI + LangGraph + vLLM + Milvus + Neo4j + PostgreSQL + Redis + Elasticsearch + Hyperledger Fabric + 10+ external APIs), **no error handling strategy, circuit breaker patterns, or graceful degradation paths are documented**. Specific gaps:
- What happens when PubMed API is down during a RAG query?
- What happens when vLLM runs out of GPU memory?
- What happens when Milvus is unreachable during vector search?
- What happens when a specialist agent in AI Council times out?
- What happens when the FIDES fact-checker encounters conflicting evidence?

In a medical system, a silent failure or an unhandled error that returns partial/incorrect information is a **patient safety risk**.

**Severity:** 🔴 CRITICAL — System reliability + patient safety

**Mitigation:**
1. Implement **circuit breaker pattern** (e.g., using `tenacity` or `pybreaker`) for every external dependency
2. Define **fallback behavior** for each service: PubMed down → use cached PubMed data; vLLM down → use API fallback; Milvus down → use FAISS
3. Implement **partial response handling** — if 3 of 5 sources return results, synthesize from available data with explicit "limited evidence" warning
4. Add **timeout budgets** per pipeline stage with documented escalation behavior
5. Create **health check endpoints** for all services with automated alerting
6. Design **degraded mode** operation — system can serve basic queries even when advanced features fail

---

### 2.2 🔴 CRITICAL — Blockchain Complexity Unjustified for MVP

**Source:** `product_proposal.md` (line 839, 876), `project_structure_and_sprints.md`

**Finding:** Hyperledger Fabric is planned for Phase 2 (Month 3-4) for:
- Blockchain audit trail for clinical decisions
- Blockchain consent management for data sharing

Hyperledger Fabric requires:
- Multiple peer nodes, orderer nodes, CA (Certificate Authority)
- Chaincode (smart contract) development in Go/Node.js
- Channel configuration and access control
- Operational monitoring and maintenance

This is a **massive infrastructure investment** for a feature that could be achieved with simpler alternatives (append-only database logs with cryptographic hashing). For a 4-person team, adding Hyperledger in Month 3-4 while simultaneously building CareGuard, Medical Scribe, and enhanced app features is unrealistic.

**Severity:** 🔴 CRITICAL — Scope creep, engineering resource drain

**Mitigation:**
1. **Remove Hyperledger Fabric from Phase 1-2** entirely
2. Use **append-only PostgreSQL audit logs** with SHA-256 hash chains for tamper evidence
3. Add **digital signatures** (asymmetric cryptography) for non-repudiation
4. Consider blockchain only in Phase 3+ after core medical features are stable
5. Evaluate if blockchain is actually a regulatory requirement — it likely isn't

---

### 2.3 🟠 HIGH — LLM Fallback Strategy Insufficient

**Source:** `product_proposal.md` (line 1002), `technical_architecture_deep_dive.md`

**Finding:** The only documented LLM fallback is: *"vLLM (self-hosted) + API fallback (OpenAI/Claude)"*. This creates issues:
- **Cross-border data transfer:** Sending Vietnamese patient data to OpenAI/Claude APIs (US-hosted) may violate Nghị định 13/2023 cross-border transfer requirements
- **Cost unpredictability:** Sudden failover to GPT-4o API at $5-15/1M tokens could create unexpected costs
- **Behavioral inconsistency:** Different models produce different style responses — users may notice quality/format changes during failover
- **No warm standby:** No documented approach for keeping API fallback "warm" or tested

**Severity:** 🟠 HIGH — Regulatory + operational risk

**Mitigation:**
1. Implement **data anonymization/de-identification** before sending to external APIs
2. **Budget API fallback costs** — set spending limits and alerting
3. Run **shadow testing** — periodically send anonymized queries to API fallback to verify quality
4. Consider **Qwen2.5-72B + Llama-3.1-70B** as documented backup — both can be self-hosted

---

### 2.4 🟠 HIGH — No A/B Testing or Gradual Rollout Strategy

**Source:** All documentation reviewed — no mention found

**Finding:** There is no documented strategy for:
- A/B testing different model configurations
- Gradual rollout of new features (canary deployments)
- Feature flags for medical features
- Measuring the impact of model changes on medical accuracy

For a medical AI system where model updates can change clinical recommendations, deploying changes without gradual rollout is high-risk.

**Severity:** 🟠 HIGH — Quality regression risk

**Mitigation:**
1. Implement **feature flags** (e.g., LaunchDarkly, Unleash) for all AI pipeline changes
2. Design **canary deployment** pipeline — new models serve 5% → 25% → 100% of traffic
3. Define **medical accuracy regression tests** that run before any model update goes live
4. Build **A/B test infrastructure** for comparing model performance on identical queries

---

### 2.5 🟠 HIGH — Feature Count Inconsistency

**Source:** `product_proposal.md` — Appendix A (line 1179) vs Appendix B (line 1191)

**Finding:** Appendix A states **65 total features**, while Appendix B (detailed feature ID index) sums to **67 features**. This 2-feature discrepancy suggests either:
- Features were added to modules without updating the summary
- Some features are double-counted
- The feature IDs don't align with the priority matrix

This seemingly minor inconsistency indicates **documentation drift** — a broader concern for a complex project where architectural decisions documented in one file may contradict decisions in another.

**Severity:** 🟠 HIGH — Documentation reliability concern

**Mitigation:**
1. **Reconcile feature counts** immediately — determine which number is correct
2. Create a **single source of truth** for feature tracking (e.g., Notion, Linear, or GitHub Projects)
3. Implement **documentation review process** — changes to one doc trigger review of related docs

---

### 2.6 🟠 HIGH — Self-Consistency Check Impractical

**Source:** `fides_fact_checker.md`

**Finding:** The FIDES pipeline includes a self-consistency verification step that generates 5 separate responses to the same query and checks for agreement. This approach:
- **Multiplies LLM inference cost by 5×** per query
- **Multiplies latency by 5×** (or requires 5 parallel GPU instances)
- Requires **5× GPU memory** for parallel execution
- Contradicts the <2 minute response time KPI

**Severity:** 🟠 HIGH — Impractical for production

**Mitigation:**
1. **Remove from real-time pipeline** — use for offline quality monitoring only
2. Replace with **single-pass entropy-based uncertainty estimation** (also documented in FIDES spec)
3. Use **retrieval-based consistency** instead — check if response is consistent with retrieved evidence (already part of FIDES)

---

### 2.7 🟡 MEDIUM — Separate Verification Model Instance

**Source:** `technical_architecture_deep_dive.md`

**Finding:** The architecture calls for a separate LLM instance for verification (distinct from synthesis), which effectively doubles GPU requirements. Running both Qwen2.5-72B for synthesis AND a separate instance for verification requires 4× A100 80GB GPUs minimum.

**Severity:** 🟡 MEDIUM — Cost and infrastructure complexity

**Mitigation:**
1. Use a **smaller model for verification** (e.g., 7-8B model for fact-checking)
2. **Share GPU instances** — use same vLLM instance with different system prompts
3. Run verification **asynchronously** — stream initial response, then verify and add confidence scores

---

### 2.8 🟡 MEDIUM — Technology Stack Sprawl

**Source:** `product_proposal.md` (lines 945-995)

**Finding:** The technology stack includes **16+ distinct technologies** that the 4-person team must deploy, configure, and maintain:

PostgreSQL, Milvus, Neo4j, Elasticsearch, Redis, Hyperledger Fabric, FastAPI, LangGraph, vLLM, React, React Native, Next.js, Kubernetes (EKS), Docker, Prometheus, Grafana, Sentry, ELK Stack, Kong/AWS API Gateway, Keycloak, Celery, PaddleOCR, Whisper

Each technology requires operational expertise. The team has **one DevOps person** (who is also the backend developer).

**Severity:** 🟡 MEDIUM — Operational overhead

**Mitigation:**
1. **Consolidate databases** — do you really need PostgreSQL AND Elasticsearch AND Neo4j AND Milvus?
2. Use **managed services** (RDS, ElastiCache, Zilliz Cloud) to reduce operational burden
3. **Defer non-critical technologies** — Keycloak, Hyperledger, Neo4j, ELK can wait until Phase 2-3
4. Start with **SQLite/PostgreSQL + FAISS + Redis** for MVP

---

### 2.9 🟡 MEDIUM — No Rate Limiting / Abuse Prevention

**Source:** All documentation reviewed

**Finding:** No documented rate limiting strategy for CLARA's own APIs. Without rate limiting:
- A single abusive user could consume all GPU resources
- Bot attacks could drain API quotas with external services
- No protection against prompt injection at scale
- No cost controls for expensive LLM inference

**Severity:** 🟡 MEDIUM — Security and cost risk

**Mitigation:**
1. Implement **tiered rate limits** per user role (free: 10 queries/day, premium: 100, researcher: 500)
2. Add **API key management** with per-key quotas
3. Implement **cost-per-query tracking** and alerting
4. Add **request throttling** at API Gateway level (Kong or AWS API Gateway)

---

## 3. Product Gaps

### 3.1 🔴 CRITICAL — Liability for Incorrect Medical Advice

**Source:** `product_proposal.md`, `market_research_global.md` (Watson Health case study)

**Finding:** The documentation mentions "advisory only" positioning and disclaimers, but does not address:
- **Legal liability framework** — Who is responsible if a patient is harmed by CLARA's DDI check missing a critical interaction?
- **Medical malpractice insurance** — Does CLARA need professional indemnity coverage?
- **Terms of service** — No documented liability limitation terms
- **Clinician responsibility model** — The "doctor-in-the-loop" requirement is mentioned but not enforced architecturally
- **Consumer app risk** — Normal users receiving health advice with no medical professional involved

The Watson Health failure (documented in market research) is a cautionary tale: *"Over-promised capabilities; struggled with unstructured clinical data; required extensive manual curation; clinician trust deficit."*

**Severity:** 🔴 CRITICAL — Legal and reputational risk

**Mitigation:**
1. Engage **healthcare lawyer** immediately to draft terms of service, privacy policy, and liability framework
2. Implement **architectural guardrails** that enforce doctor-in-the-loop for clinical recommendations
3. Add **mandatory disclaimers** on every response — not just text, but UI-level warnings with acknowledgment
4. Consider **medical malpractice insurance** — required in many jurisdictions
5. Limit **consumer app scope** — health information only, no clinical decision support without physician
6. Study Hippocratic AI's approach: explicitly does NOT diagnose or prescribe

---

### 3.2 🟠 HIGH — App-Platform Integration Unclear

**Source:** `product_proposal.md`, `personal_health_app.md`

**Finding:** CLARA has two products: (1) AI Agent Platform for researchers/doctors, (2) Personal Health App for consumers. The documentation describes each extensively but does not clearly explain:
- How do they share infrastructure? Same backend or separate?
- Can a doctor use the Platform to view a patient's Health App data (with consent)?
- How does the Doctor Marketplace in the App connect to the AI Council on the Platform?
- Are they a single mobile app or two separate apps?
- How do authentication and authorization span both products?

**Severity:** 🟠 HIGH — Architectural ambiguity for core product

**Mitigation:**
1. Create a **system integration document** showing data flows between Platform and App
2. Define **shared vs. separate services** explicitly
3. Design **consent-based data sharing** architecture between consumer health profiles and doctor access
4. Clarify **single app with role-based views** vs **two separate applications**

---

### 3.3 🟠 HIGH — Revenue Projections Overly Optimistic

**Source:** `product_proposal.md` (lines 1143-1163)

**Finding:** Revenue projections show:
- Month 3: $700 MRR (product not yet fully built per sprint plan)
- Month 6: $15,000 MRR (still in development per Phase 3 timeline)
- Month 12: $110,000 MRR ($1.32M ARR)
- Break-even: Month 8-10

Issues:
- **Month 3 revenue with 4-person team** — Phase 1 barely completes the MVP by Month 2
- **$110K MRR by Month 12** requires 30,000 MAU — aggressive for a Vietnamese market with no competitor reference
- **Doctor/Hospital revenue at Month 6** ($5K MRR) — hospital sales cycles are 6-12 months minimum
- **Monthly fixed costs stated as $40-60K** but infrastructure alone is $5-10K, team of 4 costs additional $15-25K+ — where does $40-60K come from? (This implies a larger team than currently exists)

**Severity:** 🟠 HIGH — Financial planning may be unrealistic

**Mitigation:**
1. Create **conservative, baseline, optimistic** scenarios (current projections are optimistic only)
2. Extend **break-even estimate** to Month 14-18 for realistic planning
3. Focus on **free tier growth** before monetization — build user base first
4. Secure **12-18 months of runway** before expecting meaningful revenue

---

### 3.4 🟠 HIGH — No Accessibility Features

**Source:** All documentation reviewed

**Finding:** No mention of accessibility for:
- **Elderly users** — Vietnam's aging population is a key health app demographic; larger fonts, voice interaction, simplified UI needed
- **Visual impairment** — Screen reader support, high contrast mode
- **Low literacy** — Simplified language mode, visual health information
- **Low bandwidth** — Rural Vietnam has limited internet; no offline mode documented

**Severity:** 🟠 HIGH — Excludes significant user segments

**Mitigation:**
1. Add **accessibility requirements** to Phase 1 user stories
2. Implement **WCAG 2.1 AA** compliance for web platform
3. Design **simplified mode** for elderly/low-literacy users
4. Plan **offline functionality** for core features (medication reminders, saved DDI results)

---

### 3.5 🟡 MEDIUM — Doctor Marketplace Physician Buy-In

**Source:** `product_proposal.md`, `personal_health_app.md`

**Finding:** The doctor marketplace charges 15-20% commission per consultation ($10-30/consultation). In Vietnam's healthcare context:
- Doctors in public hospitals have restricted private practice
- 15-20% commission is high compared to existing platforms (eDoctor, Doctor Anywhere)
- No documented physician recruitment strategy
- Target of 50+ verified doctors by Month 6, 200+ by Month 12 is ambitious without dedicated sales team

**Severity:** 🟡 MEDIUM — Revenue stream dependency

**Mitigation:**
1. Start with **lower commission** (10%) and increase as platform value is demonstrated
2. Partner with **medical associations** for physician recruitment
3. Offer **initial free listing period** (6 months) to build supply side
4. Consider **non-commission models** — flat monthly fee for doctors

---

### 3.6 🟡 MEDIUM — No Internationalization Strategy Beyond Vietnamese

**Source:** `product_proposal.md`, `market_research_global.md`

**Finding:** While ASEAN expansion is mentioned as a long-term goal, the architecture is not designed for multi-language support. The Vietnamese-specific fine-tuning, BYT protocol integration, and Dược thư Quốc gia data are deeply embedded in the pipeline. Expanding to Laos, Cambodia, or Myanmar would require significant re-engineering.

**Severity:** 🟡 MEDIUM — Future scalability

**Mitigation:**
1. Design **language-agnostic architecture** from the start — separate content from logic
2. Use **configuration-driven clinical protocol loading** — not hard-coded Vietnamese references
3. Build **translation pipeline** into the RAG architecture for future markets

---

### 3.7 🟡 MEDIUM — Monetization Timeline Conflict

**Source:** `product_proposal.md`

**Finding:** The revenue model requires simultaneously building a **free product good enough to attract users** AND **premium features worth paying for**. With 4 people, this creates a prioritization conflict — every hour spent on premium features is an hour not spent on core quality. The projected $700 MRR at Month 3 implies payment infrastructure, billing, subscription management — all additional engineering work.

**Severity:** 🟡 MEDIUM — Resource allocation conflict

**Mitigation:**
1. **Delay monetization to Month 6** — focus entirely on product quality and user acquisition
2. Use **simple payment integration** (Stripe/VNPay) rather than building custom billing
3. Start with **manual billing** for early hospital contracts — don't build billing infra until validated

---

## 4. Regulatory Risks

### 4.1 🔴 CRITICAL — Medical Device Classification Ambiguity

**Source:** `market_research_global.md` (lines 528-569), `product_proposal.md` (Appendix D)

**Finding:** It is unclear whether CLARA qualifies as a **medical device** under Vietnamese law:
- The EU AI Act classifies most medical AI as **HIGH RISK** (Annex III)
- US FDA has SaMD (Software as Medical Device) guidance
- Vietnam has **no clear pathway** for AI medical device approval equivalent to FDA 510(k)
- If CLARA is classified as a medical device by BYT, it could trigger:
  - Registration requirements (6-12 month process)
  - Clinical validation studies
  - Post-market surveillance obligations
  - Manufacturing quality system requirements (ISO 13485)

The documentation mentions monitoring this risk but provides no concrete strategy if classification occurs.

**Severity:** 🔴 CRITICAL — Could halt the entire project

**Mitigation:**
1. **Engage with BYT proactively** — request informal guidance on classification
2. Design CLARA as **"decision support" not "diagnostic"** — architectural distinction
3. Study **Hippocratic AI's approach** — explicitly does NOT diagnose or prescribe
4. Prepare **pre-submission dossier** in case BYT requires registration
5. Join **Vietnam health-tech industry association** to participate in regulatory development
6. Budget **legal costs** for regulatory navigation ($10-20K)

---

### 4.2 🟠 HIGH — Regulatory Moving Target (Decree 13 → Decree 356)

**Source:** `market_research_global.md` (line 544)

**Finding:** Vietnam's data protection landscape is actively changing:
- **Nghị định 13/2023/NĐ-CP** (current) — effective July 1, 2023
- **Decree 356** (replacement) — effective January 1, 2026
- **Luật Bảo vệ Dữ liệu Cá nhân** — full law passed in 2024, elevating from decree to law
- **Luật Khám bệnh chữa bệnh 2023** — new medical practice law
- **Law on Digital Technology Industry (2024)** — AI governance provisions

CLARA is building during a regulatory transition period where requirements may change mid-development.

**Severity:** 🟠 HIGH — Compliance uncertainty

**Mitigation:**
1. Design for the **strictest interpretation** of all regulations
2. Engage **regulatory counsel** familiar with Vietnamese health IT law
3. Build **compliance as configuration** — data residency, consent flows, audit logging should be toggleable
4. Monitor **Decree 356** development closely — identify gaps between current and future requirements
5. Join industry working groups that participate in regulatory drafting

---

### 4.3 🟠 HIGH — Cross-Border Data Transfer Requirements

**Source:** `market_research_global.md` (lines 538-539), `data_sources_and_rag_analysis.md`

**Finding:** CLARA sends data to US-based APIs:
- **PubMed E-utilities** (NIH, USA)
- **RxNorm** (NLM, USA)
- **openFDA** (FDA, USA)
- **ClinicalTrials.gov** (NLM, USA)
- **OpenAI/Claude API** (fallback, USA)

Under Nghị định 13/2023, cross-border transfer of sensitive personal data (health data) requires:
- **Data Protection Impact Assessment (DPIA)** — must be filed with Ministry of Public Security within 60 days
- **Registration with Ministry of Public Security**
- **Data localization provisions** may apply

Sending patient queries (which may contain health information) to US APIs without DPIA compliance is a violation.

**Severity:** 🟠 HIGH — Legal compliance risk

**Mitigation:**
1. **De-identify all queries** before sending to external APIs — strip patient identifiers
2. File **DPIA with Ministry of Public Security** before launch
3. Consider **local API mirrors** for frequently accessed data (PubMed abstracts, RxNorm mappings)
4. **Never send raw patient data** to external LLM APIs — anonymize first
5. Implement **data flow documentation** showing exactly what data crosses borders

---

### 4.4 🟠 HIGH — Patient Consent Management Gaps

**Source:** `personal_health_app.md`, `product_proposal.md`

**Finding:** While consent is mentioned throughout the documentation, the implementation details are vague:
- How is consent captured and stored?
- Can users granularly control what data is shared with AI processing vs. doctors vs. research?
- How is consent withdrawal handled (right to deletion)?
- How is consent documented for regulatory audit?
- What happens to AI model training data when a user withdraws consent?

**Severity:** 🟠 HIGH — Regulatory compliance gap

**Mitigation:**
1. Design **granular consent management system** — separate consents for each data use
2. Implement **consent audit trail** — immutable log of all consent grants/withdrawals
3. Build **data deletion pipeline** — when user withdraws consent, all personal data is purged
4. Create **consent UI** following GDPR-style best practices (clear, informed, specific)

---

### 4.5 🟡 MEDIUM — Data Localization Requirements

**Source:** `market_research_global.md` (line 556)

**Finding:** Vietnamese law has data localization provisions. Using AWS (primary cloud) with data centers potentially outside Vietnam could create compliance issues. AWS has a region in Southeast Asia (Singapore) but not in Vietnam.

**Severity:** 🟡 MEDIUM — Infrastructure planning

**Mitigation:**
1. Use **AWS Singapore region** as primary (closest to Vietnam)
2. Evaluate **Vietnamese cloud providers** (Viettel Cloud, FPT Cloud) for data residency
3. Implement **hybrid architecture** — sensitive data on Vietnamese infrastructure, compute on AWS
4. Document **data residency justification** for DPIA filing

---

### 4.6 🟡 MEDIUM — AI Transparency Requirements

**Source:** `market_research_global.md` (EU AI Act section), Vietnamese regulatory framework

**Finding:** Emerging AI regulations globally (EU AI Act) and in Vietnam (Law on Digital Technology Industry 2024) require AI transparency — explaining how AI makes decisions. CLARA's multi-agent, multi-model pipeline makes explainability challenging:
- Intent routing decisions are made by a 0.5B parameter model
- Evidence synthesis uses 72B parameter model
- FIDES fact-checking uses another model
- AI Council involves 2-5 agent deliberation

Explaining "why CLARA recommended X" requires tracing decisions across multiple models and retrieval steps.

**Severity:** 🟡 MEDIUM — Future regulatory compliance

**Mitigation:**
1. Implement **decision logging** at every pipeline stage — full trace from query to response
2. Build **explainability UI** — show users which sources were consulted, which agents contributed, confidence levels
3. Store **decision audit trails** for regulatory review
4. The existing FIDES citation system is a good foundation — extend to cover all pipeline stages

---

## 5. Team Risks

### 5.1 🔴 CRITICAL — 4 People vs. Recommended 10-12

**Source:** `product_proposal.md` (Appendix E, lines 1215-1230), `project_structure_and_sprints.md`

**Finding:** The project's own documentation recommends:

| Role | Recommended Count | Actual |
|------|------------------|--------|
| CTO / Tech Lead | 1 | 0 (shared) |
| ML Engineers | 2-3 | 2 (Quang + An) |
| Backend Engineers | 2-3 | 1 (Duy) |
| Frontend Engineers | 2 | 1 (Thiện, also PM) |
| Medical Advisor | 1 | **0** |
| Product Manager | 1 | 1 (Thiện, also Frontend) |
| DevOps / SRE | 1 | 1 (Duy, also Backend) |
| Medical NLP Specialist | 1 (Phase 2) | **0** |
| Security Engineer | 1 (Phase 2) | **0** |
| QA / Test Engineer | 1 (Phase 2) | **0** |
| **TOTAL Phase 1** | **10-12** | **4** |
| **TOTAL Phase 3** | **14-17** | **4** |

The team is operating at **33-40% of recommended capacity** while attempting 100% of the feature scope.

With 65-67 features in 6 months (12 sprints), the team must deliver approximately:
- **5.4-5.6 features per sprint** across the team
- **1.4 features per person per sprint** — while also building infrastructure, writing tests, doing DevOps

**Severity:** 🔴 CRITICAL — Project feasibility

**Mitigation:**
1. **Ruthlessly prioritize** — cut scope to 15-20 core features for MVP (P0 only)
2. Hire **2-3 additional engineers** before Month 2
3. Use **contractors** for non-core work (frontend UI, DevOps setup, documentation)
4. **Eliminate entire modules** from Phase 1: Trials & Cohort, Ops & Education can wait
5. Set **realistic sprint goals** — 2-3 features per sprint maximum for 4 people

---

### 5.2 🔴 CRITICAL — No Medical Advisor

**Source:** `product_proposal.md` (Appendix E — Medical Advisor listed as Phase 1 requirement)

**Finding:** The project has **zero medical professionals** on the team, despite:
- Building a medical AI system that provides clinical decision support
- Needing to validate Vietnamese medical content accuracy
- Requiring 5 Vietnamese physicians for TCVN fine-tuning data validation
- Needing clinical expertise for DDI database validation
- Requiring medical domain expertise for FIDES fact-checker tuning
- Hospital partnership negotiations requiring clinical credibility

The documentation lists "Medical Advisory Board" as a key resource but no advisor is identified.

**Severity:** 🔴 CRITICAL — Medical accuracy and credibility

**Mitigation:**
1. **Recruit a medical advisor immediately** — even part-time (10 hours/week)
2. Partner with a **Vietnamese medical school** for ongoing clinical review
3. Hire **medical students** for content validation at lower cost
4. Engage a **clinical informatician** who bridges medicine and technology
5. **Do not launch** any clinical decision support features without medical review

---

### 5.3 🟠 HIGH — Bus Factor = 1 for Every Function

**Source:** `project_structure_and_sprints.md`

**Finding:** Each critical function has exactly one person:
- **Thiện** → PM + Frontend (if unavailable: no product direction, no frontend progress)
- **Quang** → AI/ML Lead (if unavailable: no model development, no RAG pipeline)
- **Duy** → Backend + DevOps (if unavailable: no API development, no infrastructure)
- **An** → AI/ML Engineer (if unavailable: no fine-tuning, no FIDES implementation)

If any single person is ill for 2 weeks, leaves the project, or burns out, that entire function stops.

**Severity:** 🟠 HIGH — Project continuity risk

**Mitigation:**
1. **Cross-training sessions** — each person should understand at least one other person's area
2. **Document everything** — architecture decisions, deployment procedures, model training configs
3. **Pair programming** on critical paths — ensures knowledge sharing
4. Maintain **recruitment pipeline** — be ready to replace any team member within 2 weeks

---

### 5.4 🟠 HIGH — TCVN Fine-Tuning Requires 5 Physicians

**Source:** `medical_slms_research.md` (lines 1382-1400)

**Finding:** The Vietnamese medical fine-tuning pipeline explicitly requires **5 Vietnamese physicians part-time** for:
- Validating instruction pair quality from Dược thư Quốc gia
- Reviewing BYT protocol Q&A pairs
- Evaluating synthetic data generated by GPT-4
- Clinical accuracy review of fine-tuned model outputs

These 5 physicians are **not on the team**, **not budgeted**, and **not identified**.

**Severity:** 🟠 HIGH — Critical dependency unaddressed

**Mitigation:**
1. Budget **$5-10K** for physician consultation fees
2. Partner with **medical schools** — faculty may participate for academic credit/publication
3. Start **physician recruitment** in Sprint 1 — this is on the critical path
4. Consider **crowdsourcing** from medical student communities for initial data validation

---

### 5.5 🟠 HIGH — Knowledge Gaps in Medical Domain

**Source:** Team composition analysis

**Finding:** The 4-person team appears to have strong technical skills but the documentation does not indicate:
- Prior healthcare/medical AI experience
- Understanding of clinical workflows
- Knowledge of Vietnamese regulatory requirements
- Experience with medical data handling and privacy

Building a medical AI system without medical domain expertise risks creating technically impressive but clinically inappropriate solutions.

**Severity:** 🟠 HIGH — Product-market fit risk

**Mitigation:**
1. **Medical advisor** (see 5.2) is the primary mitigation
2. Attend **medical conferences** and shadow physicians to understand workflows
3. Read **medical informatics literature** — especially on CDSS implementation failures
4. Study **IBM Watson Health failure** extensively — documented in the market research

---

### 5.6 🟡 MEDIUM — Burnout Risk

**Source:** Derived from scope analysis

**Finding:** With 65-67 features, 6 modules, 20+ technologies, and 4 people working for 6 months, the workload per person is extreme. Each team member is wearing multiple hats (PM+Frontend, Backend+DevOps). Sustained high-intensity work for 6 months without adequate staffing leads to burnout, quality degradation, and attrition.

**Severity:** 🟡 MEDIUM — Team sustainability

**Mitigation:**
1. **Reduce scope** dramatically (see 5.1)
2. Set **sustainable pace** — avoid consistent 60+ hour weeks
3. Build in **sprint retrospectives** that honestly assess team capacity
4. **Celebrate milestones** — maintain morale

---

### 5.7 🟡 MEDIUM — No Dedicated QA/Testing

**Source:** `product_proposal.md` (Appendix E)

**Finding:** No QA/Test Engineer on the team. For a medical AI system, testing is especially critical:
- Medical accuracy testing requires clinical expertise
- Regression testing for model updates
- Security testing for patient data
- Load testing for GPU infrastructure
- End-to-end testing of complex multi-service pipeline

**Severity:** 🟡 MEDIUM — Quality risk

**Mitigation:**
1. Implement **automated testing** from Day 1 — CI/CD pipeline with unit and integration tests
2. Create **medical accuracy test suite** — curated set of medical questions with known correct answers
3. Budget for **external security audit** before launch (Phase 3 plans this)
4. Consider **outsourced QA** for mobile app testing

---

## 6. Consolidated Recommendations

### 6.1 Immediate Actions (Sprint 1-2)

| # | Action | Owner | Impact |
|---|--------|-------|--------|
| 1 | **Recruit medical advisor** (part-time) | PM (Thiện) | Unlocks medical accuracy, credibility, physician partnerships |
| 2 | **Cut scope to 15-20 P0 features** for MVP | Entire team | Makes timeline feasible for 4-person team |
| 3 | **Remove Hyperledger Fabric** from Phase 1-2 | Tech lead | Saves months of engineering effort |
| 4 | **Remove self-consistency check** from real-time pipeline | AI/ML (Quang) | Makes <2 min response time achievable |
| 5 | **Engage healthcare lawyer** | PM (Thiện) | Addresses liability, DPIA filing, device classification |
| 6 | **Start physician recruitment** for data validation | AI/ML (Quang) | Critical path for TCVN fine-tuning |
| 7 | **File DPIA** with Ministry of Public Security | PM (Thiện) | Legal requirement before processing health data |

### 6.2 Architecture Simplifications

| Current Plan | Recommended Alternative | Rationale |
|-------------|------------------------|-----------|
| Milvus (self-hosted) | FAISS or Zilliz Cloud | Reduce operational burden for 4-person team |
| Hyperledger Fabric | PostgreSQL audit logs + SHA-256 | Same tamper evidence, 10× less complexity |
| 4-layer cache | Redis-only for MVP | Implement incrementally as needed |
| 16+ databases/services | PostgreSQL + Redis + FAISS | Consolidate for MVP, add as needed |
| Qwen2.5-72B (self-hosted) | GPT-4o/Claude API (Phase 1) | Defer GPU infra until user base justifies cost |
| BioMistral-7B (FIDES) | OpenBioLLM-8B or Qwen2.5-7B | 2K context limit is inadequate |
| Self-consistency (5× gen) | Entropy-based uncertainty | 5× cost/latency is impractical |
| Separate verification model | Shared vLLM instance | Halves GPU requirements |
| Keycloak | Firebase Auth / Auth0 | Managed service, faster to implement |
| ELK Stack | CloudWatch / Grafana Cloud | Managed service, less operational burden |

### 6.3 Phased Delivery Strategy

**Recommended MVP (Phase 1 — Month 1-2, 15 features max):**
1. Vietnamese medical chatbot (RAG with PubMed + Dược thư)
2. Basic intent routing (Layer 1 only — Qwen2.5-0.5B)
3. Simple FIDES fact-check (3-step, not 5-step)
4. Basic consumer health app (React Native)
5. User authentication (JWT)
6. DDI check (basic — RxNorm API integration)
7. Medication management (CRUD)
8. Basic caching (Redis)
9. Monitoring (basic Prometheus/Grafana)
10. CI/CD pipeline

**Defer to Phase 2 (Month 3-4):**
- Medical Scribe, AI Council, Layer 2 routing, CareGuard advanced features

**Defer to Phase 3+ (Month 5+):**
- Trials & Cohort, Ops & Education, Blockchain, Knowledge Graph visualization
- Hospital EHR integration, CME content, Clinical case simulation

### 6.4 KPI Target Adjustments

| KPI | Current Target | Recommended Target | Rationale |
|-----|---------------|-------------------|-----------|
| Normal user response | <2 min | <2 min (cached), <5 min (novel) | Full pipeline exceeds 2 min |
| Vietnamese NLP quality | ≥90% intent | ≥80% intent (Phase 1), ≥90% (Phase 3) | No Vietnamese medical training data exists yet |
| Factual accuracy | ≥90% (Phase 3) | ≥80% (Phase 1), ≥90% (Phase 3) | Keep Phase 1 realistic |
| App users (Month 6) | 5,000 | 1,000-2,000 | Conservative estimate for new market |
| Hospital contracts | 3-5 (Month 6) | 1-2 pilots (Month 6) | Hospital sales cycles are 6-12 months |
| MRR (Month 6) | $15,000 | $2,000-5,000 | Product still in early stage at Month 6 |
| Break-even | Month 8-10 | Month 14-18 | Align with realistic revenue trajectory |

### 6.5 Risk Monitoring Dashboard

Implement a simple risk monitoring system tracking:

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| API rate limit usage | PubMed, RxNorm, openFDA | >70% of limit |
| LLM response latency (P95) | vLLM / API metrics | >120 seconds |
| Factual accuracy (sampled) | Weekly manual evaluation | <80% |
| Cache staleness | Source Freshness Tracker | >7 days without update |
| GPU utilization | Prometheus | >85% sustained |
| Error rate | Sentry | >2% of requests |
| User-reported issues | App feedback | >5 medical accuracy complaints/week |
| Team velocity | Sprint board | <50% of planned story points |

---

## 7. Summary of Top 10 Risks (Priority Order)

| Rank | Risk | Category | Severity | Immediate Action |
|------|------|----------|----------|------------------|
| 1 | **4-person team for 65-67 features** | Team | 🔴 CRITICAL | Cut scope to 15-20 features |
| 2 | **No medical advisor** | Team | 🔴 CRITICAL | Recruit immediately |
| 3 | **Fine-tuning timeline (20 weeks) ≈ project duration** | Technical | 🔴 CRITICAL | Defer fine-tuning, use RAG-only MVP |
| 4 | **Vietnamese medical NLP gap** | Technical | 🔴 CRITICAL | Start with bilingual mode |
| 5 | **Medical device classification ambiguity** | Regulatory | 🔴 CRITICAL | Engage BYT proactively |
| 6 | **Liability for incorrect medical advice** | Product | 🔴 CRITICAL | Engage healthcare lawyer |
| 7 | **No error handling / circuit breakers** | Architecture | 🔴 CRITICAL | Design degraded mode |
| 8 | **Blockchain complexity for MVP** | Architecture | 🔴 CRITICAL | Replace with PostgreSQL audit logs |
| 9 | **SLM accuracy (44-60% USMLE)** | Technical | 🔴 CRITICAL | Never use SLMs for standalone clinical reasoning |
| 10 | **Cross-border data transfer compliance** | Regulatory | 🟠 HIGH | File DPIA, anonymize API calls |

---

> **Assessment:** CLARA is a technically ambitious and well-researched project with a genuine market opportunity in Vietnamese medical AI. However, the current plan has a **fundamental scope-team mismatch** that must be addressed before development proceeds. The most important single action is **aggressive scope reduction** combined with **medical advisor recruitment**. With these changes, a viable MVP is achievable within the 6-month timeline.

---

*This analysis was generated by reviewing all documentation in the `docs/` directory (~9,000+ lines across 8 files). Each risk includes source references to specific documentation files and line numbers where applicable.*