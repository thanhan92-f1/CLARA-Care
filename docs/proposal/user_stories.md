# CLARA User Stories & Use Cases

## Tổng quan / Overview
16 user stories cho 3 nhóm người dùng của CLARA.

---

## A. Normal Users / Người dùng thông thường (6 stories)

### US-01: Tra cứu thông tin sức khỏe / Health Information Lookup
**Role:** Normal User
**Story:** As a normal user, I want to search health information in Vietnamese, so that I can understand my symptoms and conditions.
**Acceptance Criteria:**
- Response in under 2 minutes
- Information sourced from verified medical databases
- Vietnamese language support with medical term explanations
- Disclaimer that this is not medical advice
**Priority:** P0 | **Response Time:** < 2 min | **Module:** CLARA Research

### US-02: Cài đặt nhắc lịch uống thuốc / Medication Reminder
**Role:** Normal User
**Story:** As a normal user, I want to set medication reminders, so that I never miss a dose.
**Acceptance Criteria:**
- Add medication name, dosage, frequency
- Push notification at scheduled times
- Track medication adherence history
**Priority:** P1 | **Response Time:** < 1 min | **Module:** Personal Health App

### US-03: Kiểm tra tương tác thuốc / Drug Interaction Check
**Role:** Normal User
**Story:** As a normal user, I want to check if my medications interact, so that I stay safe.
**Acceptance Criteria:**
- Input multiple medications
- Show interaction severity (minor/moderate/severe)
- Suggest alternatives when dangerous interactions found
- Source from RxNorm and openFDA
**Priority:** P0 | **Response Time:** < 2 min | **Module:** CLARA CareGuard

### US-04: Tạo hồ sơ sức khỏe / Health Profile via Q&A
**Role:** Normal User
**Story:** As a normal user, I want to create my health profile through guided questions, so that CLARA can personalize recommendations.
**Acceptance Criteria:**
- Guided onboarding questionnaire (age, conditions, allergies, medications)
- Profile auto-updates from chat history
- Data encrypted and private
**Priority:** P1 | **Response Time:** < 5 min | **Module:** Personal Health App

### US-05: Tóm tắt sức khỏe AI / AI Health Summary
**Role:** Normal User
**Story:** As a normal user, I want an AI-generated health summary updated after each interaction, so that I have a comprehensive health overview.
**Acceptance Criteria:**
- Auto-generated summary after each chat session
- Highlights key health concerns and trends
- Exportable as PDF
**Priority:** P1 | **Response Time:** < 2 min | **Module:** Personal Health App

### US-06: Liên hệ bác sĩ / Connect with Doctor
**Role:** Normal User
**Story:** As a normal user, I want to connect with a real doctor when AI recommends it, so that I get professional medical advice.
**Acceptance Criteria:**
- Doctor directory with specialties
- Booking system for consultations
- Share health profile and chat history with doctor (with consent)
**Priority:** P2 | **Response Time:** < 1 min | **Module:** Personal Health App

---

## B. Researchers / Nhà nghiên cứu (5 stories)

### US-07: Tổng quan tài liệu tự động / Automated Literature Review
**Role:** Researcher
**Story:** As a researcher, I want to automatically review literature on a medical topic, so that I save weeks of manual searching.
**Acceptance Criteria:**
- Search across PubMed, ClinicalTrials.gov, BYT
- Return structured summary with PMID citations
- Perplexity-style progressive results (5-10-20 min based on depth)
- Show processing logs and sources consulted
**Priority:** P0 | **Response Time:** 5-20 min | **Module:** CLARA Research

### US-08: Tìm thử nghiệm lâm sàng / Clinical Trial Search
**Role:** Researcher
**Story:** As a researcher, I want to find relevant clinical trials with NCT IDs, so that I can reference them in my research.
**Acceptance Criteria:**
- Search by condition, drug, or intervention
- Return NCT IDs with trial status and phase
- Filter by date, location, status
**Priority:** P1 | **Response Time:** 5-10 min | **Module:** CLARA Trials

### US-09: Tra cứu thuốc có trích dẫn / Drug Info with Citations
**Role:** Researcher
**Story:** As a researcher, I want drug information with proper citations (PMID, RxCUI), so that I can use them in academic papers.
**Acceptance Criteria:**
- Drug info from RxNorm with RxCUI
- Related studies from PubMed with PMID
- Vietnamese drug info from Dược thư Quốc gia
- Formatted citations ready for academic use
**Priority:** P0 | **Response Time:** < 5 min | **Module:** CLARA Research

### US-10: Xác minh chéo / Cross-reference Validation
**Role:** Researcher
**Story:** As a researcher, I want to cross-validate medical claims across multiple sources, so that I ensure accuracy.
**Acceptance Criteria:**
- Check claim against PubMed, BYT, WHO sources
- Show agreement/disagreement across sources
- FIDES-inspired confidence score
**Priority:** P1 | **Response Time:** 5-10 min | **Module:** CLARA Research (Fact Checker)

### US-11: Xuất báo cáo nghiên cứu / Research Export
**Role:** Researcher
**Story:** As a researcher, I want to export research summaries with proper formatting, so that I can include them in my papers.
**Acceptance Criteria:**
- Export as PDF, DOCX, or Markdown
- Include all citations in standard format (APA, Vancouver)
- Bibliography auto-generated
**Priority:** P1 | **Response Time:** < 5 min | **Module:** CLARA Research

---

## C. Doctors / Bác sĩ (5 stories)

### US-12: Hỗ trợ quyết định lâm sàng / Clinical Decision Support
**Role:** Doctor
**Story:** As a doctor, I want AI-powered clinical decision support at point-of-care, so that I can make evidence-based decisions quickly.
**Acceptance Criteria:**
- Input patient symptoms, lab results, current medications
- Return evidence-based recommendations with sources
- Check against BYT protocols
- Show confidence level and evidence strength
- Processing logs visible
**Priority:** P0 | **Response Time:** 10-20 min | **Module:** CLARA CareGuard

### US-13: Hội chẩn AI / AI Council
**Role:** Doctor
**Story:** As a doctor, I want an AI Council (multi-specialist deliberation) for complex cases, so that I get comprehensive multi-perspective analysis.
**Acceptance Criteria:**
- Multiple AI specialist agents deliberate (cardiology, neurology, etc.)
- Show reasoning logs from each specialist
- Final synthesized recommendation with consensus/dissent
- Total processing time < 20 min
- All sources and reasoning transparent
**Priority:** P0 | **Response Time:** 10-20 min | **Module:** AI Council

### US-14: Kiểm tra DDI có bằng chứng / Evidence-based DDI Check
**Role:** Doctor
**Story:** As a doctor, I want evidence-based drug interaction checking, so that I prescribe safely with full documentation.
**Acceptance Criteria:**
- Check interactions via RxNorm + openFDA
- Show severity, mechanism, and clinical significance
- Provide alternative drug suggestions
- Link to primary literature (PMID)
**Priority:** P0 | **Response Time:** < 5 min | **Module:** CLARA CareGuard

### US-15: Chuyển audio thành bệnh án / Audio to Medical Record
**Role:** Doctor
**Story:** As a doctor, I want to convert clinical audio into structured medical records, so that I reduce administrative burden.
**Acceptance Criteria:**
- Support Vietnamese audio input
- Speaker diarization (doctor vs patient)
- Output structured sections (HPI, ROS, PMH, Assessment, Plan)
- NER for medical entities (drugs, diagnoses, procedures)
- ICD-11 and RxNorm coding suggestions
**Priority:** P0 | **Response Time:** < 5 min | **Module:** CLARA Medical Scribe

### US-16: Kiểm tra tuân thủ phác đồ / Protocol Compliance Check
**Role:** Doctor
**Story:** As a doctor, I want to verify my treatment plan against BYT protocols, so that I ensure compliance with national guidelines.
**Acceptance Criteria:**
- Match treatment plan against relevant BYT guidelines
- Highlight deviations with explanations
- Suggest corrections based on latest protocols
- Show protocol version and date
**Priority:** P1 | **Response Time:** < 10 min | **Module:** CLARA CareGuard

---

## Tracing Matrix

| Story | Role | Priority | Time | Module | Phase |
|-------|------|----------|------|--------|-------|
| US-01 | User | P0 | <2m | Research | 1 |
| US-02 | User | P1 | <1m | Health App | 2 |
| US-03 | User | P0 | <2m | CareGuard | 2 |
| US-04 | User | P1 | <5m | Health App | 2 |
| US-05 | User | P1 | <2m | Health App | 2 |
| US-06 | User | P2 | <1m | Health App | 3 |
| US-07 | Researcher | P0 | 5-20m | Research | 1 |
| US-08 | Researcher | P1 | 5-10m | Trials | 2 |
| US-09 | Researcher | P0 | <5m | Research | 1 |
| US-10 | Researcher | P1 | 5-10m | Research | 2 |
| US-11 | Researcher | P1 | <5m | Research | 2 |
| US-12 | Doctor | P0 | 10-20m | CareGuard | 2 |
| US-13 | Doctor | P0 | 10-20m | AI Council | 3 |
| US-14 | Doctor | P0 | <5m | CareGuard | 2 |
| US-15 | Doctor | P0 | <5m | Scribe | 1 |
| US-16 | Doctor | P1 | <10m | CareGuard | 2 |

