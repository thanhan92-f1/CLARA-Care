# CD Pipeline: Staging -> Production Promote

Workflow: `.github/workflows/cd.yml`

## Mục tiêu

- Deploy bản build theo image tag (`vX.Y.Z` hoặc `sha-<shortsha>`) vào **staging**.
- Chạy health/smoke checks cho API/ML/Web.
- Chỉ khi staging pass mới cho phép promote sang **production**.
- Hỗ trợ rollback bằng cách deploy lại tag cũ.

## Trigger

- `workflow_dispatch` (chạy tay từ GitHub Actions).

Inputs:

- `image_tag`: tag muốn deploy, ví dụ `v1.3.0` hoặc `sha-a1b2c3d`.
- `rollback_tag`: nếu nhập giá trị này thì ưu tiên deploy tag rollback.
- `promote_production`: `true/false`, có promote production sau staging hay không.

Nếu không nhập `image_tag` và `rollback_tag`, pipeline tự dùng `sha-<7 ký tự đầu của commit hiện tại>`.

## Cơ chế approve

Workflow sử dụng GitHub Environments:

- Job `deploy-staging` chạy trong environment `staging`.
- Job `promote-production` chạy trong environment `production`.

Để bật manual approval:

1. Vào `Settings -> Environments -> staging`.
2. Add `Required reviewers`.
3. Làm tương tự với `production`.

## Secrets bắt buộc

### Staging

- `STAGING_SSH_HOST`
- `STAGING_SSH_USER`
- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_SSH_PORT` (optional, default `22`)
- `STAGING_DEPLOY_PATH` (optional, default `/opt/clara-care`)
- `STAGING_GHCR_USERNAME`
- `STAGING_GHCR_TOKEN` (quyền đọc GHCR package)
- `STAGING_BASE_URL` (ví dụ `https://staging.example.com`)

### Production

- `PRODUCTION_SSH_HOST`
- `PRODUCTION_SSH_USER`
- `PRODUCTION_SSH_PRIVATE_KEY`
- `PRODUCTION_SSH_PORT` (optional, default `22`)
- `PRODUCTION_DEPLOY_PATH` (optional, default `/opt/clara-care`)
- `PRODUCTION_GHCR_USERNAME`
- `PRODUCTION_GHCR_TOKEN` (quyền đọc GHCR package)
- `PRODUCTION_BASE_URL` (ví dụ `https://app.example.com`)

## Flow kỹ thuật

1. Resolve tag deploy từ input.
2. Copy deploy assets (`deploy/docker/*`, `.env.example`) lên server qua SSH/rsync.
3. Tạo file override `docker-compose.cd-images.yml` để ép dùng image từ GHCR:
   - `ghcr.io/<owner>/<repo>/clara-api:<tag>`
   - `ghcr.io/<owner>/<repo>/clara-ml:<tag>`
   - `ghcr.io/<owner>/<repo>/clara-web:<tag>`
4. `docker compose pull` + `docker compose up -d --no-build`.
5. Smoke checks:
   - `${BASE_URL}/api/v1/health`
   - `${BASE_URL}/health`
   - `${BASE_URL}/ml/health`
   - `${BASE_URL}/` (web)
6. Nếu staging pass và `promote_production=true`, chạy lại quy trình cho production.

## Rollback

Rollback = chạy lại workflow với `rollback_tag=vX.Y.Z` (tag đã có image trên GHCR).

Khuyến nghị:

- Giữ lịch sử tags sạch theo semver (`vX.Y.Z`).
- Luôn đính kèm image manifest trong release để truy ngược digest.

## Notes vận hành

- Workflow không build image mới, chỉ deploy image đã có trên registry.
- Nếu server production dùng self-hosted runner thay vì SSH, có thể chuyển job sang runner label riêng và bỏ rsync/ssh steps.
