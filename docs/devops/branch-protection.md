# Branch Protection Policy (main)

Workflow: `.github/workflows/branch-protection-sync.yml`

## Mục tiêu

- Chặn merge vào `main` nếu thiếu check bắt buộc.
- Bắt buộc review PR và code owner review.
- Chặn force-push và xóa branch `main`.

## Policy áp dụng

- Required status checks:
  - `required-ci-gates`
- Require pull request trước khi merge.
- Require tối thiểu 1 approving review.
- Dismiss stale reviews khi có commit mới.
- Require code owner review.
- Require conversation resolution.
- Enforce rule với cả admin.
- Disallow force pushes.
- Disallow deletions.

## Cách chạy

1. Tạo secret repo: `BRANCH_PROTECTION_TOKEN`
   - Loại token: Fine-grained PAT hoặc GitHub App token.
   - Quyền tối thiểu: Repository administration (write).
2. Vào Actions -> `Branch Protection Sync`.
3. Run workflow với:
   - `branch`: `main`
   - `required_checks`: `required-ci-gates`
   - `required_approvals`: `1` (có thể tăng 2-3 cho nhánh production)
   - `require_code_owner_reviews`: `true`
   - `dry_run`: `true` để xem payload trước.
4. Chạy lại với `dry_run=false` để áp rule thật.

## Schedule tự động

- Workflow có cron mỗi thứ Hai 04:00 UTC để re-apply policy.
- Mục tiêu: tránh drift cấu hình do chỉnh tay trong Settings.
- Nếu thiếu secret `BRANCH_PROTECTION_TOKEN`, workflow sẽ tự `skip` và cảnh báo thay vì fail toàn job.

## Kết hợp với CODEOWNERS

- File `.github/CODEOWNERS` định nghĩa owner theo thư mục.
- Khi bật `require_code_owner_reviews`, PR sẽ cần owner approve trước merge.
