# 📚 CLARA Documentation Index

> **CLARA** — Clinical Agent for Retrieval & Analysis
> **Total Documentation**: 15 files | **~16,680 lines** | **~420 pages equivalent**

---

## 📊 Documentation Overview

| # | File | Lines | Category | Status |
|---|------|-------|----------|--------|
| 1 | `CLAUDE.md` | 173 | Project Config | ✅ Complete |
| 2 | `docs/research/market_research_global.md` | 654 | Market Research | ✅ Complete |
| 3 | `docs/research/technical_architecture_deep_dive.md` | 2,007 | Technical | ✅ Complete |
| 4 | `docs/research/data_sources_and_rag_analysis.md` | 1,580 | Technical | ✅ Complete |
| 5 | `docs/research/fides_fact_checker.md` | 1,302 | Technical | ✅ Complete |
| 6 | `docs/research/medical_slms_research.md` | 1,033 | Research | ✅ Complete |
| 7 | `docs/research/risk_analysis_and_gaps.md` | 998 | Analysis | ✅ Complete |
| 8 | `docs/proposal/product_proposal.md` | 1,269 | Proposal | ✅ Complete |
| 9 | `docs/proposal/research_proposal_vi.md` | 191 | Proposal (VN) | ✅ Complete |
| 10 | `docs/proposal/personal_health_app.md` | 1,742 | Product | ✅ Complete |
| 11 | `docs/proposal/clara_workflows.md` | 957 | Architecture | ✅ Complete |
| 12 | `docs/proposal/project_structure_and_sprints.md` | 825 | Planning | ✅ Complete |
| 13 | `docs/proposal/user_stories.md` | 196 | Requirements | ✅ Complete |
| 14 | `docs/proposal/devops_and_cicd.md` | 2,794 | DevOps | ✅ Complete |
| 15 | `docs/architecture/CLARA_SYSTEM_ARCHITECTURE.md` | 959 | Architecture | ✅ Complete |

---

## 📖 Recommended Reading Order

### For Executive / Stakeholder Review
1. `docs/proposal/research_proposal_vi.md` — Đề xuất nghiên cứu (tiếng Việt)
2. `docs/research/market_research_global.md` — Market research & competitor analysis
3. `docs/proposal/product_proposal.md` — Full product proposal with features & business model

### For Technical Team
4. `docs/architecture/CLARA_SYSTEM_ARCHITECTURE.md` — **★ Master Architecture Reference** (synthesizes all docs + 11 Mermaid diagrams)
5. `docs/research/technical_architecture_deep_dive.md` — Core architecture (Intent Router, RAG, Workflows)
6. `docs/proposal/clara_workflows.md` — Workflow diagrams (Simple/Research/Doctor tiers)
7. `docs/research/data_sources_and_rag_analysis.md` — Data sources, RAG pipeline, cache strategy
8. `docs/research/fides_fact_checker.md` — FIDES-inspired fact checking module
9. `docs/research/medical_slms_research.md` — Medical SLM selection & fine-tuning

### For Product Team
10. `docs/proposal/user_stories.md` — 16 user stories across 3 roles
11. `docs/proposal/personal_health_app.md` — Personal Health Management App/Web

### For DevOps & Planning
12. `docs/proposal/project_structure_and_sprints.md` — Project structure & sprint planning
13. `docs/proposal/devops_and_cicd.md` — CI/CD, Docker, K8s, monitoring, security
14. `docs/research/risk_analysis_and_gaps.md` — 42 identified risks with mitigations

### For Development
15. `CLAUDE.md` — AI coding assistant context & architecture patterns

---

## 🔗 Document Relationships

```
CLARA_SYSTEM_ARCHITECTURE.md (★ Master Reference — synthesizes all below)
    │
    research_proposal_vi.md (Executive Summary)
    ├── market_research_global.md (Market Data)
    ├── product_proposal.md (Features & Business)
    │   ├── user_stories.md (Requirements)
    │   └── personal_health_app.md (Health App Detail)
    ├── technical_architecture_deep_dive.md (Core Architecture)
    │   ├── clara_workflows.md (Workflow Diagrams)
    │   ├── data_sources_and_rag_analysis.md (RAG Pipeline)
    │   ├── fides_fact_checker.md (Verification)
    │   └── medical_slms_research.md (AI Models)
    ├── project_structure_and_sprints.md (Planning)
    │   └── devops_and_cicd.md (Infrastructure)
    └── risk_analysis_and_gaps.md (Risk Assessment)
```

---

## 📋 Coverage Matrix

| Topic | Covered In | Depth |
|-------|-----------|-------|
| Market Research | `market_research_global.md` | ★★★★★ |
| Competitor Analysis | `market_research_global.md` | ★★★★★ |
| Vietnam AI Healthcare | `market_research_global.md` | ★★★★☆ |
| Intent Router (2-layer) | `technical_architecture_deep_dive.md`, `clara_workflows.md` | ★★★★★ |
| RAG Pipeline | `data_sources_and_rag_analysis.md`, `technical_architecture_deep_dive.md` | ★★★★★ |
| Data Sources (PubMed, BYT, etc.) | `data_sources_and_rag_analysis.md` | ★★★★★ |
| Fact Checking (FIDES) | `fides_fact_checker.md` | ★★★★★ |
| Medical SLMs | `medical_slms_research.md` | ★★★★★ |
| Workflows (3 tiers) | `clara_workflows.md` | ★★★★★ |
| AI Council (Hội chẩn) | `clara_workflows.md`, `technical_architecture_deep_dive.md` | ★★★★☆ |
| Cache Strategy | `data_sources_and_rag_analysis.md`, `clara_workflows.md` | ★★★★☆ |
| Blockchain | `technical_architecture_deep_dive.md` | ★★★☆☆ |
| Personal Health App | `personal_health_app.md` | ★★★★★ |
| User Stories | `user_stories.md` | ★★★★☆ |
| Product Proposal | `product_proposal.md` | ★★★★★ |
| Sprint Planning | `project_structure_and_sprints.md` | ★★★★☆ |
| DevOps / CI/CD | `devops_and_cicd.md` | ★★★★★ |
| Risk Analysis | `risk_analysis_and_gaps.md` | ★★★★★ |
| Vietnamese NLP | `data_sources_and_rag_analysis.md`, `medical_slms_research.md` | ★★★★☆ |
| Security | `devops_and_cicd.md`, `medical_slms_research.md` | ★★★★☆ |
| Legal/Regulatory | `market_research_global.md`, `research_proposal_vi.md` | ★★★★☆ |
| Business Model | `product_proposal.md` | ★★★★☆ |
| Budget Estimation | `research_proposal_vi.md`, `devops_and_cicd.md` | ★★★☆☆ |

---

## 🏗️ Key Architecture Decisions Documented

1. **Two-Layer Intent Router** — Qwen2.5-0.5B for role, Phi-3-mini for intent (not single classifier)
2. **Three Workflow Tiers** — Simple (<2min), Research (5-20min), Doctor (10-20min)
3. **FIDES Fact Checker** — Separate verification node, not inline
4. **Cache: UPDATE not ADD** — Medical safety requirement
5. **BGE-M3 Embeddings** — Multilingual support for Vietnamese
6. **Milvus Vector DB** — Primary vector store (FAISS for local dev)
7. **Progressive Results** — Perplexity-style for researchers
8. **AI Council** — Multi-specialist deliberation for doctors with full logs

---

*Generated: 2025 | Project CLARA*

