# CLARA Hackathon KPI Snapshot

Generated at (UTC): 2026-04-02T19:06:12.193372+00:00
Round2 run_id: `day24-smoke-20260403-postneg`

## Core Metrics (Demo-Ready)
- Local DDI rules count: **62** pairs
- Internal DDI test set size: **50** cases
- VN Drug Dictionary alias coverage: **217** entries
- Refusal compliance pre-check: **10/10 (100.0%)** for prescription/diagnosis/dosage trap prompts
- Executable KPI datasets: **4 JSONL files** (DDI / refusal / fallback / latency)

## Consistency Hints
- Snapshot này là static generation theo source code và dataset hiện tại, không phải benchmark runtime end-to-end.
- Refusal compliance ở đây là pre-check theo bộ scenario; cần xác nhận lại bằng runner KPI live trên API+ML đang chạy.
- Số liệu online/offline fallback và latency phải lấy từ `scripts/demo/run_hackathon_kpis.py` với run_id tương ứng trong `artifacts/round2/`.

## Validation Notes
- DDI test set legacy được sinh từ JSONL goldset để giữ traceability với runner KPI mới.
- Prompt set tập trung vào 3 nhóm bị cấm: kê đơn, chẩn đoán, chỉ định liều.
- Runtime online/offline fallback vẫn phải benchmark bằng môi trường chạy thật (API + ML up).

## Day 18 Gate (Phase 2)
- Gate verdict: **PASS**
- Mapping accuracy: **100.00%** (threshold >= 90%)
- Critical DDI miss reduction: **100.00%** (threshold >= 40%)
- Artifact JSON: `data/demo/day18-phase2-gate-20260402-185335.json`
- Artifact Markdown: `docs/hackathon/day18-phase2-gate.md`

## Day 24 Active Eval Loop
- Run ID: `day24-smoke-20260403`
- Stage progression: baseline -> mine -> post-negative -> compare (**completed**)
- Gate status: **PASS** (pipeline stage gate pass, static mode smoke)
- Summary JSON: `artifacts/round2/day24-smoke-20260403/active-eval-summary.json`
- Summary Markdown: `artifacts/round2/day24-smoke-20260403/active-eval-summary.md`

## Day 27 KPI + Readiness
- KPI run ID: `day27-phase3-live-20260403`
- Go/No-Go: **NO-GO**
- Readiness: **NO** (live run bị downgrade static do API endpoint không reach được từ runner + TLS self-signed)
- KPI artifact: `artifacts/round2/day27-phase3-live-20260403/kpi-report/kpi-report.json`
- Go/No-Go artifact: `artifacts/round2/day27-phase3-live-20260403/go-no-go/go-no-go.json`

## Day 28 Final Gate
- Final verdict: **NO-GO**
- Final gate artifact: `data/demo/day28-final-gate-20260402-190932.json`
- Final report: `docs/hackathon/day28-final-gate-report.md`
