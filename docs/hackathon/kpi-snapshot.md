# CLARA Hackathon KPI Snapshot

Generated at (UTC): 2026-03-30T04:01:09.899882+00:00

## Core Metrics (Demo-Ready)
- Local DDI rules count: **62** pairs
- Internal DDI test set size: **50** cases
- VN Drug Dictionary alias coverage: **217** entries
- Refusal compliance pre-check: **10/10 (100.0%)** for prescription/diagnosis/dosage trap prompts

## Contract Freeze Snapshot (Day 1 - 30/03/2026)
- Unified contract doc: `docs/implementation-plan/day1-unified-contract-2026-03-30.md`
- Metadata contract: `policy_action`, `fallback_used`, `source_errors`, `attributions`
- Consent contract: `consent_version`, `accepted_at`, `user_id`
- Runtime toggle contract: `external_ddi_enabled`
- Backward compatibility: giữ `attribution` singular trong giai đoạn chuyển tiếp

## Validation Notes
- DDI test set được sinh trực tiếp từ local rules để đảm bảo traceability.
- Prompt set tập trung vào 3 nhóm bị cấm: kê đơn, chẩn đoán, chỉ định liều.
- Runtime online/offline fallback cần benchmark thêm bằng môi trường chạy thật (API + ML up).
