# CLARA — Project Structure & Sprint Planning

> **Version:** 2.0
> **Date:** January 2025
> **Classification:** Internal — Engineering & Project Management
> **Prepared by:** CLARA Engineering Team
> **Audience:** All Team Members, Stakeholders

---

## Table of Contents

1. [Project Directory Structure](#1-project-directory-structure)
2. [Technology Stack](#2-technology-stack)
3. [Team Allocation & Responsibilities](#3-team-allocation--responsibilities)
4. [Sprint Planning (6 Months = 12 Sprints × 2 Weeks)](#4-sprint-planning-6-months--12-sprints--2-weeks)
5. [Environment Setup & API Keys](#5-environment-setup--api-keys)
6. [KPI Milestones per Sprint](#6-kpi-milestones-per-sprint)

---

## 1. Project Directory Structure

### 1.1 Monorepo Layout

```
clara/
│
├── docs/                                    # 📚 Documentation
│   ├── proposal/                            #    Product proposals, user stories
│   ├── research/                            #    Technical research documents
│   ├── architecture/                        #    Architecture Decision Records (ADRs)
│   ├── api/                                 #    API documentation (OpenAPI/Swagger)
│   ├── onboarding/                          #    Developer onboarding guides
│   └── meeting-notes/                       #    Sprint retros, standups
│
├── src/                                     # 🧠 Core Source Code
│   │
│   ├── agents/                              # 🤖 AI Agent Modules
│   │   ├── intent_router/                   #    Two-layer intent classification
│   │   │   ├── layer1_role_classifier.py    #    Role detection (Normal/Researcher/Doctor)
│   │   │   ├── layer2_intent_classifier.py  #    Role-specific intent routing
│   │   │   ├── router_config.yaml           #    Routing rules & thresholds
│   │   │   └── tests/
│   │   ├── research/                        #    CLARA Research agent
│   │   │   ├── search_agent.py              #    PubMed/literature search orchestration
│   │   │   ├── synthesis_agent.py           #    Evidence synthesis & GRADE assessment
│   │   │   ├── comparative_agent.py         #    Drug/treatment comparison
│   │   │   └── tests/
│   │   ├── scribe/                          #    CLARA Medical Scribe agent
│   │   │   ├── asr_pipeline.py              #    Vietnamese medical ASR (Whisper)
│   │   │   ├── diarization.py               #    Speaker diarization (pyannote)
│   │   │   ├── soap_generator.py            #    SOAP note generation
│   │   │   ├── medical_ner.py               #    Medical entity extraction
│   │   │   └── tests/
│   │   ├── careguard/                       #    CLARA CareGuard agent
│   │   │   ├── ddi_checker.py               #    Drug-drug interaction engine
│   │   │   ├── dosage_calculator.py         #    Patient-specific dosage calc
│   │   │   ├── contraindication_alert.py    #    Contraindication detection
│   │   │   ├── prescription_validator.py    #    BYT protocol validation
│   │   │   └── tests/
│   │   ├── council/                         #    AI Council (Hội chẩn AI)
│   │   │   ├── council_orchestrator.py      #    Multi-specialist orchestration
│   │   │   ├── specialist_agents.py         #    Cardio, Nephro, Endo, etc.
│   │   │   ├── deliberation_engine.py       #    Consensus/divergence resolution
│   │   │   └── tests/
│   │   ├── coding/                          #    Coding agent for tool use
│   │   └── shared/                          #    Shared agent utilities
│   │       ├── base_agent.py                #    Abstract base agent class
│   │       ├── agent_registry.py            #    Agent discovery & registration
│   │       └── prompts/                     #    Prompt templates (YAML)
│   │
│   ├── rag/                                 # 🔍 RAG Pipeline
│   │   ├── ingestion/                       #    Document ingestion pipeline
│   │   │   ├── pubmed_ingestor.py           #    PubMed article processing
│   │   │   ├── pdf_parser.py                #    PDF extraction (Vietnamese medical texts)
│   │   │   ├── chunking.py                  #    Semantic chunking strategies
│   │   │   └── preprocessor.py              #    Text cleaning, normalization
│   │   ├── retrieval/                       #    Retrieval engine
│   │   │   ├── hybrid_search.py             #    Dense + sparse hybrid retrieval
│   │   │   ├── reranker.py                  #    Cross-encoder reranking
│   │   │   ├── query_enrichment.py          #    MeSH term expansion, synonym mapping
│   │   │   └── multi_source_retriever.py    #    Parallel multi-source retrieval
│   │   ├── synthesis/                       #    Response synthesis (separate node)
│   │   │   ├── synthesizer.py               #    LLM-based response generation
│   │   │   ├── citation_formatter.py        #    Citation extraction & formatting
│   │   │   ├── streaming.py                 #    Perplexity-style streaming output
│   │   │   └── templates/                   #    Response templates by role
│   │   └── verification/                    #    Fact-checking — FIDES (separate node)
│   │       ├── claim_decomposer.py          #    Break response into atomic claims
│   │       ├── evidence_retriever.py        #    Retrieve evidence for each claim
│   │       ├── cross_reference.py           #    Cross-source verification
│   │       ├── verdict_generator.py         #    Support/Refute/Insufficient verdict
│   │       └── fides_pipeline.py            #    Complete FIDES orchestration
│   │
│   ├── data_sources/                        # 🗄️ External Data Source Connectors
│   │   ├── pubmed/                          #    PubMed E-utilities connector
│   │   │   ├── client.py                    #    API client (ESearch, EFetch, ELink)
│   │   │   ├── mesh_mapper.py               #    MeSH term mapping
│   │   │   └── rate_limiter.py              #    10 req/s rate limiting
│   │   ├── clinical_trials/                 #    ClinicalTrials.gov connector
│   │   │   ├── client.py                    #    API client
│   │   │   └── criteria_parser.py           #    Eligibility criteria NLP parser
│   │   ├── rxnorm/                          #    RxNorm API connector
│   │   │   ├── client.py                    #    Drug normalization API
│   │   │   └── interaction_db.py            #    DDI data integration
│   │   ├── openfda/                         #    OpenFDA connector
│   │   │   ├── client.py                    #    Adverse events, labeling
│   │   │   └── safety_alerts.py             #    Drug safety alert monitoring
│   │   ├── icd11/                           #    ICD-11 API connector
│   │   │   ├── client.py                    #    Disease classification lookup
│   │   │   └── code_mapper.py               #    ICD-11 code mapping
│   │   ├── vietnamese/                      #    🇻🇳 Vietnamese medical sources
│   │   │   ├── duoc_thu_parser.py           #    Dược thư Quốc gia parser
│   │   │   ├── byt_protocol_parser.py       #    BYT treatment protocol parser
│   │   │   ├── vn_medical_journals.py       #    Vietnamese journal scraper
│   │   │   └── terminology_mapper.py        #    VN ↔ EN medical term mapping
│   │   └── shared/                          #    Shared connector utilities
│   │       ├── base_client.py               #    Abstract API client base
│   │       ├── retry_handler.py             #    Exponential backoff, circuit breaker
│   │       └── response_normalizer.py       #    Unified response schema
│   │
│   ├── middleware/                           # 🌐 FastAPI Backend
│   │   ├── main.py                          #    FastAPI application entry point
│   │   ├── api/                             #    API route handlers
│   │   │   ├── v1/                          #    API v1 routes
│   │   │   │   ├── search.py                #    /search endpoints
│   │   │   │   ├── chat.py                  #    /chat endpoints (WebSocket)
│   │   │   │   ├── scribe.py                #    /scribe endpoints
│   │   │   │   ├── careguard.py             #    /careguard endpoints
│   │   │   │   ├── council.py               #    /council endpoints
│   │   │   │   ├── health_profile.py        #    /profile endpoints
│   │   │   │   └── marketplace.py           #    /marketplace endpoints
│   │   │   └── deps.py                      #    Dependency injection
│   │   ├── auth/                            #    Authentication & authorization
│   │   │   ├── jwt_handler.py               #    JWT token management
│   │   │   ├── oauth2.py                    #    OAuth2 providers
│   │   │   ├── rbac.py                      #    Role-based access control
│   │   │   └── medical_verification.py      #    Doctor credential verification
│   │   ├── websocket/                       #    WebSocket handlers
│   │   │   ├── streaming_handler.py         #    Real-time response streaming
│   │   │   └── council_live_log.py          #    AI Council live processing logs
│   │   ├── models/                          #    Pydantic data models
│   │   │   ├── user.py
│   │   │   ├── query.py
│   │   │   ├── medical_record.py
│   │   │   └── prescription.py
│   │   ├── config.py                        #    Application configuration
│   │   └── middleware.py                    #    CORS, logging, rate limiting
│   │
│   ├── cache/                               # ⚡ Caching Layer
│   │   ├── redis_cache.py                   #    Redis hot cache (sessions, rate limits)
│   │   ├── postgres_cache.py                #    PostgreSQL semantic cache (query results)
│   │   ├── embedding_cache.py               #    Pre-computed embedding cache
│   │   ├── invalidation.py                  #    Medical data cache invalidation logic
│   │   └── cache_config.yaml                #    TTL policies, eviction rules
│   │
│   ├── blockchain/                          # 🔗 Audit Trail
│   │   ├── audit_logger.py                  #    Clinical decision audit logging
│   │   ├── consent_manager.py               #    Patient data sharing consent
│   │   ├── hyperledger_client.py            #    Hyperledger Fabric SDK client
│   │   └── hash_verifier.py                 #    Integrity verification
│   │
│   ├── nlp/                                 # 🇻🇳 Vietnamese Medical NLP
│   │   ├── tokenizer.py                     #    Vietnamese medical text tokenization
│   │   ├── diacritics_handler.py            #    Tone mark normalization & validation
│   │   └── term_mapper.py                   #    VN ↔ EN medical terminology mapping
│   │
│   └── web/                                 # 💻 Next.js Web Frontend
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── src/
│       │   ├── app/                          #    Next.js App Router pages
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx                  #    Landing page
│       │   │   ├── research/                 #    CLARA Research interface
│       │   │   ├── scribe/                   #    Medical Scribe interface
│       │   │   ├── careguard/                #    CareGuard dashboard
│       │   │   ├── council/                  #    AI Council interface
│       │   │   └── dashboard/                #    User dashboard
│       │   ├── components/                   #    Reusable UI components
│       │   │   ├── ui/                       #    shadcn/ui base components
│       │   │   ├── chat/                     #    Chat interface components
│       │   │   ├── medical/                  #    Medical-specific components
│       │   │   └── streaming/                #    Streaming response display
│       │   ├── hooks/                        #    Custom React hooks
│       │   ├── lib/                          #    Utility libraries
│       │   └── styles/                       #    Global styles (Tailwind)
│       └── public/                           #    Static assets
│
├── app/                                     # 📱 React Native Mobile App
│   ├── package.json
│   ├── app.json                             #    Expo/RN config
│   ├── src/
│   │   ├── screens/                         #    App screens
│   │   │   ├── HomeScreen.tsx               #    Health dashboard
│   │   │   ├── ChatScreen.tsx               #    AI Health Chatbot
│   │   │   ├── MedicationsScreen.tsx        #    Medication manager
│   │   │   ├── DDICheckScreen.tsx           #    Drug interaction checker
│   │   │   ├── ProfileScreen.tsx            #    Health profile
│   │   │   ├── RecordsScreen.tsx            #    Medical records vault
│   │   │   ├── MarketplaceScreen.tsx        #    Doctor marketplace
│   │   │   └── OnboardingScreen.tsx         #    Health profile onboarding Q&A
│   │   ├── components/                      #    Reusable components
│   │   │   ├── MedicationCard.tsx
│   │   │   ├── DDIAlert.tsx
│   │   │   ├── HealthSummary.tsx
│   │   │   └── DoctorCard.tsx
│   │   ├── navigation/                      #    React Navigation setup
│   │   ├── services/                        #    API service layer
│   │   │   ├── api.ts                       #    Axios/fetch API client
│   │   │   ├── auth.ts                      #    Authentication service
│   │   │   └── notifications.ts             #    Push notification service
│   │   ├── hooks/                           #    Custom hooks
│   │   ├── store/                           #    State management (Zustand/Redux)
│   │   └── utils/                           #    Utility functions
│   ├── ios/                                 #    iOS native code
│   ├── android/                             #    Android native code
│   └── __tests__/                           #    Mobile test suite
│
├── models/                                  # 🧪 SLM Configurations & Fine-tuning
│   ├── intent_router/                       #    Intent router model configs
│   │   ├── qwen2.5-0.5b-router/            #    Layer 1 role classifier
│   │   │   ├── config.json
│   │   │   ├── training_config.yaml
│   │   │   └── evaluation/
│   │   └── phi3-mini-intent/                #    Layer 2 intent classifier
│   │       ├── config.json
│   │       ├── training_config.yaml
│   │       └── evaluation/
│   ├── medical_ner/                         #    Medical NER model configs
│   │   └── biobert-vn/                      #    Vietnamese BioBERT fine-tune
│   │       ├── config.json
│   │       └── training_config.yaml
│   ├── synthesis/                           #    Synthesis LLM configs
│   │   ├── qwen2.5-72b/                    #    Primary synthesis model
│   │   │   ├── vllm_config.yaml             #    vLLM serving configuration
│   │   │   ├── quantization.yaml            #    GPTQ/AWQ quantization settings
│   │   │   └── lora_adapters/               #    LoRA fine-tuning adapters
│   │   └── llama-3.1-70b/                   #    Backup synthesis model
│   │       └── vllm_config.yaml
│   ├── asr/                                 #    ASR model configs
│   │   └── whisper-large-v3-vn/             #    Vietnamese medical Whisper
│   │       ├── config.json
│   │       └── fine_tune_config.yaml
│   └── embeddings/                          #    Embedding model configs
│       └── bge-m3/                          #    BGE-M3 multilingual embeddings
│           ├── config.json
│           └── fine_tune_config.yaml
│
├── data/                                    # 💾 Data & Vector Storage
│   ├── vector_db/                           #    Milvus vector collections
│   │   ├── pubmed_embeddings/               #    PubMed article embeddings
│   │   ├── vietnamese_medical/              #    Vietnamese corpus embeddings
│   │   ├── drug_embeddings/                 #    Drug information embeddings
│   │   └── guidelines/                      #    Clinical guideline embeddings
│   ├── knowledge_graph/                     #    Neo4j graph data
│   │   ├── medical_ontology/                #    UMLS/SNOMED-CT/ICD-11 graph
│   │   └── drug_interaction_graph/          #    DDI relationship graph
│   ├── training_data/                       #    Model training datasets
│   │   ├── intent_classification/           #    Labeled query → intent pairs
│   │   ├── medical_ner/                     #    NER annotated Vietnamese text
│   │   ├── vietnamese_medical_corpus/       #    Curated VN medical text
│   │   └── asr_training/                    #    Medical ASR training audio
│   ├── seed/                                #    Database seed data
│   │   ├── drugs.json                       #    Initial drug database
│   │   ├── icd11_codes.json                 #    ICD-11 code reference
│   │   └── byt_protocols.json               #    BYT treatment protocols
│   └── migrations/                          #    Database migrations
│       ├── alembic.ini
│       └── versions/
│
├── tests/                                   # 🧪 Test Suite
│   ├── unit/                                #    Unit tests
│   │   ├── test_intent_router.py
│   │   ├── test_rag_pipeline.py
│   │   ├── test_ddi_checker.py
│   │   ├── test_fides_verifier.py
│   │   └── test_data_sources.py
│   ├── integration/                         #    Integration tests
│   │   ├── test_pubmed_integration.py
│   │   ├── test_rxnorm_integration.py
│   │   ├── test_end_to_end_query.py
│   │   └── test_council_workflow.py
│   ├── benchmarks/                          #    Performance & accuracy benchmarks
│   │   ├── medical_qa_benchmark.py          #    Medical QA accuracy testing
│   │   ├── ddi_benchmark.py                 #    DDI detection benchmark
│   │   ├── vietnamese_nlp_benchmark.py      #    Vietnamese NLP quality
│   │   └── latency_benchmark.py             #    Response time benchmarks
│   ├── evaluation/                          #    RAG evaluation benchmarks
│   │   ├── rag_evaluation.py                #    RAG pipeline accuracy
│   │   └── router_evaluation.py             #    Intent router evaluation
│   ├── fixtures/                            #    Test data & fixtures
│   │   ├── sample_queries.json
│   │   ├── sample_prescriptions.json
│   │   └── sample_audio/
│   └── conftest.py                          #    Pytest configuration
│
├── deploy/                                  # 🚀 Deployment Configurations
│   ├── docker/                              #    Docker configurations
│   │   ├── Dockerfile.api                   #    FastAPI backend
│   │   ├── Dockerfile.worker                #    Celery worker
│   │   ├── Dockerfile.web                   #    Next.js frontend
│   │   ├── Dockerfile.vllm                  #    vLLM model serving
│   │   └── docker-compose.yml               #    Local development stack
│   ├── k8s/                                 #    Kubernetes manifests
│   │   ├── base/                            #    Base K8s configs
│   │   │   ├── namespace.yaml
│   │   │   ├── api-deployment.yaml
│   │   │   ├── worker-deployment.yaml
│   │   │   ├── web-deployment.yaml
│   │   │   ├── vllm-deployment.yaml
│   │   │   └── services.yaml
│   │   ├── overlays/                        #    Environment overlays
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── helm/                            #    Helm charts
│   │       └── clara/
│   ├── terraform/                           #    Infrastructure as Code
│   │   ├── aws/                             #    AWS infrastructure
│   │   │   ├── main.tf
│   │   │   ├── eks.tf                       #    EKS cluster
│   │   │   ├── rds.tf                       #    PostgreSQL RDS
│   │   │   ├── elasticache.tf               #    Redis ElastiCache
│   │   │   └── gpu-instances.tf             #    A100/H100 instances
│   │   └── modules/
│   └── ci-cd/                               #    CI/CD pipeline configs
│       ├── .github/                         #    GitHub Actions workflows
│       │   └── workflows/
│       │       ├── ci.yml                   #    Test & lint on PR
│       │       ├── cd-staging.yml           #    Deploy to staging
│       │       └── cd-production.yml        #    Deploy to production
│       └── argocd/                          #    ArgoCD application configs
│
├── scripts/                                 # 🔧 Utility Scripts
│   ├── setup/                               #    Development setup
│   │   ├── install.sh                       #    Full dev environment setup
│   │   ├── seed_database.py                 #    Seed initial data
│   │   └── download_models.py               #    Download & setup SLMs
│   ├── crawlers/                            #    Data crawlers
│   │   ├── byt_crawler.py                   #    BYT monthly protocol crawler
│   │   └── vn_journals_crawler.py           #    Vietnamese medical journal crawler
│   ├── data_processing/                     #    Data management
│   │   ├── ingest_pubmed.py                 #    Bulk PubMed ingestion
│   │   ├── ingest_duoc_thu.py               #    Dược thư ingestion
│   │   ├── build_embeddings.py              #    Generate vector embeddings
│   │   └── update_drug_db.py                #    Update drug interaction DB
│   ├── evaluation/                          #    Model evaluation
│   │   ├── evaluate_rag.py                  #    RAG pipeline evaluation
│   │   ├── evaluate_router.py               #    Intent router accuracy
│   │   └── evaluate_ddi.py                  #    DDI detection evaluation
│   └── monitoring/                          #    Monitoring utilities
│       ├── health_check.py
│       └── gpu_monitor.py
│
├── .env.example                             #    Environment variable template
├── .gitignore
├── pyproject.toml                           #    Python project config (Poetry/uv)
├── Makefile                                 #    Common dev commands
├── README.md                                #    Project overview & quick start
└── LICENSE
```


---

## 2. Technology Stack

### 2.1 Core Stack Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Backend** | Python, FastAPI | 3.11+, 0.104+ | Async API server, auto-generated OpenAPI docs |
| **Frontend Web** | Next.js, React, TailwindCSS | 14, 18, 3.4+ | App Router SSR, shared components with mobile |
| **Mobile** | React Native (Expo) | 0.73+ | iOS + Android, code sharing with web |
| **UI Components** | shadcn/ui | latest | Accessible, customizable component library |
| **AI Orchestration** | LangChain, LangGraph | 0.2+, latest | Agent orchestration, state machine workflows |
| **LLMs** | GPT-4o, Qwen2.5-72B, BioMistral-7B | latest | Main synthesis, backup, specialized medical |
| **Embeddings** | BGE-M3 | latest | Multilingual dense+sparse embeddings |
| **Vector DB** | Milvus (prod), FAISS (local dev) | 2.3+, latest | Hybrid search (dense + BM25) |
| **Database** | PostgreSQL | 16 | Primary store, JSONB for flexible health data, semantic cache |
| **Cache** | Redis | 7 | Hot cache, sessions, rate limits, task queues |
| **Search** | Elasticsearch | 8 | BM25 sparse search for hybrid retrieval |
| **Graph DB** | Neo4j | latest | Medical ontology, DDI relationships, health profiles |
| **Task Queue** | Celery + Redis | latest | Async background workers |
| **ASR** | Whisper Large v3 (VN fine-tuned) | latest | Vietnamese medical speech recognition |
| **NER** | ViHealthBERT + BioBERT-VN | latest | Vietnamese medical entity extraction |
| **LLM Serving** | vLLM | latest | Self-hosted model inference |
| **Blockchain** | Hyperledger Fabric | latest | Immutable clinical audit trail |
| **Object Storage** | S3 / MinIO | latest | Encrypted medical records, audio, PDFs |

### 2.2 Infrastructure & DevOps

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Kubernetes (EKS) | Production container orchestration |
| **IaC** | Terraform | AWS infrastructure provisioning |
| **CI/CD** | GitHub Actions + ArgoCD | Automated test/build/deploy pipeline |
| **Monitoring** | Prometheus + Grafana | Metrics collection & visualization |
| **Logging** | ELK Stack | Centralized logging |
| **Error Tracking** | Sentry | Runtime error capture |
| **AI Observability** | LangSmith | LLM trace monitoring, prompt debugging |
| **API Gateway** | Kong / Traefik | JWT auth, rate limiting |
| **Auth** | JWT + OAuth2 (Keycloak) | Authentication & authorization |
| **Push Notifications** | FCM + APNs | Medication reminders |
| **Payment** | VNPay + MoMo | Vietnamese payment integration |

### 2.3 Model Stack Summary

| CLARA Component | Recommended Model | Size | Latency Target |
|---|---|---|---|
| Layer 1: Role Classifier | Qwen2.5-0.5B-Instruct (VN fine-tuned) | 0.5B | <20ms |
| Layer 2: Intent Router | Qwen2.5-3B-Instruct (VN fine-tuned) | 3B | <80ms |
| Medical NER | ViHealthBERT + Qwen2.5-1.5B ensemble | 110M + 1.5B | <100ms |
| Query Decomposition | Qwen2.5-7B-Instruct (VN medical fine-tuned) | 7B | <200ms |
| Response Synthesis | Qwen2.5-72B / GPT-4o (fallback) | 72B | 2-10s |
| Fact-Checking (FIDES) | BioMistral-7B (VN fine-tuned) | 7B | 1-5s |
| Vietnamese ASR | Whisper Large v3 (VN fine-tuned) | 1.5B | Real-time |
| Embeddings | BGE-M3 (multilingual) | 568M | <50ms |

### 2.4 Estimated Monthly Infrastructure Costs

| Component | Specification | Monthly Cost (Est.) |
|-----------|--------------|-------------------|
| GPU Instances | 2× A100 80GB (LLM inference) | $3,000–6,000 |
| Application Servers | 4× c5.2xlarge (API, workers) | $800–1,200 |
| Databases | PostgreSQL RDS + Redis ElastiCache | $400–800 |
| Vector DB | Milvus on dedicated instance | $300–500 |
| Graph DB | Neo4j AuraDB or self-hosted | $200–400 |
| Storage | S3 (medical records, audio) | $100–300 |
| CDN & Networking | CloudFront, ALB, VPC | $100–200 |
| Monitoring & Logging | Grafana Cloud or self-hosted | $100–200 |
| External APIs | PubMed, RxNorm, LLM API fallback | $200–500 |
| Blockchain | Hyperledger infrastructure | $250–620 |
| **TOTAL** | | **$5,450–10,720/month** |

> **Note:** Costs will be lower in Phase 1 (fewer GPU needs) and scale up with user growth. Self-hosted LLMs via vLLM significantly reduce per-query costs vs. API-only approach at scale.

---

## 3. Team Allocation & Responsibilities (4 Members)

### 3.1 Team Overview

| Member | Role | Primary Domains |
|--------|------|-----------------|
| **Nguyễn Ngọc Thiện** | PM + Frontend Lead | Project management, proposal documents, web/app UI/UX, Personal Health App, market research coordination |
| **Trịnh Minh Quang** | AI/ML Lead | RAG pipeline architecture, intent router design, agent orchestration, AI Council implementation, LangGraph flow design |
| **Nguyễn Hải Duy** | Backend + DevOps Lead | API integration, data source connectors (PubMed, RxNorm, ICD-11, OpenFDA), middleware, infrastructure, cache, deployment, database |
| **Vũ Văn An** | AI/ML Engineer | Medical Scribe (ASR + SOAP), FIDES fact checker, SLM fine-tuning, Vietnamese medical NLP, blockchain audit trail |

### 3.2 Detailed Responsibility Matrix

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         CLARA — RESPONSIBILITY MATRIX                        │
├───────────────────────────┬────────┬────────┬────────┬────────┤
│ Component                 │ Thiện  │ Quang  │  Duy   │   An   │
├───────────────────────────┼────────┼────────┼────────┼────────┤
│ Project Management        │   ★    │        │        │        │
│ Product Proposals/Docs    │   ★    │   ○    │        │        │
│ Market Research           │   ★    │        │        │        │
│ Next.js Web Frontend      │   ★    │        │        │        │
│ React Native Mobile App   │   ★    │        │        │        │
│ Personal Health App       │   ★    │        │   ○    │        │
├───────────────────────────┼────────┼────────┼────────┼────────┤
│ Intent Router (2-Layer)   │        │   ★    │        │        │
│ RAG Pipeline Architecture │        │   ★    │        │        │
│ Agent Orchestration       │        │   ★    │        │        │
│ AI Council Implementation │        │   ★    │        │   ○    │
│ LangGraph Flow Design     │        │   ★    │        │        │
│ Research Agent            │        │   ★    │   ○    │        │
├───────────────────────────┼────────┼────────┼────────┼────────┤
│ FastAPI Middleware         │        │        │   ★    │        │
│ Data Source Connectors     │        │        │   ★    │        │
│ API Integration           │        │        │   ★    │        │
│ Cache Layer (Redis+PG)     │        │        │   ★    │        │
│ Database & Migrations      │        │        │   ★    │        │
│ Docker / K8s / Terraform   │        │        │   ★    │        │
│ CI/CD Pipeline             │        │        │   ★    │        │
│ Monitoring & Observability │        │        │   ★    │        │
├───────────────────────────┼────────┼────────┼────────┼────────┤
│ Medical Scribe Agent       │        │        │        │   ★    │
│ FIDES Fact Checker         │        │        │        │   ★    │
│ SLM Fine-tuning            │        │   ○    │        │   ★    │
│ Vietnamese Medical NLP     │        │        │        │   ★    │
│ Blockchain Audit Trail     │        │        │   ○    │   ★    │
│ Medical NER / BioBERT-VN   │        │        │        │   ★    │
└───────────────────────────┴────────┴────────┴────────┴────────┘

★ = Primary owner    ○ = Contributor/Support
```

### 3.3 Cross-Cutting Concerns

| Concern | Lead | Contributors |
|---------|------|-------------|
| Code Reviews | Rotating | All members |
| Security & Compliance | Duy | An (blockchain), Thiện (auth UI) |
| Testing Strategy | Quang | All members |
| Documentation | Thiện | All members |
| Vietnamese Localization | An | Thiện (UI strings) |

---

## 4. Sprint Planning (6 Months = 12 Sprints × 2 Weeks)

### 4.1 Phase Overview

```
Month 1        Month 2        Month 3        Month 4        Month 5        Month 6
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│◀────── PHASE 1 ──────▶│◀────── PHASE 2 ──────▶│◀────── PHASE 3 ──────▶│
│   Sprints 1-4          │   Sprints 5-8          │   Sprints 9-12         │
│   Foundation           │   Core Features        │   Advanced & Testing   │
│                        │                        │                        │
│   Core RAG + Infra     │   Scribe + CareGuard   │   AI Council + Pilot   │
│   + Basic App          │   + Health Management  │   + Refinement         │
│   Alpha Testing        │   Hospital Pilots      │   Public Launch        │
└────────────────────────┴────────────────────────┴────────────────────────┘
```

### 4.2 Phase 1: Foundation (Sprints 1–4, Months 1–2)

> **Goal:** Build the foundational infrastructure, core RAG engine, and basic user interfaces. Validate core technology with early alpha users.

#### Sprint 1 (Weeks 1–2): Project Setup & First Data Sources

| Owner | Deliverables |
|-------|-------------|
| **Duy** | Cloud infra setup (AWS/GCP), CI/CD pipeline (GitHub Actions), PostgreSQL + Redis + Milvus deployment, Docker Compose for local dev |
| **Duy** | PubMed E-utilities connector (ESearch, EFetch, ELink), ICD-11 API connector, rate limiting (10 req/s) |
| **Quang** | Project architecture setup, LangChain/LangGraph scaffolding, base agent class design |
| **An** | Vietnamese NLP tokenizer setup (VnCoreNLP/PhoBERT), BGE-M3 embedding pipeline initialization |
| **Thiện** | Project documentation setup, development environment guide, Next.js project scaffold |

#### Sprint 2 (Weeks 3–4): Basic RAG Pipeline & Vector DB

| Owner | Deliverables |
|-------|-------------|
| **Quang** | Basic RAG pipeline: ingestion → chunking → embedding → retrieval → synthesis, semantic chunking strategy |
| **Quang** | Milvus vector DB collections setup, FAISS local dev fallback, hybrid search (dense + BM25) |
| **Duy** | Elasticsearch setup for BM25 sparse search, embedding pipeline automation |
| **An** | BGE-M3 embedding generation for initial PubMed corpus, Vietnamese text preprocessing |
| **Thiện** | Basic web UI: search interface, streaming response display prototype |

#### Sprint 3 (Weeks 5–6): Intent Router Layer 1 & Web UI

| Owner | Deliverables |
|-------|-------------|
| **Quang** | Intent Router Layer 1: Qwen2.5-0.5B role classifier (Normal/Researcher/Doctor), training data collection, router_config.yaml |
| **Duy** | FastAPI middleware: main.py, API v1 routes (/search, /chat), WebSocket streaming, JWT auth |
| **An** | Vietnamese medical corpus indexing: Dược thư Quốc gia initial ingestion, BYT protocol seed data |
| **Thiện** | Web UI: CLARA Research interface, chat components, Perplexity-style streaming display, responsive layout |

#### Sprint 4 (Weeks 7–8): Intent Router Layer 2 & Multi-Source Retrieval

| Owner | Deliverables |
|-------|-------------|
| **Quang** | Intent Router Layer 2: role-specific intent classification (~15 categories), Phi-3-mini or Qwen2.5-3B fine-tuning |
| **Quang** | Multi-source retrieval: parallel queries to PubMed + Vietnamese corpus + ICD-11, cross-encoder reranking |
| **Duy** | RxNorm API connector, OpenFDA connector, ClinicalTrials.gov connector, unified response normalizer |
| **An** | MeSH term mapping for query enrichment, Vietnamese ↔ English medical term mapper |
| **Thiện** | Personal Health App MVP: React Native scaffold, onboarding health profile (APP-001), basic chatbot (APP-006) |

**Phase 1 Exit Criteria:** RAG response quality ≥80% factual accuracy, response time <2min (Normal), <5min (Researcher simple), 3+ data sources integrated, intent routing accuracy >85%

### 4.3 Phase 2: Core Features (Sprints 5–8, Months 3–4)

> **Goal:** Launch clinical decision support tools (CareGuard, Medical Scribe) and enhance the consumer health app. Begin hospital pilot programs at ĐH Y Dược Huế.

#### Sprint 5 (Weeks 9–10): Medical Scribe MVP

| Owner | Deliverables |
|-------|-------------|
| **An** | Medical Scribe MVP: Whisper-based Vietnamese ASR pipeline, speaker diarization (pyannote), medical entity extraction (NER) |
| **An** | SOAP note generation from transcribed audio, Vietnamese medical terminology handling |
| **Quang** | Scribe agent integration into LangGraph workflow, audio → text → structured record pipeline |
| **Duy** | /scribe API endpoints, audio upload handling, WebSocket for real-time transcription |
| **Thiện** | Scribe web interface: audio recording, live transcription display, SOAP note review/edit UI |

#### Sprint 6 (Weeks 11–12): Vietnamese Sources & Cache Layer

| Owner | Deliverables |
|-------|-------------|
| **An** | Vietnamese medical NLP refinements: diacritics handler, coreference resolution (VN-specific), term mapping improvements |
| **Duy** | BYT monthly crawler (automated), Dược thư Quốc gia full ingestion, Vietnamese medical journal scrapers |
| **Duy** | 4-layer cache implementation: Redis hot cache, PostgreSQL semantic cache, embedding cache, cache invalidation with UPDATE-not-APPEND semantics |
| **Quang** | Query enrichment pipeline: MeSH term expansion, Vietnamese synonym mapping, medical abbreviation resolution |
| **Thiện** | Personal Health App: medication manager (APP-003), medication reminders (APP-004), smart health profile (APP-002) |

#### Sprint 7 (Weeks 13–14): CareGuard & FIDES v1

| Owner | Deliverables |
|-------|-------------|
| **Duy** | CareGuard DDI engine: RxNorm integration, drug normalization, interaction severity classification (critical/major/moderate/minor) |
| **An** | FIDES Fact Checker v1: claim decomposition (BioMistral-7B), evidence retrieval, cross-reference verification, verdict generation |
| **An** | DDI cross-checking against Dược thư Quốc gia, Vietnamese drug name normalization |
| **Quang** | CareGuard agent orchestration: dosage calculator (Cockcroft-Gault, CKD-EPI), contraindication detection, prescription validation vs. BYT protocols |
| **Thiện** | CareGuard web dashboard, consumer DDI check interface (APP-005) with severity color-coding (🔴🟡🟢) |

#### Sprint 8 (Weeks 15–16): Personal Health App Enhancement

| Owner | Deliverables |
|-------|-------------|
| **Thiện** | Health summary dashboard (APP-007), medical records vault (APP-008), doctor marketplace MVP (APP-010), share-with-doctor (APP-009) |
| **Duy** | Health profile API endpoints, Neo4j graph setup for patient→conditions→medications relationships, FHIR data model |
| **Quang** | Research agent enhancements: comparative analysis (drug/treatment comparison), guideline analyzer (BYT vs. international) |
| **An** | BioBERT-VN fine-tuning for medical NER, Whisper ASR accuracy improvements with real clinical audio data |
| **Duy** | Blockchain audit trail MVP: Hyperledger Fabric setup, clinical decision logging, hash verification |

**Phase 2 Exit Criteria:** DDI detection accuracy ≥95% sensitivity for critical interactions, Scribe WER <15%, SOAP note acceptance ≥75%, FIDES fact-check F1 >0.8, 2-3 hospital pilot sites active, 500-1,000 app users

### 4.4 Phase 3: Advanced & Testing (Sprints 9–12, Months 5–6)

> **Goal:** Complete the full platform with AI Council, advanced workflows, blockchain audit, and conduct pilot testing. Prepare for public launch.

#### Sprint 9 (Weeks 17–18): AI Council for Doctors

| Owner | Deliverables |
|-------|-------------|
| **Quang** | AI Council multi-agent deliberation: council_orchestrator.py, specialist agent framework (Cardiology, Nephrology, Endocrinology, etc.) |
| **Quang** | Deliberation engine: independent analysis → conflict detection → consensus/divergence resolution, structured recommendation output |
| **An** | Full FIDES v2: 5-step pipeline (Claim Decomposition → Evidence Retrieval → Cross-Reference → Citation Validation → Verdict), tiered verification depth |
| **Duy** | /council API endpoints, WebSocket for live processing logs (council_live_log.py), AI Council session management |
| **Thiện** | AI Council web interface: case input form, live specialist reasoning display, consensus visualization, recommendation export |

#### Sprint 10 (Weeks 19–20): Blockchain Audit & Advanced Workflows

| Owner | Deliverables |
|-------|-------------|
| **An** | Blockchain: consent manager for patient data sharing, complete audit trail for all clinical decisions, hash verification pipeline |
| **Duy** | Advanced cache: embedding cache optimization, medical data cache invalidation logic, TTL policies per data source |
| **Quang** | Multi-tier workflow refinement: Tier 1 Simple (<2min), Tier 2 Research (5-20min with streaming), Tier 3 AI Council (<20min with live logs) |
| **Quang** | Coding agent for tool use: dynamic tool creation for specialized medical calculations, API queries |
| **Thiện** | Advanced app features: family health profiles (APP-011), symptom checker (APP-014), appointment manager (APP-013) |

#### Sprint 11 (Weeks 21–22): Pilot Testing at ĐH Y Dược Huế

| Owner | Deliverables |
|-------|-------------|
| **All** | Pilot deployment at ĐH Y Dược Huế, on-site support, feedback collection from doctors, researchers, and students |
| **An** | Vietnamese NLP optimization based on real-world feedback, ASR model refinement with clinical audio |
| **Quang** | RAG pipeline tuning based on pilot queries, intent router accuracy improvements, response quality optimization |
| **Duy** | Performance optimization: latency reduction, load testing, infrastructure scaling, monitoring dashboards (Prometheus + Grafana) |
| **Thiện** | UI/UX refinements based on pilot feedback, accessibility improvements, mobile app polish |

#### Sprint 12 (Weeks 23–24): Refinement, Documentation & Final Deployment

| Owner | Deliverables |
|-------|-------------|
| **Duy** | Production security hardening: penetration testing, OWASP compliance, data encryption verification, final infrastructure setup |
| **Quang** | Final model evaluations: RAG accuracy benchmarks, intent router benchmarks, DDI benchmarks, all KPI verification |
| **An** | Documentation: FIDES technical docs, SLM fine-tuning guides, Vietnamese NLP documentation, blockchain audit specs |
| **Thiện** | Final documentation: API docs (OpenAPI/Swagger), user guides, onboarding docs, project wrap-up |
| **All** | Bug fixes, edge case handling, final deployment to production, launch preparation |

**Phase 3 Exit Criteria:** AI Council functional for complex cases, response times meeting all tier KPIs, pilot feedback score >4/5, 99.5% uptime over 2-week burn-in, all P0/P1 features operational, security audit passed, 5,000+ registered app users

---

## 5. Environment Setup & API Keys

### 5.1 Required API Keys & External Services

| Service | API Key / Credential | Purpose | Rate Limits | Free Tier |
|---------|---------------------|---------|-------------|-----------|
| **NCBI/PubMed** | NCBI API Key | PubMed E-utilities (ESearch, EFetch, ELink) | 10 req/s (with key) vs. 3 req/s (without) | ✅ Free |
| **OpenAI** | OPENAI_API_KEY | GPT-4o synthesis (fallback), embeddings | Pay-per-token | ❌ Paid |
| **WHO ICD-11** | ICD11_CLIENT_ID + SECRET | Disease classification lookup | Standard API limits | ✅ Free |
| **NLM RxNorm** | No key required | Drug normalization, DDI data | ~20 req/s | ✅ Free |
| **OpenFDA** | OPENFDA_API_KEY (optional) | Adverse events, drug labeling | 240 req/min (with key) | ✅ Free |
| **ClinicalTrials.gov** | No key required | Clinical trial registry search | Standard API limits | ✅ Free |
| **HuggingFace** | HF_TOKEN | Model downloads (Qwen, BioMistral, BGE-M3) | Standard limits | ✅ Free |
| **LangSmith** | LANGCHAIN_API_KEY | AI observability, prompt tracing | Varies by plan | ✅ Free tier |

### 5.2 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/clara-team/clara.git && cd clara

# 2. Python environment (Python 3.11+ required)
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"  # or: poetry install / uv sync

# 3. Environment variables
cp .env.example .env
# Fill in API keys: NCBI_API_KEY, OPENAI_API_KEY, ICD11_CLIENT_ID, etc.

# 4. Start infrastructure services
cd deploy/docker && docker-compose up -d
# Starts: PostgreSQL, Redis, Milvus, Elasticsearch, Neo4j

# 5. Database setup
python scripts/setup/seed_database.py         # Seed initial data
alembic upgrade head                           # Run migrations

# 6. Download models (first time only)
python scripts/setup/download_models.py        # BGE-M3, Qwen2.5, BioMistral

# 7. Start development servers
make dev-api          # FastAPI backend (uvicorn, port 8000)
make dev-web          # Next.js frontend (port 3000)
make dev-worker       # Celery worker for async tasks
```

### 5.3 Pre-commit Hooks Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    hooks:
      - id: ruff          # Python linting
      - id: ruff-format   # Python formatting
  - repo: https://github.com/pre-commit/mirrors-mypy
    hooks:
      - id: mypy          # Type checking
  - repo: local
    hooks:
      - id: pytest-check  # Run unit tests
        entry: pytest tests/unit/ -x --timeout=30
```

### 5.4 Makefile Quick Reference

```makefile
make dev-api           # Start FastAPI dev server
make dev-web           # Start Next.js dev server
make dev-worker        # Start Celery worker
make test              # Run all tests
make test-unit         # Run unit tests only
make test-integration  # Run integration tests
make lint              # Run ruff linter
make format            # Auto-format code
make type-check        # Run mypy
make docker-up         # Start Docker services
make docker-down       # Stop Docker services
make seed              # Seed database
make evaluate-rag      # Run RAG evaluation
make evaluate-router   # Run intent router evaluation
make build-embeddings  # Generate vector embeddings
```

---

## 6. KPI Milestones per Sprint

### 6.1 Sprint-Level KPI Targets

| Sprint | Period | Key KPI Targets |
|--------|--------|-----------------|
| **Sprint 1–2** | Weeks 1–4 | ✅ 1+ data source working end-to-end (PubMed), basic query → response pipeline functional, <5s embedding generation |
| **Sprint 3–4** | Weeks 5–8 | ✅ 3+ sources integrated (PubMed, ICD-11, RxNorm), intent routing accuracy >85%, response time <2min (Normal user) |
| **Sprint 5–6** | Weeks 9–12 | ✅ Medical Scribe WER <15% for Vietnamese, Vietnamese sources live (BYT + Dược thư), cache hit rate >30% |
| **Sprint 7–8** | Weeks 13–16 | ✅ DDI detection accuracy ≥90% (critical), FIDES fact-check F1 >0.8, Personal Health App functional on iOS + Android |
| **Sprint 9–10** | Weeks 17–20 | ✅ AI Council functional with 2-5 specialists, all tier response times meeting KPIs, blockchain audit operational |
| **Sprint 11–12** | Weeks 21–24 | ✅ Pilot feedback score >4/5 at ĐH Y Dược Huế, all KPIs met, 99.5% uptime, security audit passed |

### 6.2 Cumulative Performance KPIs

| Metric | Sprint 4 | Sprint 8 | Sprint 12 (Final) |
|--------|----------|----------|-------------------|
| **Factual Accuracy** | ≥80% | ≥85% | ≥90% |
| **Citation Accuracy** | ≥85% | ≥90% | ≥95% |
| **Intent Router Accuracy** | >85% | >90% | >93% |
| **DDI Sensitivity (Critical)** | — | ≥90% | ≥98% |
| **DDI Specificity** | — | ≥80% | ≥85% |
| **Scribe WER (Vietnamese)** | — | <15% | <12% |
| **SOAP Note Acceptance** | — | ≥75% | ≥80% |
| **FIDES Fact-Check Precision** | — | ≥80% | ≥85% |
| **Hallucination Rate** | <10% | <7% | <5% |
| **Vietnamese NLP Intent Classification** | ≥85% | ≥88% | ≥90% |

### 6.3 Response Time KPIs by Tier

| Workflow Tier | Target | Description |
|--------------|--------|-------------|
| **Tier 1: Simple** | <2 minutes | Normal user simple health queries |
| **Tier 2: Research** | 5–20 minutes | Researcher complex literature search with Perplexity-style streaming |
| **Tier 3: AI Council** | <20 minutes | Doctor complex case deliberation with live processing logs |
| **Intent Routing** | <100ms | Two-layer SLM-based classification |
| **Embedding Generation** | <50ms | BGE-M3 per query |
| **Cache Hit Response** | <500ms | Semantic cache retrieval |

### 6.4 Business & Engagement KPIs

| Metric | Sprint 4 | Sprint 8 | Sprint 12 (Final) |
|--------|----------|----------|-------------------|
| **Alpha/Beta Users** | 50–100 | 500–1,000 | 5,000+ |
| **Hospital Pilot Sites** | — | 2–3 | 3–5 signed contracts/MOUs |
| **Doctor Marketplace** | — | — | 50+ verified doctors, 100+ consultations |
| **Platform Uptime** | 95% | 99% | 99.5% |
| **NPS Score** | — | — | ≥40 across all segments |
| **P0/P1 Feature Delivery** | 100% Phase 1 | 100% Phase 2 | 100% all phases |

### 6.5 Feature Delivery Summary

| Priority | Count | Timeline | Description |
|----------|-------|----------|-------------|
| **P0** (Must Have) | 22 features | Phase 1–2 | Core functionality required for MVP and clinical safety |
| **P1** (Should Have) | 18 features | Phase 1–3 | Important features for competitive differentiation |
| **P2** (Nice to Have) | 17 features | Phase 2–3 | Enhanced functionality for user delight |
| **P3** (Future) | 8 features | Phase 3+ | Advanced features for future phases |
| **TOTAL** | **65 features** | 6 months | Across 6 modules (Research, Scribe, CareGuard, Trials, Ops, Personal Health) |

---

> **Cross-References:**
> - `docs/proposal/product_proposal.md` — Full feature specifications, user stories, and business model
> - `docs/proposal/personal_health_app.md` — Detailed Personal Health App design and architecture
> - `docs/proposal/user_stories.md` — Complete user stories for all modules
> - `docs/research/technical_architecture_deep_dive.md` — Detailed technical architecture across 7 dimensions
> - `docs/research/data_sources_and_rag_analysis.md` — Data source analysis and RAG pipeline design
> - `docs/research/fides_fact_checker.md` — FIDES fact-checking pipeline research and implementation
> - `docs/research/medical_slms_research.md` — Medical SLM analysis and Vietnamese fine-tuning strategy
> - `docs/research/market_research_global.md` — Global market research and competitive analysis

---

*Document generated for CLARA (Clinical Agent for Retrieval & Analysis) — Vietnamese Medical AI Assistant*
*© 2025 CLARA Project — Internal Technical Documentation*