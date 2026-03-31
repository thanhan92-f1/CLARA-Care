# Lệnh chạy KPI / Artifact cho Hackathon

## Mục tiêu
Tài liệu này chốt các lệnh ngắn gọn để team tạo bộ bằng chứng cho Vòng 2 mà không phải nhớ tay từng bước.

## Bộ dữ liệu đầu vào
- `data/demo/ddi-goldset.jsonl`
- `data/demo/refusal-scenarios.jsonl`
- `data/demo/fallback-scenarios.jsonl`
- `data/demo/latency-scenarios.jsonl`

## 1. Regenerate artifact tĩnh từ source repo
Lệnh này không cần service đang chạy.

```bash
python3 scripts/demo/generate_demo_artifacts.py --run-id local-smoke
```

Kết quả chính:
- `docs/hackathon/data-manifest.json`
- `docs/hackathon/kpi-snapshot.md`
- `data/demo/ddi_internal_test_set.json`
- `data/demo/chatbot_refusal_prompts_10.json`
- `artifacts/round2/local-smoke/*`

## 2. Chạy runner KPI ở chế độ static
Phù hợp CI hoặc máy chưa bật API/ML.

```bash
python3 scripts/demo/run_hackathon_kpis.py --mode static --run-id local-smoke
```

Kết quả:
- `artifacts/round2/local-smoke/kpi-report/kpi-report.json`
- `artifacts/round2/local-smoke/kpi-report/kpi-report.md`
- `artifacts/round2/local-smoke/test-report/test-report.json`
- `artifacts/round2/local-smoke/fallback-proof/fallback-proof.json`

## 3. Chạy runner KPI ở chế độ auto
Runner sẽ thử live trước, nếu không reach được service hoặc thiếu auth thì tự hạ xuống static.

```bash
python3 scripts/demo/run_hackathon_kpis.py \
  --mode auto \
  --run-id round2-auto \
  --api-base-url http://127.0.0.1:8000 \
  --ml-base-url http://127.0.0.1:8001 \
  --email admin@example.com \
  --password 'Clara#Admin2026!' \
  --doctor-email admin@example.com \
  --doctor-password 'Clara#Admin2026!'
```

## 4. Chạy runner KPI ở chế độ live nghiêm ngặt
Chế độ này fail ngay nếu không reach được service hoặc không login được.

```bash
python3 scripts/demo/run_hackathon_kpis.py \
  --mode live \
  --strict-live \
  --run-id round2-live \
  --api-base-url http://127.0.0.1:8000 \
  --ml-base-url http://127.0.0.1:8001 \
  --email admin@example.com \
  --password 'Clara#Admin2026!' \
  --doctor-email admin@example.com \
  --doctor-password 'Clara#Admin2026!'
```

## 5. Dùng bearer token thay vì password

```bash
python3 scripts/demo/run_hackathon_kpis.py \
  --mode live \
  --run-id round2-token \
  --api-base-url http://127.0.0.1:8000 \
  --ml-base-url http://127.0.0.1:8001 \
  --bearer-token "$CLARA_BEARER_TOKEN" \
  --doctor-bearer-token "$CLARA_DOCTOR_BEARER_TOKEN"
```

## Ý nghĩa các report
- `kpi-report`: tổng hợp metric chính cho pitch.
- `test-report`: log trạng thái từng case.
- `fallback-proof`: bằng chứng bật/tắt external DDI và kết quả local fallback.

## Lưu ý vận hành
- Live fallback proof cần quyền `doctor` hoặc `admin` để gọi `/api/v1/system/careguard/runtime`.
- Nếu chỉ có user token thường, runner vẫn đo được `DDI` và `refusal`, nhưng phần fallback sẽ bị đánh dấu `blocked`.
- `DDI precision` trong report chỉ là proxy theo goldset nội bộ, không phải chỉ số kiểm định lâm sàng.
