# CLARA — DevOps, CI/CD & Infrastructure Planning Document

> **Version:** 1.0
> **Date:** January 2025
> **Classification:** Internal — Engineering & DevOps
> **Prepared by:** CLARA Engineering Team (Lead: Nguyễn Hải Duy — Backend + DevOps Lead)
> **Audience:** Engineering Team, Stakeholders, Cloud Architects
> **Cross-References:** `project_structure_and_sprints.md`, `technical_architecture_deep_dive.md`, `product_proposal.md`

---

## Table of Contents

1. [GitHub Actions Workflows](#1-github-actions-workflows)
   - 1.1 [CI Pipeline](#11-ci-pipeline)
   - 1.2 [CD Pipeline](#12-cd-pipeline)
   - 1.3 [Documentation Pipeline](#13-documentation-pipeline)
   - 1.4 [AI Evaluation Pipeline](#14-ai-evaluation-pipeline)
   - 1.5 [Security Scanning Pipeline](#15-security-scanning-pipeline)
2. [Docker Architecture](#2-docker-architecture)
   - 2.1 [Local Development (docker-compose.yml)](#21-local-development-docker-composeyml)
   - 2.2 [Production Dockerfiles (Multi-Stage)](#22-production-dockerfiles-multi-stage)
   - 2.3 [GPU Container for SLM Inference](#23-gpu-container-for-slm-inference)
3. [Infrastructure as Code](#3-infrastructure-as-code)
   - 3.1 [Terraform Modules](#31-terraform-modules)
   - 3.2 [Kubernetes Manifests](#32-kubernetes-manifests)
   - 3.3 [Estimated Costs (AWS/GCP)](#33-estimated-costs-awsgcp)
4. [Monitoring & Observability](#4-monitoring--observability)
   - 4.1 [Prometheus Metrics](#41-prometheus-metrics)
   - 4.2 [Grafana Dashboards](#42-grafana-dashboards)
   - 4.3 [LangSmith LLM Tracing](#43-langsmith-llm-tracing)
   - 4.4 [Alert Rules](#44-alert-rules)
5. [Security Checklist](#5-security-checklist)
6. [Backup & Disaster Recovery](#6-backup--disaster-recovery)

---

## 1. GitHub Actions Workflows

All workflow files live in `deploy/ci-cd/.github/workflows/` and are symlinked from the repo root `.github/workflows/`.

### 1.1 CI Pipeline

> **Trigger:** Push to any branch, Pull Request to `main` / `develop`
> **File:** `ci.yml`

```yaml
# deploy/ci-cd/.github/workflows/ci.yml
name: CLARA CI Pipeline

on:
  push:
    branches: [main, develop, 'feature/**', 'fix/**']
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  PYTHON_VERSION: '3.11'
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  # ──────────────────────────────────────────────
  # Python Backend (FastAPI)
  # ──────────────────────────────────────────────
  python-lint:
    name: 🐍 Python Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      - name: Install dependencies
        run: |
          pip install uv
          uv sync --frozen --dev
      - name: Ruff Lint
        run: uv run ruff check src/ --output-format=github
      - name: Ruff Format Check
        run: uv run ruff format --check src/
      - name: Import Sorting (isort)
        run: uv run ruff check --select I src/

  python-type-check:
    name: 🐍 Python Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      - name: Install dependencies
        run: |
          pip install uv
          uv sync --frozen --dev
      - name: Mypy Type Check
        run: uv run mypy src/ --config-file pyproject.toml

  python-test:
    name: 🐍 Python Tests
    runs-on: ubuntu-latest
    needs: [python-lint]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: clara_test
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: clara_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://clara_test:test_password@localhost:5432/clara_test
      REDIS_URL: redis://localhost:6379/0
      TESTING: 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      - name: Install dependencies
        run: |
          pip install uv
          uv sync --frozen --dev
      - name: Run migrations
        run: uv run alembic upgrade head
      - name: Run Tests with Coverage
        run: |
          uv run pytest tests/ \
            --cov=src \
            --cov-report=xml:coverage.xml \
            --cov-report=html:htmlcov \
            --junitxml=test-results.xml \
            -v --tb=short \
            -x --timeout=300
      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: coverage.xml
          flags: backend
          token: ${{ secrets.CODECOV_TOKEN }}
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: python-test-results
          path: |
            test-results.xml
            htmlcov/

  # ──────────────────────────────────────────────
  # TypeScript Frontend (Next.js)
  # ──────────────────────────────────────────────
  frontend-lint:
    name: 🌐 Frontend Lint
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/web
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: src/web/pnpm-lock.yaml
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      - name: ESLint
        run: pnpm lint
      - name: Prettier Check
        run: pnpm prettier --check .

  frontend-type-check:
    name: 🌐 Frontend Type Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/web
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: src/web/pnpm-lock.yaml
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      - name: TypeScript Check
        run: pnpm tsc --noEmit

  frontend-test:
    name: 🌐 Frontend Tests
    runs-on: ubuntu-latest
    needs: [frontend-lint]
    defaults:
      run:
        working-directory: src/web
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: src/web/pnpm-lock.yaml
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      - name: Run Tests
        run: pnpm test -- --coverage --ci
      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          file: src/web/coverage/lcov.info
          flags: frontend
          token: ${{ secrets.CODECOV_TOKEN }}

  frontend-build:
    name: 🌐 Frontend Build
    runs-on: ubuntu-latest
    needs: [frontend-type-check, frontend-test]
    defaults:
      run:
        working-directory: src/web
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: src/web/pnpm-lock.yaml
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      - name: Build Next.js
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: https://api.clara.vn

  # ──────────────────────────────────────────────
  # CI Gate (required for merge)
  # ──────────────────────────────────────────────
  ci-gate:
    name: ✅ CI Gate
    runs-on: ubuntu-latest
    needs:
      - python-lint
      - python-type-check
      - python-test
      - frontend-lint
      - frontend-type-check
      - frontend-test
      - frontend-build
    if: always()
    steps:
      - name: Check CI Results
        run: |
          if [[ "${{ contains(needs.*.result, 'failure') }}" == "true" ]]; then
            echo "❌ One or more CI jobs failed"
            exit 1
          fi
          echo "✅ All CI checks passed"
```

**CI Pipeline Diagram:**

```
Push / PR
  │
  ├─── python-lint ────────────────┐
  │     └── ruff check/format      │
  │                                │
  ├─── python-type-check ──────────┤
  │     └── mypy                   │
  │                                │
  ├─── python-test ───────────────┤
  │     └── pytest + coverage      │   ──► ci-gate ──► ✅ Merge allowed
  │                                │
  ├─── frontend-lint ─────────────┤
  │     └── eslint + prettier      │
  │                                │
  ├─── frontend-type-check ────────┤
  │     └── tsc --noEmit           │
  │                                │
  ├─── frontend-test ─────────────┤
  │     └── vitest + coverage      │
  │                                │
  └─── frontend-build ────────────┘
        └── next build
```


### 1.2 CD Pipeline

> **Trigger:** Push to `main` (staging), manual approval + tag (production)
> **Files:** `cd-staging.yml`, `cd-production.yml`

```yaml
# deploy/ci-cd/.github/workflows/cd-staging.yml
name: CLARA CD — Deploy to Staging

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository }}

jobs:
  build-and-push:
    name: 🐳 Build & Push Docker Images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service:
          - { name: api, dockerfile: deploy/docker/Dockerfile.api, context: . }
          - { name: web, dockerfile: deploy/docker/Dockerfile.web, context: ./src/web }
          - { name: worker, dockerfile: deploy/docker/Dockerfile.worker, context: . }
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_PREFIX }}/${{ matrix.service.name }}
          tags: |
            type=sha,prefix=staging-
            type=raw,value=staging-latest

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.service.context }}
          file: ${{ matrix.service.dockerfile }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_ENV=staging
            GIT_SHA=${{ github.sha }}

  deploy-staging:
    name: 🚀 Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build-and-push]
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Update Kubernetes Manifests
        run: |
          cd deploy/k8s/overlays/staging
          kustomize edit set image \
            clara-api=${{ env.IMAGE_PREFIX }}/api:staging-${{ github.sha }} \
            clara-web=${{ env.IMAGE_PREFIX }}/web:staging-${{ github.sha }} \
            clara-worker=${{ env.IMAGE_PREFIX }}/worker:staging-${{ github.sha }}

      - name: Apply Manifests
        run: |
          kubectl apply -k deploy/k8s/overlays/staging
          kubectl rollout status deployment/clara-api -n clara-staging --timeout=300s
          kubectl rollout status deployment/clara-web -n clara-staging --timeout=300s

      - name: Run Smoke Tests
        run: |
          STAGING_URL="https://staging.clara.vn"
          # Health check
          curl -sf "${STAGING_URL}/api/health" | jq .
          # Basic API functionality
          curl -sf "${STAGING_URL}/api/v1/status" | jq .

      - name: Notify on Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "${{ job.status == 'success' && '✅' || '❌' }} Staging deployment ${{ job.status }}: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

```yaml
# deploy/ci-cd/.github/workflows/cd-production.yml
name: CLARA CD — Deploy to Production

on:
  push:
    tags: ['v*.*.*']
  workflow_dispatch:
    inputs:
      tag:
        description: 'Release tag to deploy (e.g., v1.2.3)'
        required: true

jobs:
  validate:
    name: 🔍 Pre-Deploy Validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify tag exists and CI passed
        run: |
          TAG="${{ github.event.inputs.tag || github.ref_name }}"
          echo "Deploying tag: ${TAG}"
          # Verify the tag's commit passed CI
          gh run list --commit $(git rev-parse ${TAG}) --status success --json conclusion \
            | jq -e 'length > 0' || (echo "❌ CI not passed for ${TAG}" && exit 1)
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  build-production:
    name: 🐳 Build Production Images
    runs-on: ubuntu-latest
    needs: [validate]
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service: [api, web, worker]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: deploy/docker/Dockerfile.${{ matrix.service }}
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.ref_name }}
            ghcr.io/${{ github.repository }}/${{ matrix.service }}:latest
          build-args: |
            BUILD_ENV=production

  deploy-production:
    name: 🚀 Deploy to Production
    runs-on: ubuntu-latest
    needs: [build-production]
    environment:
      name: production
      url: https://clara.vn
    steps:
      - uses: actions/checkout@v4
      - name: Configure kubectl
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}
      - name: Blue-Green Deploy
        run: |
          TAG="${{ github.event.inputs.tag || github.ref_name }}"
          cd deploy/k8s/overlays/production

          # Deploy to green (inactive) slot
          kustomize edit set image \
            clara-api=ghcr.io/${{ github.repository }}/api:${TAG} \
            clara-web=ghcr.io/${{ github.repository }}/web:${TAG} \
            clara-worker=ghcr.io/${{ github.repository }}/worker:${TAG}

          kubectl apply -k .
          kubectl rollout status deployment/clara-api -n clara-production --timeout=600s

          # Run production smoke tests before switching traffic
          echo "Running production health checks..."
          kubectl exec -n clara-production deploy/clara-api -- \
            python -m scripts.monitoring.health_check

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: ${{ github.ref_name }}
          generate_release_notes: true
```

**CD Pipeline Flow:**

```
                    ┌─────────────────────────────────────────────────┐
                    │              CD PIPELINE FLOW                    │
                    └─────────────────────────────────────────────────┘

  Push to main ──► Build Images ──► Push to GHCR ──► Deploy Staging
                                                         │
                                                    Smoke Tests
                                                         │
                                                   ✅ Staging OK
                                                         │
                                                  Manual Tag (vX.Y.Z)
                                                         │
  Tag Push ──► Validate CI ──► Build Prod Images ──► Deploy Production
                                                         │
                                                   Blue-Green Deploy
                                                         │
                                                   Health Checks ──► ✅ Live
```

### 1.3 Documentation Pipeline

> **Trigger:** Push to `main` that modifies `src/` or `docs/`
> **File:** `docs.yml`

```yaml
# deploy/ci-cd/.github/workflows/docs.yml
name: CLARA Documentation Pipeline

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'docs/**'
      - 'pyproject.toml'
  workflow_dispatch:

jobs:
  generate-api-docs:
    name: 📖 Generate API Documentation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install uv
          uv sync --frozen --dev

      - name: Generate OpenAPI Schema
        run: |
          uv run python -c "
          from src.api.main import app
          import json
          schema = app.openapi()
          with open('docs/api/openapi.json', 'w') as f:
              json.dump(schema, f, indent=2, ensure_ascii=False)
          "

      - name: Generate API Reference (Redoc)
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          npx @redocly/cli build-docs docs/api/openapi.json \
            --output docs/api/index.html \
            --title "CLARA API Reference"

      - name: Generate Python Docs (pdoc)
        run: |
          uv run pdoc src/ \
            --output-dir docs/api/python \
            --template-dir docs/templates \
            --docformat google

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/api
          destination_dir: api

  generate-architecture-diagrams:
    name: 📊 Generate Architecture Diagrams
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate Mermaid Diagrams
        uses: mermaid-js/mermaid-cli-action@v1
        with:
          input: docs/architecture/diagrams/
          output: docs/api/diagrams/
      - name: Upload Diagrams
        uses: actions/upload-artifact@v4
        with:
          name: architecture-diagrams
          path: docs/api/diagrams/
```


### 1.4 AI Evaluation Pipeline

> **Trigger:** Scheduled (weekly), manual dispatch, or on model changes
> **File:** `ai-evaluation.yml`

```yaml
# deploy/ci-cd/.github/workflows/ai-evaluation.yml
name: CLARA AI Evaluation Pipeline

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2:00 AM UTC
  workflow_dispatch:
    inputs:
      eval_suite:
        description: 'Evaluation suite to run'
        required: false
        default: 'all'
        type: choice
        options: [all, rag, intent-router, fides, medical-ner, ddi]
  push:
    branches: [main]
    paths:
      - 'src/agents/**'
      - 'src/rag/**'
      - 'data/evaluation/**'

jobs:
  rag-evaluation:
    name: 🧪 RAG Quality Benchmarks
    runs-on: ubuntu-latest
    if: >
      github.event.inputs.eval_suite == 'all' ||
      github.event.inputs.eval_suite == 'rag' ||
      github.event_name == 'schedule'
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: clara_eval
          POSTGRES_PASSWORD: eval_password
          POSTGRES_DB: clara_eval
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    env:
      DATABASE_URL: postgresql://clara_eval:eval_password@localhost:5432/clara_eval
      REDIS_URL: redis://localhost:6379/0
      LANGSMITH_API_KEY: ${{ secrets.LANGSMITH_API_KEY }}
      LANGSMITH_PROJECT: clara-eval-${{ github.run_id }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install uv
          uv sync --frozen --dev

      - name: Run RAG Evaluation Suite
        run: |
          uv run python -m scripts.evaluation.run_rag_eval \
            --dataset data/evaluation/rag_golden_set.jsonl \
            --metrics "context_relevancy,answer_faithfulness,answer_relevancy,citation_accuracy" \
            --output eval-results/rag_results.json \
            --langsmith-trace

      - name: Run Vietnamese Medical Query Evaluation
        run: |
          uv run python -m scripts.evaluation.run_rag_eval \
            --dataset data/evaluation/vietnamese_medical_queries.jsonl \
            --metrics "vietnamese_accuracy,medical_term_coverage,byt_compliance" \
            --output eval-results/vn_medical_results.json

      - name: Assert Quality Thresholds
        run: |
          uv run python -m scripts.evaluation.check_thresholds \
            --results eval-results/rag_results.json \
            --thresholds '{
              "context_relevancy": 0.75,
              "answer_faithfulness": 0.85,
              "answer_relevancy": 0.80,
              "citation_accuracy": 0.90
            }'

      - name: Upload Evaluation Results
        uses: actions/upload-artifact@v4
        with:
          name: rag-eval-results
          path: eval-results/
          retention-days: 90

      - name: Post Weekly Results as Issue
        if: github.event_name == 'schedule'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('eval-results/rag_results.json'));
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `📊 Weekly RAG Eval — ${new Date().toISOString().split('T')[0]}`,
              body: `## Results\n\n| Metric | Score | Threshold | Status |\n|--------|-------|-----------|--------|\n` +
                Object.entries(results.metrics).map(([k, v]) =>
                  `| ${k} | ${v.score.toFixed(3)} | ${v.threshold} | ${v.passed ? '✅' : '❌'} |`
                ).join('\n'),
              labels: ['evaluation', 'automated']
            });

  intent-router-evaluation:
    name: 🧪 Intent Router Benchmarks
    runs-on: ubuntu-latest
    if: >
      github.event.inputs.eval_suite == 'all' ||
      github.event.inputs.eval_suite == 'intent-router' ||
      github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install uv && uv sync --frozen --dev
      - name: Evaluate Intent Router
        run: |
          uv run python -m scripts.evaluation.run_intent_eval \
            --dataset data/evaluation/intent_classification_test.jsonl \
            --model-path models/intent_router/ \
            --output eval-results/intent_results.json \
            --metrics "accuracy,f1_macro,latency_p95,latency_p99"
      - name: Assert Router KPIs
        run: |
          uv run python -m scripts.evaluation.check_thresholds \
            --results eval-results/intent_results.json \
            --thresholds '{
              "accuracy": 0.92,
              "f1_macro": 0.88,
              "latency_p95_ms": 100,
              "latency_p99_ms": 200
            }'
```

**Evaluation KPI Targets:**

| Evaluation Suite | Metric | Target | Frequency |
|-----------------|--------|--------|-----------|
| RAG Quality | Context Relevancy | ≥0.75 | Weekly |
| RAG Quality | Answer Faithfulness | ≥0.85 | Weekly |
| RAG Quality | Citation Accuracy | ≥0.90 | Weekly |
| Intent Router | Classification Accuracy | ≥92% | Weekly |
| Intent Router | Latency (p95) | <100ms | Weekly |
| FIDES | Hallucination Detection Rate | ≥90% | Weekly |
| FIDES | False Positive Rate | <5% | Weekly |
| Medical NER | Vietnamese Entity F1 | ≥85% | Bi-weekly |
| DDI Checker | Critical DDI Detection | ≥99% | Weekly |

### 1.5 Security Scanning Pipeline

> **Trigger:** Daily schedule, PRs, and dependency changes
> **File:** `security.yml`

```yaml
# deploy/ci-cd/.github/workflows/security.yml
name: CLARA Security Scanning

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6:00 AM UTC
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]
    paths:
      - 'pyproject.toml'
      - 'uv.lock'
      - 'src/web/pnpm-lock.yaml'
      - 'deploy/docker/**'

jobs:
  python-dependency-audit:
    name: 🔒 Python Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install uv && uv sync --frozen --dev
      - name: Safety Check (CVE Database)
        run: uv run pip-audit --strict --desc
      - name: Bandit SAST (Python)
        run: |
          uv run bandit -r src/ \
            -c pyproject.toml \
            -f json -o bandit-results.json \
            --severity-level medium
      - name: Upload Bandit Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: bandit-results
          path: bandit-results.json

  node-dependency-audit:
    name: 🔒 Node.js Dependency Audit
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/web
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: '8'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - name: pnpm audit
        run: pnpm audit --audit-level moderate
      - name: ESLint Security Plugin
        run: pnpm eslint --config .eslintrc.security.json src/

  container-scanning:
    name: 🐳 Container Vulnerability Scan
    runs-on: ubuntu-latest
    strategy:
      matrix:
        dockerfile: [Dockerfile.api, Dockerfile.web, Dockerfile.worker]
    steps:
      - uses: actions/checkout@v4
      - name: Build Image
        run: |
          docker build -f deploy/docker/${{ matrix.dockerfile }} \
            -t clara-scan:${{ matrix.dockerfile }} .
      - name: Trivy Vulnerability Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: clara-scan:${{ matrix.dockerfile }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      - name: Upload Trivy Results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif

  codeql-analysis:
    name: 🔍 CodeQL SAST Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    strategy:
      matrix:
        language: [python, javascript]
    steps:
      - uses: actions/checkout@v4
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-and-quality
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  secrets-scanning:
    name: 🔐 Secrets Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Gitleaks Secrets Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: TruffleHog Deep Scan
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified
```

**Security Scanning Summary:**

| Scanner | Target | Checks | Severity |
|---------|--------|--------|----------|
| `pip-audit` | Python dependencies | Known CVEs (PyPI) | All |
| `Bandit` | Python source code | SAST (SQL injection, exec, etc.) | Medium+ |
| `pnpm audit` | Node.js dependencies | Known CVEs (npm) | Moderate+ |
| `Trivy` | Docker images | OS & library vulnerabilities | Critical, High |
| `CodeQL` | Python + JavaScript | Semantic SAST analysis | Security + Quality |
| `Gitleaks` | Git history | Leaked secrets/credentials | All |
| `TruffleHog` | Git history | Verified secret detection | Verified only |

---

## 2. Docker Architecture

### 2.1 Local Development (docker-compose.yml)

```yaml
# deploy/docker/docker-compose.yml
# CLARA Local Development Stack
# Usage: docker-compose up -d

version: '3.9'

x-common-env: &common-env
  ENVIRONMENT: development
  LOG_LEVEL: debug

services:
  # ──────────────────────────────────────────────
  # Application Services
  # ──────────────────────────────────────────────
  api:
    build:
      context: ../..
      dockerfile: deploy/docker/Dockerfile.api
      target: development
    ports:
      - "8000:8000"
    volumes:
      - ../../src:/app/src
      - ../../scripts:/app/scripts
    environment:
      <<: *common-env
      DATABASE_URL: postgresql://clara:clara_dev@postgres:5432/clara_dev
      REDIS_URL: redis://redis:6379/0
      ELASTICSEARCH_URL: http://elasticsearch:9200
      MILVUS_HOST: milvus
      MILVUS_PORT: 19530
      CELERY_BROKER_URL: redis://redis:6379/1
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy
      milvus:
        condition: service_started
    command: >
      uvicorn src.api.main:app
      --host 0.0.0.0 --port 8000
      --reload --reload-dir src
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: ../../src/web
      dockerfile: ../../deploy/docker/Dockerfile.web
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ../../src/web:/app
      - /app/node_modules
      - /app/.next
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
      NEXT_PUBLIC_WS_URL: ws://localhost:8000
    depends_on:
      - api
    command: pnpm dev

  worker:
    build:
      context: ../..
      dockerfile: deploy/docker/Dockerfile.worker
      target: development
    volumes:
      - ../../src:/app/src
    environment:
      <<: *common-env
      DATABASE_URL: postgresql://clara:clara_dev@postgres:5432/clara_dev
      REDIS_URL: redis://redis:6379/0
      CELERY_BROKER_URL: redis://redis:6379/1
    depends_on:
      - redis
      - postgres
    command: >
      celery -A src.workers.celery_app worker
      --loglevel=debug --concurrency=2

  # ──────────────────────────────────────────────
  # Infrastructure Services
  # ──────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: clara
      POSTGRES_PASSWORD: clara_dev
      POSTGRES_DB: clara_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts/postgres:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clara -d clara_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  milvus:
    image: milvusdb/milvus:v2.3-latest
    ports:
      - "19530:19530"  # gRPC
      - "9091:9091"    # Metrics
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - milvus_data:/var/lib/milvus
    depends_on:
      - etcd
      - minio

  # Milvus dependencies
  etcd:
    image: quay.io/coreos/etcd:v3.5.11
    environment:
      ETCD_AUTO_COMPACTION_MODE: revision
      ETCD_AUTO_COMPACTION_RETENTION: "1000"
      ETCD_QUOTA_BACKEND_BYTES: "4294967296"
    volumes:
      - etcd_data:/etcd

  minio:
    image: minio/minio:latest
    ports:
      - "9001:9001"    # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
  milvus_data:
  etcd_data:
  minio_data:

networks:
  default:
    name: clara-network
```

**Service Map for Local Development:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLARA Local Dev Stack                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  APPLICATION LAYER                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ web      │  │ api      │  │ worker   │                      │
│  │ :3000    │──│ :8000    │──│ (Celery) │                      │
│  │ Next.js  │  │ FastAPI  │  │ Async    │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                      │              │                            │
│  DATA LAYER          ▼              ▼                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ postgres │  │ redis    │  │ elastic  │  │ milvus   │       │
│  │ :5432    │  │ :6379    │  │ :9200    │  │ :19530   │       │
│  │ Primary  │  │ Cache +  │  │ BM25     │  │ Vector   │       │
│  │ Store    │  │ Broker   │  │ Search   │  │ Search   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │              │
│                                    ┌──────────┐  ┌──────────┐  │
│                                    │ etcd     │  │ minio    │  │
│                                    │ :2379    │  │ :9001    │  │
│                                    └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Production Dockerfiles (Multi-Stage)

```dockerfile
# deploy/docker/Dockerfile.api
# CLARA FastAPI Backend — Multi-Stage Build

# ── Stage 1: Base with dependencies ──────────────────────
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libpq-dev gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# ── Stage 2: Dependencies ───────────────────────────────
FROM base AS dependencies

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# ── Stage 3: Development (with hot-reload) ──────────────
FROM base AS development

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY src/ ./src/
COPY scripts/ ./scripts/
COPY alembic/ ./alembic/
COPY alembic.ini ./

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ── Stage 4: Production ─────────────────────────────────
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libpq5 tini && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r clara && useradd -r -g clara clara

# Copy dependencies from build stage
COPY --from=dependencies /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy application code
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Security: run as non-root
USER clara

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

EXPOSE 8000
ENTRYPOINT ["tini", "--"]
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

```dockerfile
# deploy/docker/Dockerfile.web
# CLARA Next.js Frontend — Multi-Stage Build

# ── Stage 1: Dependencies ───────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# ── Stage 2: Development ────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# ── Stage 3: Build ──────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && pnpm build

# ── Stage 4: Production (standalone) ────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### 2.3 GPU Container for SLM Inference

```dockerfile
# deploy/docker/Dockerfile.vllm
# CLARA vLLM Model Server — GPU-Enabled

# ── Stage 1: Base CUDA image ────────────────────────────
FROM nvidia/cuda:12.1.1-devel-ubuntu22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3.11-venv python3-pip curl git && \
    rm -rf /var/lib/apt/lists/* && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# ── Stage 2: Install vLLM + dependencies ────────────────
FROM base AS builder

WORKDIR /app

RUN python3 -m pip install --no-cache-dir \
    vllm==0.4.0 \
    torch==2.2.0 \
    transformers==4.38.0 \
    accelerate \
    bitsandbytes \
    flash-attn --no-build-isolation

# ── Stage 3: Production GPU server ─────────────────────
FROM base AS production

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/dist-packages /usr/local/lib/python3.11/dist-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Model configuration
COPY deploy/docker/vllm-config/ /app/config/

# Non-root user (still needs GPU access via group)
RUN groupadd -r vllm && useradd -r -g vllm -G video vllm
USER vllm

# vLLM API server
EXPOSE 8001

# Environment for model selection
ENV MODEL_NAME="Qwen/Qwen2.5-72B-Instruct" \
    MAX_MODEL_LEN=8192 \
    GPU_MEMORY_UTILIZATION=0.90 \
    TENSOR_PARALLEL_SIZE=1 \
    QUANTIZATION="awq"

HEALTHCHECK --interval=60s --timeout=30s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

CMD ["python3", "-m", "vllm.entrypoints.openai.api_server", \
     "--model", "${MODEL_NAME}", \
     "--host", "0.0.0.0", \
     "--port", "8001", \
     "--max-model-len", "${MAX_MODEL_LEN}", \
     "--gpu-memory-utilization", "${GPU_MEMORY_UTILIZATION}", \
     "--tensor-parallel-size", "${TENSOR_PARALLEL_SIZE}", \
     "--quantization", "${QUANTIZATION}", \
     "--enforce-eager"]
```

**GPU Container Configuration by Model:**

| Model | GPU Required | VRAM | Quantization | Container Instances |
|-------|-------------|------|--------------|-------------------|
| Qwen2.5-72B-Instruct | A100 80GB | ~45GB (AWQ) | AWQ 4-bit | 1 (primary synthesis) |
| Qwen2.5-7B-Instruct | A6000 48GB | ~5GB (AWQ) | AWQ 4-bit | 1 (shared: query decomposition) |
| BioMistral-7B | A6000 48GB | ~5GB (AWQ) | AWQ 4-bit | 1 (shared: FIDES fact-check) |
| Qwen2.5-3B-Instruct | A6000 48GB | ~2GB (AWQ) | AWQ 4-bit | 1 (shared: intent router) |
| Qwen2.5-0.5B-Instruct | CPU or any GPU | ~0.5GB | None | 1 (role classifier) |
| BGE-M3 (embeddings) | Any GPU | ~2GB | None | 1 (embedding server) |
| Whisper Large v3 | Any GPU | ~3GB | None | 1 (ASR server) |

> **Note:** Models marked "shared" run on the same A6000 via vLLM continuous batching. Total GPU requirement for production: 1× A100 80GB + 1× A6000 48GB minimum.

**Docker Image Size Optimization:**

| Image | Unoptimized | Multi-Stage | Reduction |
|-------|------------|-------------|-----------|
| `clara-api` | ~1.8 GB | ~380 MB | 79% |
| `clara-web` | ~1.2 GB | ~120 MB | 90% |
| `clara-worker` | ~1.6 GB | ~350 MB | 78% |
| `clara-vllm` | ~18 GB | ~15 GB | 17% (GPU libs) |

---

## 3. Infrastructure as Code

### 3.1 Terraform Modules

```
deploy/terraform/
├── aws/
│   ├── main.tf              # Provider config, backend (S3 + DynamoDB)
│   ├── variables.tf          # Input variables
│   ├── outputs.tf            # Output values
│   ├── eks.tf                # EKS cluster configuration
│   ├── rds.tf                # PostgreSQL RDS
│   ├── elasticache.tf        # Redis ElastiCache
│   ├── gpu-instances.tf      # EC2 GPU instances for vLLM
│   ├── s3.tf                 # Object storage (medical records)
│   ├── vpc.tf                # Network configuration
│   ├── iam.tf                # IAM roles and policies
│   ├── secrets.tf            # Secrets Manager
│   └── monitoring.tf         # CloudWatch, alarms
├── modules/
│   ├── eks-cluster/          # Reusable EKS module
│   ├── rds-postgres/         # Reusable RDS module
│   ├── gpu-node-group/       # GPU node group for K8s
│   ├── vpc-networking/       # VPC with public/private subnets
│   └── security-groups/      # Security group rules
└── environments/
    ├── dev.tfvars
    ├── staging.tfvars
    └── production.tfvars
```

```hcl
# deploy/terraform/aws/main.tf

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
  }

  backend "s3" {
    bucket         = "clara-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-southeast-1"    # Singapore (closest to Vietnam)
    dynamodb_table = "clara-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CLARA"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Team        = "CLARA-Engineering"
    }
  }
}
```

```hcl
# deploy/terraform/aws/eks.tf — Key EKS Configuration

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "clara-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Managed node groups
  eks_managed_node_groups = {
    # Application workloads (API, web, workers)
    application = {
      instance_types = ["c5.2xlarge"]   # 8 vCPU, 16 GB RAM
      min_size       = 2
      max_size       = 6
      desired_size   = 3

      labels = { workload = "application" }
    }

    # Data-intensive workloads (Elasticsearch, Milvus operations)
    data = {
      instance_types = ["r5.2xlarge"]   # 8 vCPU, 64 GB RAM
      min_size       = 1
      max_size       = 3
      desired_size   = 2

      labels = { workload = "data" }
    }

    # GPU nodes for model inference
    gpu-inference = {
      instance_types = ["p4d.24xlarge"]  # 8× A100 80GB
      ami_type       = "AL2_x86_64_GPU"
      min_size       = 0
      max_size       = 2
      desired_size   = 1

      labels = {
        workload                          = "gpu-inference"
        "nvidia.com/gpu.present"          = "true"
      }

      taints = [{
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }

  # Enable IRSA for service accounts
  enable_irsa = true
}
```

```hcl
# deploy/terraform/aws/rds.tf — PostgreSQL Configuration

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "clara-${var.environment}"

  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.environment == "production" ? "db.r6g.xlarge" : "db.t3.medium"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.clara_db.arn

  db_name  = "clara"
  username = "clara_admin"
  port     = 5432

  # High availability
  multi_az               = var.environment == "production"
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"

  # Network
  vpc_security_group_ids = [aws_security_group.rds.id]
  subnet_ids             = module.vpc.database_subnets

  # Performance Insights
  performance_insights_enabled = true
  monitoring_interval         = 60

  # Parameters for medical data workloads
  parameters = [
    { name = "shared_preload_libraries", value = "pg_stat_statements,pgvector" },
    { name = "max_connections",          value = "200" },
    { name = "work_mem",                 value = "256MB" },
  ]
}
```

### 3.2 Kubernetes Manifests

```
deploy/k8s/
├── base/                         # Base configurations (Kustomize)
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── api-deployment.yaml       # FastAPI backend
│   ├── web-deployment.yaml       # Next.js frontend
│   ├── worker-deployment.yaml    # Celery workers
│   ├── vllm-deployment.yaml      # GPU model server
│   ├── services.yaml             # ClusterIP services
│   ├── ingress.yaml              # NGINX Ingress
│   ├── hpa.yaml                  # Horizontal Pod Autoscaler
│   └── network-policies.yaml     # Network isolation
├── overlays/
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── production/
│       ├── kustomization.yaml
│       ├── patches/
│       └── pdb.yaml              # Pod Disruption Budgets
└── helm/
    └── clara/
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
```

```yaml
# deploy/k8s/base/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clara-api
  labels:
    app: clara
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: clara
      component: api
  template:
    metadata:
      labels:
        app: clara
        component: api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: clara-api
      containers:
        - name: api
          image: ghcr.io/clara-team/clara/api:latest
          ports:
            - containerPort: 8000
              name: http
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: clara-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: clara-secrets
                  key: redis-url
          livenessProbe:
            httpGet:
              path: /api/health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
      nodeSelector:
        workload: application
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
```

```yaml
# deploy/k8s/base/vllm-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clara-vllm
  labels:
    app: clara
    component: vllm
spec:
  replicas: 1
  selector:
    matchLabels:
      app: clara
      component: vllm
  template:
    spec:
      containers:
        - name: vllm
          image: ghcr.io/clara-team/clara/vllm:latest
          ports:
            - containerPort: 8001
              name: http
          resources:
            requests:
              cpu: "8"
              memory: "32Gi"
              nvidia.com/gpu: 1
            limits:
              cpu: "16"
              memory: "64Gi"
              nvidia.com/gpu: 1
          env:
            - name: MODEL_NAME
              value: "Qwen/Qwen2.5-72B-Instruct-AWQ"
            - name: TENSOR_PARALLEL_SIZE
              value: "1"
            - name: GPU_MEMORY_UTILIZATION
              value: "0.90"
          volumeMounts:
            - name: model-cache
              mountPath: /root/.cache/huggingface
            - name: shm
              mountPath: /dev/shm
      volumes:
        - name: model-cache
          persistentVolumeClaim:
            claimName: clara-model-cache
        - name: shm
          emptyDir:
            medium: Memory
            sizeLimit: "16Gi"
      nodeSelector:
        workload: gpu-inference
      tolerations:
        - key: "nvidia.com/gpu"
          operator: "Exists"
          effect: "NoSchedule"
---
# Horizontal Pod Autoscaler for API
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: clara-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: clara-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
```

### 3.3 Estimated Costs (AWS/GCP)

#### AWS Estimated Monthly Costs

| Component | Dev/Staging | Production (Small) | Production (Scale) |
|-----------|------------|--------------------|--------------------|
| **EKS Cluster** | $73 | $73 | $73 |
| **EC2 — App Nodes** (c5.2xlarge ×2-3) | $500 | $1,000 | $2,000 |
| **EC2 — Data Nodes** (r5.2xlarge ×1-2) | $400 | $800 | $1,600 |
| **EC2 — GPU Nodes** (p4d.24xlarge ×1) | – | $3,500 | $7,000 |
| **RDS PostgreSQL** (r6g.xlarge, Multi-AZ) | $200 | $600 | $1,200 |
| **ElastiCache Redis** (r6g.large) | $120 | $250 | $500 |
| **S3 Storage** (500 GB–2 TB) | $30 | $100 | $300 |
| **ALB + CloudFront** | $50 | $150 | $400 |
| **Secrets Manager** | $10 | $20 | $40 |
| **CloudWatch + Monitoring** | $50 | $150 | $300 |
| **Data Transfer** | $50 | $200 | $500 |
| **External APIs** (OpenAI fallback) | $100 | $500 | $2,000 |
| **Blockchain Infra** | – | $250 | $620 |
| **TOTAL** | **~$1,583** | **~$7,593** | **~$16,533** |

#### GCP Alternative Costs (Comparable)

| Component | GCP Service | Production (Small) |
|-----------|------------|-------------------|
| EKS → GKE | GKE Autopilot | $74 |
| EC2 → Compute Engine | n2-standard-8 | $900 |
| GPU → A100 | a2-highgpu-1g | $3,000 |
| RDS → Cloud SQL | db-custom-4-16384 | $500 |
| ElastiCache → Memorystore | M1, 5 GB | $200 |
| S3 → Cloud Storage | Standard | $80 |
| **TOTAL (GCP)** | | **~$6,800** |

> **Cost Optimization Strategies:**
> - Use **Spot/Preemptible instances** for non-GPU nodes (40-60% savings)
> - **Reserved Instances** (1-year commitment) for GPU: ~30% savings
> - **Auto-scaling** to zero for staging GPU nodes during off-hours
> - **vLLM continuous batching** to maximize GPU utilization (serve multiple SLMs per GPU)
> - Consider **Lambda/Cloud Functions** for infrequent crawlers (BYT, PubMed ingest)

---

## 4. Monitoring & Observability

### 4.1 Prometheus Metrics

CLARA exposes custom metrics from the FastAPI backend via `prometheus_fastapi_instrumentator` and custom counters/histograms.

**Core Application Metrics:**

```python
# src/api/middleware/metrics.py
from prometheus_client import Counter, Histogram, Gauge, Summary

# ── API Latency Metrics ──────────────────────────────────
api_request_duration = Histogram(
    "clara_api_request_duration_seconds",
    "API request duration in seconds",
    labelnames=["method", "endpoint", "status_code"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
)

api_requests_total = Counter(
    "clara_api_requests_total",
    "Total API requests",
    labelnames=["method", "endpoint", "status_code"]
)

# ── RAG Pipeline Metrics ─────────────────────────────────
rag_query_duration = Histogram(
    "clara_rag_query_duration_seconds",
    "RAG pipeline total query duration",
    labelnames=["tier", "agent_type"],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)

rag_retrieval_quality = Histogram(
    "clara_rag_retrieval_quality_score",
    "RAG retrieval quality score (0-1)",
    labelnames=["source_type"],
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

rag_context_relevancy = Summary(
    "clara_rag_context_relevancy",
    "Context relevancy score per query",
    labelnames=["tier"]
)

rag_sources_retrieved = Histogram(
    "clara_rag_sources_retrieved_count",
    "Number of sources retrieved per query",
    buckets=[1, 3, 5, 10, 15, 20, 30]
)

# ── Cache Metrics ────────────────────────────────────────
cache_hit_total = Counter(
    "clara_cache_hit_total",
    "Cache hit count",
    labelnames=["cache_layer", "cache_type"]
    # cache_layer: redis, postgres_semantic, embedding, source_freshness
    # cache_type: hit, miss, stale
)

cache_hit_ratio = Gauge(
    "clara_cache_hit_ratio",
    "Cache hit ratio (rolling 5 min window)",
    labelnames=["cache_layer"]
)

# ── LLM / vLLM Inference Metrics ────────────────────────
llm_inference_duration = Histogram(
    "clara_llm_inference_duration_seconds",
    "LLM inference latency",
    labelnames=["model", "operation"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

llm_tokens_generated = Counter(
    "clara_llm_tokens_generated_total",
    "Total tokens generated",
    labelnames=["model"]
)

llm_tokens_per_second = Gauge(
    "clara_llm_tokens_per_second",
    "Token generation throughput",
    labelnames=["model"]
)

gpu_memory_utilization = Gauge(
    "clara_gpu_memory_utilization_percent",
    "GPU memory utilization percentage",
    labelnames=["gpu_id", "model"]
)

# ── FIDES Fact-Checker Metrics ───────────────────────────
fides_check_duration = Histogram(
    "clara_fides_check_duration_seconds",
    "FIDES fact-check pipeline duration",
    labelnames=["verification_depth"]
)

fides_hallucination_detected = Counter(
    "clara_fides_hallucination_detected_total",
    "Number of hallucinations detected",
    labelnames=["severity", "claim_type"]
)

fides_verdict_distribution = Counter(
    "clara_fides_verdict_total",
    "FIDES verdict distribution",
    labelnames=["verdict"]
    # verdict: SUPPORTED, REFUTED, NOT_ENOUGH_INFO, PARTIALLY_SUPPORTED
)

# ── Intent Router Metrics ────────────────────────────────
intent_router_latency = Histogram(
    "clara_intent_router_latency_seconds",
    "Intent router classification latency",
    labelnames=["layer", "predicted_class"],
    buckets=[0.005, 0.01, 0.02, 0.05, 0.1, 0.2]
)

intent_router_confidence = Histogram(
    "clara_intent_router_confidence",
    "Intent router confidence score distribution",
    labelnames=["layer"],
    buckets=[0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1.0]
)

# ── Medical Scribe Metrics ───────────────────────────────
asr_transcription_duration = Histogram(
    "clara_asr_transcription_duration_seconds",
    "ASR transcription processing time",
    labelnames=["audio_language"],
    buckets=[1, 5, 10, 30, 60, 120, 300]
)

asr_word_error_rate = Gauge(
    "clara_asr_word_error_rate",
    "ASR word error rate (rolling average)",
    labelnames=["language"]
)

# ── Business Metrics ─────────────────────────────────────
active_users = Gauge(
    "clara_active_users",
    "Current active users",
    labelnames=["user_tier"]  # normal, researcher, doctor
)

queries_per_minute = Gauge(
    "clara_queries_per_minute",
    "Queries per minute (rolling 5 min)",
    labelnames=["query_type"]
)
```

### 4.2 Grafana Dashboards

CLARA requires **5 core dashboards** in Grafana, provisioned via dashboard-as-code (JSON models in `deploy/monitoring/grafana/dashboards/`).

| Dashboard | Key Panels | Refresh Rate |
|-----------|-----------|-------------|
| **📊 CLARA Overview** | Total requests, active users, error rate, uptime, p95 latency, cache hit ratio | 30s |
| **🧠 AI Pipeline** | RAG query duration by tier, retrieval quality scores, FIDES verdict distribution, intent router accuracy, token throughput | 1m |
| **🖥️ GPU & Model Inference** | GPU utilization, VRAM usage, tokens/sec per model, inference queue depth, model loading status | 15s |
| **💾 Data Infrastructure** | PostgreSQL connections & query time, Redis memory & hit rate, Elasticsearch indexing rate, Milvus query latency | 30s |
| **🏥 Medical Quality** | Hallucination rate trend, citation accuracy, DDI detection rate, ASR word error rate, BYT compliance score | 5m |

**Dashboard Layout — CLARA Overview:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 CLARA OVERVIEW DASHBOARD                                            │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┤
│  Total Req  │  Error Rate │  p95 Latency│  Active     │  Uptime        │
│   24,521    │    0.3%     │    420ms    │  Users: 847 │   99.97%       │
├─────────────┴─────────────┴─────────────┴─────────────┴────────────────┤
│                                                                         │
│  [REQUEST RATE GRAPH — 24h]              [ERROR RATE GRAPH — 24h]      │
│  ▄▄▆▇▇██▇▆▅▃▂▁▁▂▃▅▆▇██▇▆               ▁▁▁▁▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁     │
│                                                                         │
├─────────────────────────────────┬───────────────────────────────────────┤
│  CACHE HIT RATIO BY LAYER      │  LATENCY DISTRIBUTION (p50/p95/p99)  │
│  ┌─ Redis:       94.2%         │  [HEATMAP]                            │
│  ├─ PG Semantic:  67.8%        │  p50: 120ms                          │
│  ├─ Embedding:    89.1%        │  p95: 420ms                          │
│  └─ Overall:      83.7%        │  p99: 1.8s                           │
├─────────────────────────────────┴───────────────────────────────────────┤
│  TOP ENDPOINTS BY LATENCY       │  QUERIES BY TYPE                      │
│  POST /api/v1/search   — 350ms │  ██████████ Research: 45%             │
│  POST /api/v1/chat     — 280ms │  ████████   Clinical: 35%            │
│  POST /api/v1/scribe   — 1.2s  │  ████       Consumer: 20%            │
└─────────────────────────────────┴───────────────────────────────────────┘
```

### 4.3 LangSmith LLM Tracing

CLARA integrates with **LangSmith** for end-to-end LLM observability, trace debugging, and prompt engineering.

```python
# src/agents/tracing.py
import os
from langsmith import Client
from langsmith.run_helpers import traceable

# Initialize LangSmith client
ls_client = Client(
    api_url=os.getenv("LANGSMITH_API_URL", "https://api.smith.langchain.com"),
    api_key=os.getenv("LANGSMITH_API_KEY"),
)

# Project configuration per environment
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT", "clara-production")

# ── Trace decorators for all agent operations ────────────
@traceable(
    name="clara-rag-pipeline",
    project_name=LANGSMITH_PROJECT,
    tags=["rag", "production"],
    metadata={"version": "1.0"}
)
async def rag_pipeline(query: str, user_tier: str, context: dict):
    """Full RAG pipeline with LangSmith tracing."""
    # All sub-calls (retrieval, synthesis, fact-check) are auto-traced
    # as child spans in LangSmith
    ...

@traceable(name="clara-fides-verification", project_name=LANGSMITH_PROJECT)
async def fides_verify(response: str, claims: list):
    """FIDES fact-checker with tracing."""
    ...
```

**LangSmith Monitoring Strategy:**

| Trace Category | What's Tracked | Alert On |
|---------------|----------------|----------|
| RAG Pipeline | Full query lifecycle: routing → retrieval → synthesis → fact-check | Latency >30s, quality <0.6 |
| Intent Router | Input query → classification → confidence score | Confidence <0.7 rate >10% |
| FIDES | Claim decomposition → evidence → verdict chain | Hallucination spike >5% |
| Synthesis | Prompt template → LLM call → token usage → output | Token cost anomaly |
| CareGuard DDI | Drug pair → interaction lookup → severity classification | Missed critical DDI |

### 4.4 Alert Rules

```yaml
# deploy/monitoring/prometheus/alert-rules.yml
groups:
  - name: clara-critical
    rules:
      # ── API Health ──────────────────────────────────────
      - alert: ClaraAPIDown
        expr: up{job="clara-api"} == 0
        for: 1m
        labels:
          severity: critical
          team: devops
        annotations:
          summary: "CLARA API is down"
          description: "CLARA API has been unreachable for >1 minute"
          runbook: "https://wiki.clara.vn/runbooks/api-down"

      - alert: ClaraHighErrorRate
        expr: |
          sum(rate(clara_api_requests_total{status_code=~"5.."}[5m]))
          / sum(rate(clara_api_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "API error rate >5% for 5 minutes"

      - alert: ClaraHighLatency
        expr: |
          histogram_quantile(0.95,
            rate(clara_api_request_duration_seconds_bucket[5m])
          ) > 2.0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "API p95 latency >2s for 10 minutes"

      # ── AI / RAG Quality ────────────────────────────────
      - alert: ClaraRAGQualityDrop
        expr: |
          avg(clara_rag_retrieval_quality_score) < 0.65
        for: 30m
        labels:
          severity: warning
          team: ai
        annotations:
          summary: "RAG retrieval quality dropped below 0.65"

      - alert: ClaraHallucinationSpike
        expr: |
          rate(clara_fides_hallucination_detected_total[1h]) > 0.1
        for: 15m
        labels:
          severity: critical
          team: ai
        annotations:
          summary: "Hallucination detection rate spiked >10%/hour"
          description: "FIDES is detecting an unusual number of hallucinations"

      # ── GPU / Model Inference ───────────────────────────
      - alert: ClaraGPUMemoryHigh
        expr: clara_gpu_memory_utilization_percent > 95
        for: 5m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "GPU memory utilization >95%"

      - alert: ClaravLLMDown
        expr: up{job="clara-vllm"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "vLLM model server is down — no LLM inference available"

      # ── Cache ───────────────────────────────────────────
      - alert: ClaraCacheHitRateLow
        expr: clara_cache_hit_ratio{cache_layer="redis"} < 0.50
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Redis cache hit ratio below 50%"

      # ── Database ────────────────────────────────────────
      - alert: ClaraDBConnectionsHigh
        expr: |
          pg_stat_activity_count{datname="clara"}
          / pg_settings_max_connections > 0.80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL connections at 80% capacity"

      - alert: ClaraDBReplicationLag
        expr: pg_replication_lag_seconds > 30
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL replication lag >30s"

  - name: clara-business
    rules:
      - alert: ClaraNoQueriesReceived
        expr: |
          sum(rate(clara_api_requests_total{endpoint="/api/v1/search"}[30m])) == 0
        for: 30m
        labels:
          severity: warning
          team: product
        annotations:
          summary: "No search queries received in 30 minutes during business hours"

      - alert: ClaraDDICriticalMissed
        expr: |
          clara_ddi_critical_missed_total > 0
        for: 0m
        labels:
          severity: critical
          team: ai
        annotations:
          summary: "⚠️ Critical drug-drug interaction was MISSED by CareGuard"
          description: "Immediate investigation required — patient safety issue"
```

**Alert Routing:**

| Severity | Channel | Response Time | Escalation |
|----------|---------|--------------|------------|
| **Critical** | Slack #alerts-critical + PagerDuty + SMS | <5 min | Auto-escalate to team lead after 15 min |
| **Warning** | Slack #alerts-warning | <30 min | Escalate to critical if persists 2 hours |
| **Info** | Slack #alerts-info | Next business day | No escalation |

**Observability Stack Summary:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLARA OBSERVABILITY STACK                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Prometheus│──│ Grafana  │  │LangSmith │  │  Sentry  │       │
│  │ Metrics  │  │Dashboard │  │LLM Trace │  │  Errors  │       │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────┘       │
│       │                                                         │
│  ┌────▼─────┐  ┌──────────┐  ┌──────────┐                     │
│  │Alertmgr  │──│PagerDuty │  │  Slack   │                     │
│  │ Rules    │  │ On-Call  │  │ Channels │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │  ELK     │  │  Jaeger  │  │ MLflow   │                     │
│  │  Logs    │  │ Tracing  │  │ Exp.Track│                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Security Checklist

### 5.1 API Key Management (Secrets Manager)

| Secret | Storage | Rotation | Access |
|--------|---------|----------|--------|
| `OPENAI_API_KEY` | AWS Secrets Manager | 90 days | API pods only (IRSA) |
| `LANGSMITH_API_KEY` | AWS Secrets Manager | 90 days | API + worker pods |
| `NCBI_API_KEY` | AWS Secrets Manager | Annual | Worker pods only |
| `DATABASE_URL` | AWS Secrets Manager | 30 days (auto) | API + worker pods |
| `REDIS_URL` | AWS Secrets Manager | 30 days | API + worker pods |
| `JWT_SECRET_KEY` | AWS Secrets Manager | 30 days | API pods only |
| `ENCRYPTION_KEY` (AES-256) | AWS KMS | Annual | Encryption service |
| GitHub Deploy Keys | GitHub Secrets | Per release | CI/CD only |
| Docker Registry Token | GitHub Secrets | Annual | CI/CD only |

**Implementation:**

```yaml
# K8s External Secrets Operator — syncs AWS Secrets Manager → K8s Secrets
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: clara-api-secrets
  namespace: clara-production
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: aws-secrets-manager
  target:
    name: clara-secrets
    creationPolicy: Owner
  data:
    - secretKey: database-url
      remoteRef:
        key: clara/production/database-url
    - secretKey: openai-api-key
      remoteRef:
        key: clara/production/openai-api-key
    - secretKey: jwt-secret
      remoteRef:
        key: clara/production/jwt-secret
```

### 5.2 Network Security (VPC, Firewall Rules)

```
┌─────────────────────────────────────────────────────────────────────┐
│  VPC: 10.0.0.0/16 (clara-production-vpc)                           │
│                                                                      │
│  ┌─ Public Subnets (10.0.1.0/24, 10.0.2.0/24) ─────────────────┐  │
│  │  ALB (Load Balancer) ── only 443/HTTPS inbound               │  │
│  │  NAT Gateway                                                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌─ Private Subnets (10.0.10.0/24, 10.0.11.0/24) ──────────────┐  │
│  │  EKS Worker Nodes (API, Web, Worker pods)                     │  │
│  │  ├── Ingress: ALB only (port 8000, 3000)                     │  │
│  │  ├── Egress: NAT Gateway (external APIs, model downloads)    │  │
│  │  └── Inter-pod: NetworkPolicy (namespace-scoped)              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌─ Database Subnets (10.0.20.0/24, 10.0.21.0/24) ─────────────┐  │
│  │  RDS PostgreSQL, ElastiCache Redis, Milvus                    │  │
│  │  ├── Ingress: Private subnets only (SG: clara-app-sg)        │  │
│  │  ├── Egress: None (no internet access)                        │  │
│  │  └── Encrypted: TLS in-transit, KMS at-rest                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ GPU Subnet (10.0.30.0/24) ──────────────────────────────────┐  │
│  │  GPU instances (vLLM model servers)                            │  │
│  │  ├── Ingress: Private subnets only (port 8001)               │  │
│  │  └── Egress: HuggingFace Hub (model download), NFS (cache)   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Data Encryption

| Data State | Method | Key Management |
|-----------|--------|---------------|
| **At rest — PostgreSQL** | AES-256 (RDS encryption) | AWS KMS (CMK) |
| **At rest — Redis** | AES-256 (ElastiCache encryption) | AWS KMS |
| **At rest — S3 (medical records)** | AES-256-GCM (SSE-KMS) | AWS KMS (CMK, per-tenant keys) |
| **At rest — Milvus vectors** | EBS encryption | AWS KMS |
| **In transit — API** | TLS 1.3 (ALB termination) | ACM certificates |
| **In transit — Internal** | mTLS (Istio service mesh) | Auto-rotated certs |
| **In transit — Database** | TLS 1.2+ (forced) | RDS CA certificates |
| **Application-level** | AES-256-GCM (patient PII fields) | Application KMS key |

### 5.4 PII/PHI Handling Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    PII/PHI DATA HANDLING PIPELINE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INGESTION                                                       │
│  ├── PII Detection (regex + NER model)                          │
│  │   ├── Vietnamese name patterns                                │
│  │   ├── CMND/CCCD (ID numbers)                                 │
│  │   ├── Phone numbers (+84...)                                  │
│  │   ├── Medical record numbers                                  │
│  │   └── Date of birth                                           │
│  │                                                               │
│  ├── Classification                                              │
│  │   ├── PHI (Protected Health Info) → Highest protection       │
│  │   ├── PII (Personal Identifiable) → High protection          │
│  │   └── Non-sensitive → Standard handling                       │
│  │                                                               │
│  PROCESSING                                                      │
│  ├── Tokenization: PII replaced with reversible tokens          │
│  │   └── "Nguyễn Văn A" → [PATIENT_TOKEN_a3f2...]              │
│  ├── Encryption: PHI fields encrypted at application level      │
│  ├── Access Log: Every PHI access logged to blockchain          │
│  └── Consent Check: Verify patient consent before processing    │
│                                                                  │
│  STORAGE                                                         │
│  ├── PHI → Encrypted PostgreSQL (separate schema, row-level)    │
│  ├── De-identified data → Standard tables (for analytics)       │
│  ├── LLM prompts → PII stripped before sending to external API  │
│  └── Audit trail → Hyperledger (hash only, no PII)              │
│                                                                  │
│  RETENTION                                                       │
│  ├── Active data: Per patient consent (default: 5 years)        │
│  ├── Archived: Encrypted cold storage (7 years per VN law)      │
│  └── Deletion: Right to erasure with cryptographic verification  │
│                                                                  │
│  COMPLIANCE                                                      │
│  ├── NĐ 13/2023/NĐ-CP (Vietnam Personal Data Protection)      │
│  ├── Luật An toàn thông tin mạng 2015 (Cybersecurity Law)       │
│  └── Future VN healthcare AI regulations                         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 Access Control (RBAC)

| Role | Scope | Permissions |
|------|-------|-------------|
| **Platform Admin** | Full system | All operations, infrastructure access, user management |
| **AI Engineer** | Model + pipeline | Model deployment, evaluation runs, prompt management, no patient data |
| **Backend Developer** | API + data | Code deploy, database migrations, log access, no PII |
| **Medical Reviewer** | Content + quality | Review flagged responses, approve medical content, view de-identified data |
| **Doctor (End User)** | Tier 3 clinical | Full clinical features, patient context, CareGuard, audit trail access |
| **Researcher (End User)** | Tier 2 research | Research queries, literature search, no patient-specific data |
| **Patient (End User)** | Personal health | Own health records, medication, chat, appointment booking |

```yaml
# K8s RBAC for application namespaces
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: clara-developer
  namespace: clara-staging
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log", "services", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch"]
  # No access to secrets in staging
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: []  # Explicitly denied
```

**Security Audit Schedule:**

| Audit Type | Frequency | Responsible | Tools |
|-----------|-----------|-------------|-------|
| Dependency vulnerability scan | Daily (automated) | CI/CD | pip-audit, pnpm audit, Trivy |
| SAST code analysis | Every PR | CI/CD | CodeQL, Bandit |
| Secrets detection | Every commit | CI/CD | Gitleaks, TruffleHog |
| Penetration testing | Quarterly | External firm | OWASP ZAP, Burp Suite |
| Access review | Monthly | Team Lead | Manual review |
| PHI access audit | Weekly | Compliance | Blockchain audit logs |
| Infrastructure security | Monthly | DevOps Lead | AWS Security Hub, GuardDuty |


---

## 6. Backup & Disaster Recovery

### 6.1 Database Backup Strategy

#### PostgreSQL (RDS) Backup

```
┌─────────────────────────────────────────────────────────────────┐
│                 POSTGRESQL BACKUP ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AUTOMATED BACKUPS (RDS-managed)                                │
│  ├── Daily automated snapshots: 03:00–04:00 UTC+7              │
│  ├── Retention: 30 days (production), 7 days (staging)          │
│  ├── Point-in-Time Recovery (PITR): 5-minute granularity       │
│  ├── Transaction logs: Streamed to S3 every 5 minutes          │
│  └── Storage: Encrypted with AWS KMS (CMK)                      │
│                                                                  │
│  CROSS-REGION REPLICATION                                        │
│  ├── Primary: ap-southeast-1 (Singapore)                        │
│  ├── Replica: ap-southeast-2 (Sydney) — async read replica     │
│  ├── Replication lag target: <1 second (normal), <30s (peak)    │
│  └── Automated failover: via Route53 health checks              │
│                                                                  │
│  MANUAL/SCHEDULED EXPORTS                                        │
│  ├── Weekly full pg_dump → S3 (clara-backups-{env})            │
│  ├── Schema-only backup: Before every migration                 │
│  ├── PHI tables: Separate encrypted export (compliance)         │
│  └── Retention: 90 days (S3 Standard), then Glacier (7 years)  │
└─────────────────────────────────────────────────────────────────┘
```

**Backup Automation Script:**

```yaml
# deploy/ci-cd/backup-cron.yml — GitHub Actions Scheduled Backup
name: 📦 Database Backup

on:
  schedule:
    - cron: '0 20 * * 0'  # Weekly — Sunday 03:00 UTC+7 (20:00 UTC Saturday)
  workflow_dispatch:
    inputs:
      backup_type:
        description: 'Backup type'
        required: true
        default: 'full'
        type: choice
        options: ['full', 'schema-only', 'phi-export']

jobs:
  backup:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_BACKUP_ROLE_ARN }}
          aws-region: ap-southeast-1

      - name: Create RDS snapshot
        run: |
          SNAPSHOT_ID="clara-prod-$(date +%Y%m%d-%H%M%S)"
          aws rds create-db-snapshot \
            --db-instance-identifier clara-production \
            --db-snapshot-identifier "$SNAPSHOT_ID" \
            --tags Key=backup-type,Value=${{ inputs.backup_type || 'full' }} \
                   Key=retention,Value=90d

          # Wait for snapshot completion
          aws rds wait db-snapshot-available \
            --db-snapshot-identifier "$SNAPSHOT_ID"

          echo "✅ Snapshot created: $SNAPSHOT_ID"

      - name: Export to S3 (pg_dump)
        run: |
          # Connect via SSM port forwarding (no direct DB access)
          aws ssm start-session \
            --target ${{ secrets.BASTION_INSTANCE_ID }} \
            --document-name AWS-StartPortForwardingSessionToRemoteHost \
            --parameters '{"host":["${{ secrets.RDS_ENDPOINT }}"],"portNumber":["5432"],"localPortNumber":["15432"]}' &

          sleep 5

          PGPASSWORD="${{ secrets.DB_BACKUP_PASSWORD }}" pg_dump \
            -h localhost -p 15432 -U clara_backup -d clara \
            --format=custom --compress=9 \
            -f /tmp/clara-backup-$(date +%Y%m%d).dump

          aws s3 cp /tmp/clara-backup-$(date +%Y%m%d).dump \
            s3://clara-backups-production/weekly/clara-backup-$(date +%Y%m%d).dump \
            --sse aws:kms --sse-kms-key-id ${{ secrets.BACKUP_KMS_KEY }}

      - name: Copy snapshot to DR region
        run: |
          aws rds copy-db-snapshot \
            --source-db-snapshot-identifier "$SNAPSHOT_ID" \
            --target-db-snapshot-identifier "$SNAPSHOT_ID-dr" \
            --source-region ap-southeast-1 \
            --kms-key-id ${{ secrets.DR_KMS_KEY_ARN }} \
            --region ap-southeast-2

      - name: Verify backup integrity
        run: |
          # Download and verify the backup can be restored
          aws s3 cp \
            s3://clara-backups-production/weekly/clara-backup-$(date +%Y%m%d).dump \
            /tmp/verify.dump

          pg_restore --list /tmp/verify.dump > /dev/null 2>&1
          echo "✅ Backup integrity verified"

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚨 Database backup FAILED — $(date +%Y-%m-%d)",
              "channel": "#alerts-critical"
            }
```

#### Redis Backup Strategy

| Method | Frequency | Retention | Use Case |
|--------|-----------|-----------|----------|
| **RDB Snapshots** (ElastiCache) | Every 6 hours | 7 days | Full point-in-time recovery |
| **AOF Persistence** | Continuous (fsync every second) | Current | Minimal data loss on crash |
| **S3 Export** | Daily | 30 days | Long-term cache warmup data |
| **Cluster Snapshot** | Before maintenance | 14 days | Rollback safety net |

> **Note:** Redis is used as a cache layer in CLARA. Most cached data can be regenerated from PostgreSQL and re-computed embeddings. Redis backup priority is **lower** than PostgreSQL — focus is on fast recovery via cache warming scripts.

### 6.2 Vector DB Snapshot Schedule

#### Milvus Vector Database Backup

| Collection | Size (Est.) | Snapshot Schedule | Rebuild Time | Strategy |
|-----------|-------------|-------------------|-------------|----------|
| `medical_knowledge_vi` | ~5M vectors, ~20 GB | Daily (02:00 UTC+7) | ~4 hours | Snapshot + rebuild pipeline |
| `drug_interactions` | ~500K vectors, ~2 GB | Daily (02:30 UTC+7) | ~30 min | Snapshot + full re-index |
| `clinical_guidelines` | ~1M vectors, ~4 GB | Daily (02:15 UTC+7) | ~1 hour | Snapshot + incremental |
| `pubmed_abstracts` | ~10M vectors, ~40 GB | Weekly (Sunday 01:00) | ~8 hours | S3 snapshot + lazy rebuild |
| `user_conversation_embeddings` | ~2M vectors, ~8 GB | Every 6 hours | ~2 hours | Snapshot only (ephemeral) |

**Milvus Backup Process:**

```bash
#!/bin/bash
# scripts/backup/milvus-snapshot.sh

BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
MILVUS_ENDPOINT="${MILVUS_HOST:-localhost}:19530"
S3_BUCKET="s3://clara-backups-production/milvus"

# 1. Flush all collections to ensure data persistence
echo "📦 Flushing Milvus collections..."
python3 -c "
from pymilvus import connections, utility
connections.connect(host='${MILVUS_HOST}', port='19530')
collections = utility.list_collections()
for col in collections:
    utility.flush([col])
    print(f'  ✅ Flushed: {col}')
"

# 2. Snapshot Milvus data volumes (EBS snapshots)
for VOLUME_ID in $(aws ec2 describe-volumes \
  --filters "Name=tag:Component,Values=milvus" \
  --query 'Volumes[*].VolumeId' --output text); do

  aws ec2 create-snapshot \
    --volume-id "$VOLUME_ID" \
    --description "clara-milvus-${BACKUP_DATE}" \
    --tag-specifications "ResourceType=snapshot,Tags=[{Key=backup,Value=milvus},{Key=date,Value=${BACKUP_DATE}}]"
done

# 3. Export collection metadata
python3 -c "
from pymilvus import connections, Collection, utility
connections.connect(host='${MILVUS_HOST}', port='19530')
import json
metadata = {}
for name in utility.list_collections():
    col = Collection(name)
    metadata[name] = {
        'schema': str(col.schema),
        'num_entities': col.num_entities,
        'indexes': [idx.to_dict() for idx in col.indexes]
    }
with open('/tmp/milvus-metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
"

aws s3 cp /tmp/milvus-metadata.json \
  "${S3_BUCKET}/metadata/milvus-metadata-${BACKUP_DATE}.json"

echo "✅ Milvus backup complete: ${BACKUP_DATE}"
```

**Embedding Rebuild Strategy:**

In case of catastrophic Milvus data loss, vectors can be **fully rebuilt** from source data:

```
Source Documents (S3/PostgreSQL)
       │
       ▼
  ┌─────────────────┐
  │  BGE-M3 Model   │  ← Re-run embedding pipeline
  │  (Embedding)    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Milvus Bulk    │  ← Parallel insert (batch size: 10K)
  │  Insert         │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Index Rebuild  │  ← IVF_FLAT or HNSW index
  │  (Automatic)    │
  └─────────────────┘

Estimated Full Rebuild Time:
  • medical_knowledge_vi (5M): ~4 hours (GPU-accelerated embedding)
  • Full corpus (18M+ vectors): ~16 hours
  • Strategy: Prioritize critical collections first (drug_interactions → medical_knowledge_vi → rest)
```

#### Elasticsearch Backup

| Method | Frequency | Retention | Notes |
|--------|-----------|-----------|-------|
| **Snapshot to S3** | Daily (04:00 UTC+7) | 14 days | SLM policy managed |
| **Index Lifecycle** | Automated | Hot: 7d → Warm: 30d → Cold: 90d → Delete | ILM policy |
| **Cross-cluster replication** | Continuous | N/A | DR cluster (production only) |

### 6.3 RTO/RPO Targets

#### Recovery Objectives by Failure Scenario

| Failure Scenario | RPO (Max Data Loss) | RTO (Max Downtime) | Recovery Strategy |
|-----------------|--------------------|--------------------|-------------------|
| **Single pod crash** | 0 (no data loss) | <30 seconds | K8s auto-restart, HPA |
| **Single node failure** | 0 | <2 minutes | K8s reschedule to healthy node |
| **AZ (Availability Zone) failure** | 0 | <5 minutes | Multi-AZ deployment, topology spread |
| **PostgreSQL primary failure** | <5 minutes (PITR) | <10 minutes | RDS Multi-AZ automatic failover |
| **Redis cluster failure** | <1 second (AOF) | <5 minutes | ElastiCache auto-failover + cache warming |
| **Milvus data corruption** | <24 hours | <4 hours | EBS snapshot restore + priority rebuild |
| **Full region outage** | <5 minutes | <30 minutes | Cross-region failover (Route53 + DR replica) |
| **GPU node failure** | 0 (stateless inference) | <15 minutes | Fallback to CPU inference / external API |
| **Complete data loss (worst case)** | <1 week (weekly S3 export) | <24 hours | Full restore from S3 + embedding rebuild |
| **Ransomware / security breach** | 0 (immutable backups) | <4 hours | Restore from S3 Glacier vault + rotate all secrets |

#### Disaster Recovery Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLARA DISASTER RECOVERY PLAN                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PRIMARY REGION: ap-southeast-1 (Singapore)                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  EKS Cluster ─── RDS Primary ─── ElastiCache ─── Milvus    │    │
│  │       │              │                │              │       │    │
│  │   [Active]    [Sync Replica]    [Auto-failover]   [EBS]     │    │
│  └───────┬──────────────┬────────────────┬──────────────┬──────┘    │
│          │              │                │              │            │
│          ▼              ▼                ▼              ▼            │
│  ┌─ S3 Backup Bucket ────────────────────────────────────────┐     │
│  │  • DB dumps (weekly)     • Milvus snapshots (daily)       │     │
│  │  • Redis exports (daily) • ES snapshots (daily)           │     │
│  │  • Config backups        • Model weights cache            │     │
│  │  • S3 Cross-Region Replication (CRR) enabled ──────────┐ │     │
│  └────────────────────────────────────────────────────────┬┘ │     │
│                                                           │  │      │
│  DR REGION: ap-southeast-2 (Sydney)                      │  │      │
│  ┌───────────────────────────────────────────────────────┬┘  │     │
│  │  RDS Read Replica (async) ── S3 Backup Copy           │   │     │
│  │  EKS Cluster (warm standby, scaled to 0)              │   │     │
│  │  Pre-configured Terraform (can spin up in <15 min)    │   │     │
│  └───────────────────────────────────────────────────────┘   │     │
└─────────────────────────────────────────────────────────────────────┘
```

#### DR Runbook Summary

| Step | Action | Owner | Time |
|------|--------|-------|------|
| 1 | Detect failure (automated monitoring + PagerDuty) | DevOps On-call | 0–2 min |
| 2 | Assess scope: pod/node/AZ/region failure | DevOps Lead | 2–5 min |
| 3a | **Pod/Node/AZ**: K8s auto-recovery, verify health | Automated | 1–5 min |
| 3b | **Region failure**: Initiate DR failover | DevOps Lead | 5–10 min |
| 4 | Promote RDS read replica in DR region | DevOps Lead | 5–10 min |
| 5 | Scale up EKS cluster in DR region | DevOps Lead | 5–10 min |
| 6 | Update Route53 DNS to point to DR region | DevOps Lead | 2–3 min |
| 7 | Restore Milvus from latest S3 snapshot | AI Engineer | 1–4 hours |
| 8 | Run cache warming scripts (Redis) | Backend Dev | 15–30 min |
| 9 | Verify all health checks pass | Team | 10–15 min |
| 10 | Notify stakeholders | Product Owner | 5 min |

#### DR Testing Schedule

| Test Type | Frequency | Scope | Duration |
|-----------|-----------|-------|----------|
| **Backup restore test** | Monthly | Restore PostgreSQL + Milvus from backup | 2 hours |
| **Failover drill** | Quarterly | Full DR failover to secondary region | 4 hours |
| **Chaos engineering** | Monthly | Random pod/node killing (Litmus Chaos) | 1 hour |
| **Tabletop exercise** | Semi-annual | Walk through worst-case scenarios with team | 2 hours |

#### S3 Versioning & Lifecycle Policy

```hcl
# deploy/terraform/aws/s3-backups.tf
resource "aws_s3_bucket" "clara_backups" {
  bucket = "clara-backups-${var.environment}"

  versioning {
    enabled = true
  }

  # Object Lock for ransomware protection
  object_lock_configuration {
    object_lock_enabled = "Enabled"
    rule {
      default_retention {
        mode = "GOVERNANCE"
        days = 30
      }
    }
  }

  lifecycle_rule {
    id      = "backup-lifecycle"
    enabled = true

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    # Keep backups for 7 years (VN healthcare compliance)
    expiration {
      days = 2555  # ~7 years
    }
  }

  # Cross-region replication
  replication_configuration {
    role = aws_iam_role.replication.arn

    rules {
      id     = "dr-replication"
      status = "Enabled"

      destination {
        bucket        = aws_s3_bucket.clara_backups_dr.arn
        storage_class = "STANDARD_IA"

        encryption_configuration {
          replica_kms_key_id = var.dr_kms_key_arn
        }
      }
    }
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.clara_backup.arn
      }
    }
  }
}
```

---

*Document generated for CLARA (Clinical Agent for Retrieval & Analysis) — Vietnamese Medical AI Assistant*
*© 2025 CLARA Project — Internal Technical Documentation*