# CLARA Hackathon KPI Snapshot

Generated at (UTC): 2026-04-02T15:51:43.072685+00:00
Round2 run_id: `phase1-day10-live-20260402-225142`

## Core Metrics (Demo-Ready)
- Local DDI rules count: **62** pairs
- Internal DDI test set size: **50** cases
- VN Drug Dictionary alias coverage (static seed file): **217** entries
- VN Drug Dictionary production mappings (DAV full seed, 2026-04-03): **43,150** mappings
- Refusal compliance pre-check: **10/10 (100.0%)** for prescription/diagnosis/dosage trap prompts
- Executable KPI datasets: **4 JSONL files** (DDI / refusal / fallback / latency)

## VN Dictionary Full Seed (DAVIDrug)
- Source: DAVIDrug public paging API (`GetAllPublicServerPaging`)
- Fetch total: **53,814** rows
- Parsed: **53,814**
- Inserted: **43,149**
- Updated: **138**
- Alias conflict skipped: **6**
- Duration: **431.925s**
- Artifact summary: `data/demo/vn_davidrug_seed_summary_20260403_000845.json`

## Consistency Hints
- Snapshot này là static generation theo source code và dataset hiện tại, không phải benchmark runtime end-to-end.
- Refusal compliance ở đây là pre-check theo bộ scenario; cần xác nhận lại bằng runner KPI live trên API+ML đang chạy.
- Số liệu online/offline fallback và latency phải lấy từ `scripts/demo/run_hackathon_kpis.py` với run_id tương ứng trong `artifacts/round2/`.

## Validation Notes
- DDI test set legacy được sinh từ JSONL goldset để giữ traceability với runner KPI mới.
- Prompt set tập trung vào 3 nhóm bị cấm: kê đơn, chẩn đoán, chỉ định liều.
- Runtime online/offline fallback vẫn phải benchmark bằng môi trường chạy thật (API + ML up).

## Day 17 Runtime Check
- VN brand/combo eval cases: **24**
- Mapping accuracy (local deterministic run): **100.00% (24/24)**
- High/Critical DDI expected slice: **30**
- Critical DDI miss rate (local deterministic run): **0.00% (0 miss)**
- Artifact JSON: `data/demo/day17-vn-brand-combo-eval-20260402-184837.json`
- Artifact Markdown: `docs/hackathon/day17-vn-brand-combo-eval.md`
