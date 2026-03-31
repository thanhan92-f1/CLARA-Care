from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data/demo"
ARTIFACTS_ROOT = ROOT / "artifacts/round2"
GENERATOR_SCRIPT = ROOT / "scripts/demo/generate_demo_artifacts.py"

DDI_GOLDSET_PATH = DATA_DIR / "ddi-goldset.jsonl"
REFUSAL_SCENARIOS_PATH = DATA_DIR / "refusal-scenarios.jsonl"
FALLBACK_SCENARIOS_PATH = DATA_DIR / "fallback-scenarios.jsonl"
LATENCY_SCENARIOS_PATH = DATA_DIR / "latency-scenarios.jsonl"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run hackathon KPI scaffolding in static/live/auto mode and emit round2 artifacts."
    )
    parser.add_argument("--run-id", default="", help="Artifact run id under artifacts/round2.")
    parser.add_argument(
        "--mode",
        choices=("auto", "static", "live"),
        default="auto",
        help="Execution mode. 'auto' falls back to static if services or auth are unavailable.",
    )
    parser.add_argument(
        "--api-base-url",
        default=os.getenv("CLARA_API_BASE_URL", "http://127.0.0.1:8000"),
        help="API service base URL without trailing slash.",
    )
    parser.add_argument(
        "--ml-base-url",
        default=os.getenv("CLARA_ML_BASE_URL", "http://127.0.0.1:8001"),
        help="ML service base URL without trailing slash.",
    )
    parser.add_argument("--email", default=os.getenv("CLARA_DEMO_EMAIL", ""))
    parser.add_argument("--password", default=os.getenv("CLARA_DEMO_PASSWORD", ""))
    parser.add_argument("--doctor-email", default=os.getenv("CLARA_DOCTOR_EMAIL", ""))
    parser.add_argument("--doctor-password", default=os.getenv("CLARA_DOCTOR_PASSWORD", ""))
    parser.add_argument("--bearer-token", default=os.getenv("CLARA_BEARER_TOKEN", ""))
    parser.add_argument(
        "--doctor-bearer-token",
        default=os.getenv("CLARA_DOCTOR_BEARER_TOKEN", ""),
    )
    parser.add_argument("--timeout-seconds", type=float, default=12.0)
    parser.add_argument(
        "--strict-live",
        action="store_true",
        help="Fail if live mode cannot reach services or cannot authenticate.",
    )
    return parser.parse_args()


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw:
            continue
        rows.append(json.loads(raw))
    return rows


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def join_url(base_url: str, path: str) -> str:
    return base_url.rstrip("/") + "/" + path.lstrip("/")


def call_generator(run_id: str) -> None:
    cmd = [sys.executable, str(GENERATOR_SCRIPT)]
    if run_id:
        cmd.extend(["--run-id", run_id])
    subprocess.run(cmd, check=True, cwd=ROOT)


def percentile(sorted_values: list[float], p: float) -> float:
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return sorted_values[0]
    rank = (len(sorted_values) - 1) * p
    low = math.floor(rank)
    high = math.ceil(rank)
    if low == high:
        return sorted_values[low]
    weight = rank - low
    return sorted_values[low] * (1.0 - weight) + sorted_values[high] * weight


def severity_rank(value: str | None) -> int:
    normalized = (value or "").strip().lower()
    order = {
        "none": 0,
        "low": 1,
        "medium": 2,
        "moderate": 2,
        "high": 3,
        "severe": 3,
        "critical": 4,
        "contraindicated": 4,
    }
    return order.get(normalized, 0)


def coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return False


def coerce_alerts(payload: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("alerts", "interactions", "items", "ddi_alerts"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def coerce_fallback_used(payload: dict[str, Any]) -> bool:
    if "fallback_used" in payload:
        return coerce_bool(payload.get("fallback_used"))
    metadata = payload.get("metadata")
    if isinstance(metadata, dict) and "fallback_used" in metadata:
        return coerce_bool(metadata.get("fallback_used"))
    return coerce_bool(payload.get("fallback"))


def coerce_policy_action(payload: dict[str, Any]) -> str:
    direct = str(payload.get("policy_action") or "").strip().lower()
    if direct:
        return direct
    if str(payload.get("intent") or "").strip().lower() == "medical_policy_refusal":
        return "block"
    return ""


def response_summary_for_log(payload: dict[str, Any]) -> dict[str, Any]:
    alerts = coerce_alerts(payload)
    return {
        "policy_action": payload.get("policy_action"),
        "intent": payload.get("intent"),
        "guard_reason": payload.get("guard_reason"),
        "fallback_used": coerce_fallback_used(payload),
        "alert_count": len(alerts),
        "top_severity": max(
            [alert.get("severity") for alert in alerts if isinstance(alert.get("severity"), str)],
            default=None,
            key=severity_rank,
        ),
        "metadata": payload.get("metadata"),
    }


@dataclass
class HttpResult:
    ok: bool
    status_code: int
    payload: dict[str, Any]
    elapsed_ms: float
    error: str | None = None


class HttpJsonClient:
    def __init__(self, timeout_seconds: float) -> None:
        self.timeout_seconds = timeout_seconds

    def request_json(
        self,
        method: str,
        url: str,
        payload: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> HttpResult:
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
        body = None
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url=url,
            data=body,
            method=method.upper(),
            headers=request_headers,
        )
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                raw = response.read().decode("utf-8")
                elapsed_ms = (time.perf_counter() - started) * 1000.0
                parsed = json.loads(raw) if raw else {}
                if not isinstance(parsed, dict):
                    parsed = {"data": parsed}
                return HttpResult(
                    ok=True,
                    status_code=response.getcode(),
                    payload=parsed,
                    elapsed_ms=elapsed_ms,
                )
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            elapsed_ms = (time.perf_counter() - started) * 1000.0
            try:
                parsed = json.loads(raw) if raw else {}
                if not isinstance(parsed, dict):
                    parsed = {"data": parsed}
            except json.JSONDecodeError:
                parsed = {"raw": raw}
            return HttpResult(
                ok=False,
                status_code=exc.code,
                payload=parsed,
                elapsed_ms=elapsed_ms,
                error=f"HTTPError:{exc.code}",
            )
        except Exception as exc:  # noqa: BLE001
            elapsed_ms = (time.perf_counter() - started) * 1000.0
            return HttpResult(
                ok=False,
                status_code=0,
                payload={},
                elapsed_ms=elapsed_ms,
                error=f"{type(exc).__name__}:{exc}",
            )


class ClaraApiSession:
    def __init__(self, client: HttpJsonClient, base_url: str) -> None:
        self.client = client
        self.base_url = base_url.rstrip("/")
        self.token = ""
        self.role = ""
        self.email = ""

    def is_authenticated(self) -> bool:
        return bool(self.token)

    def auth_headers(self) -> dict[str, str]:
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}

    def use_bearer_token(self, token: str, *, email: str = "") -> None:
        self.token = token.strip()
        self.email = email

    def login(self, email: str, password: str) -> HttpResult:
        result = self.client.request_json(
            "POST",
            join_url(self.base_url, "/api/v1/auth/login"),
            payload={"email": email, "password": password},
        )
        token = str(result.payload.get("access_token") or "").strip()
        if result.ok and token:
            self.token = token
            self.email = email
            me_result = self.client.request_json(
                "GET",
                join_url(self.base_url, "/api/v1/auth/me"),
                headers=self.auth_headers(),
            )
            if me_result.ok:
                self.role = str(me_result.payload.get("role") or "").strip()
        return result

    def ensure_consent(self) -> HttpResult | None:
        if not self.token:
            return None
        status_result = self.client.request_json(
            "GET",
            join_url(self.base_url, "/api/v1/auth/consent-status"),
            headers=self.auth_headers(),
        )
        if not status_result.ok:
            return status_result
        if coerce_bool(status_result.payload.get("accepted")):
            return status_result
        required_version = str(status_result.payload.get("required_version") or "").strip()
        if not required_version:
            return status_result
        return self.client.request_json(
            "POST",
            join_url(self.base_url, "/api/v1/auth/consent"),
            payload={"consent_version": required_version, "accepted": True},
            headers=self.auth_headers(),
        )

    def get_runtime(self) -> HttpResult:
        return self.client.request_json(
            "GET",
            join_url(self.base_url, "/api/v1/system/careguard/runtime"),
            headers=self.auth_headers(),
        )

    def put_runtime(self, payload: dict[str, Any]) -> HttpResult:
        return self.client.request_json(
            "PUT",
            join_url(self.base_url, "/api/v1/system/careguard/runtime"),
            payload=payload,
            headers=self.auth_headers(),
        )

    def careguard_analyze(self, payload: dict[str, Any]) -> HttpResult:
        return self.client.request_json(
            "POST",
            join_url(self.base_url, "/api/v1/careguard/analyze"),
            payload=payload,
            headers=self.auth_headers(),
        )

    def research_tier2(self, payload: dict[str, Any]) -> HttpResult:
        return self.client.request_json(
            "POST",
            join_url(self.base_url, "/api/v1/research/tier2"),
            payload=payload,
            headers=self.auth_headers(),
        )


def detect_live_capability(
    client: HttpJsonClient,
    api_base_url: str,
    ml_base_url: str,
) -> dict[str, Any]:
    api_health = client.request_json("GET", join_url(api_base_url, "/health"))
    ml_health = client.request_json("GET", join_url(ml_base_url, "/health"))
    return {
        "api_reachable": api_health.ok and api_health.status_code == 200,
        "ml_reachable": ml_health.ok and ml_health.status_code == 200,
        "api_health": {
            "ok": api_health.ok,
            "status_code": api_health.status_code,
            "elapsed_ms": round(api_health.elapsed_ms, 2),
            "error": api_health.error,
        },
        "ml_health": {
            "ok": ml_health.ok,
            "status_code": ml_health.status_code,
            "elapsed_ms": round(ml_health.elapsed_ms, 2),
            "error": ml_health.error,
        },
    }


def evaluate_ddi_case(case: dict[str, Any], result: HttpResult) -> dict[str, Any]:
    alerts = coerce_alerts(result.payload)
    top_severity = max(
        [alert.get("severity") for alert in alerts if isinstance(alert.get("severity"), str)],
        default="none",
        key=severity_rank,
    )
    combined_text = " ".join(
        [
            str(alert.get("message") or "")
            for alert in alerts
            if isinstance(alert, dict)
        ]
    )
    combined_text = f"{combined_text} {result.payload.get('recommendation') or ''}".lower()
    expected_alert = coerce_bool(case.get("expected_alert"))
    expected_min_severity = str(case.get("expected_min_severity") or "none").strip().lower()
    expected_tokens = [str(token).strip().lower() for token in case.get("expected_tokens", [])]
    actual_alert = len(alerts) > 0

    if not result.ok:
        passed = False
        failure_reason = result.error or f"http_{result.status_code}"
    elif expected_alert:
        passed = (
            actual_alert
            and severity_rank(str(top_severity)) >= severity_rank(expected_min_severity)
            and all(token in combined_text for token in expected_tokens)
        )
        failure_reason = None if passed else "alert_mismatch"
    else:
        passed = not actual_alert
        failure_reason = None if passed else "unexpected_alert"

    return {
        "case_id": case["case_id"],
        "status": "passed" if passed else "failed",
        "expected_alert": expected_alert,
        "actual_alert": actual_alert,
        "expected_min_severity": expected_min_severity,
        "actual_top_severity": top_severity,
        "alert_count": len(alerts),
        "latency_ms": round(result.elapsed_ms, 2),
        "failure_reason": failure_reason,
        "response_summary": response_summary_for_log(result.payload),
    }


def evaluate_refusal_case(case: dict[str, Any], result: HttpResult) -> dict[str, Any]:
    expected_action = str(case.get("expected_policy_action") or "block").strip().lower()
    expected_model = str(case.get("expected_model") or "").strip().lower()
    expected_reasons = [
        str(value).strip().lower() for value in case.get("expected_guard_reason_any", [])
    ]
    actual_action = coerce_policy_action(result.payload)
    actual_model = str(result.payload.get("model_used") or "").strip().lower()
    actual_reason = str(result.payload.get("guard_reason") or "").strip().lower()
    passed = bool(result.ok) and actual_action == expected_action
    if expected_model:
        passed = passed and actual_model == expected_model
    if expected_reasons:
        passed = passed and actual_reason in expected_reasons
    return {
        "case_id": case["case_id"],
        "status": "passed" if passed else "failed",
        "expected_policy_action": expected_action,
        "actual_policy_action": actual_action,
        "expected_model": expected_model,
        "actual_model": actual_model,
        "expected_guard_reason_any": expected_reasons,
        "actual_guard_reason": actual_reason,
        "latency_ms": round(result.elapsed_ms, 2),
        "failure_reason": None if passed else result.error or "refusal_contract_mismatch",
        "response_summary": response_summary_for_log(result.payload),
    }


def evaluate_fallback_case(case: dict[str, Any], result: HttpResult) -> dict[str, Any]:
    alerts = coerce_alerts(result.payload)
    fallback_used = coerce_fallback_used(result.payload)
    source_text = json.dumps(result.payload, ensure_ascii=False).lower()
    expected_sources = [
        str(value).strip().lower() for value in case.get("expected_source_any", [])
    ]
    expected_min_alerts = int(case.get("expected_min_alerts") or 0)
    expect_fallback_used = coerce_bool(case.get("expect_fallback_used"))

    passed = (
        result.ok
        and fallback_used == expect_fallback_used
        and len(alerts) >= expected_min_alerts
        and (
            not expected_sources
            or any(source in source_text for source in expected_sources)
        )
    )
    return {
        "case_id": case["case_id"],
        "status": "passed" if passed else "failed",
        "expected_fallback_used": expect_fallback_used,
        "actual_fallback_used": fallback_used,
        "expected_min_alerts": expected_min_alerts,
        "actual_alert_count": len(alerts),
        "latency_ms": round(result.elapsed_ms, 2),
        "failure_reason": None if passed else result.error or "fallback_contract_mismatch",
        "response_summary": response_summary_for_log(result.payload),
    }


def build_dataset_overview(
    ddi_cases: list[dict[str, Any]],
    refusal_cases: list[dict[str, Any]],
    fallback_cases: list[dict[str, Any]],
    latency_cases: list[dict[str, Any]],
) -> dict[str, Any]:
    ddi_positive = sum(1 for case in ddi_cases if coerce_bool(case.get("expected_alert")))
    return {
        "ddi_goldset": {
            "path": str(DDI_GOLDSET_PATH.relative_to(ROOT)),
            "cases": len(ddi_cases),
            "positive_cases": ddi_positive,
            "negative_cases": len(ddi_cases) - ddi_positive,
        },
        "refusal_scenarios": {
            "path": str(REFUSAL_SCENARIOS_PATH.relative_to(ROOT)),
            "cases": len(refusal_cases),
        },
        "fallback_scenarios": {
            "path": str(FALLBACK_SCENARIOS_PATH.relative_to(ROOT)),
            "cases": len(fallback_cases),
        },
        "latency_scenarios": {
            "path": str(LATENCY_SCENARIOS_PATH.relative_to(ROOT)),
            "cases": len(latency_cases),
            "profiles": dict(Counter(str(case.get("profile") or "default") for case in latency_cases)),
        },
    }


def summarize_case_results(case_results: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(case_results)
    passed = sum(1 for item in case_results if item["status"] == "passed")
    failed = total - passed
    rate = 0.0 if total == 0 else (passed / total) * 100.0
    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "rate_percent": round(rate, 2),
    }


def summarize_latencies(samples: list[dict[str, Any]]) -> dict[str, Any]:
    values = sorted(sample["latency_ms"] for sample in samples if sample["status"] != "blocked")
    by_endpoint: dict[str, list[float]] = defaultdict(list)
    for sample in samples:
        if sample["status"] == "blocked":
            continue
        by_endpoint[str(sample["endpoint"])].append(sample["latency_ms"])
    per_endpoint = {
        endpoint: {
            "count": len(endpoint_values),
            "p50_ms": round(percentile(sorted(endpoint_values), 0.50), 2),
            "p95_ms": round(percentile(sorted(endpoint_values), 0.95), 2),
            "max_ms": round(max(endpoint_values), 2),
        }
        for endpoint, endpoint_values in by_endpoint.items()
        if endpoint_values
    }
    return {
        "count": len(values),
        "p50_ms": round(percentile(values, 0.50), 2) if values else 0.0,
        "p95_ms": round(percentile(values, 0.95), 2) if values else 0.0,
        "max_ms": round(max(values), 2) if values else 0.0,
        "by_endpoint": per_endpoint,
    }


def render_simple_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    widths = [max(len(row[index]) for row in rows) for index in range(len(rows[0]))]
    rendered: list[str] = []
    for idx, row in enumerate(rows):
        rendered.append("| " + " | ".join(value.ljust(widths[col]) for col, value in enumerate(row)) + " |")
        if idx == 0:
            rendered.append("| " + " | ".join("-" * width for width in widths) + " |")
    return "\n".join(rendered)


def render_kpi_report_markdown(report: dict[str, Any]) -> str:
    metrics = report["metrics"]
    latency = metrics["latency"]
    table = render_simple_table(
        [
            ["Metric", "Passed", "Total", "Rate"],
            [
                "DDI precision proxy",
                str(metrics["ddi_precision"]["passed"]),
                str(metrics["ddi_precision"]["total"]),
                f'{metrics["ddi_precision"]["rate_percent"]:.2f}%',
            ],
            [
                "Refusal compliance",
                str(metrics["refusal_compliance"]["passed"]),
                str(metrics["refusal_compliance"]["total"]),
                f'{metrics["refusal_compliance"]["rate_percent"]:.2f}%',
            ],
            [
                "Fallback success rate",
                str(metrics["fallback_success_rate"]["passed"]),
                str(metrics["fallback_success_rate"]["total"]),
                f'{metrics["fallback_success_rate"]["rate_percent"]:.2f}%',
            ],
        ]
    )
    lines = [
        "# KPI Report",
        "",
        f"- Run ID: `{report['run_id']}`",
        f"- Generated at (UTC): `{report['generated_at']}`",
        f"- Execution mode: `{report['execution_mode']}`",
        f"- Live executed: `{str(report['live_executed']).lower()}`",
        "",
        "## Dataset Overview",
        f"- DDI goldset: **{report['datasets']['ddi_goldset']['cases']}** cases",
        f"- Refusal scenarios: **{report['datasets']['refusal_scenarios']['cases']}** cases",
        f"- Fallback scenarios: **{report['datasets']['fallback_scenarios']['cases']}** cases",
        f"- Latency scenarios: **{report['datasets']['latency_scenarios']['cases']}** cases",
        "",
        "## Core Metrics",
        table,
        "",
        "## Latency",
        f"- p50: **{latency['p50_ms']:.2f} ms**",
        f"- p95: **{latency['p95_ms']:.2f} ms**",
        f"- max: **{latency['max_ms']:.2f} ms**",
        "",
        "## Environment",
        f"- API reachable: `{str(report['environment']['availability']['api_reachable']).lower()}`",
        f"- ML reachable: `{str(report['environment']['availability']['ml_reachable']).lower()}`",
        "",
        "## Notes",
    ]
    lines.extend(f"- {note}" for note in report.get("notes", []))
    return "\n".join(lines) + "\n"


def render_test_report_markdown(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# Test Report",
        "",
        f"- Run ID: `{report['run_id']}`",
        f"- Generated at (UTC): `{report['generated_at']}`",
        f"- Execution mode: `{report['execution_mode']}`",
        "",
        "## Summary",
        f"- Passed: **{summary['passed']}**",
        f"- Failed: **{summary['failed']}**",
        f"- Blocked: **{summary['blocked']}**",
        "",
        "## Case Breakdown",
    ]
    for section_name in ("ddi_cases", "refusal_cases", "fallback_cases", "latency_cases"):
        items = report["cases"].get(section_name, [])
        lines.append(f"### {section_name}")
        if not items:
            lines.append("- No cases.")
            lines.append("")
            continue
        table_rows = [["Case", "Status", "Latency (ms)", "Reason"]]
        for item in items:
            table_rows.append(
                [
                    str(item.get("case_id") or ""),
                    str(item.get("status") or ""),
                    str(item.get("latency_ms") or ""),
                    str(item.get("failure_reason") or ""),
                ]
            )
        lines.append(render_simple_table(table_rows))
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def render_fallback_proof_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Fallback Proof",
        "",
        f"- Run ID: `{report['run_id']}`",
        f"- Generated at (UTC): `{report['generated_at']}`",
        f"- Toggle method: `{report['toggle_method']}`",
        "",
        "## Summary",
        f"- Passed: **{report['summary']['passed']}**",
        f"- Failed: **{report['summary']['failed']}**",
        "",
        "## Scenario Evidence",
    ]
    rows = [["Case", "Status", "Fallback used", "Alerts", "Latency (ms)"]]
    for item in report["cases"]:
        rows.append(
            [
                str(item.get("case_id") or ""),
                str(item.get("status") or ""),
                str(item.get("actual_fallback_used") or ""),
                str(item.get("actual_alert_count") or ""),
                str(item.get("latency_ms") or ""),
            ]
        )
    lines.append(render_simple_table(rows))
    lines.append("")
    lines.append("## Restore")
    lines.append(f"- Restored runtime config: `{str(report['restored']).lower()}`")
    if report.get("notes"):
        lines.append("")
        lines.append("## Notes")
        lines.extend(f"- {note}" for note in report["notes"])
    return "\n".join(lines) + "\n"


def static_latency_results(latency_cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for case in latency_cases:
        output.append(
            {
                "case_id": case["case_id"],
                "endpoint": case["endpoint"],
                "profile": case.get("profile"),
                "status": "blocked",
                "latency_ms": 0.0,
                "budget_ms": case.get("budget_ms"),
                "failure_reason": "static_mode_not_executed",
            }
        )
    return output


def run_live(
    *,
    args: argparse.Namespace,
    ddi_cases: list[dict[str, Any]],
    refusal_cases: list[dict[str, Any]],
    fallback_cases: list[dict[str, Any]],
    latency_cases: list[dict[str, Any]],
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    client = HttpJsonClient(timeout_seconds=args.timeout_seconds)
    availability = detect_live_capability(client, args.api_base_url, args.ml_base_url)
    if not availability["api_reachable"]:
        raise RuntimeError("API service is not reachable for live KPI run.")

    user_session = ClaraApiSession(client, args.api_base_url)
    doctor_session = ClaraApiSession(client, args.api_base_url)

    if args.bearer_token:
        user_session.use_bearer_token(args.bearer_token, email=args.email)
    elif args.email and args.password:
        login_result = user_session.login(args.email, args.password)
        if not login_result.ok:
            raise RuntimeError(f"User login failed: {login_result.error or login_result.payload}")
    else:
        raise RuntimeError("Missing user auth for live KPI run.")
    consent_result = user_session.ensure_consent()
    if consent_result is not None and not consent_result.ok:
        raise RuntimeError(f"Consent setup failed: {consent_result.error or consent_result.payload}")

    toggle_method = "unavailable"
    original_runtime: dict[str, Any] | None = None
    if args.doctor_bearer_token:
        doctor_session.use_bearer_token(args.doctor_bearer_token, email=args.doctor_email)
    elif args.doctor_email and args.doctor_password:
        doctor_login = doctor_session.login(args.doctor_email, args.doctor_password)
        if doctor_login.ok:
            toggle_method = "api-control-tower"
    if doctor_session.is_authenticated():
        runtime_result = doctor_session.get_runtime()
        if runtime_result.ok:
            original_runtime = dict(runtime_result.payload)
            toggle_method = "api-control-tower"

    ddi_results: list[dict[str, Any]] = []
    for case in ddi_cases:
        result = user_session.careguard_analyze({"medications": case["medications"]})
        ddi_results.append(evaluate_ddi_case(case, result))

    refusal_results: list[dict[str, Any]] = []
    for case in refusal_cases:
        result = user_session.research_tier2(
            {"query": case["query"], "research_mode": "fast"}
        )
        refusal_results.append(evaluate_refusal_case(case, result))

    fallback_results: list[dict[str, Any]] = []
    fallback_notes: list[str] = []
    if original_runtime is None:
        fallback_notes.append(
            "Fallback live verification skipped toggle because doctor/admin runtime access was unavailable."
        )
        for case in fallback_cases:
            fallback_results.append(
                {
                    "case_id": case["case_id"],
                    "status": "blocked",
                    "expected_fallback_used": case.get("expect_fallback_used"),
                    "actual_fallback_used": None,
                    "expected_min_alerts": case.get("expected_min_alerts"),
                    "actual_alert_count": 0,
                    "latency_ms": 0.0,
                    "failure_reason": "runtime_toggle_unavailable",
                }
            )
    else:
        force_local_payload = dict(original_runtime)
        force_local_payload["external_ddi_enabled"] = False
        toggle_result = doctor_session.put_runtime(force_local_payload)
        if not toggle_result.ok:
            raise RuntimeError(
                f"Failed to disable external DDI runtime toggle: {toggle_result.error or toggle_result.payload}"
            )
        try:
            for case in fallback_cases:
                result = user_session.careguard_analyze({"medications": case["medications"]})
                fallback_results.append(evaluate_fallback_case(case, result))
        finally:
            restore_result = doctor_session.put_runtime(original_runtime)
            restored = restore_result.ok
            if not restored:
                fallback_notes.append(
                    f"Failed to restore original runtime config: {restore_result.error or restore_result.payload}"
                )
    restored = bool(original_runtime is None or fallback_notes == [] or "Failed to restore" not in " ".join(fallback_notes))

    latency_results: list[dict[str, Any]] = []
    for case in latency_cases:
        endpoint = str(case.get("endpoint") or "")
        payload = dict(case.get("payload") or {})
        profile = str(case.get("profile") or "default")
        if endpoint == "careguard":
            toggled = False
            if original_runtime is not None and profile == "offline":
                force_local_payload = dict(original_runtime)
                force_local_payload["external_ddi_enabled"] = False
                toggle_result = doctor_session.put_runtime(force_local_payload)
                toggled = toggle_result.ok
            try:
                result = user_session.careguard_analyze(payload)
            finally:
                if original_runtime is not None and profile == "offline" and toggled:
                    doctor_session.put_runtime(original_runtime)
        elif endpoint == "research_tier2":
            result = user_session.research_tier2(payload)
        else:
            result = HttpResult(
                ok=False,
                status_code=0,
                payload={},
                elapsed_ms=0.0,
                error=f"unsupported_endpoint:{endpoint}",
            )
        latency_results.append(
            {
                "case_id": case["case_id"],
                "endpoint": endpoint,
                "profile": profile,
                "status": "passed" if result.ok else "failed",
                "latency_ms": round(result.elapsed_ms, 2),
                "budget_ms": case.get("budget_ms"),
                "within_budget": result.ok and result.elapsed_ms <= float(case.get("budget_ms") or 0),
                "failure_reason": None if result.ok else result.error,
            }
        )

    test_report = {
        "run_id": args.run_id,
        "generated_at": utcnow(),
        "execution_mode": "live",
        "cases": {
            "ddi_cases": ddi_results,
            "refusal_cases": refusal_results,
            "fallback_cases": fallback_results,
            "latency_cases": latency_results,
        },
    }
    summary_counts = Counter()
    for group in test_report["cases"].values():
        for item in group:
            summary_counts[str(item.get("status") or "unknown")] += 1
    test_report["summary"] = {
        "passed": summary_counts.get("passed", 0),
        "failed": summary_counts.get("failed", 0),
        "blocked": summary_counts.get("blocked", 0),
    }

    kpi_report = {
        "run_id": args.run_id,
        "generated_at": utcnow(),
        "execution_mode": "live",
        "live_executed": True,
        "datasets": build_dataset_overview(ddi_cases, refusal_cases, fallback_cases, latency_cases),
        "environment": {
            "api_base_url": args.api_base_url,
            "ml_base_url": args.ml_base_url,
            "availability": availability,
        },
        "metrics": {
            "ddi_precision": summarize_case_results(ddi_results),
            "refusal_compliance": summarize_case_results(refusal_results),
            "fallback_success_rate": summarize_case_results(fallback_results),
            "latency": summarize_latencies(latency_results),
        },
        "notes": [
            "Live KPI run executed against current API/ML endpoints.",
            "DDI metric is a precision proxy against repo goldset, not a clinical validation metric.",
            "Refusal metric checks hard-guard contract fields only.",
        ],
    }

    fallback_proof = {
        "run_id": args.run_id,
        "generated_at": utcnow(),
        "toggle_method": toggle_method,
        "restored": restored,
        "summary": summarize_case_results(fallback_results),
        "cases": fallback_results,
        "notes": fallback_notes,
    }
    return kpi_report, test_report, fallback_proof


def run_static(
    *,
    run_id: str,
    api_base_url: str,
    ml_base_url: str,
    ddi_cases: list[dict[str, Any]],
    refusal_cases: list[dict[str, Any]],
    fallback_cases: list[dict[str, Any]],
    latency_cases: list[dict[str, Any]],
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    ddi_results = [
        {
            "case_id": case["case_id"],
            "status": "blocked",
            "expected_alert": case.get("expected_alert"),
            "actual_alert": None,
            "expected_min_severity": case.get("expected_min_severity"),
            "actual_top_severity": None,
            "alert_count": 0,
            "latency_ms": 0.0,
            "failure_reason": "static_mode_not_executed",
        }
        for case in ddi_cases
    ]
    refusal_results = [
        {
            "case_id": case["case_id"],
            "status": "blocked",
            "expected_policy_action": case.get("expected_policy_action"),
            "actual_policy_action": None,
            "expected_model": case.get("expected_model"),
            "actual_model": None,
            "expected_guard_reason_any": case.get("expected_guard_reason_any"),
            "actual_guard_reason": None,
            "latency_ms": 0.0,
            "failure_reason": "static_mode_not_executed",
        }
        for case in refusal_cases
    ]
    fallback_results = [
        {
            "case_id": case["case_id"],
            "status": "blocked",
            "expected_fallback_used": case.get("expect_fallback_used"),
            "actual_fallback_used": None,
            "expected_min_alerts": case.get("expected_min_alerts"),
            "actual_alert_count": 0,
            "latency_ms": 0.0,
            "failure_reason": "static_mode_not_executed",
        }
        for case in fallback_cases
    ]
    latency_results = static_latency_results(latency_cases)

    test_report = {
        "run_id": run_id,
        "generated_at": utcnow(),
        "execution_mode": "static",
        "cases": {
            "ddi_cases": ddi_results,
            "refusal_cases": refusal_results,
            "fallback_cases": fallback_results,
            "latency_cases": latency_results,
        },
        "summary": {
            "passed": 0,
            "failed": 0,
            "blocked": len(ddi_results) + len(refusal_results) + len(fallback_results) + len(latency_results),
        },
    }
    kpi_report = {
        "run_id": run_id,
        "generated_at": utcnow(),
        "execution_mode": "static",
        "live_executed": False,
        "datasets": build_dataset_overview(ddi_cases, refusal_cases, fallback_cases, latency_cases),
        "environment": {
            "api_base_url": api_base_url,
            "ml_base_url": ml_base_url,
            "availability": {
                "api_reachable": False,
                "ml_reachable": False,
                "api_health": {"ok": False, "status_code": 0, "elapsed_ms": 0.0, "error": "not_checked"},
                "ml_health": {"ok": False, "status_code": 0, "elapsed_ms": 0.0, "error": "not_checked"},
            },
        },
        "metrics": {
            "ddi_precision": {"total": len(ddi_cases), "passed": 0, "failed": 0, "rate_percent": 0.0},
            "refusal_compliance": {"total": len(refusal_cases), "passed": 0, "failed": 0, "rate_percent": 0.0},
            "fallback_success_rate": {"total": len(fallback_cases), "passed": 0, "failed": 0, "rate_percent": 0.0},
            "latency": summarize_latencies(latency_results),
        },
        "notes": [
            "Static mode only validates dataset presence and artifact structure.",
            "Use live mode with API/ML services and credentials to populate measured KPI values.",
        ],
    }
    fallback_proof = {
        "run_id": run_id,
        "generated_at": utcnow(),
        "toggle_method": "not_executed",
        "restored": True,
        "summary": {"total": len(fallback_cases), "passed": 0, "failed": 0, "rate_percent": 0.0},
        "cases": fallback_results,
        "notes": ["Fallback proof was not executed because runner used static mode."],
    }
    return kpi_report, test_report, fallback_proof


def write_reports(
    run_id: str,
    kpi_report: dict[str, Any],
    test_report: dict[str, Any],
    fallback_proof: dict[str, Any],
) -> None:
    run_root = ARTIFACTS_ROOT / run_id
    write_json(run_root / "kpi-report/kpi-report.json", kpi_report)
    write_text(run_root / "kpi-report/kpi-report.md", render_kpi_report_markdown(kpi_report))
    write_json(run_root / "test-report/test-report.json", test_report)
    write_text(run_root / "test-report/test-report.md", render_test_report_markdown(test_report))
    write_json(run_root / "fallback-proof/fallback-proof.json", fallback_proof)
    write_text(run_root / "fallback-proof/README.md", render_fallback_proof_markdown(fallback_proof))


def ensure_run_id(raw_value: str) -> str:
    normalized = raw_value.strip()
    if normalized:
        return normalized
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def main() -> None:
    args = parse_args()
    args.run_id = ensure_run_id(args.run_id)

    ddi_cases = read_jsonl(DDI_GOLDSET_PATH)
    refusal_cases = read_jsonl(REFUSAL_SCENARIOS_PATH)
    fallback_cases = read_jsonl(FALLBACK_SCENARIOS_PATH)
    latency_cases = read_jsonl(LATENCY_SCENARIOS_PATH)

    call_generator(args.run_id)

    if args.mode == "static":
        kpi_report, test_report, fallback_proof = run_static(
            run_id=args.run_id,
            api_base_url=args.api_base_url,
            ml_base_url=args.ml_base_url,
            ddi_cases=ddi_cases,
            refusal_cases=refusal_cases,
            fallback_cases=fallback_cases,
            latency_cases=latency_cases,
        )
    else:
        try:
            kpi_report, test_report, fallback_proof = run_live(
                args=args,
                ddi_cases=ddi_cases,
                refusal_cases=refusal_cases,
                fallback_cases=fallback_cases,
                latency_cases=latency_cases,
            )
        except Exception as exc:  # noqa: BLE001
            if args.mode == "live" and args.strict_live:
                raise
            kpi_report, test_report, fallback_proof = run_static(
                run_id=args.run_id,
                api_base_url=args.api_base_url,
                ml_base_url=args.ml_base_url,
                ddi_cases=ddi_cases,
                refusal_cases=refusal_cases,
                fallback_cases=fallback_cases,
                latency_cases=latency_cases,
            )
            kpi_report["notes"].append(f"Live execution downgraded to static mode: {type(exc).__name__}: {exc}")
            fallback_proof["notes"].append(f"Live execution downgraded to static mode: {type(exc).__name__}: {exc}")
            test_report["downgraded_from_live_error"] = f"{type(exc).__name__}: {exc}"
            kpi_report["execution_mode"] = "static-downgraded"
            test_report["execution_mode"] = "static-downgraded"
            fallback_proof["toggle_method"] = "downgraded_to_static"

    write_reports(args.run_id, kpi_report, test_report, fallback_proof)

    print(f"Generated KPI artifacts for run_id={args.run_id}")
    print(f"- {ARTIFACTS_ROOT.joinpath(args.run_id, 'kpi-report/kpi-report.json').relative_to(ROOT)}")
    print(f"- {ARTIFACTS_ROOT.joinpath(args.run_id, 'test-report/test-report.json').relative_to(ROOT)}")
    print(f"- {ARTIFACTS_ROOT.joinpath(args.run_id, 'fallback-proof/fallback-proof.json').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
