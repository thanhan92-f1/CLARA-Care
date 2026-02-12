# CLARA — Product Proposal & Feature Planning Document
# (Clinical Agent for Retrieval & Analysis)

> **Version:** 1.0
> **Date:** January 2025
> **Classification:** Internal — Product Strategy & Planning
> **Prepared by:** CLARA Product Team
> **Audience:** Founders, Engineering Leadership, Investors, Stakeholders

---

## Table of Contents

1. [Executive Summary (Tóm tắt Điều hành)](#1-executive-summary)
2. [Product Vision & Mission](#2-product-vision--mission)
3. [Target Users & Personas](#3-target-users--personas)
4. [Product Architecture — Two Components](#4-product-architecture--two-components)
5. [Feature Planning by Module](#5-feature-planning-by-module)
   - 5.1 CLARA Research
   - 5.2 CLARA Medical Scribe
   - 5.3 CLARA CareGuard
   - 5.4 CLARA Trials & Cohort
   - 5.5 CLARA Ops & Education Suite
   - 5.6 Personal Health Management App/Web
6. [User Stories](#6-user-stories)
7. [Phase Planning — 6-Month Roadmap](#7-phase-planning--6-month-roadmap)
8. [KPI Targets & Performance Metrics](#8-kpi-targets--performance-metrics)
9. [Technology Stack Recommendations](#9-technology-stack-recommendations)
10. [Risk Assessment](#10-risk-assessment)
11. [Business Model Canvas](#11-business-model-canvas)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary (Tóm tắt Điều hành)

### Tiếng Việt

**CLARA (Clinical Agent for Retrieval & Analysis)** là một nền tảng AI y tế toàn diện, được thiết kế để phục vụ đồng thời ba nhóm đối tượng chính: **người dùng thông thường**, **nhà nghiên cứu y khoa**, và **bác sĩ lâm sàng**. Sản phẩm được xây dựng trên nền tảng công nghệ Agentic RAG (Retrieval-Augmented Generation) tiên tiến nhất, đảm bảo mọi câu trả lời đều được trích dẫn từ nguồn y khoa đáng tin cậy.

**Tầm nhìn chiến lược:** Trở thành nền tảng AI y tế hàng đầu Việt Nam và Đông Nam Á, cung cấp hỗ trợ quyết định lâm sàng dựa trên bằng chứng, quản lý sức khỏe cá nhân thông minh, và công cụ nghiên cứu y khoa tiên tiến — tất cả bằng tiếng Việt, phù hợp với bối cảnh y tế Việt Nam.

**CLARA gồm hai thành phần chính:**

**Thành phần 1 — Nền tảng CLARA AI Agent (Nghiên cứu & Lâm sàng):**
- **CLARA Research:** Hệ thống Agentic RAG cho tra cứu y văn, tổng hợp bằng chứng, phân tích so sánh thuốc và phác đồ điều trị
- **CLARA Medical Scribe:** Chuyển đổi âm thanh khám bệnh thành bệnh án điện tử có cấu trúc (SOAP notes), hỗ trợ tiếng Việt bản địa
- **CLARA CareGuard:** Hỗ trợ quyết định lâm sàng — kiểm tra tương tác thuốc (DDI), tính liều, cảnh báo chống chỉ định, phát hiện xung đột với phác đồ BYT
- **CLARA Trials & Cohort:** Đối chiếu bệnh nhân với thử nghiệm lâm sàng phù hợp, hỗ trợ tuyển chọn đối tượng nghiên cứu
- **CLARA Ops & Education Suite:** Tối ưu hóa vận hành bệnh viện, đào tạo y khoa liên tục, mô phỏng ca bệnh

**Thành phần 2 — Ứng dụng Quản lý Sức khỏe Cá nhân (App/Web):**
- Hồ sơ sức khỏe cá nhân thông minh — tự động xây dựng từ lịch sử tương tác + khảo sát onboarding
- Quản lý thuốc với nhắc nhở uống thuốc
- Kiểm tra tương tác thuốc (DDI) cho người dùng thông thường
- Chatbot AI hỏi đáp sức khỏe bằng ngôn ngữ dễ hiểu
- Tính năng AI: Tự động tổng hợp & cập nhật hồ sơ sức khỏe sau mỗi tương tác
- Quản lý hồ sơ y tế (lưu trữ, chia sẻ với bác sĩ)
- **Mô hình kinh doanh:** Kết nối với bác sĩ thật để nhận tư vấn chuyên sâu (marketplace y tế)

**Cơ hội thị trường:**
- Thị trường AI y tế toàn cầu: $14.9–26.6 tỷ USD (2024), dự kiến $164–194 tỷ USD vào 2030
- Thị trường CDSS: ~$2.5 tỷ USD (2024), phân khúc tăng trưởng nhanh nhất
- Việt Nam: 100 triệu dân, tỷ lệ bác sĩ/bệnh nhân thấp (9/10.000), chưa có đối thủ cạnh tranh trực tiếp
- Lợi thế tiên phong: Không có sản phẩm AI y tế nào hỗ trợ tiếng Việt bản địa ở cấp độ lâm sàng

**Lộ trình 6 tháng:**
- Giai đoạn 1 (Tháng 1–2): Core RAG + Ứng dụng Sức khỏe cơ bản
- Giai đoạn 2 (Tháng 3–4): Medical Scribe + CareGuard + Quản lý Sức khỏe nâng cao
- Giai đoạn 3 (Tháng 5–6): Trials, Ops, và tính năng nâng cao

**KPI mục tiêu:**
- Người dùng thông thường: Phản hồi < 2 phút
- Nhà nghiên cứu: 5–10–20 phút tùy độ phức tạp (streaming real-time)
- Bác sĩ: < 10–20 phút với nhật ký xử lý AI Council trực tiếp

---

### English Summary

CLARA is a comprehensive AI-powered medical platform serving three user segments simultaneously: everyday health consumers, medical researchers, and practicing clinicians. Built on state-of-the-art Agentic RAG architecture, CLARA ensures every response is grounded in verifiable medical evidence. The platform comprises two major components: (1) the CLARA AI Agent Platform for research and clinical decision support, and (2) a Personal Health Management App/Web for everyday users. CLARA targets the Vietnamese market as first-mover, with plans for ASEAN expansion. The global CDSS market is valued at ~$2.5B (2024) and growing rapidly, with no dominant Vietnamese-language competitor. The 6-month roadmap delivers the MVP in months 1–2, adds clinical tools in months 3–4, and completes advanced features in months 5–6.

---

## 2. Product Vision & Mission

### 2.1 Vision

> **"Democratize access to evidence-based medical knowledge for every Vietnamese — from the patient in a rural commune health center to the specialist at a tier-1 hospital."**

CLARA envisions a future where:
- Every Vietnamese citizen can access reliable, understandable health information in their native language
- Every researcher can synthesize the global body of medical literature in minutes, not days
- Every doctor can consult an AI-powered multi-specialist council before making critical decisions
- Every patient's health data is unified, private, portable, and actionable

### 2.2 Mission

**Build the most trusted, Vietnamese-native AI medical platform** that:

1. **Empowers patients** with personalized health management tools and AI-powered health literacy
2. **Accelerates research** by automating literature synthesis and evidence grading across millions of medical publications
3. **Supports clinicians** with real-time clinical decision support — drug interaction checks, dosage calculations, differential diagnosis, and multi-specialist AI deliberation
4. **Bridges the gap** between global medical knowledge (predominantly English) and Vietnamese clinical practice (BYT protocols, Dược thư Quốc gia)
5. **Connects patients to doctors** through an integrated marketplace for professional medical consultations

### 2.3 Core Principles

| Principle | Description |
|-----------|-------------|
| **Evidence-First** | Every claim is grounded in retrievable, verifiable medical evidence. No hallucination tolerance. |
| **Safety-by-Design** | Multi-layer verification (FIDES fact-checker), emergency fast-paths, clear disclaimers. Never replaces a doctor's judgment. |
| **Vietnamese-Native** | Purpose-built for Vietnamese language, clinical workflows, BYT protocols, and cultural context. |
| **Transparent** | Full citation transparency. Users always see the sources behind every recommendation. |
| **Privacy-Centered** | Compliance with Nghị định 13/2023/NĐ-CP, GDPR-ready architecture, blockchain audit trails. |
| **Inclusive** | Accessible to all — from medical students to senior specialists, from urban patients to rural communities. |




---

## 3. Target Users & Personas

### 3.1 User Segment Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CLARA USER SEGMENTS                                    │
│                                                                          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  NORMAL USERS   │  │  RESEARCHERS     │  │  DOCTORS             │   │
│  │  (Người dùng    │  │  (Nhà nghiên     │  │  (Bác sĩ lâm sàng)  │   │
│  │   thông thường) │  │   cứu y khoa)    │  │                      │   │
│  ├─────────────────┤  ├──────────────────┤  ├──────────────────────┤   │
│  │ • Patients      │  │ • PhD students   │  │ • GPs (Bác sĩ ĐK)   │   │
│  │ • Caregivers    │  │ • Post-docs      │  │ • Specialists        │   │
│  │ • Health-       │  │ • Faculty        │  │ • Residents          │   │
│  │   conscious     │  │ • Pharmacists    │  │ • Hospital admins    │   │
│  │ • Medical       │  │ • Clinical       │  │ • Pharmacists (clin) │   │
│  │   students      │  │   researchers    │  │ • Nurses (advanced)  │   │
│  ├─────────────────┤  ├──────────────────┤  ├──────────────────────┤   │
│  │ KPI: < 2 min    │  │ KPI: 5-20 min    │  │ KPI: < 10-20 min    │   │
│  │ Component: App  │  │ Component: Both  │  │ Component: Platform  │   │
│  │ Language: Simple │  │ Language: Expert │  │ Language: Clinical   │   │
│  └─────────────────┘  └──────────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Persona Details

#### Persona 1: Chị Lan — Normal User (Patient / Caregiver)

| Attribute | Details |
|-----------|---------|
| **Name** | Nguyễn Thị Lan, 42 tuổi |
| **Role** | Nhân viên văn phòng, chăm sóc bố mẹ già |
| **Context** | Bố bị đái tháo đường type 2, mẹ bị tăng huyết áp. Bản thân mới được kê đơn thuốc cholesterol. |
| **Pain Points** | Không hiểu rõ tác dụng phụ của thuốc; khó nhớ lịch uống thuốc; muốn kiểm tra xem thuốc bố/mẹ có tương tác không; lo lắng khi đọc thông tin y tế trên mạng không rõ nguồn |
| **Needs** | Thông tin y tế đáng tin cậy bằng tiếng Việt dễ hiểu; nhắc nhở uống thuốc; kiểm tra DDI đơn giản; hồ sơ sức khỏe gia đình; khi cần thì được kết nối bác sĩ thật |
| **CLARA Usage** | Personal Health App — medication reminders, DDI check, AI chatbot for health questions, doctor marketplace |
| **Success Metric** | < 2 min response time, 0 medical jargon in responses, clear "khi nào cần gặp bác sĩ" guidance |

#### Persona 2: Anh Minh — Researcher (Medical PhD Student)

| Attribute | Details |
|-----------|---------|
| **Name** | Trần Văn Minh, 29 tuổi |
| **Role** | Nghiên cứu sinh tiến sĩ Y khoa, chuyên ngành Nội tiết, Đại học Y Hà Nội |
| **Context** | Đang làm luận văn về hiệu quả ức chế SGLT2 trên bệnh nhân suy tim có đái tháo đường. Cần tổng hợp hàng trăm bài báo từ PubMed, so sánh kết quả các RCT, và phân tích hướng dẫn quốc tế. |
| **Pain Points** | Mất hàng tuần để systematic review thủ công; khó theo dõi bài báo mới; cần so sánh guideline quốc tế với phác đồ BYT; thiếu công cụ tiếng Việt cho research |
| **Needs** | Tìm kiếm PubMed nâng cao; tổng hợp bằng chứng tự động; bảng so sánh kết quả RCT; trích xuất dữ liệu từ bài báo; đánh giá chất lượng bằng chứng (GRADE) |
| **CLARA Usage** | CLARA Research — literature search, evidence synthesis, comparative analysis, clinical trial tracking |
| **Success Metric** | 5-10-20 min depending on complexity; Perplexity-style streaming; full citations with PMIDs |

#### Persona 3: Bác sĩ Hương — Doctor (Clinical Specialist)

| Attribute | Details |
|-----------|---------|
| **Name** | BS. Lê Thị Hương, 45 tuổi |
| **Role** | Bác sĩ Nội khoa, Trưởng khoa Nội tổng hợp, Bệnh viện tuyến tỉnh |
| **Context** | Quản lý 40+ bệnh nhân nội trú, nhiều ca phức tạp đa bệnh lý. Cần hội chẩn nhưng bệnh viện tuyến tỉnh thiếu chuyên gia. Mất 30% thời gian cho giấy tờ hành chính. |
| **Pain Points** | Thiếu chuyên gia để hội chẩn ca khó; mất thời gian viết bệnh án; cần kiểm tra tương tác thuốc cho bệnh nhân đa thuốc; khó cập nhật guideline mới; UpToDate quá đắt ($520+/năm) |
| **Needs** | AI Council (Hội chẩn AI) cho ca phức tạp; Medical Scribe tự động ghi bệnh án; CareGuard kiểm tra DDI/liều; cập nhật guideline tự động; giá cả phải chăng |
| **CLARA Usage** | Full platform — AI Council, Medical Scribe, CareGuard, CLARA Research |
| **Success Metric** | < 10-20 min AI Council with live logs; 70% reduction in documentation time; 100% DDI detection accuracy |

### 3.3 Market Size by Segment

| Segment | Vietnam Addressable Market | Pricing Tier | Revenue Potential |
|---------|---------------------------|-------------|-------------------|
| **Normal Users** | 15-20M health-conscious adults (smartphone users) | Freemium: Free basic / $2-5/month premium | $5-15M ARR at 1% penetration |
| **Researchers** | ~50,000 medical researchers + 80,000 med students | $10-20/month individual / $200-500 institutional | $3-8M ARR |
| **Doctors** | ~90,000 practicing physicians | $15-30/month individual / $5K-20K hospital license | $10-30M ARR |
| **Doctor Marketplace** | Transaction fees on consultations | 15-20% commission | $2-10M ARR at scale |
| **TOTAL** | | | **$20-63M ARR potential** |



---

## 4. Product Architecture — Two Components

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLARA ECOSYSTEM                                        │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                COMPONENT 1: CLARA AI AGENT PLATFORM                       │  │
│  │                (Research & Clinical Decision Support)                      │  │
│  │                                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │ CLARA    │  │ CLARA    │  │ CLARA    │  │ CLARA    │  │ CLARA    │ │  │
│  │  │ Research │  │ Medical  │  │ CareGuard│  │ Trials & │  │ Ops &    │ │  │
│  │  │          │  │ Scribe   │  │          │  │ Cohort   │  │ Education│ │  │
│  │  │ Agentic  │  │ Audio →  │  │ DDI,     │  │ Trial    │  │ Hospital │ │  │
│  │  │ RAG for  │  │ SOAP     │  │ Dosage,  │  │ Matching │  │ Ops,     │ │  │
│  │  │ Medical  │  │ Notes    │  │ Clinical │  │ Cohort   │  │ CME,     │ │  │
│  │  │ Lit.     │  │          │  │ Safety   │  │ Selection│  │ Training │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                             │
│                            Shared Services                                       │
│                 (RAG Engine, Fact Checker, Knowledge Base,                       │
│                  Two-Layer Intent Router, Blockchain Audit)                      │
│                                    │                                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                COMPONENT 2: PERSONAL HEALTH APP/WEB                       │  │
│  │                (Consumer-Facing Health Management)                         │  │
│  │                                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │ Health   │  │ Medi-    │  │ DDI      │  │ AI       │  │ Doctor   │ │  │
│  │  │ Profile  │  │ cation   │  │ Check    │  │ Health   │  │ Market-  │ │  │
│  │  │ Manager  │  │ Manager  │  │ (Simple) │  │ Chatbot  │  │ place    │ │  │
│  │  │          │  │ +Remind  │  │          │  │          │  │          │ │  │
│  │  │ Auto-    │  │          │  │ Consumer │  │ Easy     │  │ Connect  │ │  │
│  │  │ build    │  │ Track &  │  │ friendly │  │ language │  │ real     │ │  │
│  │  │ from Q&A │  │ Remind   │  │ alerts   │  │ answers  │  │ doctors  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  │                                                                           │  │
│  │  ┌──────────────────────────────────┐  ┌───────────────────────────────┐ │  │
│  │  │ Medical Records Management       │  │ AI Health Summary             │ │  │
│  │  │ Upload, store, share with docs   │  │ Auto-update after each chat   │ │  │
│  │  └──────────────────────────────────┘  └───────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Relationship

| Aspect | Component 1: AI Agent Platform | Component 2: Personal Health App |
|--------|-------------------------------|----------------------------------|
| **Target Users** | Researchers, Doctors | Normal Users (Patients, Caregivers) |
| **Complexity** | Expert-level, deep analysis | Simple, consumer-friendly |
| **Response Time** | 5-20 minutes (deep work) | < 2 minutes (quick answers) |
| **Language Level** | Medical terminology, clinical | Plain Vietnamese, no jargon |
| **Revenue Model** | SaaS subscription, enterprise | Freemium + marketplace commission |
| **Platform** | Web (desktop-first) | Mobile-first (App) + Web |
| **Authentication** | Verified credentials required | Email/phone, optional verification |
| **RAG Depth** | Full multi-source, AI Council | Simplified single-pass RAG |
| **Shared Infrastructure** | RAG Engine, Knowledge Base, Fact Checker, Blockchain Audit Layer |

### 4.3 Data Flow Between Components

```
Personal Health App ←→ Shared Knowledge Base ←→ AI Agent Platform
       │                        │                        │
       │   User health profile  │  Medical evidence DB   │  Clinical data
       │   Medication list      │  Drug interaction DB   │  Research results
       │   Chat history         │  Vietnamese guidelines │  AI Council logs
       │                        │                        │
       └────────────────────────┴────────────────────────┘
                                │
                    Doctor Marketplace Bridge
                 (Patient shares profile → Doctor reviews)
```



---

## 5. Feature Planning by Module

### 5.1 CLARA Research — Agentic RAG for Medical Literature

> **Purpose:** Enable researchers and clinicians to search, synthesize, compare, and analyze medical literature across millions of publications — with full citations, evidence grading, and Vietnamese language support.

#### 5.1.1 Core Features

| Feature ID | Feature Name | Description | Priority | Phase |
|-----------|-------------|-------------|----------|-------|
| **RES-001** | **Intelligent Medical Search** | Natural language search across PubMed (36M+ articles), ClinicalTrials.gov, WHO databases, Vietnamese medical journals. Auto-generates MeSH queries, applies date/study-type filters. | P0 | 1 |
| **RES-002** | **Evidence Synthesis Engine** | Multi-source RAG that retrieves, ranks, and synthesizes evidence from 10+ sources. Outputs structured reports with evidence quality indicators (GRADE methodology). | P0 | 1 |
| **RES-003** | **Comparative Analysis** | Side-by-side comparison of drugs, treatments, guidelines. Auto-generates comparison tables with outcomes, NNT, NNH, and effect sizes. | P0 | 1 |
| **RES-004** | **Guideline Analyzer** | Compare international guidelines (AHA/ACC, ESC, KDIGO) with BYT Vietnamese protocols. Highlight differences, identify gaps, track updates. | P1 | 1 |
| **RES-005** | **Citation Manager** | Full citation export (APA, Vancouver, BibTeX). Direct PMID/DOI links. Citation verification via FIDES fact-checker. | P1 | 1 |
| **RES-006** | **Perplexity-Style Streaming** | Real-time streaming of partial results as sub-agents retrieve from different sources. User sees search progress live. | P0 | 1 |
| **RES-007** | **Data Extraction Tables** | Extract structured data from research papers: patient demographics, outcomes, endpoints, statistical measures. Export to CSV/Excel. | P2 | 2 |
| **RES-008** | **Knowledge Graph Navigation** | Visual exploration of disease-drug-symptom-gene relationships via medical knowledge graph (UMLS/SNOMED-CT backbone). | P2 | 3 |
| **RES-009** | **Vietnamese Medical Corpus** | Dedicated index of Vietnamese medical literature: Dược thư Quốc gia, BYT protocols, Vietnamese medical journals, medical textbooks. | P0 | 1 |
| **RES-010** | **Research Workspace** | Save searches, create research projects, organize findings, collaborate with team. Persistent conversation history. | P2 | 2 |
| **RES-011** | **Alert & Monitoring** | Set up alerts for new publications on specific topics. Weekly digest of new evidence relevant to saved interests. | P2 | 3 |
| **RES-012** | **AI Council for Research** | Multi-agent deliberation for complex research questions. Specialist agents analyze from different angles (methodology, clinical relevance, statistical validity). | P1 | 2 |

#### 5.1.2 Research Workflow Detail

```
User Research Query
    │
    ├── Simple Search (5 min) ──────────────────────────────────────┐
    │   Query → MeSH enrichment → PubMed search →                  │
    │   Top results + summary → Cite                               │
    │                                                               │
    ├── Moderate Synthesis (10 min) ────────────────────────────────┤
    │   Query → Decompose → Multi-source parallel retrieval →      │
    │   Stream partial results → Deep synthesis → Fact check →     │
    │   Structured report with comparison tables                   │
    │                                                               │
    └── Deep Analysis (20 min) ────────────────────────────────────┘
        Query → Decompose into 5-10 sub-queries →
        Parallel agents (PubMed, Trials, Guidelines, Drugs) →
        Cross-reference → Synthesize with GRADE assessment →
        Full research report with knowledge gaps identified
```



### 5.2 CLARA Medical Scribe — Audio to Structured Medical Records

> **Purpose:** Transform doctor-patient conversations (audio) into structured, standardized medical records (SOAP notes), reducing documentation burden by 70%+ while ensuring clinical accuracy.

#### 5.2.1 Core Features

| Feature ID | Feature Name | Description | Priority | Phase |
|-----------|-------------|-------------|----------|-------|
| **SCR-001** | **Vietnamese Medical ASR** | Automatic Speech Recognition optimized for Vietnamese medical terminology. Handles mixed Vietnamese-English medical terms, hospital noise, multiple speakers. | P0 | 2 |
| **SCR-002** | **SOAP Note Generation** | Auto-generate structured SOAP notes (Subjective, Objective, Assessment, Plan) from transcribed audio. Maps to Vietnamese hospital documentation standards. | P0 | 2 |
| **SCR-003** | **Speaker Diarization** | Distinguish doctor vs. patient voices. Attribute statements correctly in the medical record. | P1 | 2 |
| **SCR-004** | **Medical Entity Extraction** | Extract symptoms, diagnoses, medications, dosages, lab values, procedures from conversation. Auto-map to ICD-11, RxNorm. | P0 | 2 |
| **SCR-005** | **Template Customization** | Hospital-specific templates (khoa Nội, Ngoại, Sản, Nhi). Customizable fields to match each hospital's documentation requirements. | P1 | 2 |
| **SCR-006** | **Real-time Transcription** | Live transcription during consultation. Doctor can review and edit in real-time on secondary screen/tablet. | P2 | 3 |
| **SCR-007** | **EHR Integration** | Export generated records to hospital EHR systems (HL7 FHIR format). Initial support for Vietnamese hospital software systems. | P2 | 3 |
| **SCR-008** | **Review & Edit Interface** | Post-consultation review interface. Doctor confirms, edits, and signs off on generated records. Track all edits for training data. | P1 | 2 |
| **SCR-009** | **Multi-language Support** | Handle conversations in Vietnamese with English medical terms intermixed (common in Vietnamese clinical practice). | P0 | 2 |
| **SCR-010** | **Coding Suggestions** | Auto-suggest ICD-11 codes, CPT/procedure codes based on documented conditions and procedures. | P2 | 3 |

#### 5.2.2 Scribe Pipeline

```
Audio Input (Doctor-Patient Conversation)
    │
    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Vietnamese   │───▶│ Speaker      │───▶│ Medical NER  │
│ Medical ASR  │    │ Diarization  │    │ & Coding     │
│ (Whisper +   │    │ (pyannote)   │    │ (Custom      │
│  VN fine-    │    │              │    │  BioBERT-VN) │
│  tune)       │    │              │    │              │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │ SOAP Note        │
                                    │ Generator        │
                                    │ (LLM + Template) │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │ Doctor Review     │
                                    │ & Approval        │
                                    │ Interface         │
                                    └──────────────────┘
```



### 5.3 CLARA CareGuard — Clinical Decision Support

> **Purpose:** Real-time clinical safety net — checking drug interactions, calculating dosages, validating prescriptions against patient profiles, and alerting to potential clinical risks before they become patient harm events.

#### 5.3.1 Core Features

| Feature ID | Feature Name | Description | Priority | Phase |
|-----------|-------------|-------------|----------|-------|
| **CG-001** | **Drug-Drug Interaction (DDI) Check** | Real-time DDI checking using RxNorm + Dược thư Quốc gia. Severity classification (critical/major/moderate/minor). Alternative drug suggestions. | P0 | 2 |
| **CG-002** | **Dosage Calculator** | Patient-specific dosage calculation based on weight, age, renal function (eGFR/CrCl), hepatic function. Uses Cockcroft-Gault, CKD-EPI formulas. | P0 | 2 |
| **CG-003** | **Contraindication Alert** | Cross-reference prescribed drugs against patient conditions, allergies, and current medications. Alert for absolute and relative contraindications. | P0 | 2 |
| **CG-004** | **Prescription Validation** | Validate entire prescription against BYT protocols. Check completeness, dosage ranges, duration appropriateness. | P1 | 2 |
| **CG-005** | **Drug-Food Interaction** | Warn about significant drug-food interactions (e.g., grapefruit + statins, vitamin K foods + warfarin). Vietnamese dietary context. | P2 | 3 |
| **CG-006** | **Renal/Hepatic Dose Adjustment** | Automated dose adjustment recommendations for patients with impaired renal/hepatic function. Mapped to CKD stages and Child-Pugh scores. | P1 | 2 |
| **CG-007** | **Differential Diagnosis Support** | AI-assisted DDx generation based on symptoms, exam findings, and lab results. Ranked by probability with supporting evidence. | P1 | 2 |
| **CG-008** | **AI Council (Hội chẩn AI)** | Multi-specialist AI deliberation for complex cases. 2-5 specialist agents analyze independently, then deliberate with live processing logs visible to the doctor. | P0 | 2 |
| **CG-009** | **Clinical Score Calculators** | Built-in calculators for HEART, TIMI, CHA₂DS₂-VASc, HAS-BLED, CURB-65, Wells, MELD, Child-Pugh, Glasgow, APACHE II, etc. | P1 | 2 |
| **CG-010** | **Guideline Quick Reference** | Instant access to relevant BYT treatment protocols and international guidelines for the current clinical context. | P1 | 2 |
| **CG-011** | **Antibiotic Stewardship** | Culture-guided antibiotic selection support. Local antibiogram integration. De-escalation reminders. Duration recommendations. | P2 | 3 |
| **CG-012** | **Pharmacogenomics Alerts** | Flag drugs with known pharmacogenomic implications (CYP2D6, CYP2C19, HLA-B*5801). Especially relevant for Vietnamese population-specific variants. | P3 | 3 |

#### 5.3.2 CareGuard Safety Architecture

```
Doctor Input (Patient Data + Clinical Query)
    │
    ▼
┌───────────────────────────────────────────────────────────┐
│                    CAREGUARD SAFETY LAYERS                  │
│                                                            │
│  Layer 1: IMMEDIATE CHECKS (< 1 second)                   │
│  ├── DDI check against full medication list               │
│  ├── Allergy cross-reference                              │
│  ├── Critical contraindication scan                       │
│  └── Emergency drug alerts (e.g., QT prolongation risk)   │
│                                                            │
│  Layer 2: CLINICAL VALIDATION (< 30 seconds)              │
│  ├── Dosage range verification (Dược thư + RxNorm)       │
│  ├── Renal/hepatic dose adjustment check                  │
│  ├── Pregnancy/lactation safety check                     │
│  └── Duplicate therapy detection                          │
│                                                            │
│  Layer 3: EVIDENCE-BASED REVIEW (< 5 minutes)             │
│  ├── BYT protocol compliance check                        │
│  ├── Evidence-based treatment validation                  │
│  ├── Clinical score calculation & risk stratification     │
│  └── Alternative therapy suggestions with evidence        │
│                                                            │
│  Layer 4: AI COUNCIL (< 10-20 minutes, on-demand)         │
│  ├── Multi-specialist deliberation                        │
│  ├── Complex case analysis                                │
│  ├── Conflict resolution between specialist opinions      │
│  └── Full audit trail with evidence citations             │
└───────────────────────────────────────────────────────────┘
```



### 5.4 CLARA Trials & Cohort — Clinical Trial Matching & Cohort Selection

> **Purpose:** Accelerate clinical research by automatically matching patients to eligible clinical trials and helping researchers identify and recruit study cohorts from hospital patient populations.

#### 5.4.1 Core Features

| Feature ID | Feature Name | Description | Priority | Phase |
|-----------|-------------|-------------|----------|-------|
| **TRI-001** | **Trial Registry Search** | Unified search across ClinicalTrials.gov, WHO ICTRP, Vietnamese clinical trial registry. Natural language query → structured eligibility criteria matching. | P1 | 3 |
| **TRI-002** | **Patient-Trial Matching** | Automated matching of patient profiles against trial inclusion/exclusion criteria. Eligibility scoring with explanation for each criterion match/mismatch. | P1 | 3 |
| **TRI-003** | **Cohort Builder** | Define patient cohorts using natural language or structured criteria. Query hospital EHR data to identify eligible patients. Real-time cohort size estimation. | P2 | 3 |
| **TRI-004** | **Eligibility Criteria Parser** | NLP-based extraction and structuring of free-text eligibility criteria from trial registrations. Maps to standardized medical ontologies (ICD-11, SNOMED-CT). | P2 | 3 |
| **TRI-005** | **Trial Landscape Analysis** | Competitive landscape for specific conditions/drugs. Visualize active trials by phase, geography, sponsor. Identify gaps and opportunities. | P2 | 3 |
| **TRI-006** | **Recruitment Analytics** | Dashboard showing recruitment funnel: screened → eligible → enrolled → completed. Predict recruitment timelines based on patient flow data. | P3 | 3 |
| **TRI-007** | **Site Feasibility Assessment** | Evaluate hospital suitability for trial participation: patient volume, expertise, infrastructure, regulatory compliance. | P3 | 3 |
| **TRI-008** | **Protocol Compliance Monitor** | Track adherence to trial protocol during study execution. Alert for protocol deviations, missing data points, upcoming visit windows. | P3 | 3 |

#### 5.4.2 Trial Matching Workflow

```
Patient Profile                    Trial Registry
(Demographics, Dx,                 (ClinicalTrials.gov,
 Medications, Labs)                 WHO ICTRP, VN Registry)
        │                                  │
        ▼                                  ▼
┌──────────────────┐          ┌──────────────────────┐
│ Patient Feature  │          │ Criteria Extraction   │
│ Extraction       │          │ & Structuring (NLP)   │
│ (Standardized)   │          │                       │
└────────┬─────────┘          └──────────┬────────────┘
         │                               │
         └──────────┬────────────────────┘
                    ▼
         ┌──────────────────┐
         │ Matching Engine   │
         │ (Criterion-by-    │
         │  criterion eval)  │
         └────────┬──────────┘
                  ▼
         ┌──────────────────┐
         │ Results:          │
         │ • Eligible trials │
         │ • Match score     │
         │ • Gaps identified │
         └──────────────────┘
```



### 5.5 CLARA Ops & Education Suite — Operations & Medical Education

> **Purpose:** Optimize hospital operations through AI-driven analytics and provide continuous medical education with realistic case simulations and knowledge assessment tools.

#### 5.5.1 Core Features

| Feature ID | Feature Name | Description | Priority | Phase |
|-----------|-------------|-------------|----------|-------|
| **OPS-001** | **Bed Management Optimizer** | AI-driven bed allocation and discharge prediction. Forecast occupancy, suggest patient transfers, optimize patient flow across departments. | P2 | 3 |
| **OPS-002** | **Resource Utilization Analytics** | Dashboard for equipment usage, OR scheduling, lab turnaround times, staffing patterns. Identify bottlenecks and optimization opportunities. | P3 | 3 |
| **OPS-003** | **Readmission Risk Predictor** | ML model predicting 30-day readmission risk at discharge. Flag high-risk patients for enhanced follow-up planning. | P2 | 3 |
| **OPS-004** | **CME Module (Continuing Medical Education)** | AI-generated case studies from published literature. Interactive Q&A for knowledge assessment. Track CME credits. Vietnamese medical licensure requirements. | P1 | 3 |
| **OPS-005** | **Clinical Case Simulator** | Interactive case simulations where doctors practice clinical decision-making. AI generates realistic patient scenarios with branching outcomes based on decisions. | P2 | 3 |
| **OPS-006** | **Knowledge Assessment** | Automated assessment generation for medical students and residents. Maps to Vietnamese medical curriculum. Tracks knowledge gaps across topics. | P2 | 3 |
| **OPS-007** | **Evidence Update Digest** | Automated weekly/monthly digests of new guidelines, landmark trials, and drug approvals relevant to each department/specialty. | P2 | 3 |
| **OPS-008** | **Mortality & Morbidity Analytics** | Aggregate de-identified clinical data analysis for quality improvement. Benchmark against national/international standards. | P3 | 3 |
| **OPS-009** | **Supply Chain Intelligence** | Drug shortage prediction, consumption forecasting, formulary optimization recommendations based on clinical evidence and cost-effectiveness. | P3 | 3 |
| **OPS-010** | **Infection Control Dashboard** | Real-time surveillance of HAI (Healthcare-Associated Infections). Track antibiotic resistance patterns. Integrate with microbiology lab data. | P3 | 3 |



### 5.6 Personal Health Management App/Web — Consumer Health Platform

> **Purpose:** Empower everyday Vietnamese users to manage their health proactively — from medication tracking and drug interaction checking to AI-powered health queries and seamless connection with real doctors when needed. This is the consumer-facing gateway to the CLARA ecosystem.

#### 5.6.1 Core Features

| Feature ID | Feature Name | Description | Priority | Phase |
|-----------|-------------|-------------|----------|-------|
| **APP-001** | **Onboarding Health Profile** | Guided Q&A onboarding flow that builds initial health profile: demographics, conditions, allergies, current medications, family history. Progressive disclosure — starts simple, deepens over time. | P0 | 1 |
| **APP-002** | **Smart Health Profile** | AI auto-builds and updates health profile from every interaction. After each chatbot conversation, extracts new health data and updates profile. Shows "last updated" and change history. | P0 | 1 |
| **APP-003** | **Medication Manager** | Add, track, and manage all current medications. Scan prescription photos (OCR) to auto-add drugs. Visual medication list with dosage, frequency, prescribing doctor. | P0 | 1 |
| **APP-004** | **Medication Reminders** | Smart reminders for medication schedules. Customizable timing (before/after meals). Adherence tracking with calendar view. Missed dose guidance. | P0 | 1 |
| **APP-005** | **Consumer DDI Check** | Simplified drug interaction checker for non-medical users. Input medications → get clear, actionable alerts in plain Vietnamese. Severity color-coding (🔴🟡🟢). "Hỏi bác sĩ" prompt for critical interactions. | P0 | 2 |
| **APP-006** | **AI Health Chatbot** | Conversational AI for health queries in plain Vietnamese. Answers questions about symptoms, medications, conditions, prevention. Always cites sources. Clear disclaimers. Smart escalation to doctor when needed. | P0 | 1 |
| **APP-007** | **Health Summary Dashboard** | Visual dashboard showing: current conditions, active medications, recent interactions, health trends. Auto-generated summary that can be shared with doctors. | P1 | 2 |
| **APP-008** | **Medical Records Vault** | Upload and store medical records (lab results, prescriptions, imaging reports, discharge summaries). OCR extraction of key data. Organized timeline view. | P1 | 2 |
| **APP-009** | **Share with Doctor** | One-tap share of health profile + records with selected doctor. Generates a structured health summary for the doctor's review. Consent-managed, time-limited access. | P1 | 2 |
| **APP-010** | **Doctor Marketplace** | Browse and connect with verified doctors for paid consultations. Filter by specialty, rating, price, availability. In-app video/chat consultation. Post-consultation follow-up. | P1 | 2 |
| **APP-011** | **Family Health Profiles** | Manage health profiles for family members (parents, children). Caregiver mode for elderly parents. Shared medication reminders. Family DDI checking (e.g., when parents take multiple drugs). | P2 | 2 |
| **APP-012** | **Health Metrics Tracking** | Log and track basic health metrics: blood pressure, blood glucose, weight, BMI. Trend visualization. Smart alerts for concerning trends. Integration with wearable devices (future). | P2 | 3 |
| **APP-013** | **Appointment Manager** | Schedule, track, and be reminded of medical appointments. Post-visit summary generation. Pre-visit question preparation with AI assistance. | P2 | 3 |
| **APP-014** | **Symptom Checker** | Guided symptom assessment with triage recommendations. Uses simplified version of CLARA's differential diagnosis engine. Clear urgency indicators (self-care / see doctor / go to ER). | P1 | 2 |
| **APP-015** | **Health Education Content** | Personalized health education based on user's conditions. Daily tips, articles, videos curated by AI. Content from verified medical sources, adapted to user's health literacy level. | P2 | 3 |

#### 5.6.2 Personal Health Profile — Auto-Build Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                SMART HEALTH PROFILE ENGINE                           │
│                                                                      │
│  Input Sources:                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Onboard  │  │ Chat History │  │ Uploaded     │  │ Medication │ │
│  │ Q&A      │  │ (Every       │  │ Medical      │  │ List       │ │
│  │          │  │  interaction)│  │ Records      │  │ Changes    │ │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│       │               │                 │                 │        │
│       └───────┬───────┴─────────┬───────┴────────┬───────┘        │
│               ▼                 ▼                ▼                  │
│       ┌─────────────────────────────────────────────┐              │
│       │         NLP Extraction Engine                 │              │
│       │  • Condition identification                  │              │
│       │  • Medication extraction                     │              │
│       │  • Allergy detection                         │              │
│       │  • Lab value parsing                         │              │
│       │  • Family history extraction                 │              │
│       └────────────────┬────────────────────────────┘              │
│                        ▼                                            │
│       ┌─────────────────────────────────────────────┐              │
│       │         Health Profile Graph (Neo4j)          │              │
│       │                                               │              │
│       │  Patient ──has_condition──▶ Condition         │              │
│       │  Patient ──takes──▶ Medication                │              │
│       │  Patient ──allergic_to──▶ Allergen            │              │
│       │  Patient ──has_lab──▶ LabResult               │              │
│       │  Patient ──family_hx──▶ FamilyCondition      │              │
│       │                                               │              │
│       │  Auto-updated after EVERY interaction         │              │
│       │  Change log with timestamps                   │              │
│       └─────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

#### 5.6.3 Doctor Marketplace Business Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCTOR MARKETPLACE FLOW                        │
│                                                                   │
│  PATIENT SIDE                          DOCTOR SIDE               │
│  ┌──────────────┐                      ┌──────────────┐         │
│  │ Browse       │                      │ Create       │         │
│  │ Doctors      │                      │ Profile      │         │
│  │ (specialty,  │                      │ (credentials,│         │
│  │  rating,     │                      │  specialty,  │         │
│  │  price)      │                      │  schedule)   │         │
│  └──────┬───────┘                      └──────┬───────┘         │
│         │                                     │                  │
│         ▼                                     ▼                  │
│  ┌──────────────┐    ┌────────────┐   ┌──────────────┐         │
│  │ Share Health │───▶│ Consultation│◀──│ Review       │         │
│  │ Profile      │    │ (Video/Chat)│   │ Patient      │         │
│  │ (consent)    │    │ 15-30 min   │   │ Profile      │         │
│  └──────────────┘    └─────┬──────┘   └──────────────┘         │
│                            │                                     │
│                            ▼                                     │
│                   ┌────────────────┐                             │
│                   │ Post-consult:   │                             │
│                   │ • Prescription  │     Revenue Split:          │
│                   │ • Follow-up     │     • Doctor: 80-85%        │
│                   │ • Updated       │     • CLARA: 15-20%         │
│                   │   health profile│     • ~$10-30/consult       │
│                   └────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```



---

## 6. User Stories

### 6.1 Normal User (Patient / Caregiver) Stories

#### US-N01: Health Question
> **As a** normal user,
> **I want to** ask health questions in everyday Vietnamese and receive clear, trustworthy answers,
> **So that** I can understand my health conditions without needing to visit a doctor for basic information.

**Acceptance Criteria:**
- Response in < 2 minutes
- Language is plain Vietnamese (no medical jargon, or jargon is explained)
- Sources are cited with links to original content
- Clear disclaimer: "Thông tin này không thay thế tư vấn y khoa"
- When query is urgent/dangerous, immediately recommend "Hãy đến cơ sở y tế gần nhất"

#### US-N02: Medication Reminder
> **As a** caregiver managing my parents' medications,
> **I want to** set up medication reminders for multiple family members,
> **So that** I can ensure no one misses their daily medications.

**Acceptance Criteria:**
- Can create profiles for family members
- Custom reminder times per medication (trước ăn / sau ăn / khi đói)
- Push notifications + optional SMS fallback
- Adherence tracking calendar visible for all family members
- Missed dose guidance (take now / skip / call doctor)

#### US-N03: Drug Interaction Check
> **As a** patient taking multiple medications,
> **I want to** check if my medications interact with each other,
> **So that** I can avoid dangerous drug combinations and discuss with my doctor.

**Acceptance Criteria:**
- Input medications by name (Vietnamese drug names supported), photo scan, or barcode
- Color-coded severity: 🔴 Nguy hiểm / 🟡 Cần chú ý / 🟢 An toàn
- Plain language explanation of each interaction
- Clear action guidance: "Liên hệ bác sĩ ngay" for critical interactions
- Option to share interaction report with doctor

#### US-N04: Doctor Consultation
> **As a** user who received concerning results from the AI chatbot,
> **I want to** quickly connect with a real doctor for a consultation,
> **So that** I can get professional medical advice on my specific situation.

**Acceptance Criteria:**
- Seamless transition from chatbot to doctor marketplace
- Health profile auto-shared with patient consent
- Doctor sees structured health summary (not raw chat history)
- Filter by specialty, price, availability, rating
- In-app video/chat consultation with recording option
- Post-consultation prescription and follow-up notes added to health profile

### 6.2 Researcher Stories

#### US-R01: Literature Review
> **As a** medical researcher,
> **I want to** search and synthesize evidence from PubMed and other databases using natural language,
> **So that** I can complete my systematic review in hours instead of weeks.

**Acceptance Criteria:**
- Natural language query → auto-generated MeSH terms
- Search across PubMed, Cochrane, ClinicalTrials.gov simultaneously
- Streaming results (Perplexity-style) — see progress as each source returns
- Structured output with evidence quality grading (GRADE methodology)
- Full citations with PMID/DOI links
- Export to BibTeX, RIS, CSV
- Response time: 5-20 min depending on complexity

#### US-R02: Comparative Drug Analysis
> **As a** pharmacology researcher,
> **I want to** compare the efficacy and safety profiles of multiple drugs for the same condition,
> **So that** I can identify the most appropriate treatment options for my research.

**Acceptance Criteria:**
- Input: 2-5 drugs + condition/indication
- Output: comparison table with NNT, NNH, effect sizes, confidence intervals
- Source trials listed with quality assessment
- BYT guideline positioning included
- Visualization of efficacy/safety trade-offs
- Exportable comparison table

#### US-R03: Guideline Comparison
> **As a** clinical researcher at a Vietnamese hospital,
> **I want to** compare international guidelines with Vietnamese BYT protocols,
> **So that** I can identify gaps and recommend evidence-based updates to local practice.

**Acceptance Criteria:**
- Select condition/topic → retrieve relevant guidelines (AHA, ESC, KDIGO, etc.) + BYT protocols
- Side-by-side comparison table highlighting differences
- Evidence level for each recommendation
- Identify areas where BYT protocol diverges from international consensus
- Generate recommendation summary for hospital committee



### 6.3 Doctor (Clinician) Stories

#### US-D01: AI Council for Complex Case
> **As a** doctor at a provincial hospital without access to specialists,
> **I want to** consult an AI Council (Hội chẩn AI) for a complex multi-morbidity patient,
> **So that** I can receive multi-specialist perspectives before making critical treatment decisions.

**Acceptance Criteria:**
- Input patient presentation (symptoms, labs, imaging, current medications)
- 2-5 specialist AI agents analyze independently (Cardiology, Nephrology, Endocrinology, etc.)
- Live processing logs visible — doctor sees each specialist's reasoning in real-time
- Deliberation phase: agents discuss conflicts and reach consensus/divergence
- Final output: structured recommendations with evidence citations, confidence levels, and areas of agreement/disagreement
- Full audit trail stored with blockchain hash
- Response time: < 10-20 minutes

#### US-D02: Medical Scribe
> **As a** doctor seeing 30+ patients per day,
> **I want** my patient consultations to be automatically transcribed into structured SOAP notes,
> **So that** I can reduce documentation time by 70% and focus on patient care.

**Acceptance Criteria:**
- Audio recording of consultation (15-30 minutes)
- Vietnamese medical ASR with mixed English term support
- Output: structured SOAP note (Subjective, Objective, Assessment, Plan)
- Auto-extracted: diagnoses (ICD-11), medications, lab orders, follow-up plan
- Doctor review & edit interface before finalization
- Export to hospital EHR format

#### US-D03: Prescription Safety Check
> **As a** doctor prescribing medications for a patient with multiple conditions,
> **I want** CareGuard to automatically check for drug interactions, dosage issues, and contraindications,
> **So that** I can prevent adverse drug events before they occur.

**Acceptance Criteria:**
- Input: patient profile + proposed prescription
- Layer 1 (< 1 sec): critical DDI and allergy alerts
- Layer 2 (< 30 sec): dosage validation, renal/hepatic adjustment recommendations
- Layer 3 (< 5 min): BYT protocol compliance, evidence-based alternatives
- Severity classification with color coding
- Alternative drug suggestions with equivalent efficacy evidence
- One-click override with documented clinical rationale

#### US-D04: Quick Evidence Lookup
> **As a** doctor during ward rounds,
> **I want to** quickly look up the latest evidence for a treatment decision,
> **So that** I can make evidence-based decisions at the bedside.

**Acceptance Criteria:**
- Quick query from mobile device
- Response in < 2 minutes for simple queries
- Relevant BYT protocol highlighted first
- International guideline recommendations included
- Key trial evidence summarized in 3-5 bullet points
- Bookmark for later detailed review



---

## 7. Phase Planning — 6-Month Roadmap

### 7.1 Phase Overview

```
Month 1        Month 2        Month 3        Month 4        Month 5        Month 6
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│◀──── PHASE 1 ─────▶│◀──── PHASE 2 ─────▶│◀──── PHASE 3 ─────▶│
│  Core RAG +          │  Scribe + CareGuard  │  Trials, Ops,       │
│  Basic App           │  + Health Management │  Advanced Features  │
│                      │                      │                      │
│  MVP Launch          │  Clinical Beta       │  Full Platform       │
│  Alpha Testing       │  Hospital Pilots     │  Public Launch       │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

### 7.2 Phase 1: Core RAG + Basic App (Month 1–2)

> **Goal:** Launch the foundational AI engine and consumer health app MVP. Validate core technology with early users.

#### 7.2.1 Deliverables

| Week | Milestone | Features Delivered |
|------|-----------|-------------------|
| **W1-2** | Infrastructure Setup | Cloud infra (AWS/GCP), CI/CD pipeline, database setup (PostgreSQL, Redis, Milvus), development environment |
| **W3-4** | RAG Engine v1 | Two-Layer Intent Router, PubMed API integration, basic Vietnamese medical search, FIDES fact-checker v1 |
| **W5-6** | Research MVP | RES-001 (Intelligent Search), RES-002 (Evidence Synthesis), RES-006 (Streaming), RES-009 (VN Corpus) |
| **W7-8** | Personal App MVP | APP-001 (Onboarding Profile), APP-002 (Smart Profile), APP-003 (Med Manager), APP-004 (Reminders), APP-006 (Chatbot) |

#### 7.2.2 Technical Milestones

- [x] Two-Layer Intent Router operational (Qwen2.5-0.5B + Phi-3-mini)
- [x] PubMed E-utilities API integration
- [x] Vietnamese medical corpus indexed (Dược thư Quốc gia, BYT protocols)
- [x] BGE-M3 embeddings operational with FAISS/Milvus
- [x] Qwen2.5-72B synthesis pipeline via vLLM
- [x] FIDES fact-checker v1 (3-step: claim decomposition → evidence retrieval → verdict)
- [x] Basic Personal Health App (React Native or Flutter)
- [x] FastAPI backend with WebSocket streaming
- [x] User authentication (JWT + OAuth2)

#### 7.2.3 Success Criteria (Phase 1 Exit)

| Metric | Target |
|--------|--------|
| RAG Response Quality | ≥ 80% factual accuracy on medical benchmark |
| Response Time (Normal User) | < 2 minutes |
| Response Time (Researcher, simple) | < 5 minutes |
| Vietnamese Language Quality | ≥ 85% user satisfaction |
| App MVP Functional | Core features working on iOS + Android |
| Alpha Users | 50-100 internal/beta testers |

### 7.3 Phase 2: Scribe + CareGuard + Health Management (Month 3–4)

> **Goal:** Launch clinical decision support tools and enhance the consumer health app. Begin hospital pilot programs.

#### 7.3.1 Deliverables

| Week | Milestone | Features Delivered |
|------|-----------|-------------------|
| **W9-10** | CareGuard v1 | CG-001 (DDI Check), CG-002 (Dosage Calc), CG-003 (Contraindication), CG-008 (AI Council v1) |
| **W11-12** | Medical Scribe v1 | SCR-001 (VN ASR), SCR-002 (SOAP Notes), SCR-004 (Entity Extraction), SCR-008 (Review Interface) |
| **W13-14** | Enhanced App | APP-005 (Consumer DDI), APP-007 (Health Dashboard), APP-008 (Records Vault), APP-010 (Doctor Marketplace v1) |
| **W15-16** | Research Enhancement | RES-003 (Comparative Analysis), RES-004 (Guideline Analyzer), RES-012 (AI Council for Research) |

#### 7.3.2 Technical Milestones

- [x] Drug interaction database integrated (RxNorm + Dược thư Quốc gia)
- [x] AI Council multi-agent framework operational (LangGraph)
- [x] Whisper-based Vietnamese medical ASR fine-tuned
- [x] SOAP note generation pipeline
- [x] BioBERT-VN for medical NER
- [x] Consumer DDI interface with severity color-coding
- [x] Doctor Marketplace MVP (profile creation, booking flow)
- [x] Neo4j health profile graph operational
- [x] Blockchain audit trail (Hyperledger Fabric) for clinical decisions

#### 7.3.3 Success Criteria (Phase 2 Exit)

| Metric | Target |
|--------|--------|
| DDI Detection Accuracy | ≥ 95% sensitivity for critical interactions |
| SOAP Note Quality | ≥ 75% doctor acceptance rate (minimal edits needed) |
| AI Council Response Time | < 20 minutes for complex cases |
| Vietnamese ASR Accuracy | ≥ 90% word error rate for medical conversations |
| Hospital Pilot Sites | 2-3 hospitals actively testing |
| App Users | 500-1,000 registered users |



### 7.4 Phase 3: Trials, Ops, Advanced Features (Month 5–6)

> **Goal:** Complete the full platform with clinical trial tools, hospital operations, and advanced features. Prepare for public launch and commercialization.

#### 7.4.1 Deliverables

| Week | Milestone | Features Delivered |
|------|-----------|-------------------|
| **W17-18** | Trials & Cohort | TRI-001 (Trial Search), TRI-002 (Patient Matching), TRI-003 (Cohort Builder) |
| **W19-20** | Ops & Education | OPS-001 (Bed Management), OPS-004 (CME Module), OPS-005 (Case Simulator) |
| **W21-22** | Advanced Features | CG-005 (Drug-Food), CG-011 (Antibiotic Stewardship), RES-008 (Knowledge Graph), APP-012 (Health Metrics) |
| **W23-24** | Launch Prep | Performance optimization, security audit, compliance review, documentation, public launch |

#### 7.4.2 Technical Milestones

- [x] ClinicalTrials.gov API integration with NLP criteria parser
- [x] Hospital EHR integration framework (HL7 FHIR)
- [x] Knowledge graph visualization (Neo4j + D3.js)
- [x] CME content generation pipeline
- [x] Clinical case simulation engine
- [x] Full FIDES fact-checker v2 (5-step with cross-reference)
- [x] Blockchain consent management for data sharing
- [x] Production security hardening (penetration testing, OWASP compliance)
- [x] Monitoring & observability (Prometheus, Grafana, Sentry)

#### 7.4.3 Success Criteria (Phase 3 Exit / Launch)

| Metric | Target |
|--------|--------|
| Platform Stability | 99.5% uptime over 2-week burn-in |
| Full Feature Delivery | 100% of P0/P1 features operational |
| Security Audit | Pass independent security assessment |
| Hospital Partnerships | 3-5 signed contracts/MOUs |
| App Users | 5,000+ registered users |
| Doctor Marketplace | 50+ verified doctors, 100+ consultations |
| NPS Score | ≥ 40 across all user segments |

---

## 8. KPI Targets & Performance Metrics

### 8.1 Response Time KPIs by User Segment

| User Segment | Query Type | Target Response Time | Measurement |
|-------------|-----------|---------------------|-------------|
| **Normal User** | Health question | **< 2 minutes** | Time from query submission to complete response |
| **Normal User** | DDI check | **< 30 seconds** | Time from medication input to interaction report |
| **Normal User** | Medication reminder | **Real-time** | Push notification at scheduled time ±1 minute |
| **Researcher** | Simple search | **< 5 minutes** | Single-source search with summary |
| **Researcher** | Moderate synthesis | **5-10 minutes** | Multi-source retrieval with comparison |
| **Researcher** | Deep analysis | **10-20 minutes** | Full systematic review with GRADE assessment |
| **Doctor** | Quick evidence lookup | **< 2 minutes** | Point-of-care evidence summary |
| **Doctor** | DDI/dosage check | **< 1 minute** | CareGuard Layer 1+2 completion |
| **Doctor** | AI Council | **< 10-20 minutes** | Full multi-specialist deliberation with live logs |
| **Doctor** | Medical Scribe | **< 5 minutes** | Post-consultation SOAP note generation |

### 8.2 Quality & Accuracy KPIs

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Factual Accuracy** | ≥ 90% (Phase 3) | Expert evaluation on standardized medical question set |
| **Citation Accuracy** | ≥ 95% | Automated PMID/DOI verification + manual sampling |
| **DDI Detection Sensitivity** | ≥ 98% critical, ≥ 95% major | Benchmark against DrugBank + Dược thư gold standard |
| **DDI Specificity** | ≥ 85% | Minimize false positive alerts (alert fatigue reduction) |
| **SOAP Note Accuracy** | ≥ 80% doctor acceptance | Doctor review acceptance rate (no major edits) |
| **Vietnamese NLP Quality** | ≥ 90% intent classification | Test set of Vietnamese medical queries |
| **FIDES Fact-Check Precision** | ≥ 85% | Manual evaluation of claim verification results |
| **Hallucination Rate** | < 5% | Ungrounded claims in generated responses |

### 8.3 Business & Engagement KPIs

| Metric | Month 2 | Month 4 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| **App Downloads** | 500 | 5,000 | 20,000 | 100,000 |
| **MAU (Monthly Active Users)** | 100 | 1,000 | 5,000 | 30,000 |
| **Researcher Users** | 20 | 100 | 500 | 2,000 |
| **Doctor Users** | 10 | 50 | 200 | 1,000 |
| **Hospital Contracts** | 0 | 3 | 5 | 15 |
| **Doctor Marketplace Doctors** | 0 | 20 | 50 | 200 |
| **Consultations/Month** | 0 | 50 | 500 | 5,000 |
| **MRR (Monthly Recurring Revenue)** | $0 | $2K | $15K | $100K |
| **NPS (Net Promoter Score)** | N/A | 30 | 40 | 50 |



---

## 9. Technology Stack Recommendations

### 9.1 Stack Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                     CLARA TECHNOLOGY STACK                              │
│                                                                        │
│  FRONTEND                                                              │
│  ├── Web Platform: React + Next.js + TypeScript                       │
│  ├── Mobile App: React Native (or Flutter)                            │
│  ├── Real-time: WebSocket (Socket.io) for streaming responses         │
│  └── UI Components: Shadcn/UI + Tailwind CSS                         │
│                                                                        │
│  BACKEND (API Layer)                                                   │
│  ├── Framework: FastAPI (Python 3.11+)                                │
│  ├── API Gateway: Kong / AWS API Gateway                              │
│  ├── Authentication: JWT + OAuth2 (Keycloak)                          │
│  ├── Task Queue: Celery + Redis                                       │
│  └── WebSocket: FastAPI WebSocket for streaming                       │
│                                                                        │
│  AI / ML ENGINE                                                        │
│  ├── Orchestration: LangGraph + LangChain                             │
│  ├── LLM Serving: vLLM (self-hosted) + API fallback (OpenAI/Claude)  │
│  ├── Embeddings: BGE-M3 (multilingual, self-hosted)                   │
│  ├── Intent Router: Qwen2.5-0.5B (Layer 1) + Phi-3-mini (Layer 2)   │
│  ├── Synthesis: Qwen2.5-72B (primary) + Llama-3.1-70B (backup)      │
│  ├── Medical NER: Fine-tuned BioBERT / PhoBERT-medical               │
│  ├── ASR: Whisper-large-v3 + Vietnamese fine-tune                     │
│  └── OCR: PaddleOCR / Tesseract for prescription scanning            │
│                                                                        │
│  DATA LAYER                                                            │
│  ├── Primary DB: PostgreSQL 16 (users, sessions, records)             │
│  ├── Vector DB: Milvus / FAISS (medical embeddings)                   │
│  ├── Graph DB: Neo4j (knowledge graph, health profiles)               │
│  ├── Search: Elasticsearch (full-text medical search)                 │
│  ├── Cache: Redis (sessions, hot queries, rate limiting)              │
│  ├── Object Storage: S3 / MinIO (medical records, audio files)        │
│  └── Blockchain: Hyperledger Fabric (audit trails, consent)           │
│                                                                        │
│  INFRASTRUCTURE                                                        │
│  ├── Container: Docker + Kubernetes (EKS/GKE)                         │
│  ├── CI/CD: GitHub Actions + ArgoCD                                    │
│  ├── Monitoring: Prometheus + Grafana + Sentry                        │
│  ├── Logging: ELK Stack (Elasticsearch, Logstash, Kibana)             │
│  ├── Cloud: AWS (primary) or GCP                                       │
│  └── GPU: A100/H100 instances for LLM inference                       │
│                                                                        │
│  EXTERNAL APIs                                                         │
│  ├── PubMed E-utilities (medical literature)                           │
│  ├── ClinicalTrials.gov API (clinical trials)                          │
│  ├── RxNorm API (drug normalization)                                   │
│  ├── UMLS API (medical ontology)                                       │
│  └── Payment: VNPay / MoMo / Stripe (marketplace payments)            │
└────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Key Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **LLM Strategy** | Self-hosted (vLLM) + API fallback | Cost control at scale; data privacy for patient info; API fallback for peak/complex queries |
| **Primary LLM** | Qwen2.5-72B | Best open-source performance for multilingual (incl. Vietnamese); medical reasoning benchmarks |
| **Embedding Model** | BGE-M3 | Best multilingual embedding; supports Vietnamese; dense + sparse + multi-vector retrieval |
| **Vector DB** | Milvus | Production-ready; scalable; supports hybrid search; better than FAISS for distributed deployment |
| **Agent Framework** | LangGraph | State machine-based agent orchestration; better for complex multi-agent workflows than vanilla LangChain |
| **Mobile Framework** | React Native | Code sharing with web (React); large ecosystem; sufficient performance for health app |
| **ASR** | Whisper-large-v3 | Best multilingual ASR; fine-tunable for Vietnamese medical terminology |
| **Blockchain** | Hyperledger Fabric | Enterprise-grade; permissioned; suitable for healthcare compliance; no cryptocurrency overhead |

### 9.3 Infrastructure Cost Estimate

| Component | Specification | Monthly Cost (Est.) |
|-----------|--------------|-------------------|
| **GPU Instances** | 2x A100 80GB (LLM inference) | $3,000-6,000 |
| **Application Servers** | 4x c5.2xlarge (API, workers) | $800-1,200 |
| **Databases** | PostgreSQL RDS + Redis ElastiCache | $400-800 |
| **Vector DB** | Milvus on dedicated instance | $300-500 |
| **Graph DB** | Neo4j AuraDB or self-hosted | $200-400 |
| **Storage** | S3 (medical records, audio) | $100-300 |
| **CDN & Networking** | CloudFront, ALB, VPC | $100-200 |
| **Monitoring & Logging** | Grafana Cloud or self-hosted | $100-200 |
| **External APIs** | PubMed, RxNorm, LLM API fallback | $200-500 |
| **TOTAL** | | **$5,200-10,100/month** |

> **Note:** Costs will be lower in Phase 1 (fewer GPU needs) and scale up with user growth. Self-hosted LLMs significantly reduce per-query costs vs. API-only approach at scale.



---

## 10. Risk Assessment

### 10.1 Risk Matrix

| # | Risk | Likelihood | Impact | Severity | Mitigation Strategy |
|---|------|-----------|--------|----------|-------------------|
| **R1** | **AI Hallucination in Medical Context** | Medium | Critical | 🔴 **High** | FIDES 5-step fact-checker; citation verification; "uncertainty" flagging; never provide definitive diagnosis; mandatory disclaimers |
| **R2** | **Patient Harm from Incorrect DDI/Dosage** | Low | Critical | 🔴 **High** | Multi-source DDI validation; gold-standard benchmark testing; doctor-in-the-loop for all clinical decisions; clear "advisory only" positioning |
| **R3** | **Data Privacy Breach (Patient Data)** | Low-Medium | Critical | 🔴 **High** | End-to-end encryption; RBAC; Nghị định 13/2023 compliance; regular penetration testing; blockchain audit trails; data minimization |
| **R4** | **Regulatory Non-compliance** | Medium | High | 🟠 **High** | Legal counsel for Vietnam health IT regulations; BYT software registration if required; proactive engagement with regulators |
| **R5** | **Vietnamese NLP Quality Issues** | Medium | High | 🟠 **Medium-High** | Continuous fine-tuning on Vietnamese medical corpus; native speaker QA team; user feedback loop; fallback to bilingual responses |
| **R6** | **Doctor Adoption Resistance** | Medium | High | 🟠 **Medium-High** | Champion doctor partnerships; clinical validation studies; workflow integration (not disruption); free pilot programs; CME credits |
| **R7** | **GPU Cost Escalation** | Medium | Medium | 🟡 **Medium** | Model quantization (GPTQ/AWQ); batch inference; intelligent caching; cost monitoring alerts; reserved instances |
| **R8** | **Competitor Entry (Google/OpenAI in Healthcare)** | Medium | Medium | 🟡 **Medium** | Vietnamese-native moat; BYT protocol integration; local hospital relationships; regulatory compliance advantage; speed to market |
| **R9** | **Medical Scribe ASR Accuracy** | Medium | Medium | 🟡 **Medium** | Continuous ASR fine-tuning; noise-robust training; doctor review mandatory; never auto-submit without approval |
| **R10** | **Team Scaling & Talent** | Medium | Medium | 🟡 **Medium** | Remote-first hiring; competitive compensation; university partnerships; AI/ML community engagement |
| **R11** | **Infrastructure Downtime** | Low | High | 🟡 **Medium** | Multi-AZ deployment; auto-scaling; health checks; disaster recovery plan; 99.5% SLA target |
| **R12** | **User Trust & Adoption (Consumers)** | Medium | Medium | 🟡 **Medium** | Transparent AI (show sources); gradual trust building; doctor endorsements; community partnerships; free tier |

### 10.2 Risk Mitigation Priorities

```
CRITICAL RISKS (Immediate attention required):
├── R1: AI Hallucination → FIDES fact-checker is CORE infrastructure
├── R2: Patient Harm → CareGuard multi-layer safety architecture
└── R3: Data Privacy → Security-first architecture from Day 1

HIGH RISKS (Phase 1-2 mitigation):
├── R4: Regulatory → Legal advisor onboarded by Month 1
├── R5: Vietnamese NLP → Dedicated VN medical corpus team
└── R6: Doctor Adoption → Hospital partnerships strategy

MEDIUM RISKS (Ongoing management):
├── R7: GPU Costs → Optimization roadmap in tech architecture
├── R8: Competition → Speed to market + local moat
├── R9: ASR Quality → Iterative improvement with real data
├── R10: Talent → Hiring pipeline established early
├── R11: Infrastructure → Standard SRE practices
└── R12: User Trust → Marketing & community strategy
```



---

## 11. Business Model Canvas

### 11.1 Visual Canvas

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│  KEY PARTNERS    │  KEY ACTIVITIES  │  VALUE           │  CUSTOMER        │  CUSTOMER        │
│                  │                  │  PROPOSITIONS    │  RELATIONSHIPS   │  SEGMENTS        │
│ • Vietnamese     │ • AI/ML model    │                  │                  │                  │
│   hospitals      │   development    │ FOR CONSUMERS:   │ • Self-service   │ • Health-        │
│ • Medical        │ • Medical corpus │ • Trusted health │   app (Free)     │   conscious      │
│   universities   │   curation       │   info in VN     │ • Premium        │   adults         │
│ • BYT (Ministry  │ • Platform       │ • Med management │   subscription   │ • Patients with  │
│   of Health)     │   engineering    │ • DDI checking   │ • Doctor         │   chronic        │
│ • Drug data      │ • Hospital       │ • Doctor access  │   marketplace    │   conditions     │
│   providers      │   partnerships   │                  │ • Community      │ • Caregivers     │
│   (RxNorm, etc.) │ • User research  │ FOR RESEARCHERS: │   forums         │                  │
│ • Cloud          │ • Content QA     │ • 10x faster     │                  │ • Medical        │
│   providers      │ • Regulatory     │   literature     │ FOR DOCTORS:     │   researchers    │
│   (AWS/GCP)      │   compliance     │   review         │ • Dedicated      │ • PhD students   │
│ • Payment        │                  │ • Evidence       │   account mgr    │ • Pharmacists    │
│   processors     │                  │   synthesis      │ • Hospital       │                  │
│   (VNPay/MoMo)   │                  │ • Full citations │   onboarding     │ • Physicians     │
│ • Medical        │                  │                  │ • Training &     │ • Hospital       │
│   associations   │                  │ FOR DOCTORS:     │   support        │   departments    │
│                  │                  │ • AI Council     │ • Clinical       │ • Provincial     │
│                  │                  │ • Medical Scribe │   champions      │   hospitals      │
│                  │                  │ • CareGuard DDI  │   program        │                  │
│                  │                  │ • Time savings   │                  │                  │
├──────────────────┴──────────────────┤                  ├──────────────────┴──────────────────┤
│  KEY RESOURCES                      │                  │  CHANNELS                           │
│                                     │                  │                                     │
│ • AI/ML engineering team            │                  │ • App Store / Google Play           │
│ • Vietnamese medical knowledge base │                  │ • Web platform (clara.vn)           │
│ • GPU infrastructure                │                  │ • Hospital direct sales             │
│ • Hospital partnerships             │                  │ • Medical conferences               │
│ • Medical advisory board            │                  │ • KOL doctors (social media)        │
│ • Proprietary medical SLMs          │                  │ • University partnerships           │
│ • User data & interaction history   │                  │ • Zalo / Facebook communities       │
│                                     │                  │ • SEO / Content marketing           │
├─────────────────────────────────────┴──────────────────┴─────────────────────────────────────┤
│  COST STRUCTURE                                        │  REVENUE STREAMS                     │
│                                                        │                                      │
│ • GPU infrastructure (~$5-10K/mo scaling to $20-50K)  │ 1. FREEMIUM APP                      │
│ • Engineering team (8-15 people)                       │    • Free: basic chatbot, 5 DDI/mo   │
│ • Cloud hosting & storage                              │    • Premium: $2-5/mo unlimited      │
│ • Medical data licensing                               │                                      │
│ • Regulatory compliance & legal                        │ 2. RESEARCHER SUBSCRIPTION           │
│ • Marketing & user acquisition                         │    • Individual: $10-20/mo            │
│ • Customer support                                     │    • Institutional: $200-500/yr/seat  │
│ • Office & operations                                  │                                      │
│                                                        │ 3. DOCTOR/HOSPITAL LICENSE            │
│ Fixed costs: ~$30-50K/month (early stage)              │    • Individual doctor: $15-30/mo     │
│ Variable: scales with usage (GPU, API calls)           │    • Hospital: $5K-20K/yr             │
│                                                        │                                      │
│                                                        │ 4. DOCTOR MARKETPLACE COMMISSION      │
│                                                        │    • 15-20% per consultation          │
│                                                        │    • ~$10-30/consultation              │
│                                                        │                                      │
│                                                        │ 5. DATA INSIGHTS (Future)             │
│                                                        │    • Anonymized health trends          │
│                                                        │    • Pharma market intelligence        │
│                                                        │    • Clinical trial recruitment fees   │
└────────────────────────────────────────────────────────┴──────────────────────────────────────┘
```

### 11.2 Revenue Projection (12-Month)

| Revenue Stream | Month 3 | Month 6 | Month 9 | Month 12 |
|---------------|---------|---------|---------|----------|
| **App Premium** | $500 | $5,000 | $15,000 | $40,000 |
| **Researcher Subs** | $200 | $2,000 | $5,000 | $15,000 |
| **Doctor/Hospital** | $0 | $5,000 | $15,000 | $35,000 |
| **Marketplace** | $0 | $3,000 | $8,000 | $20,000 |
| **TOTAL MRR** | **$700** | **$15,000** | **$43,000** | **$110,000** |
| **Annualized** | $8.4K | $180K | $516K | **$1.32M** |

### 11.3 Path to Profitability

```
Break-even analysis:
├── Monthly fixed costs: ~$40-60K (team + infra)
├── Break-even MRR: ~$50-70K
├── Expected break-even: Month 8-10
├── Path to $1M ARR: Month 12-14
└── Path to $5M ARR: Month 18-24 (ASEAN expansion)
```



---

## 12. Appendices

### Appendix A: Feature Priority Summary (All Modules)

| Priority | Count | Description | Timeline |
|----------|-------|-------------|----------|
| **P0** (Must Have) | 22 features | Core functionality required for MVP and clinical safety | Phase 1-2 |
| **P1** (Should Have) | 18 features | Important features for competitive differentiation | Phase 1-3 |
| **P2** (Nice to Have) | 17 features | Enhanced functionality for user delight | Phase 2-3 |
| **P3** (Future) | 8 features | Advanced features for future phases | Phase 3+ |
| **TOTAL** | **65 features** | Across 6 modules | 6 months |

### Appendix B: Complete Feature ID Index

| Module | Feature IDs | Count |
|--------|------------|-------|
| CLARA Research | RES-001 to RES-012 | 12 |
| CLARA Medical Scribe | SCR-001 to SCR-010 | 10 |
| CLARA CareGuard | CG-001 to CG-012 | 12 |
| CLARA Trials & Cohort | TRI-001 to TRI-008 | 8 |
| CLARA Ops & Education | OPS-001 to OPS-010 | 10 |
| Personal Health App | APP-001 to APP-015 | 15 |
| **TOTAL** | | **67** |

### Appendix C: Competitive Positioning

| Competitor | Region | Strengths | CLARA Advantage |
|-----------|--------|-----------|----------------|
| **UpToDate** | Global | Gold standard, 40yr brand | Vietnamese language, 10x cheaper, AI-powered synthesis, not just reference |
| **OpenEvidence** | US | AI-powered, fast | Vietnamese native, broader feature set (Scribe, CareGuard, App) |
| **Glass Health** | US | DDx generation, clinical focus | Vietnamese protocols (BYT), consumer app, doctor marketplace |
| **Perplexity (Health)** | Global | Great UX, fast search | Medical-specific RAG, clinical safety layers, not general AI |
| **Elsevier ClinicalKey** | Global | Massive content library | AI-native (not bolt-on), Vietnamese, consumer + professional |
| **None** | Vietnam | N/A | **First mover advantage in Vietnamese medical AI** |

### Appendix D: Regulatory Landscape

| Regulation | Jurisdiction | Relevance to CLARA | Compliance Strategy |
|-----------|-------------|--------------------|--------------------|
| **Nghị định 13/2023/NĐ-CP** | Vietnam | Personal data protection | Privacy-by-design architecture; consent management; data minimization |
| **Luật Khám bệnh, chữa bệnh 2023** | Vietnam | Medical practice law | Clear "advisory tool" positioning; doctor-in-the-loop for clinical decisions |
| **Thông tư BYT** (various) | Vietnam | Medical software standards | BYT protocol compliance; consultation with regulators |
| **GDPR** (reference) | EU | Data protection best practices | GDPR-inspired architecture for future international expansion |
| **FDA SaMD Guidance** (reference) | US | Software as Medical Device | Monitor for applicability; design with SaMD compliance path in mind |
| **HIPAA** (reference) | US | Health data security | HIPAA-inspired security controls for enterprise readiness |

### Appendix E: Team Requirements

| Role | Count | Phase | Key Skills |
|------|-------|-------|-----------|
| **CTO / Tech Lead** | 1 | Phase 1 | AI/ML architecture, medical informatics, system design |
| **ML Engineers** | 2-3 | Phase 1 | LLM fine-tuning, RAG, NLP, vLLM deployment |
| **Backend Engineers** | 2-3 | Phase 1 | FastAPI, distributed systems, database design |
| **Frontend Engineers** | 2 | Phase 1 | React/React Native, mobile development |
| **Medical Advisor** | 1 | Phase 1 | Clinical expertise, medical content QA |
| **Product Manager** | 1 | Phase 1 | Healthcare product experience |
| **DevOps / SRE** | 1 | Phase 1 | Kubernetes, GPU infra, monitoring |
| **Medical NLP Specialist** | 1 | Phase 2 | Vietnamese NLP, medical terminology |
| **Security Engineer** | 1 | Phase 2 | Healthcare security, compliance |
| **QA / Test Engineer** | 1 | Phase 2 | Medical software testing |
| **TOTAL (Phase 1)** | **10-12** | | |
| **TOTAL (Phase 3)** | **14-17** | | |

### Appendix F: Glossary

| Term | Definition |
|------|-----------|
| **Agentic RAG** | Retrieval-Augmented Generation with autonomous agent orchestration — AI agents decide what to retrieve, from where, and how to synthesize |
| **AI Council (Hội chẩn AI)** | Multi-specialist AI deliberation system where 2-5 specialist agents analyze a case independently, then deliberate to reach consensus |
| **BYT** | Bộ Y tế — Vietnamese Ministry of Health |
| **CDSS** | Clinical Decision Support System |
| **DDI** | Drug-Drug Interaction |
| **Dược thư Quốc gia** | Vietnamese National Drug Formulary — official drug reference |
| **FIDES** | CLARA's proprietary fact-checking pipeline (Claim Decomposition → Evidence Retrieval → Cross-Reference → Citation Validation → Verdict) |
| **GRADE** | Grading of Recommendations, Assessment, Development and Evaluations — evidence quality assessment framework |
| **HL7 FHIR** | Health Level Seven Fast Healthcare Interoperability Resources — healthcare data exchange standard |
| **ICD-11** | International Classification of Diseases, 11th revision |
| **MeSH** | Medical Subject Headings — controlled vocabulary for PubMed indexing |
| **NNT/NNH** | Number Needed to Treat / Number Needed to Harm |
| **RCT** | Randomized Controlled Trial |
| **RxNorm** | Standardized nomenclature for clinical drugs |
| **SLM** | Small Language Model (< 3B parameters, used for routing/classification) |
| **SNOMED-CT** | Systematized Nomenclature of Medicine — Clinical Terms |
| **SOAP** | Subjective, Objective, Assessment, Plan — medical documentation format |
| **UMLS** | Unified Medical Language System |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | CLARA Product Team | Initial comprehensive proposal |

---

> **CLARA — Clinical Agent for Retrieval & Analysis**
> *"Bringing evidence-based medicine to every Vietnamese, one query at a time."*
>
> © 2025 CLARA Project. All rights reserved.

