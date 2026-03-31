# CLARA Hackathon KPI Snapshot

Generated at (UTC): 2026-03-31T01:22:37.767421+00:00
Round2 run_id: `local-smoke`

## Core Metrics (Demo-Ready)
- Local DDI rules count: **62** pairs
- Internal DDI test set size: **50** cases
- VN Drug Dictionary alias coverage: **217** entries
- Refusal compliance pre-check: **10/10 (100.0%)** for prescription/diagnosis/dosage trap prompts

## Consistency Hints
- Snapshot nay la static generation theo source code hien tai, khong phai ket qua benchmark runtime end-to-end.
- Refusal compliance la pre-check theo prompt pattern; can xac nhan lai bang test run tren API+ML dang chay.
- So lieu online/offline fallback va latency can cap nhat tu artifact run_id trong artifacts/round2 sau moi lan benchmark.

## Validation Notes
- DDI test set duoc sinh truc tiep tu local rules de dam bao traceability.
- Prompt set tap trung vao 3 nhom bi cam: ke don, chan doan, chi dinh lieu.
- Runtime online/offline fallback can benchmark them bang moi truong chay that (API + ML up).
