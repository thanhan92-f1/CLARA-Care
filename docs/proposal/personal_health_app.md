# CLARA Personal Health Management App/Web — Complete Product Specification

> **Document Type:** Product Specification & Technical Proposal
> **Project:** CLARA (Clinical Agent for Retrieval & Analysis)
> **Module:** Component 2 — Personal Health Management App/Web
> **Last Updated:** 2025
> **Status:** Active Proposal
> **Cross-References:** [`product_proposal.md`](./product_proposal.md), [`user_stories.md`](./user_stories.md), [`technical_architecture_deep_dive.md`](../research/technical_architecture_deep_dive.md)

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Onboarding Flow](#2-onboarding-flow)
3. [Core Features](#3-core-features)
4. [Health Profile Schema](#4-health-profile-schema)
5. [AI Features Detail](#5-ai-features-detail)
6. [UI/UX Wireframe Descriptions](#6-uiux-wireframe-descriptions)
7. [Privacy & Security](#7-privacy--security)
8. [Business Model](#8-business-model)
9. [Tech Stack](#9-tech-stack)
10. [MVP vs Full Feature Set](#10-mvp-vs-full-feature-set)

---

## 1. App Overview

### 1.1 Product Positioning

The CLARA Personal Health Management App/Web is **Component 2** of the CLARA ecosystem — the **consumer-facing gateway** that brings AI-powered health management to everyday Vietnamese users. While Component 1 (AI Agent Platform) serves researchers and doctors with deep clinical tools, this app focuses on **individual users, patients, and caregivers** who need simple, trustworthy health management in plain Vietnamese.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLARA ECOSYSTEM — TWO COMPONENTS                      │
│                                                                          │
│  ┌─────────────────────────────┐    ┌──────────────────────────────┐    │
│  │  Component 1:               │    │  Component 2:                 │    │
│  │  AI Agent Platform          │    │  Personal Health App/Web ◄──── YOU ARE HERE
│  │  (Researchers & Doctors)    │    │  (Patients & Caregivers)     │    │
│  │                             │    │                               │    │
│  │  • CLARA Research           │    │  • Health Profile (Smart)     │    │
│  │  • CLARA Medical Scribe    │    │  • Medication Manager         │    │
│  │  • CLARA CareGuard         │    │  • DDI Check (Consumer)       │    │
│  │  • CLARA Trials & Cohort   │    │  • AI Health Chatbot          │    │
│  │  • CLARA Ops & Education   │    │  • Health Summary (AI)        │    │
│  │                             │    │  • Medical Records Vault      │    │
│  │  Platform: Web (Desktop)    │    │  • Doctor Marketplace         │    │
│  │  Audience: Professional     │    │                               │    │
│  │  Language: Medical terms    │    │  Platform: Mobile + Web       │    │
│  │  Response: 5-20 min        │    │  Audience: Consumer            │    │
│  └─────────────────────────────┘    │  Language: Plain Vietnamese   │    │
│              │                       │  Response: < 2 min            │    │
│              │                       └──────────────────────────────┘    │
│              │                                    │                       │
│              └────────────┬───────────────────────┘                       │
│                           │                                               │
│                  Shared Infrastructure:                                   │
│                  RAG Engine, Knowledge Base, Fact Checker,               │
│                  Drug Interaction DB, Blockchain Audit Layer             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Target Users

| Segment | Description | Size (Vietnam) |
|---------|-------------|----------------|
| **Health-conscious adults** | Ages 25-55, smartphone users who actively manage their health | 15-20M |
| **Chronic disease patients** | Diabetes, hypertension, heart disease — need medication management | 8-12M |
| **Elderly caregivers** | Children managing parents' health (medication, appointments) | 5-8M |
| **Young parents** | Managing children's health, vaccinations, growth tracking | 6-10M |
| **Rural users** | Limited access to specialists, need reliable health info | 30M+ potential |

### 1.3 Platform Strategy

| Aspect | Mobile App | Web App |
|--------|-----------|---------|
| **Framework** | React Native (Expo) | Next.js 14+ (App Router) |
| **Priority** | **Primary** — Mobile-first design | **Secondary** — Desktop companion |
| **Key Use Cases** | Medication reminders, quick chat, on-the-go access | Records management, health summary review, doctor booking |
| **Notifications** | Push notifications (FCM/APNs) | Browser notifications (Service Workers) |
| **Offline** | Medication schedule cached, basic profile access | PWA with limited offline |
| **Distribution** | App Store + Google Play | HTTPS web app (SEO-friendly) |

### 1.4 Data Flow — App ↔ CLARA Ecosystem

```
┌────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW ARCHITECTURE                                │
│                                                                          │
│  Personal Health App ←→ Shared Knowledge Base ←→ AI Agent Platform      │
│         │                        │                        │              │
│  User health profile     Medical evidence DB      Clinical data         │
│  Medication list         Drug interaction DB      Research results       │
│  Chat history            Vietnamese guidelines    AI Council logs        │
│         │                        │                        │              │
│         └────────────────────────┴────────────────────────┘              │
│                                  │                                        │
│                      Doctor Marketplace Bridge                           │
│                   (Patient shares profile → Doctor reviews)              │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Key Differentiators

| Differentiator | Description |
|---------------|-------------|
| **Vietnamese-Native AI** | Purpose-built for Vietnamese language, medical terminology, and cultural context — not a translated English app |
| **Smart Health Profile** | AI automatically builds and updates your health profile from every interaction — no manual data entry needed |
| **Powered by CLARA Research** | Same evidence-based AI engine used by doctors, simplified for consumers |
| **DDI Safety Net** | Automatic drug interaction checking protects users from dangerous medication combinations |
| **Doctor Bridge** | Seamless escalation from AI to real doctors when professional care is needed |
| **Privacy-First** | End-to-end encryption, Vietnamese data protection compliance, user controls everything |

---

## 2. Onboarding Flow

### 2.1 Onboarding Philosophy

The onboarding flow uses **progressive disclosure** — start with essential information (2-3 minutes), then deepen the profile over time through interactions. Users should never feel overwhelmed.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ONBOARDING FLOW — 5 STEPS                         │
│                    (Total: 3-5 minutes)                              │
│                                                                      │
│  STEP 1: Welcome & Account     STEP 2: Basic Info                   │
│  ┌──────────────────────┐      ┌──────────────────────┐             │
│  │ 👋 Chào mừng bạn     │      │ 📋 Thông tin cơ bản   │             │
│  │ đến với CLARA!       │      │                       │             │
│  │                      │  ──▶ │ • Họ tên              │             │
│  │ • Đăng ký SĐT/Email │      │ • Năm sinh            │             │
│  │ • Xác minh OTP       │      │ • Giới tính           │             │
│  │ • Mật khẩu           │      │ • Chiều cao / cân nặng│             │
│  └──────────────────────┘      └──────────┬───────────┘             │
│                                            │                         │
│  STEP 3: Health Conditions      ◀──────────┘                         │
│  ┌──────────────────────┐                                            │
│  │ 🏥 Bệnh nền           │      STEP 4: Current Medications         │
│  │                      │      ┌──────────────────────┐             │
│  │ • Bạn có bệnh nền    │      │ 💊 Thuốc đang dùng    │             │
│  │   không?             │  ──▶ │                       │             │
│  │   □ Tiểu đường       │      │ • Tên thuốc           │             │
│  │   □ Cao huyết áp     │      │ • Liều lượng          │             │
│  │   □ Tim mạch         │      │ • Số lần/ngày         │             │
│  │   □ Hen suyễn        │      │ • Chụp toa thuốc (OCR)│             │
│  │   □ Khác: ____       │      └──────────┬───────────┘             │
│  │                      │                  │                         │
│  │ • Dị ứng thuốc?      │   STEP 5: Finish ◀┘                       │

### 2.2 Onboarding Questionnaire — Detailed Fields

#### Step 1: Account Creation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Phone Number | Phone (VN format) | ✅ | Primary identifier; OTP verification via SMS |
| Email | Email | ❌ | Optional backup; used for reports export |
| Password | Password | ✅ | Min 8 chars, 1 uppercase, 1 number |
| Display Name | Text | ✅ | How the chatbot addresses the user |

#### Step 2: Basic Demographics
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | Text | ✅ | For medical records and doctor sharing |
| Year of Birth | Year picker | ✅ | Age calculation; dosage considerations |
| Gender | Select | ✅ | Male / Female / Other (medical relevance) |
| Height (cm) | Number | ❌ | BMI calculation |
| Weight (kg) | Number | ❌ | BMI calculation, dosage reference |
| Blood Type | Select | ❌ | A/B/AB/O (+/-) — useful for emergencies |
| Province/City | Select | ❌ | For doctor matching and hospital suggestions |

#### Step 3: Health Conditions & Allergies
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Chronic Conditions | Multi-select + free text | ❌ | Pre-populated list: Diabetes, Hypertension, Heart Disease, Asthma/COPD, Kidney Disease, Liver Disease, Thyroid, Cancer, Mental Health, Other |
| Known Allergies | Multi-select + free text | ❌ | Drug allergies, food allergies, latex |
| Previous Surgeries | Free text | ❌ | Type and approximate year |
| Family History | Multi-select | ❌ | Diabetes, Cancer, Heart Disease, Stroke in immediate family |
| Pregnancy Status | Select | Conditional | Only shown for females of childbearing age; critical for DDI checking |

#### Step 4: Current Medications
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Medication Name | Autocomplete (Vietnamese drug DB) | ❌ | Maps to RxNorm codes internally |
| Dosage | Text + unit selector | ❌ | e.g., "500mg", "10ml" |
| Frequency | Select | ❌ | Once daily, Twice daily, Three times daily, As needed |
| Time of Day | Multi-select | ❌ | Morning, Noon, Evening, Bedtime |
| Prescribing Doctor | Text | ❌ | Optional reference |
| Scan Prescription | Camera/Photo | ❌ | OCR auto-extraction via PaddleOCR |

#### Step 5: Preferences & Consent
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Notification Preferences | Multi-select | ✅ | Medication reminders, Health tips, Doctor updates |
| Language | Select | ✅ | Vietnamese (default), English |
| Data Sharing Consent | Checkbox | ✅ | Required: CLARA data processing. Optional: AI profile learning, Anonymous analytics |
| Privacy Policy Acknowledgment | Checkbox | ✅ | Must agree to proceed |

### 2.3 Progressive Profile Deepening

After initial onboarding, the profile deepens automatically through:

```
Week 1:  Basic profile from onboarding Q&A
         ↓
Week 2:  Chatbot interactions extract new health data
         (e.g., user mentions "tôi bị đau đầu thường xuyên" → adds "Frequent headaches" to profile)
         ↓
Week 3:  User uploads lab results → OCR extracts values
         (e.g., HbA1c = 7.2% → confirms diabetes management data)
         ↓
Month 2: Medication changes detected from chat context
         AI suggests profile updates → user confirms
         ↓
Month 3: Comprehensive profile with interaction history
         Ready for doctor sharing with full context
```

---

## 3. Core Features

### 3.1 Medication Management (APP-003 + APP-004)

#### 3.1.1 Feature Overview

The Medication Manager is the daily-use anchor feature — the reason users open the app every day.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEDICATION MANAGEMENT FLOW                     │
│                                                                   │
│  ADD MEDICATION                                                   │
│  ┌──────────┐   ┌──────────────┐   ┌────────────┐               │
│  │ Manual   │   │ Scan Rx      │   │ From Chat  │               │
│  │ Entry    │   │ (OCR)        │   │ History    │               │
│  │          │   │              │   │ (AI picks  │               │
│  │ Name     │   │ 📷 Chụp toa  │   │  up meds   │               │
│  │ Dosage   │   │ thuốc        │   │  from      │               │
│  │ Schedule │   │              │   │  convo)    │               │
│  └────┬─────┘   └──────┬───────┘   └─────┬──────┘               │
│       │                │                  │                       │
│       └────────────────┴──────────────────┘                       │
│                        │                                          │
│                        ▼                                          │
│            ┌───────────────────────┐                              │
│            │ Vietnamese Drug DB    │                              │
│            │ RxNorm Normalization  │                              │
│            │ ↓                     │                              │
│            │ DDI Check Triggered   │ ← Automatic on every add    │
│            │ (vs. existing meds)   │                              │
│            └───────────┬───────────┘                              │
│                        │                                          │
│              ┌─────────┴─────────┐                                │
│              │                   │                                │
│         [No DDI found]    [DDI Detected!]                         │
│              │                   │                                │
│              ▼                   ▼                                │
│    ┌──────────────┐    ┌──────────────────┐                      │
│    │ ✅ Medication  │    │ ⚠️ DDI Alert      │                      │
│    │ Added to List │    │ Severity: 🔴🟡🟢  │                      │
│    │ Reminders Set │    │ Explanation (VN)  │                      │
│    └──────────────┘    │ "Hỏi bác sĩ" btn │                      │
│                        └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.1.2 Medication Data Model

```json
{
  "medication_id": "med_uuid_001",
  "user_id": "user_uuid_001",
  "drug_name_vi": "Metformin",
  "drug_name_generic": "Metformin Hydrochloride",
  "rxnorm_cui": "RX860975",
  "brand_name": "Glucophage",
  "dosage": {
    "amount": 500,
    "unit": "mg"
  },
  "schedule": {
    "frequency": "twice_daily",
    "times": ["07:00", "19:00"],
    "relation_to_meal": "after_meal",
    "days_of_week": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
  },
  "reminder": {
    "enabled": true,
    "advance_minutes": 5,
    "snooze_minutes": 10,
    "max_snoozes": 3,
    "notification_channels": ["push", "in_app"]
  },
  "prescribing_doctor": "BS. Nguyễn Văn A",
  "start_date": "2025-01-15",
  "end_date": null,
  "refill_reminder": {
    "enabled": true,
    "days_before": 7,
    "quantity_remaining": 30
  },
  "adherence": {
    "taken_count": 45,
    "missed_count": 3,
    "adherence_rate": 0.9375,
    "streak_current": 12,
    "streak_best": 30
  },
  "source": "manual_entry",
  "added_at": "2025-01-15T10:00:00+07:00",
  "updated_at": "2025-02-01T08:30:00+07:00",
  "is_active": true
}
```

#### 3.1.3 Push Notification System

```
┌─────────────────────────────────────────────────────────────┐
│               NOTIFICATION PIPELINE                           │
│                                                               │
│  Scheduler (Cron) ──▶ Redis Queue ──▶ Notification Service   │
│                                              │                │
│                              ┌───────────────┼──────────────┐│
│                              │               │              ││
│                              ▼               ▼              ▼│
│                        ┌──────────┐  ┌──────────┐  ┌───────┐│
│                        │ FCM      │  │ APNs     │  │ Web   ││
│                        │ (Android)│  │ (iOS)    │  │ Push  ││
│                        └──────────┘  └──────────┘  └───────┘│
│                                                               │
│  Notification Types:                                          │
│  ├── 💊 Medication Reminder: "Đã đến giờ uống Metformin 500mg"│
│  ├── ⚠️ Missed Dose Alert: "Bạn quên uống thuốc lúc 7:00"    │
│  ├── 📋 Refill Reminder: "Thuốc Metformin còn 7 ngày"        │
│  ├── 📊 Weekly Adherence: "Tuần này bạn uống đủ 92% thuốc"   │
│  └── 🔴 DDI Alert: "Cảnh báo tương tác thuốc mới phát hiện"  │
│                                                               │
│  User Actions on Notification:                                │
│  ├── [✅ Đã uống] → Mark as taken, update adherence           │
│  ├── [⏰ Nhắc sau] → Snooze 10 min (max 3x)                  │
│  └── [❌ Bỏ qua] → Mark as skipped, log reason               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 DDI Check — Drug-Drug Interaction Checker (APP-005)

#### 3.2.1 Consumer DDI Flow

Unlike the professional CareGuard DDI checker for doctors, the consumer version uses **plain Vietnamese**, color-coded severity, and actionable next steps.

```
┌──────────────────────────────────────────────────────────────────┐
│                    CONSUMER DDI CHECK FLOW                         │
│                                                                    │
│  TRIGGER POINTS:                                                   │
│  ├── 🔄 Automatic: New medication added to list                   │
│  ├── 🔍 Manual: User opens "Kiểm tra tương tác" screen            │
│  └── 💬 Chat-based: User asks "thuốc A có uống chung thuốc B?"    │
│                                                                    │
│  PIPELINE:                                                         │
│                                                                    │
│  User's Medication List                                            │
│  [Metformin, Lisinopril, Aspirin, + NEW: Ibuprofen]               │
│         │                                                          │
│         ▼                                                          │
│  ┌──────────────────────────────────────┐                          │
│  │  Drug Name Resolution                │                          │
│  │  Vietnamese Name → RxNorm CUI        │                          │
│  │  (Fuzzy matching for brand names)    │                          │
│  │  API: /rxcui?name={drugName}          │                          │
│  └──────────────┬───────────────────────┘                          │
│                  ▼                                                  │
│  ┌──────────────────────────────────────┐                          │
│  │  Interaction Check                    │                          │
│  │  API: /interaction/list?rxcuis={ids}  │                          │
│  │  Sources: RxNorm + Dược thư QG       │                          │
│  │           + openFDA + DrugBank        │                          │
│  └──────────────┬───────────────────────┘                          │
│                  ▼                                                  │
│  ┌──────────────────────────────────────┐                          │
│  │  Result Simplification               │                          │
│  │  Medical jargon → Plain Vietnamese   │                          │
│  │  Severity color-coding               │                          │
│  └──────────────┬───────────────────────┘                          │
│                  ▼                                                  │
│  DDI REPORT (Example):                                             │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ 🔴 NGHIÊM TRỌNG: Aspirin + Ibuprofen                     │     │
│  │    Tăng nguy cơ xuất huyết tiêu hóa                      │     │
│  │    → Không nên dùng chung. Hãy hỏi bác sĩ.             │     │
│  │    [📞 Liên hệ bác sĩ]                                   │     │
│  │                                                           │     │
│  │ 🟡 TRUNG BÌNH: Lisinopril + Ibuprofen                    │     │
│  │    NSAIDs có thể giảm tác dụng hạ huyết áp              │     │
│  │    → Theo dõi huyết áp thường xuyên hơn.                │     │
│  │    [ℹ️ Tìm hiểu thêm]                                    │     │
│  │                                                           │     │
│  │ 🟢 NHẸ: Metformin + Ibuprofen                            │     │
│  │    Tương tác nhẹ, thường không đáng lo ngại              │     │
│  │    → Có thể dùng chung nhưng theo dõi.                   │     │
│  └──────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 DDI Severity Classification

| Level | Color | Vietnamese Label | Action | Example |
|-------|-------|-----------------|--------|---------|
| **Critical** | 🔴 Red | Nghiêm trọng | Block + Doctor referral | Warfarin + NSAIDs |
| **Major** | 🟠 Orange | Quan trọng | Strong warning + Alternatives | Metformin + Contrast dye |
| **Moderate** | 🟡 Yellow | Trung bình | Monitoring advice | ACE inhibitor + Potassium |
| **Minor** | 🟢 Green | Nhẹ | Informational | Mild interactions |
| **None** | ✅ Clear | Không có | No action needed | No known interaction |

### 3.3 Health Records — Medical Records Vault (APP-008)

#### 3.3.1 Supported Record Types

| Record Type | Vietnamese | Input Method | Data Extracted (OCR/AI) |
|-------------|-----------|-------------|------------------------|
| Lab Results | Kết quả xét nghiệm | Photo upload, PDF | Blood values, ranges, abnormal flags |
| Prescriptions | Đơn thuốc | Photo/scan, manual | Drug names, dosages, instructions |
| Diagnoses | Chẩn đoán | Manual, from doctor consult | ICD-11 codes, condition names |
| Imaging Reports | Kết quả hình ảnh | Photo/PDF upload | Findings summary, recommendations |
| Discharge Summaries | Giấy ra viện | Photo/PDF upload | Diagnosis, treatment, follow-up |
| Vaccination Records | Sổ tiêm chủng | Photo, manual | Vaccine type, date, next dose |

#### 3.3.2 Records Storage Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    MEDICAL RECORDS VAULT                         │
│                                                                  │
│  Upload ──▶ OCR/AI Extraction ──▶ Structured Data ──▶ Storage  │
│                                                                  │
│  ┌──────────────────┐   ┌───────────────────┐                   │
│  │ Raw Files        │   │ Extracted Data     │                   │
│  │ (Encrypted S3)   │   │ (PostgreSQL JSONB) │                   │
│  │                  │   │                     │                   │
│  │ • Original photo │   │ • Parsed values     │                   │
│  │ • PDF scan       │   │ • ICD-11 mappings   │                   │
│  │ • Audio notes    │   │ • Drug references   │                   │
│  │                  │   │ • Timeline position │                   │
│  │ AES-256 at rest  │   │ • AI confidence     │                   │
│  └──────────────────┘   └───────────────────┘                   │
│                                                                  │
│  Timeline View:                                                  │
│  2025-01 ──── Lab: HbA1c 7.2% ↑                                │
│  2025-02 ──── Rx: Metformin increased to 1000mg                 │
│  2025-03 ──── Visit: Endocrinologist follow-up                  │
│  2025-04 ──── Lab: HbA1c 6.8% ↓ (improving!)                   │
└────────────────────────────────────────────────────────────────┘
```


### 3.4 AI Health Chatbot (APP-006)

#### 3.4.1 Chatbot Architecture

The AI Health Chatbot is the primary interaction surface — a conversational AI that answers health questions in plain Vietnamese, powered by CLARA's simplified single-pass RAG engine.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI HEALTH CHATBOT PIPELINE                     │
│                                                                   │
│  User Query (Vietnamese)                                         │
│  "Tôi bị đau đầu và buồn nôn 2 ngày nay, có sao không?"       │
│         │                                                         │
│         ▼                                                         │
│  ┌────────────────────────────────────────────┐                   │
│  │  Layer 1: Safety & Emergency Check          │                   │
│  │  • Red flag symptom detection              │                   │
│  │  • Emergency → 115 hotline + first aid     │                   │
│  │  • Non-emergency → continue pipeline       │                   │
│  └──────────────────┬─────────────────────────┘                   │
│                      ▼                                             │
│  ┌────────────────────────────────────────────┐                   │
│  │  Layer 2: Context Enrichment               │                   │
│  │  • Load user's health profile              │                   │
│  │  • Current medications list                │                   │
│  │  • Recent conversation history             │                   │
│  │  • Known conditions & allergies            │                   │
│  └──────────────────┬─────────────────────────┘                   │
│                      ▼                                             │
│  ┌────────────────────────────────────────────┐                   │
│  │  Layer 3: Simplified RAG                    │                   │
│  │  • Single-pass retrieval (not multi-hop)   │                   │
│  │  • Sources: Drug DB + BYT guidelines       │                   │
│  │  • Vietnamese medical knowledge base       │                   │
│  └──────────────────┬─────────────────────────┘                   │
│                      ▼                                             │
│  ┌────────────────────────────────────────────┐                   │
│  │  Layer 4: Response Generation               │                   │
│  │  • Plain Vietnamese (no medical jargon)    │                   │
│  │  • Cited sources                           │                   │
│  │  • Disclaimer: "Đây không phải chẩn đoán"  │                   │
│  │  • Smart escalation: "Nên gặp bác sĩ nếu…"│                   │
│  └──────────────────┬─────────────────────────┘                   │
│                      ▼                                             │
│  ┌────────────────────────────────────────────┐                   │
│  │  Layer 5: Profile Update (Background)       │                   │
│  │  • Extract health entities from convo      │                   │
│  │  • Suggest profile updates (with consent)  │                   │
│  │  • Update health summary                   │                   │
│  └────────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.4.2 Chatbot Guardrails

| Guardrail | Implementation | Purpose |
|-----------|---------------|---------|
| **No Diagnosis** | System prompt + output filter | Chatbot never provides a definitive diagnosis |
| **Disclaimer** | Auto-appended to every response | "Thông tin này chỉ mang tính tham khảo, không thay thế tư vấn y khoa." |
| **Emergency Detection** | Regex + NER for red-flag symptoms | Immediate 115 redirect for emergencies |
| **Doctor Escalation** | Triage logic triggers referral | "Triệu chứng này cần gặp bác sĩ. [Đặt lịch khám →]" |
| **Source Citation** | Every factual claim must cite source | "Theo Bộ Y tế (TT-30/2018)..." |
| **Confidence Display** | Low-confidence responses flagged | "Tôi không chắc chắn lắm, bạn nên hỏi bác sĩ." |
| **Rate Limiting** | Free: 10 queries/day; Premium: unlimited | Prevent abuse, encourage premium |

#### 3.4.3 Response Time Target

| Query Type | Target | Method |
|-----------|--------|--------|
| Simple health info | < 30 seconds | Cached RAG + fast LLM |
| DDI check from chat | < 15 seconds | Direct API call to RxNorm |
| Symptom assessment | < 1 minute | NER + triage logic |
| Complex query | < 2 minutes | Full single-pass RAG |

### 3.5 AI Health Summary (APP-002 + APP-007)

#### 3.5.1 Auto-Generated Health Summary

After every significant interaction (chatbot conversation, medication change, record upload), the AI generates an updated health summary.

```
┌─────────────────────────────────────────────────────────────────┐
│              AI HEALTH SUMMARY — EXAMPLE OUTPUT                   │
│                                                                   │
│  📋 TÓM TẮT SỨC KHỎE — Nguyễn Văn B                            │
│  Cập nhật lần cuối: 15/03/2025                                   │
│                                                                   │
│  👤 THÔNG TIN CƠ BẢN                                             │
│  Nam, 52 tuổi, 168cm/72kg (BMI: 25.5 — Thừa cân)               │
│  Nhóm máu: A+                                                    │
│                                                                   │
│  🏥 BỆNH NỀN                                                     │
│  • Đái tháo đường type 2 (phát hiện 2020)                       │
│  • Tăng huyết áp (phát hiện 2019)                                │
│                                                                   │
│  💊 THUỐC ĐANG DÙNG (3 loại)                                     │
│  • Metformin 500mg — 2 lần/ngày (sáng, tối)                     │
│  • Lisinopril 10mg — 1 lần/ngày (sáng)                          │
│  • Aspirin 81mg — 1 lần/ngày (sáng)                             │
│  ⚠️ Không có tương tác thuốc nguy hiểm                           │
│                                                                   │
│  🔬 XÉT NGHIỆM GẦN NHẤT                                         │
│  • HbA1c: 7.2% (01/2025) — Mục tiêu: <7%                       │
│  • Huyết áp: 135/85 mmHg — Mục tiêu: <130/80                   │
│  • Cholesterol LDL: 120 mg/dL — Mục tiêu: <100                  │
│                                                                   │
│  📊 XU HƯỚNG                                                      │
│  • HbA1c: 7.8% → 7.2% (cải thiện ↓)                            │
│  • Cân nặng: 75kg → 72kg (giảm ↓)                               │
│                                                                   │
│  💬 TỪ LỊCH SỬ TRÒ CHUYỆN                                       │
│  • Hỏi về triệu chứng tê bì tay chân (02/2025)                 │
│  • Quan tâm về chế độ ăn kiểm soát đường huyết                  │
│  • Hỏi về tác dụng phụ của Metformin                             │
│                                                                   │
│  🎯 GỢI Ý                                                        │
│  • Tái khám nội tiết (đã 3 tháng từ lần khám cuối)             │
│  • Xét nghiệm HbA1c tiếp theo (dự kiến 04/2025)               │
│  • Cân nhắc tăng liều Metformin nếu HbA1c không giảm           │
│                                                                   │
│  ⚠️ Lưu ý: Đây là tóm tắt tự động, không thay thế tư vấn BS.  │
│  [📤 Chia sẻ với bác sĩ]  [📄 Xuất PDF]                         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.6 Doctor Connection — Marketplace (APP-009 + APP-010)

#### 3.6.1 Doctor Marketplace Business Flow

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
│                   │ Post-consult:   │     Revenue Split:          │
│                   │ • Prescription  │     • Doctor: 80-85%        │
│                   │ • Follow-up     │     • CLARA: 15-20%         │
│                   │ • Updated       │     • ~$10-30/consult       │
│                   │   health profile│                             │
│                   └────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.6.2 Smart Escalation — When AI Recommends a Doctor

| Trigger | Condition | Action |
|---------|-----------|--------|
| 🔴 **Emergency** | Red-flag symptoms detected | "Gọi 115 ngay!" + Nearest ER |
| 🟠 **Urgent** | Symptoms need professional evaluation | "Bạn nên gặp bác sĩ trong 24-48h" + Book button |
| 🟡 **Recommended** | Complex query beyond AI capability | "Câu hỏi này cần bác sĩ chuyên khoa tư vấn" |
| 🔵 **Optional** | User could benefit from professional advice | "Nếu bạn muốn, có thể hỏi bác sĩ để chắc chắn" |

#### 3.6.3 Consultation Types

| Type | Duration | Price Range (VND) | Medium |
|------|----------|-------------------|--------|
| **Quick Chat** | 10-15 min | 100,000 - 200,000 | Text chat |
| **Video Consult** | 15-30 min | 200,000 - 500,000 | Video call (Zoom/Meet) |
| **Follow-up** | 10 min | 50,000 - 150,000 | Text chat |
| **Second Opinion** | 30 min | 300,000 - 800,000 | Video + document review |

---

## 4. Health Profile Schema

### 4.1 Complete JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CLARA Personal Health Profile",
  "description": "Complete health profile schema for CLARA Personal Health App users",
  "type": "object",
  "properties": {
    "profile_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique profile identifier"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "Reference to user account"
    },
    "version": {
      "type": "integer",
      "description": "Profile schema version for migration"
    },
    "last_updated": {
      "type": "string",
      "format": "date-time"
    },
    "demographics": {
      "type": "object",
      "properties": {
        "full_name": { "type": "string" },
        "display_name": { "type": "string" },
        "date_of_birth": { "type": "string", "format": "date" },
        "gender": { "type": "string", "enum": ["male", "female", "other"] },
        "height_cm": { "type": "number", "minimum": 30, "maximum": 250 },
        "weight_kg": { "type": "number", "minimum": 2, "maximum": 300 },
        "bmi": { "type": "number", "description": "Auto-calculated" },
        "blood_type": { "type": "string", "enum": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"] },
        "province": { "type": "string" },
        "emergency_contact": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "phone": { "type": "string" },
            "relationship": { "type": "string" }
          }
        }
      },
      "required": ["full_name", "date_of_birth", "gender"]
    },
    "conditions": {
      "type": "array",
      "description": "Active and historical health conditions",
      "items": {
        "type": "object",
        "properties": {
          "condition_id": { "type": "string", "format": "uuid" },
          "name_vi": { "type": "string", "description": "Vietnamese name" },
          "name_en": { "type": "string", "description": "English name" },
          "icd11_code": { "type": "string", "description": "ICD-11 code" },
          "status": { "type": "string", "enum": ["active", "resolved", "in_remission", "chronic"] },
          "diagnosed_date": { "type": "string", "format": "date" },
          "severity": { "type": "string", "enum": ["mild", "moderate", "severe"] },
          "source": { "type": "string", "enum": ["onboarding", "chat_extracted", "doctor_consult", "record_upload", "manual"] },
          "ai_confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "verified_by_user": { "type": "boolean" },
          "notes": { "type": "string" }
        },
        "required": ["name_vi", "status", "source"]
      }
    },
    "allergies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "allergen": { "type": "string" },
          "allergen_type": { "type": "string", "enum": ["drug", "food", "environmental", "other"] },
          "reaction": { "type": "string" },
          "severity": { "type": "string", "enum": ["mild", "moderate", "severe", "anaphylaxis"] },
          "rxnorm_code": { "type": "string", "description": "For drug allergies" }
        },
        "required": ["allergen", "allergen_type", "severity"]
      }
    },
    "medications": {
      "type": "array",
      "description": "Current and past medications",
      "items": { "$ref": "#/$defs/medication" }
    },
    "family_history": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "condition": { "type": "string" },
          "relationship": { "type": "string", "enum": ["father", "mother", "sibling", "grandparent", "other"] },
          "age_of_onset": { "type": "integer" },
          "deceased": { "type": "boolean" }
        }
      }
    },
    "lab_results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "test_name": { "type": "string" },
          "value": { "type": "number" },
          "unit": { "type": "string" },
          "reference_range": { "type": "string" },
          "status": { "type": "string", "enum": ["normal", "low", "high", "critical"] },
          "date": { "type": "string", "format": "date" },
          "source": { "type": "string", "enum": ["ocr_extracted", "manual", "doctor_consult"] }
        }
      }
    },
    "vital_signs": {
      "type": "object",
      "properties": {
        "blood_pressure": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "systolic": { "type": "integer" },
              "diastolic": { "type": "integer" },
              "pulse": { "type": "integer" },
              "measured_at": { "type": "string", "format": "date-time" }
            }
          }
        },
        "blood_glucose": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "value": { "type": "number" },
              "unit": { "type": "string", "enum": ["mg/dL", "mmol/L"] },
              "timing": { "type": "string", "enum": ["fasting", "post_meal", "random"] },
              "measured_at": { "type": "string", "format": "date-time" }
            }
          }
        }
      }
    },
    "chat_history_insights": {
      "type": "array",
      "description": "Health topics extracted from chatbot conversations",
      "items": {
        "type": "object",
        "properties": {
          "topic": { "type": "string" },
          "extracted_from": { "type": "string", "description": "Session ID" },
          "extracted_at": { "type": "string", "format": "date-time" },
          "entity_type": { "type": "string", "enum": ["symptom", "concern", "question", "lifestyle", "side_effect"] },
          "ai_confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "added_to_profile": { "type": "boolean" }
        }
      }
    },
    "ai_summary": {
      "type": "object",
      "description": "Auto-generated health summary",
      "properties": {
        "last_generated": { "type": "string", "format": "date-time" },
        "summary_text_vi": { "type": "string" },
        "summary_text_en": { "type": "string" },
        "key_metrics": {
          "type": "object",
          "properties": {
            "medication_adherence_rate": { "type": "number" },
            "active_conditions_count": { "type": "integer" },
            "active_medications_count": { "type": "integer" },
            "last_lab_date": { "type": "string", "format": "date" },
            "upcoming_actions": { "type": "array", "items": { "type": "string" } }
          }
        },
        "trends": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "metric": { "type": "string" },
              "direction": { "type": "string", "enum": ["improving", "stable", "worsening"] },
              "values": { "type": "array", "items": { "type": "number" } },
              "dates": { "type": "array", "items": { "type": "string", "format": "date" } }
            }
          }
        }
      }
    },
    "privacy_settings": {
      "type": "object",
      "properties": {
        "data_processing_consent": { "type": "boolean", "description": "Required for CLARA" },
        "ai_learning_consent": { "type": "boolean", "description": "Allow AI to learn from interactions" },
        "anonymous_analytics_consent": { "type": "boolean" },
        "doctor_sharing": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean" },
            "shared_with": { "type": "array", "items": { "type": "string", "format": "uuid" } },
            "share_expiry_hours": { "type": "integer", "default": 72 }
          }
        },
        "data_retention_preference": { "type": "string", "enum": ["indefinite", "1_year", "3_years", "5_years"] },
        "export_requested": { "type": "boolean" },
        "deletion_requested": { "type": "boolean" }
      }
    }
  },
  "$defs": {
    "medication": {
      "type": "object",
      "properties": {
        "medication_id": { "type": "string", "format": "uuid" },
        "drug_name_vi": { "type": "string" },
        "drug_name_generic": { "type": "string" },
        "rxnorm_cui": { "type": "string" },
        "brand_name": { "type": "string" },
        "dosage": {
          "type": "object",
          "properties": {
            "amount": { "type": "number" },
            "unit": { "type": "string" }
          }
        },
        "schedule": {
          "type": "object",
          "properties": {
            "frequency": { "type": "string", "enum": ["once_daily", "twice_daily", "three_daily", "as_needed", "weekly"] },
            "times": { "type": "array", "items": { "type": "string", "format": "time" } },
            "relation_to_meal": { "type": "string", "enum": ["before_meal", "after_meal", "with_meal", "any"] }
          }
        },
        "is_active": { "type": "boolean" },
        "start_date": { "type": "string", "format": "date" },
        "end_date": { "type": ["string", "null"], "format": "date" },
        "source": { "type": "string", "enum": ["manual_entry", "ocr_scan", "chat_extracted", "doctor_prescribed"] },
        "adherence_rate": { "type": "number", "minimum": 0, "maximum": 1 }
      },
      "required": ["drug_name_vi", "is_active", "source"]
    }
  },
  "required": ["profile_id", "user_id", "demographics"]
}
```

### 4.2 Neo4j Graph Schema

The health profile is also represented as a graph in Neo4j for relationship-based queries (e.g., "which of this patient's medications might interact with their conditions?").

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEO4J HEALTH PROFILE GRAPH                     │
│                                                                   │
│  Node Types:                                                      │
│  ┌──────────┐  ┌─────────────┐  ┌───────────┐  ┌────────────┐  │
│  │ :Patient │  │ :Condition  │  │ :Drug     │  │ :Allergen  │  │
│  │          │  │             │  │           │  │            │  │
│  │ user_id  │  │ name_vi     │  │ name_vi   │  │ name       │  │
│  │ name     │  │ icd11_code  │  │ rxnorm_cui│  │ type       │  │
│  │ dob      │  │ status      │  │ dosage    │  │ severity   │  │
│  └──────────┘  └─────────────┘  └───────────┘  └────────────┘  │
│                                                                   │
│  ┌──────────┐  ┌─────────────┐  ┌───────────┐                   │
│  │ :LabTest │  │ :FamilyHx   │  │ :Doctor   │                   │
│  │          │  │             │  │           │                   │
│  │ test_name│  │ condition   │  │ name      │                   │
│  │ value    │  │ relation    │  │ specialty │                   │
│  │ date     │  │ age_onset   │  │ rating    │                   │
│  └──────────┘  └─────────────┘  └───────────┘                   │
│                                                                   │
│  Relationships:                                                   │
│  (Patient)-[:HAS_CONDITION {since, status}]->(Condition)         │
│  (Patient)-[:TAKES {schedule, adherence}]->(Drug)                │
│  (Patient)-[:ALLERGIC_TO {reaction, severity}]->(Allergen)       │
│  (Patient)-[:HAS_LAB {date, status}]->(LabTest)                  │
│  (Patient)-[:FAMILY_HX]->(FamilyHx)                              │
│  (Patient)-[:CONSULTED {date, type}]->(Doctor)                   │
│  (Drug)-[:INTERACTS_WITH {severity, description}]->(Drug)        │
│  (Drug)-[:CONTRAINDICATED {reason}]->(Condition)                 │
│  (Condition)-[:TREATED_BY]->(Drug)                                │
│                                                                   │
│  Example Cypher Query:                                            │
│  MATCH (p:Patient {user_id: $uid})-[:TAKES]->(d:Drug)            │
│  MATCH (d)-[i:INTERACTS_WITH]->(d2:Drug)<-[:TAKES]-(p)          │
│  WHERE i.severity IN ['critical', 'major']                       │
│  RETURN d.name_vi, d2.name_vi, i.severity, i.description        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. AI Features Detail

### 5.1 How Chat History Builds Health Profile

Every chatbot interaction is a data source. The NLP Extraction Engine runs in the background after each conversation turn, mining health-relevant entities.

```
┌─────────────────────────────────────────────────────────────────┐
│            CHAT → PROFILE UPDATE PIPELINE                         │
│                                                                   │
│  User says: "Dạo này tôi hay bị chóng mặt khi đứng dậy,        │
│              nhất là buổi sáng. Có khi nào do thuốc huyết áp?"  │
│                                                                   │
│  Step 1: NER + Entity Extraction                                 │
│  ┌───────────────────────────────────────────────────┐           │
│  │ Entities found:                                    │           │
│  │ • Symptom: "chóng mặt" (dizziness)               │           │
│  │ • Trigger: "khi đứng dậy" (orthostatic)           │           │
│  │ • Timing: "buổi sáng" (morning)                   │           │
│  │ • Drug reference: "thuốc huyết áp" (BP medicine)  │           │
│  │ • Concern: possible side effect                    │           │
│  └───────────────────────────┬───────────────────────┘           │
│                               ▼                                   │
│  Step 2: Profile Matching                                        │
│  ┌───────────────────────────────────────────────────┐           │
│  │ Cross-reference with profile:                      │           │
│  │ • User takes Lisinopril (ACE inhibitor)           │           │
│  │ • Known side effect: orthostatic hypotension ✓    │           │
│  │ • Existing condition: Hypertension ✓              │           │
│  └───────────────────────────┬───────────────────────┘           │
│                               ▼                                   │
│  Step 3: Suggest Profile Update (WITH USER CONSENT)              │
│  ┌───────────────────────────────────────────────────┐           │
│  │ 💡 "CLARA muốn cập nhật hồ sơ sức khỏe:"         │           │
│  │                                                    │           │
│  │ ✚ Thêm triệu chứng: Chóng mặt tư thế đứng      │           │
│  │   Liên quan: Lisinopril (tác dụng phụ có thể)    │           │
│  │                                                    │           │
│  │ [✅ Đồng ý cập nhật]  [❌ Bỏ qua]  [✏️ Chỉnh sửa] │           │
│  └───────────────────────────────────────────────────┘           │
│                                                                   │
│  Step 4: Neo4j Graph Update (if consented)                       │
│  CREATE (p)-[:HAS_SYMPTOM {                                      │
│    name: "orthostatic_dizziness",                                 │
│    source: "chat_extracted",                                      │
│    session_id: "sess_xxx",                                        │
│    confidence: 0.87,                                              │
│    related_drug: "Lisinopril",                                    │
│    reported_at: datetime()                                        │
│  }]->(s:Symptom)                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.1.1 Entity Types Extracted from Chat

| Entity Type | Vietnamese Examples | Profile Field Updated |
|-------------|--------------------|-----------------------|
| **Symptoms** | đau đầu, buồn nôn, mệt mỏi | `chat_history_insights` + potential `conditions` |
| **Medications mentioned** | "bác sĩ cho uống thêm Amlodipin" | `medications` (pending confirmation) |
| **Side effects** | "uống Metformin bị đau bụng" | `medications[].side_effects` |
| **Lifestyle factors** | "tôi không tập thể dục", "hút thuốc" | `chat_history_insights` |
| **Lab values** | "HbA1c vừa xét nghiệm là 7.5" | `lab_results` (pending confirmation) |
| **Concerns/Questions** | "có cần mổ không?", "thuốc có an toàn?" | `chat_history_insights` |

### 5.2 Summary Generation Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│              HEALTH SUMMARY GENERATION PIPELINE                   │
│                                                                   │
│  TRIGGERS:                                                        │
│  • New medication added/changed                                  │
│  • Lab results uploaded                                          │
│  • After 5+ chatbot messages in a session                       │
│  • Doctor consultation completed                                 │
│  • Weekly scheduled regeneration (Sunday night)                  │
│  • Manual: user taps "Cập nhật tóm tắt"                        │
│                                                                   │
│  GENERATION STEPS:                                                │
│                                                                   │
│  1. DATA AGGREGATION                                              │
│     ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│     │ PostgreSQL  │  │ Neo4j    │  │ Redis    │  │ S3        │ │
│     │ (core data) │  │ (graph)  │  │ (cache)  │  │ (records) │ │
│     └──────┬──────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘ │
│            └──────────┬───┴────────┬────┘               │       │
│                       ▼            ▼                     │       │
│  2. CONTEXT ASSEMBLY                                     │       │
│     • Demographics + BMI calculation                     │       │
│     • Active conditions (sorted by severity)             │       │
│     • Current medications + adherence rates              │       │
│     • Latest lab results + trends (3-month window)       │       │
│     • Recent chat insights (last 30 days)                │       │
│     • Upcoming actions (refills, appointments, labs)     │       │
│                                                           │       │
│  3. LLM GENERATION                                       │       │
│     • Template-guided generation (not free-form)         │       │
│     • Section-by-section: demographics → conditions →   │       │
│       medications → labs → trends → insights → actions   │       │
│     • Bilingual: Vietnamese primary, English secondary   │       │
│     • Confidence scoring per section                     │       │
│                                                           │       │
│  4. VALIDATION                                            │       │
│     • Medical consistency check                          │       │
│     • Drug-condition alignment verification              │       │
│     • No diagnostic claims in summary                    │       │
│     • Disclaimer auto-appended                           │       │
│                                                           │       │
│  5. OUTPUT                                                │       │
│     • JSON structured summary → Profile                  │       │
│     • Rendered HTML/PDF for sharing                      │       │
│     • Push notification: "Tóm tắt sức khỏe đã cập nhật"│       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Personalized Health Recommendations

Recommendations are generated based on the complete health profile context:

| Recommendation Type | Data Sources | Example |
|--------------------|-------------|---------|
| **Medication adherence** | `medications[].adherence_rate` | "Bạn bỏ lỡ 3 liều Metformin tuần này. Uống đều giúp kiểm soát đường huyết tốt hơn." |
| **Lab follow-up** | `lab_results[].date` + condition guidelines | "HbA1c cuối cùng đã 4 tháng trước. Nên xét nghiệm lại." |
| **Lifestyle** | `chat_history_insights` + conditions | "Với tiểu đường type 2, đi bộ 30 phút/ngày giúp giảm đường huyết hiệu quả." |
| **Drug optimization** | DDI results + adherence data | "Bạn đang dùng 2 thuốc huyết áp. Nên hỏi bác sĩ về việc đơn giản hóa đơn thuốc." |
| **Preventive care** | Age + gender + conditions + family history | "Nam, 52 tuổi, tiền sử gia đình ung thư đại tràng → Nên tầm soát nội soi." |
| **Doctor visit** | Trends + severity changes | "Huyết áp tăng 3 lần đo gần nhất. Nên tái khám sớm." |

#### 5.3.1 Recommendation Priority Algorithm

```python
def calculate_recommendation_priority(rec_type, user_profile):
    """
    Priority Score: 0-100 (higher = more urgent)

    Factors:
    - Medical urgency (lab values out of range, worsening trends)
    - Time since last action (overdue labs, missed appointments)
    - Adherence patterns (declining adherence rate)
    - User engagement (recommendations they've acted on before)
    """
    base_score = URGENCY_WEIGHTS[rec_type]  # 0-40

    # Time factor: longer overdue = higher priority
    time_score = min(30, days_overdue * 0.5)

    # Trend factor: worsening metrics boost priority
    trend_score = 0
    if trend == "worsening":
        trend_score = 20
    elif trend == "stable":
        trend_score = 5

    # Engagement factor: show recs user is likely to act on
    engagement_score = user_action_rate * 10  # 0-10

    return min(100, base_score + time_score + trend_score + engagement_score)
```

---

## 6. UI/UX Wireframe Descriptions

### 6.1 Screen Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    APP NAVIGATION STRUCTURE                       │
│                                                                   │
│  Bottom Tab Navigation:                                          │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │  🏠 Home │ 💊 Thuốc │  💬 Chat │ 📋 Hồ sơ │ 👤 Tôi  │       │
│  │  (Home)  │ (Meds)   │ (Chat)  │ (Records)│(Profile) │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
│                                                                   │
│  Modal/Stack Screens:                                            │
│  ├── OnboardingScreen (first-time only)                         │
│  ├── DDICheckScreen (from Medications tab)                      │
│  ├── MarketplaceScreen (from Chat escalation or Home)           │
│  ├── DoctorProfileScreen (from Marketplace)                     │
│  ├── ConsultationScreen (video/chat with doctor)                │
│  ├── AddMedicationScreen (from Medications tab)                 │
│  ├── ScanPrescriptionScreen (camera OCR)                        │
│  ├── UploadRecordScreen (from Records tab)                      │
│  └── SettingsScreen (from Profile tab)                          │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Home Dashboard (HomeScreen.tsx)

```
┌─────────────────────────────────────────┐
│ ☀️ Chào buổi sáng, Anh B!               │
│ Hôm nay: Thứ 3, 15/03/2025             │
├─────────────────────────────────────────┤
│                                          │
│ 📊 TÓM TẮT HÔM NAY                     │
│ ┌────────────┐ ┌────────────┐           │
│ │ 💊 3 thuốc  │ │ ✅ 2/3 đã   │           │
│ │ cần uống   │ │ uống       │           │
│ └────────────┘ └────────────┘           │
│ ┌────────────┐ ┌────────────┐           │
│ │ 📈 HbA1c   │ │ 💉 Huyết áp │           │
│ │ 7.2% ↓     │ │ 135/85     │           │
│ └────────────┘ └────────────┘           │
│                                          │
│ ⏰ SẮP TỚI                              │
│ ┌───────────────────────────────────┐   │
│ │ 19:00 — Metformin 500mg           │   │
│ │        [✅ Đã uống] [⏰ Nhắc sau]  │   │
│ ├───────────────────────────────────┤   │
│ │ 📅 20/03 — Tái khám nội tiết     │   │
│ │        BS. Nguyễn Văn A           │   │
│ └───────────────────────────────────┘   │
│                                          │
│ 💡 GỢI Ý CỦA CLARA                     │
│ ┌───────────────────────────────────┐   │
│ │ "HbA1c đã 3 tháng chưa xét       │   │
│ │  nghiệm. Nên kiểm tra lại."     │   │
│ │  [📋 Đặt lịch xét nghiệm →]     │   │
│ └───────────────────────────────────┘   │
│                                          │
├─────────────────────────────────────────┤
│  🏠 Home │ 💊 Thuốc │ 💬 Chat │ 📋│ 👤 │
└─────────────────────────────────────────┘
```

### 6.3 Medications List (MedicationsScreen.tsx)

```
┌─────────────────────────────────────────┐
│ 💊 Thuốc của tôi              [+ Thêm] │
├─────────────────────────────────────────┤
│                                          │
│ ĐANG DÙNG (3)                           │
│ ┌───────────────────────────────────┐   │
│ │ 💊 Metformin 500mg                │   │
│ │ 2 lần/ngày • Sáng, Tối           │   │
│ │ Sau ăn • BS. Nguyễn Văn A        │   │
│ │ ████████████░░ 93.7% tuân thủ    │   │
│ │ Tiếp theo: 19:00 hôm nay        │   │
│ ├───────────────────────────────────┤   │
│ │ 💊 Lisinopril 10mg               │   │
│ │ 1 lần/ngày • Sáng                │   │
│ │ ████████████████ 100% tuân thủ   │   │
│ │ ✅ Đã uống hôm nay               │   │
│ ├───────────────────────────────────┤   │
│ │ 💊 Aspirin 81mg                   │   │
│ │ 1 lần/ngày • Sáng                │   │
│ │ ████████████████ 98% tuân thủ    │   │
│ │ ✅ Đã uống hôm nay               │   │
│ └───────────────────────────────────┘   │
│                                          │
│ [🔍 Kiểm tra tương tác thuốc]          │
│                                          │
│ ⚠️ TƯƠNG TÁC ĐÃ BIẾT                   │
│ ┌───────────────────────────────────┐   │
│ │ 🟢 Aspirin + Lisinopril: Nhẹ     │   │
│ │    Theo dõi huyết áp             │   │
│ └───────────────────────────────────┘   │
│                                          │
├─────────────────────────────────────────┤
│  🏠 Home │ 💊 Thuốc │ 💬 Chat │ 📋│ 👤 │
└─────────────────────────────────────────┘
```

### 6.4 AI Chat Interface (ChatScreen.tsx)

```
┌─────────────────────────────────────────┐
│ 💬 CLARA Health Chat        [📋 Lịch sử]│
├─────────────────────────────────────────┤
│                                          │
│         🤖 CLARA                         │
│         ┌──────────────────────────┐    │
│         │ Xin chào Anh B! 👋       │    │
│         │ Tôi có thể giúp gì cho  │    │
│         │ anh hôm nay?            │    │
│         └──────────────────────────┘    │
│                                          │
│  ┌──────────────────────────┐           │
│  │ Dạo này tôi hay bị chóng │           │
│  │ mặt khi đứng dậy, nhất   │    👤    │
│  │ là buổi sáng.            │           │
│  └──────────────────────────┘           │
│                                          │
│         🤖 CLARA                         │
│         ┌──────────────────────────┐    │
│         │ Triệu chứng chóng mặt   │    │
│         │ khi đứng dậy (chóng mặt │    │
│         │ tư thế) có thể liên     │    │
│         │ quan đến thuốc Lisinopril│    │
│         │ 10mg mà anh đang dùng.  │    │
│         │                          │    │
│         │ Đây là tác dụng phụ      │    │
│         │ thường gặp của thuốc     │    │
│         │ ức chế ACE.              │    │
│         │                          │    │
│         │ 💡 Gợi ý:                │    │
│         │ • Đứng dậy từ từ         │    │
│         │ • Uống đủ nước           │    │
│         │ • Nên hỏi BS nếu kéo dài│    │
│         │                          │    │
│         │ ⚠️ Đây là tham khảo,     │    │
│         │ không thay thế tư vấn BS.│    │
│         │                          │    │
│         │ 📎 BYT Guidelines 2023   │    │
│         │ [📞 Hỏi bác sĩ →]       │    │
│         └──────────────────────────┘    │
│                                          │
│         💡 Profile Update Suggestion     │
│         ┌──────────────────────────┐    │
│         │ ✚ Thêm: Chóng mặt tư thế│    │
│         │ [✅ Đồng ý] [❌ Bỏ qua]  │    │
│         └──────────────────────────┘    │
│                                          │
│ ┌───────────────────────────────┐ [📎] │
│ │ Nhập câu hỏi sức khỏe...     │ [🎤] │
│ └───────────────────────────────┘ [📤] │
├─────────────────────────────────────────┤
│  🏠 Home │ 💊 Thuốc │ 💬 Chat │ 📋│ 👤 │
└─────────────────────────────────────────┘
```

### 6.5 Medical Records Vault (RecordsScreen.tsx)

```
┌─────────────────────────────────────────┐
│ 📋 Hồ sơ y tế               [+ Tải lên]│
├─────────────────────────────────────────┤
│                                          │
│ 📅 DÒNG THỜI GIAN                       │
│                                          │
│ 2025-03 ────────────────────────        │
│ ┌───────────────────────────────────┐   │
│ │ 📊 Xét nghiệm máu — 01/03/2025   │   │
│ │ HbA1c: 7.2% • Cholesterol: 220   │   │
│ │ [Xem chi tiết →]                  │   │
│ └───────────────────────────────────┘   │
│                                          │
│ 2025-02 ────────────────────────        │
│ ┌───────────────────────────────────┐   │
│ │ 💊 Đơn thuốc — BS. Nguyễn Văn A   │   │
│ │ Metformin ↑ 500mg → 1000mg        │   │
│ │ [Xem chi tiết →]                  │   │
│ ├───────────────────────────────────┤   │
│ │ 🏥 Khám nội tiết — 15/02/2025     │   │
│ │ Đái tháo đường type 2 — theo dõi │   │
│ │ [Xem chi tiết →]                  │   │
│ └───────────────────────────────────┘   │
│                                          │
│ 2025-01 ────────────────────────        │
│ ┌───────────────────────────────────┐   │
│ │ 📊 Xét nghiệm máu — 05/01/2025   │   │
│ │ HbA1c: 7.8% ↑ • Creatinine: 1.0  │   │
│ │ [Xem chi tiết →]                  │   │
│ └───────────────────────────────────┘   │
│                                          │
│ Lọc: [Tất cả ▼] [Xét nghiệm] [Đơn]   │
│                                          │
├─────────────────────────────────────────┤
│  🏠 Home │ 💊 Thuốc │ 💬 Chat │ 📋│ 👤 │
└─────────────────────────────────────────┘
```

### 6.6 Health Profile (ProfileScreen.tsx)

```
┌─────────────────────────────────────────┐
│ 👤 Hồ sơ sức khỏe            [✏️ Sửa] │
├─────────────────────────────────────────┤
│                                          │
│  ┌─────┐  Nguyễn Văn B                  │
│  │ 📷  │  Nam, 52 tuổi                   │
│  │     │  168cm / 72kg (BMI: 25.5)       │
│  └─────┘  Nhóm máu: A+                  │
│                                          │
│ ─────────────────────────────────────── │
│                                          │
│ 🏥 BỆNH NỀN                             │
│ • Đái tháo đường type 2 (2020)          │
│ • Tăng huyết áp (2019)                  │
│                                          │
│ 💊 THUỐC (3 loại đang dùng)             │
│ Tuân thủ trung bình: 96.2%              │
│ [Xem danh sách thuốc →]                │
│                                          │
│ 🚫 DỊ ỨNG                               │
│ • Penicillin (nổi mẩn, mức trung bình) │
│                                          │
│ 👨‍👩‍👧 TIỀN SỬ GIA ĐÌNH                      │
│ • Bố: Đái tháo đường type 2            │
│ • Mẹ: Tăng huyết áp                    │
│                                          │
│ 📊 TÓM TẮT AI                           │
│ Cập nhật: 15/03/2025                    │
│ [📤 Chia sẻ với bác sĩ]                │
│ [📄 Xuất PDF]                           │
│                                          │
│ ⚙️ CÀI ĐẶT                             │
│ [🔒 Quyền riêng tư & Bảo mật]         │
│ [🔔 Thông báo]                          │
│ [🌐 Ngôn ngữ: Tiếng Việt]              │
│ [❓ Trợ giúp & Phản hồi]               │
│                                          │
├─────────────────────────────────────────┤
│  🏠 Home │ 💊 Thuốc │ 💬 Chat │ 📋│ 👤 │
└─────────────────────────────────────────┘
```

---

## 7. Privacy & Security

### 7.1 Data Protection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLARA SECURITY LAYERS                          │
│                                                                   │
│  Layer 1: DATA IN TRANSIT                                        │
│  ├── TLS 1.3 for all API communications                         │
│  ├── Certificate pinning in mobile apps                         │
│  ├── WebSocket encryption for real-time chat                    │
│  └── End-to-end encryption for doctor consultations             │
│                                                                   │
│  Layer 2: DATA AT REST                                           │
│  ├── AES-256 encryption for all stored data                     │
│  ├── Encrypted S3 buckets for medical records/images            │
│  ├── Database-level encryption (PostgreSQL TDE)                 │
│  ├── Redis encryption for cached session data                   │
│  └── Hardware Security Modules (HSM) for key management         │
│                                                                   │
│  Layer 3: ACCESS CONTROL                                         │
│  ├── JWT + OAuth2 authentication (Keycloak)                     │
│  ├── Role-based access control (RBAC)                           │
│  ├── Multi-factor authentication (OTP via SMS)                  │
│  ├── Session timeout: 30 min inactive                           │
│  ├── Biometric authentication (Face ID / Fingerprint)           │
│  └── IP-based suspicious login detection                        │
│                                                                   │
│  Layer 4: INPUT SECURITY                                         │
│  ├── Vietnamese diacritics normalization                         │
│  ├── Prompt injection detection (regex + ML classifier)         │
│  ├── Rate limiting (per user, per endpoint)                     │
│  ├── Input sanitization and validation                          │
│  └── Unicode homoglyph detection                                │
│                                                                   │
│  Layer 5: AUDIT & COMPLIANCE                                     │
│  ├── Hyperledger Fabric audit trail (immutable)                 │
│  ├── All data access logged with timestamps                     │
│  ├── Consent management with version tracking                   │
│  ├── Data export capability (GDPR Article 20 equivalent)        │
│  └── Right to deletion with cryptographic erasure               │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Vietnamese Regulatory Compliance

| Regulation | Requirement | CLARA Implementation |
|-----------|------------|---------------------|
| **Nghị định 13/2023/NĐ-CP** (Personal Data Protection) | Explicit consent for health data processing | Granular consent checkboxes at onboarding; consent version tracking; withdrawal mechanism |
| **Luật An toàn thông tin mạng (2015)** (Cybersecurity Law) | Data localization for Vietnamese citizen data | All health data stored on Vietnam-region servers (AWS ap-southeast-1 or local DC) |
| **Thông tư 46/2018/TT-BYT** (EHR Standards) | Compliance with electronic health record standards | Standardized health profile schema; ICD-11 coding; HL7 FHIR export capability |
| **Nghị định 52/2013/NĐ-CP** (E-Commerce) | Secure online transactions for doctor marketplace | PCI-DSS compliant payment via VNPay/MoMo; transaction logging |
| **HIPAA Equivalence** (for international partners) | Protected Health Information (PHI) safeguards | Encryption, access controls, audit logs, BAA-equivalent agreements |

### 7.3 Consent Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSENT MANAGEMENT SYSTEM                      │
│                                                                   │
│  Consent Types:                                                   │
│  ┌────────────────────────────────────────────────────┐          │
│  │ ✅ REQUIRED (must accept to use app):               │          │
│  │    • CLARA data processing for health services     │          │
│  │    • Terms of service agreement                    │          │
│  │    • Privacy policy acknowledgment                 │          │
│  ├────────────────────────────────────────────────────┤          │
│  │ ☐ OPTIONAL (user can toggle):                       │          │
│  │    • AI learning from interactions                 │          │
│  │    • Anonymous analytics contribution              │          │
│  │    • Health tips notifications                     │          │
│  │    • Research participation                        │          │
│  ├────────────────────────────────────────────────────┤          │
│  │ 🔄 PER-ACTION (asked each time):                    │          │
│  │    • Share profile with specific doctor            │          │
│  │    • Export health data                            │          │
│  │    • Profile update from chat extraction           │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                   │
│  On-Chain Consent Record (Hyperledger):                          │
│  {                                                                │
│    "consent_id": "consent_uuid",                                 │
│    "user_id": "user_uuid",                                       │
│    "consent_type": "ai_learning",                                │
│    "granted": true,                                               │
│    "version": "v2.1",                                            │
│    "timestamp": "2025-01-15T10:00:00+07:00",                    │
│    "ip_address_hash": "sha256_hash",                             │
│    "device_fingerprint": "device_hash",                          │
│    "revocable": true                                              │
│  }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Data Retention & Deletion

| Data Category | Retention Period | Deletion Method |
|--------------|-----------------|-----------------|
| **Health Profile** | User-controlled (indefinite / 1-5 years) | Cryptographic erasure + backup purge |
| **Chat History** | 2 years (auto-archive) | Soft delete → 30-day hard delete |
| **Medical Records** | User-controlled | Encrypted S3 object deletion + CDN purge |
| **Medication Data** | While active + 1 year after deactivation | Database purge + audit log retention |
| **Audit Logs** | 7 years (regulatory requirement) | Immutable on Hyperledger |
| **Analytics Data** | Anonymized, indefinite | N/A (no PII) |

---

## 8. Business Model

### 8.1 Freemium Tier Structure

| Feature | 🆓 Free | ⭐ Premium ($2-5/mo) |
|---------|---------|---------------------|
| **Health Profile** | ✅ Full profile | ✅ Full profile + AI deepening |
| **Medication Manager** | ✅ Up to 5 medications | ✅ Unlimited medications |
| **Medication Reminders** | ✅ Basic reminders | ✅ Smart reminders + refill alerts |
| **DDI Check** | ✅ 5 checks/month | ✅ Unlimited checks |
| **AI Health Chatbot** | ✅ 10 queries/day | ✅ Unlimited + advanced queries |
| **Health Summary** | ✅ Basic summary | ✅ Detailed summary + PDF export |
| **Medical Records** | ✅ 10 records/month | ✅ Unlimited + OCR auto-extraction |
| **Doctor Sharing** | ❌ Not available | ✅ One-tap profile sharing |
| **Health Trends** | ❌ Not available | ✅ Trend visualization + alerts |
| **Family Profiles** | ❌ Not available | ✅ Up to 5 family members |
| **Priority Support** | ❌ Community only | ✅ In-app chat support |
| **Ad-free Experience** | ❌ Subtle health ads | ✅ No ads |

### 8.2 Revenue Streams

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVENUE MODEL                                  │
│                                                                   │
│  1. FREEMIUM APP SUBSCRIPTIONS                                   │
│     ├── Free tier: User acquisition funnel                      │
│     ├── Premium: 50,000 - 125,000 VND/month ($2-5)             │
│     ├── Target conversion: 5-10% of active users               │
│     └── Est. Year 1 Revenue: $40,000/month at Month 12         │
│                                                                   │
│  2. DOCTOR MARKETPLACE COMMISSION                                │
│     ├── 15-20% commission per consultation                      │
│     ├── Average consultation: $10-30                            │
│     ├── Commission per consult: $1.50 - $6.00                  │
│     └── Est. Year 1 Revenue: $20,000/month at Month 12         │
│                                                                   │
│  3. PREMIUM AI FEATURES (Add-ons)                                │
│     ├── Advanced health analytics: $1/month                     │
│     ├── Family health dashboard: $2/month                       │
│     ├── Personalized health education: $1/month                 │
│     └── Est. Year 1 Revenue: $5,000/month at Month 12          │
│                                                                   │
│  4. DATA INSIGHTS (Future — Year 2+)                             │
│     ├── Anonymized health trend reports                         │
│     ├── Pharma market intelligence                              │
│     ├── Clinical trial recruitment fees                         │
│     └── Est. Revenue: TBD (requires significant user base)     │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Revenue Projection (Personal Health App Only)

| Revenue Stream | Month 3 | Month 6 | Month 9 | Month 12 |
|---------------|---------|---------|---------|----------|
| **App Premium Subscriptions** | $500 | $5,000 | $15,000 | $40,000 |
| **Doctor Marketplace Commission** | $0 | $3,000 | $8,000 | $20,000 |
| **Premium AI Add-ons** | $0 | $500 | $2,000 | $5,000 |
| **TOTAL App MRR** | **$500** | **$8,500** | **$25,000** | **$65,000** |
| **Active Users (est.)** | 1,000 | 10,000 | 30,000 | 75,000 |
| **Premium Conversion Rate** | 5% | 6% | 7% | 8% |

### 8.4 User Acquisition Strategy

| Channel | Cost | Target |
|---------|------|--------|
| **Organic / SEO** | Low | Vietnamese health queries → Blog → App download |
| **Pharmacy Partnerships** | Medium | QR codes on prescription bags → onboard with medication scan |
| **Doctor Referrals** | Low | Doctors recommend to patients for medication tracking |
| **Social Media** | Medium | Health tips content on Zalo, Facebook, TikTok (Vietnamese platforms) |
| **Clinic Partnerships** | Medium | Post-visit follow-up app recommendation |
| **Word of Mouth** | Free | Medication reminder value → users tell family members |

---

## 9. Tech Stack

### 9.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PERSONAL HEALTH APP — TECH STACK                   │
│                                                                       │
│  CLIENTS                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │ 📱 Mobile App    │  │ 💻 Web App       │  │ ⌚ Wearables     │    │
│  │ React Native     │  │ Next.js 14       │  │ (Future)        │    │
│  │ (Expo managed)   │  │ TypeScript       │  │ BLE/Health SDK  │    │
│  │ iOS + Android    │  │ Tailwind CSS     │  │                 │    │
│  │                  │  │ Shadcn/UI        │  │                 │    │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬──────────┘    │
│           │                     │                     │              │
│           └─────────────────────┼─────────────────────┘              │
│                                 │                                     │
│                                 ▼                                     │
│  API GATEWAY                                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Kong / AWS API Gateway                                       │    │
│  │ • Rate limiting  • JWT validation  • Request routing         │    │
│  │ • WebSocket upgrade  • CORS  • SSL termination               │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  BACKEND SERVICES                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Auth Service │  │ Health API   │  │ AI Service   │              │
│  │ (Keycloak)   │  │ (FastAPI)    │  │ (FastAPI)    │              │
│  │              │  │              │  │              │              │
│  │ • OAuth2/JWT │  │ • Profile    │  │ • Chatbot    │              │
│  │ • OTP/SMS    │  │ • Meds CRUD  │  │ • Summary    │              │
│  │ • Biometric  │  │ • Records    │  │ • NER/NLP    │              │
│  │ • Sessions   │  │ • DDI Check  │  │ • RAG        │              │
│  └──────────────┘  │ • Reminders  │  │ • OCR        │              │
│                    └──────────────┘  └──────────────┘              │
│                              │              │                       │
│  TASK PROCESSING                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Celery Workers + Redis Queue                                  │   │
│  │ • Medication reminder scheduling                             │   │
│  │ • OCR processing pipeline                                    │   │
│  │ • Health summary regeneration                                │   │
│  │ • Push notification dispatch (FCM/APNs)                      │   │
│  │ • Profile update extraction (background NER)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  DATA LAYER                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │PostgreSQL│ │ Redis    │ │ Neo4j    │ │ Milvus   │ │ S3/MinIO ││
│  │          │ │          │ │          │ │          │ │          ││
│  │Users     │ │Sessions  │ │Health    │ │Medical   │ │Medical   ││
│  │Meds      │ │Cache     │ │Profile   │ │Embeddings│ │Records   ││
│  │Records   │ │Queues    │ │Graph     │ │(for RAG) │ │Images    ││
│  │Consults  │ │Rate Limit│ │Relations │ │          │ │PDFs      ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                                       │
│  AI / ML ENGINE                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ LangGraph Orchestration                                       │    │
│  │ ├── vLLM: Qwen2.5-72B (self-hosted primary LLM)             │    │
│  │ ├── BGE-M3: Multilingual embeddings (Vietnamese)             │    │
│  │ ├── PhoBERT: Vietnamese Medical NER (fine-tuned)             │    │
│  │ ├── PaddleOCR: Prescription/lab result scanning              │    │
│  │ └── API Fallback: OpenAI GPT-4 / Claude (for peak loads)    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  INFRASTRUCTURE                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Docker + Kubernetes (EKS) │ GitHub Actions + ArgoCD          │    │
│  │ Prometheus + Grafana       │ ELK Stack (logging)              │    │
│  │ Sentry (error tracking)    │ AWS ap-southeast-1 (Vietnam)    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  EXTERNAL APIs                                                        │
│  ├── RxNorm API (drug normalization + DDI)                           │
│  ├── VNPay / MoMo (payments)                                         │
│  ├── FCM + APNs (push notifications)                                 │
│  ├── Twilio / Vietnam SMS Gateway (OTP)                              │
│  └── Hyperledger Fabric (audit trail + consent)                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Key Technology Decisions (Personal Health App)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Mobile Framework** | React Native (Expo) | Code sharing with Next.js web; large ecosystem; sufficient performance for health app; Expo simplifies deployment |
| **Web Framework** | Next.js 14 | App Router for SSR; React ecosystem; shared components with mobile |
| **API Framework** | FastAPI (Python 3.11+) | Async support; auto-generated OpenAPI docs; Python ecosystem for AI/ML integration |
| **Primary Database** | PostgreSQL 16 | JSONB for flexible health data; proven reliability; encrypted at rest |
| **Graph Database** | Neo4j | Natural fit for health profile relationships (patient→conditions→medications); Cypher queries for DDI |
| **Cache Layer** | Redis | Session management; medication reminder queues; rate limiting; hot query cache |
| **Vector Database** | Milvus | Medical knowledge embeddings for RAG; scalable; supports hybrid search |
| **Object Storage** | S3 / MinIO | AES-256 encrypted storage for medical records, images, PDFs |
| **Push Notifications** | FCM + APNs | Native push for medication reminders; reliable delivery; actionable notifications |
| **Payment** | VNPay + MoMo | Vietnamese payment ecosystem; widespread adoption; regulatory compliance |
| **AI Orchestration** | LangGraph | State machine-based agent orchestration; better for health chatbot conversation flow |
| **OCR** | PaddleOCR | Best accuracy for Vietnamese text; open source; handles prescription handwriting |

---

## 10. MVP Feature Set vs Full Feature Set

### 10.1 Phased Rollout Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE ROLLOUT PHASES                         │
│                                                                   │
│  PHASE 1 — MVP (Month 1-3)                                      │
│  "Core daily value — users open the app every day"               │
│  ┌────────────────────────────────────────────────────┐         │
│  │ APP-001  Onboarding Health Profile          [P0]  │         │
│  │ APP-002  Smart Health Profile (basic)       [P0]  │         │
│  │ APP-003  Medication Manager                 [P0]  │         │
│  │ APP-004  Medication Reminders               [P0]  │         │
│  │ APP-006  AI Health Chatbot (basic)          [P0]  │         │
│  └────────────────────────────────────────────────────┘         │
│                         │                                        │
│                         ▼                                        │
│  PHASE 2 — Growth (Month 4-8)                                   │
│  "Expand value proposition — health ecosystem"                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │ APP-005  Consumer DDI Check                 [P0]  │         │
│  │ APP-007  Health Summary Dashboard           [P1]  │         │
│  │ APP-008  Medical Records Vault              [P1]  │         │
│  │ APP-009  Share with Doctor                  [P1]  │         │
│  │ APP-010  Doctor Marketplace                 [P1]  │         │
│  │ APP-011  Family Health Profiles             [P2]  │         │
│  │ APP-014  Symptom Checker                    [P1]  │         │
│  └────────────────────────────────────────────────────┘         │
│                         │                                        │
│                         ▼                                        │
│  PHASE 3 — Full (Month 9-12+)                                   │
│  "Complete health management platform"                           │
│  ┌────────────────────────────────────────────────────┐         │
│  │ APP-012  Health Metrics Tracking             [P2]  │         │
│  │ APP-013  Appointment Manager                 [P2]  │         │
│  │ APP-015  Health Education Content            [P2]  │         │
│  │ 🔮 Wearable Device Integration              [P3]  │         │
│  │ 🔮 ASEAN Language Expansion                  [P3]  │         │
│  │ 🔮 AI-Powered Insurance Integration          [P3]  │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Feature Comparison Matrix

| Feature | MVP (Phase 1) | Growth (Phase 2) | Full (Phase 3) |
|---------|:-------------:|:-----------------:|:---------------:|
| **Onboarding Q&A** | ✅ 5-step guided | ✅ + progressive deepening | ✅ + smart re-onboarding |
| **Health Profile** | ✅ Basic (demographics + conditions + meds) | ✅ + AI auto-update from chat | ✅ + multi-source aggregation |
| **Medication Manager** | ✅ Manual entry + basic list | ✅ + OCR scan + chat extraction | ✅ + refill prediction + pharmacy integration |
| **Reminders** | ✅ Time-based push notifications | ✅ + smart reminders + adherence tracking | ✅ + adaptive scheduling + wearable alerts |
| **DDI Check** | ❌ Not in MVP | ✅ Automatic + manual + chat-triggered | ✅ + food-drug interactions |
| **AI Chatbot** | ✅ Basic health Q&A (10/day free) | ✅ + profile-aware + source citations | ✅ + multi-turn reasoning + voice input |
| **Health Summary** | ❌ Not in MVP | ✅ Auto-generated + PDF export | ✅ + trend analysis + predictive insights |
| **Records Vault** | ❌ Not in MVP | ✅ Upload + OCR + timeline view | ✅ + auto-categorization + FHIR export |
| **Doctor Sharing** | ❌ Not in MVP | ✅ One-tap share + consent management | ✅ + continuous sharing + access logs |
| **Doctor Marketplace** | ❌ Not in MVP | ✅ Browse + book + video/chat consult | ✅ + ratings + follow-ups + prescriptions |
| **Family Profiles** | ❌ Not in MVP | ✅ Up to 5 family members | ✅ + caregiver mode + family DDI |
| **Symptom Checker** | ❌ Not in MVP | ✅ Guided assessment + triage | ✅ + differential diagnosis + ER routing |
| **Health Metrics** | ❌ Not in MVP | ❌ Not in Phase 2 | ✅ BP, glucose, weight + trends + wearable sync |
| **Appointment Manager** | ❌ Not in MVP | ❌ Not in Phase 2 | ✅ Schedule + reminders + pre-visit prep |
| **Health Education** | ❌ Not in MVP | ❌ Not in Phase 2 | ✅ Personalized content + daily tips |

### 10.3 MVP Success Criteria

| Metric | Target (Month 3) | Measurement |
|--------|-------------------|-------------|
| **App Downloads** | 1,000+ | App Store + Google Play analytics |
| **Daily Active Users (DAU)** | 300+ (30% retention) | Firebase Analytics |
| **Medication Reminders Set** | 2,500+ | Internal DB count |
| **Reminder Response Rate** | >60% (taken/snoozed/skipped) | Notification action tracking |
| **AI Chatbot Queries** | 5,000+ total | API call logs |
| **Chatbot Satisfaction** | >4.0/5.0 | Post-chat rating widget |
| **Onboarding Completion Rate** | >70% | Funnel analytics (step 1 → step 5) |
| **App Crash Rate** | <1% | Sentry error tracking |
| **API Response Time (p95)** | <500ms | Prometheus metrics |

### 10.4 Phase Transition Criteria

| Transition | Criteria | Decision Maker |
|-----------|----------|----------------|
| **MVP → Phase 2** | 1,000+ MAU, >60% Day-7 retention, positive NPS (>30) | Product + Engineering leads |
| **Phase 2 → Phase 3** | 10,000+ MAU, revenue >$5,000/month, doctor marketplace live with 50+ doctors | CEO + Product |
| **Phase 3 → ASEAN** | 50,000+ VN users, localization ready, regulatory mapping for Thailand/Indonesia | Board decision |

---

## Appendix: Document Cross-References

| Section | Related Documents |
|---------|-------------------|
| App Overview | `docs/proposal/product_proposal.md` §5.6 |
| Health Profile Schema | `docs/proposal/product_proposal.md` §5.6.2 |
| DDI Check | `docs/research/data_sources_and_rag_analysis.md` §3.2 (RxNorm API) |
| AI Chatbot | `docs/research/technical_architecture_deep_dive.md` §8 (RAG Pipeline) |
| Security Layers | `docs/research/medical_slms_research.md` §11.7 (CLARA Security Layers) |
| Compliance | `docs/research/market_research_global.md` §8.4 (HIPAA/GDPR/Vietnam comparison) |
| User Stories | `docs/proposal/user_stories.md` §2 (US-N01 to US-N06) |
| Project Structure | `docs/proposal/project_structure_and_sprints.md` §3.2 (Mobile App Structure) |
| Business Model | `docs/proposal/product_proposal.md` §11 (Business Model Canvas) |
| Tech Stack | `docs/proposal/product_proposal.md` §9 (Technology Stack) |

---

*Document generated for CLARA Project — Personal Health Management App/Web*
*Last updated: 2025*
*Status: Proposal — Subject to review and iteration*