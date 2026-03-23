#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "[setup] Created .env from .env.example"
fi

for cmd in docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[error] Missing command: $cmd"
    exit 1
  fi
done

if ! docker info >/dev/null 2>&1; then
  echo "[error] Docker daemon is not running"
  exit 1
fi

echo "[setup] Docker version:"
docker --version

echo "[setup] Docker compose version:"
docker compose version

echo "[setup] Validating compose file..."
docker compose --env-file .env -f deploy/docker/docker-compose.yml config >/dev/null

echo "[setup] Environment is ready"
