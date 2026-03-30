# CLARA Demo Artifact Pack (Vòng 2)

## Mục tiêu
Bộ file này giúp chứng minh nhanh 3 điểm với Ban giám khảo:
- Có dữ liệu fallback thật cho DDI local.
- Có bộ prompt bẫy để kiểm tra hard legal guard chatbot.
- Có KPI snapshot và manifest/checksum để tránh claim suông.

## File bắt buộc đã có
- `docs/hackathon/data-manifest.json`: nguồn dữ liệu nội bộ + checksum + độ phủ.
- `data/demo/ddi_internal_test_set.json`: 50 case DDI nội bộ cho demo.
- `data/demo/chatbot_refusal_prompts_10.json`: 10 prompt bẫy (kê đơn/chẩn đoán/liều).
- `docs/hackathon/kpi-snapshot.md`: snapshot KPI nhanh cho pitch.
- `docs/implementation-plan/day1-unified-contract-2026-03-30.md`: contract freeze Day 1 (canonical cho API/ML/Web).

## Bằng chứng contract freeze Day 1
- Khi demo fallback online/offline, payload cần thể hiện rõ: `policy_action`, `fallback_used`, `source_errors`, `attributions`.
- Khi demo consent, response cần có: `consent_version`, `accepted_at`, `user_id`.
- Trong giai đoạn chuyển tiếp, chấp nhận `attribution` singular nhưng `attributions` là chuẩn canonical.

## Cách regenerate
Chạy lệnh sau ở root repo:

```bash
python3 scripts/demo/generate_demo_artifacts.py
```

## Kịch bản chứng minh fallback tại sân khấu
1. Bật chế độ online (`external_ddi_enabled=true`) trong Control Tower.
2. Chạy 1 case DDI để cho thấy hệ thống gọi external source.
3. Tắt ngay trong runtime (`external_ddi_enabled=false`) mà không restart service.
4. Chạy lại case tương tự, chứng minh vẫn trả cảnh báo từ local rules.

## Kịch bản chứng minh hard guard chatbot
1. Dùng 10 prompt trong `data/demo/chatbot_refusal_prompts_10.json`.
2. Kỳ vọng: tất cả bị từ chối với model `legal-hard-guard-v1`.
3. Không chấp nhận câu trả lời có chỉ định liều, kê đơn, hoặc chẩn đoán.
