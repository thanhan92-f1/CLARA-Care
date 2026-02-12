# ĐỀ XUẤT NGHIÊN CỨU SẢN PHẨM

## Thông tin chung

| Hạng mục | Chi tiết |
|----------|----------|
| **Tên đề tài** | HỆ THỐNG PHẦN MỀM AI HỖ TRỢ NGHIÊN CỨU Y KHOA VÀ CÁC QUYẾT ĐỊNH LÂM SÀNG |
| **Tên sản phẩm** | CLARA (Clinical Agent for Retrieval & Analysis) |
| **Thời gian thực hiện** | 6 tháng |
| **Thành viên** | Nguyễn Ngọc Thiện, Trịnh Minh Quang, Nguyễn Hải Duy, Vũ Văn An |

---

## 1. Tóm tắt dự án (Executive Summary)

Dự án CLARA (Clinical Agent for Retrieval & Analysis) là một sáng kiến phát triển hệ thống Trí tuệ nhân tạo (AI) tiên tiến, được thiết kế chuyên biệt để hỗ trợ giáo dục và nghiên cứu y khoa tại Việt Nam.

CLARA sử dụng kiến trúc **Agentic RAG (Retrieval-Augmented Generation)** kết hợp với **Intent Router 2 lớp** để phục vụ 3 nhóm đối tượng chính:
- **Người dùng thông thường**: Tra cứu thông tin sức khỏe, quản lý thuốc, hồ sơ sức khỏe cá nhân
- **Nhà nghiên cứu**: Tổng quan tài liệu tự động, tra cứu thử nghiệm lâm sàng, trích dẫn học thuật
- **Bác sĩ**: Hỗ trợ quyết định lâm sàng, hội chẩn AI (AI Council), kiểm tra tương tác thuốc

Hệ thống tích hợp các nguồn tri thức y khoa quốc tế (PubMed, ClinicalTrials.gov, WHO ICD-11, RxNorm, openFDA) và trong nước (Bộ Y tế, Dược thư Quốc gia Việt Nam), đảm bảo thông tin chính xác, có trích dẫn, và phù hợp với bối cảnh Việt Nam.

---

## 2. Bối cảnh và Vấn đề

### 2.1 Thị trường AI Y tế Toàn cầu
- Thị trường AI y tế toàn cầu dự kiến đạt **208,2 tỷ USD** vào năm 2030 (CAGR 38-49%)
- Bắc Mỹ chiếm **44%** thị trường, là trung tâm R&D và xuất bản y khoa lớn nhất
- Phân khúc "Trợ lý ảo y tế" (lĩnh vực của CLARA) đang tăng trưởng mạnh mẽ

### 2.2 Vấn đề cấp thiết tại Việt Nam

**Lãng phí thời gian và nguồn lực:**
Sinh viên, bác sĩ và nhà nghiên cứu đang phải tra cứu thủ công trên nhiều hệ thống dữ liệu phân mảnh. CLARA tự động hóa tra cứu với kho dữ liệu liên tục cập nhật.

**Nguy cơ tụt hậu trong nghiên cứu:**
Y học cập nhật liên tục. Việc khó tiếp cận tri thức quốc tế mới nhất tạo nguy cơ nghiên cứu và giảng dạy bị tụt hậu. CLARA là cầu nối tri thức.

**Khoảng cách công nghệ:**
Việt Nam chưa có hệ thống AI y tế bằng tiếng Việt đủ mạnh. Đây là cơ hội "first-mover" cho CLARA.

### 2.3 Phân tích cạnh tranh
- **Quốc tế**: Google Med-Gemini, Microsoft DAX Copilot, OpenEvidence ($3.5B valuation), UpToDate
- **Việt Nam**: Chưa có đối thủ trực tiếp — thị trường mở hoàn toàn
- **Lợi thế CLARA**: Tiếng Việt, nguồn BYT, Dược thư QG, giá thành phù hợp VN

---

## 3. Mục tiêu dự án

### 3.1 Năm mô-đun chính

| Mô-đun | Chức năng | Trạng thái |
|--------|-----------|------------|
| **CLARA Research** | Agentic RAG tra cứu & phân tích y văn | ✅ Đã hoàn thành |
| **CLARA Medical Scribe** | Chuyển audio → bệnh án có cấu trúc | ✅ Đã hoàn thành |
| **CLARA CareGuard** | Hỗ trợ quyết định lâm sàng, DDI check | 📋 Dự kiến |
| **CLARA Trials & Cohort** | Kết nối thử nghiệm lâm sàng | 📋 Dự kiến |
| **CLARA Ops & Education** | Tối ưu vận hành, đào tạo | 📋 Dự kiến |

### 3.2 Ứng dụng Quản lý Sức khỏe Cá nhân (App/Web)
- Quản lý thuốc & nhắc lịch uống thuốc
- Kiểm tra tương tác thuốc (DDI Check)
- AI Chatbot hỏi đáp sức khỏe
- Hồ sơ sức khỏe AI (tự động cập nhật từ lịch sử tương tác)
- Quản lý hồ sơ bệnh án
- Tích hợp liên hệ bác sĩ thật

---

## 4. Giải pháp kỹ thuật

### 4.1 Intent Router 2 lớp
- **Lớp 1**: Phân loại vai trò người dùng (Normal User / Researcher / Doctor) — Qwen2.5-0.5B
- **Lớp 2**: Phân loại ý định theo vai trò (mỗi vai trò có bộ intent riêng)
- **Fast-path**: Bypass cho trường hợp khẩn cấp (cardiac arrest, stroke, anaphylaxis)

### 4.2 Agentic RAG đa nguồn
- **Nguồn quốc tế**: PubMed, ClinicalTrials.gov, WHO ICD-11, RxNorm, openFDA
- **Nguồn Việt Nam**: Dược thư Quốc gia, Bộ Y tế (crawl monthly), phác đồ điều trị
- **Xử lý RAG**: Chunking ngữ nghĩa → BGE-M3 embedding → Milvus vector DB → BM25 + dense hybrid search → Cross-encoder reranking
- **Tổng hợp & Kiểm chứng**: 2 node riêng biệt (Synthesis Node + Verification Node)

### 4.3 Fact Checker (FIDES-inspired)
- Phân tách claim → Truy xuất bằng chứng → Xác minh chéo → Kiểm tra trích dẫn → Phán quyết
- Confidence scoring đa chiều

### 4.4 Ba tầng Workflow
| Tầng | Đối tượng | Thời gian | Đặc điểm |
|------|-----------|-----------|----------|
| Simple | Normal Users | < 2 phút | Single source, quick synthesis |
| Research | Researchers | 5-10-20 phút | Progressive multi-source (Perplexity-style) |
| Specialized | Doctors | 10-20 phút | AI Council / Sub-agents, show logs |

### 4.5 AI Council (Hội chẩn)
- Nhiều agent chuyên khoa hoạt động song song (Tim mạch, Thần kinh, Dược lý, ...)
- Mỗi agent phân tích từ góc độ chuyên khoa + trích dẫn bằng chứng
- Agent điều phối tổng hợp → Đồng thuận / Bất đồng → Khuyến nghị cuối
- Toàn bộ log xử lý hiển thị cho bác sĩ

### 4.6 Cache Strategy
- Lưu trữ: thông tin liên quan đã tổng hợp (KHÔNG phải raw query)
- Chính sách: **UPDATE** thông tin hiện có khi có dữ liệu mới (KHÔNG ADD thêm)
- Kiến trúc: Redis (hot cache) + PostgreSQL JSONB (warm cache)
- Invalidation: Thuốc 24h, y văn 7 ngày, phác đồ 30 ngày

### 4.7 Medical SLMs
- **BioMistral-7B**: Chuyên y khoa, MedQA 50.5%
- **Qwen2.5-72B**: Đa ngôn ngữ, hỗ trợ tiếng Việt
- **Fine-tuning cho TCVN**: QLoRA trên dữ liệu y khoa Việt Nam
- **Bảo mật SLMs**: Phòng chống prompt injection, data leakage, hallucination

### 4.8 Blockchain (Cân nhắc)
- Kiểm chứng tính toàn vẹn dữ liệu
- Audit trail cho quyết định y khoa
- Quản lý đồng ý bệnh nhân
- Hybrid: Hyperledger (private) + Polygon (public anchoring)



---

## 5. Kết quả mong đợi

### 5.1 Chỉ số kỹ thuật

| Mô-đun | Chỉ số | Mục tiêu |
|--------|--------|----------|
| CLARA Research | Faithfulness (trung thực) | > 85% |
| CLARA Research | Precision & nDCG | > 80% |
| CLARA Research | Response Time (Normal User) | < 2 phút |
| CLARA Research | Response Time (Researcher) | 5-20 phút |
| Medical Scribe | Word Error Rate (WER) | < 15% |
| Medical Scribe | NER F1-Score | > 85% |
| CareGuard | DDI Detection Accuracy | > 90% |
| CareGuard | Response Time (Doctor) | < 20 phút |
| Fact Checker | Hallucination Detection Rate | > 90% |

### 5.2 Tác động giáo dục tại ĐH Y Dược Huế
- **Đào tạo kỹ năng lâm sàng**: Môi trường thực hành an toàn pháp lý (dữ liệu tổng hợp)
- **Tăng tốc nghiên cứu**: Giảm thời gian literature review từ hàng tuần → vài phút
- **Nâng cao EBM**: Truy cập tức thời bằng chứng y học mới nhất

### 5.3 Tác động xã hội
- **Chống tin giả y tế**: Kênh thông tin chính thống có trích dẫn
- **An toàn bệnh nhân**: Kiểm tra tương tác thuốc, đối chiếu phác đồ BYT

---

## 6. Kế hoạch triển khai (4 giai đoạn / 6 tháng)

| Giai đoạn | Thời gian | Nội dung chính |
|-----------|-----------|---------------|
| GĐ1: Nền tảng | Tháng 1-2 | Kiến trúc RAG, Intent Router, PubMed/ICD-11, Web UI cơ bản |
| GĐ2: Mở rộng | Tháng 3-4 | Scribe, CareGuard, BYT/Dược thư, FIDES v1, Health App MVP |
| GĐ3: Chuyên sâu | Tháng 5 | AI Council, Blockchain, SLM fine-tuning, Workflow optimization |
| GĐ4: Triển khai | Tháng 6 | Pilot ĐH Y Dược Huế, phản hồi, tài liệu, triển khai chính thức |

---

## 7. Ngân sách dự kiến

| Hạng mục | Chi phí/tháng | 6 tháng |
|----------|--------------|---------|
| Cloud (AWS/GCP) | $2,000-4,000 | $12,000-24,000 |
| GPU (A100 inference) | $1,500-3,000 | $9,000-18,000 |
| API costs (OpenAI) | $500-1,500 | $3,000-9,000 |
| Vector DB + Database | $700-1,500 | $4,200-9,000 |
| Khác (domain, tools) | $250 | $1,500 |
| **Tổng** | **$4,950-10,250** | **$29,700-61,500** |

---

## 8. Tiềm năng phát triển
- **Ngắn hạn**: Hoàn thiện 5 mô-đun, tích hợp FHIR với EMR/HIS
- **Trung hạn**: Thương mại hóa SaaS, IoT y tế (wearables)
- **Dài hạn**: Nền tảng tri thức y khoa quốc gia, Smart Patient Monitoring

## 9. An toàn pháp lý
- Tuân thủ **NĐ 13/2023/NĐ-CP** và Luật BVDLCN (2026)
- Sử dụng **dữ liệu tổng hợp** cho đào tạo
- **Ẩn danh PII/PHI** trước khi xử lý bằng LLM
- CLARA là **công cụ hỗ trợ**, KHÔNG thay thế bác sĩ

## 10. Kết luận
CLARA là dự án tiên phong áp dụng AI Agentic RAG cho y khoa tại Việt Nam, hướng đến trở thành cầu nối tri thức y khoa đáng tin cậy cho sinh viên, nhà nghiên cứu và bác sĩ.

---
*Xem chi tiết tại các tài liệu kỹ thuật đi kèm trong thư mục `docs/`.*