from collections import Counter
from threading import Lock
from time import perf_counter
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class APIMetricsStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._requests_total = 0
        self._latency_total_ms = 0.0
        self._by_route: Counter[str] = Counter()
        self._by_status: Counter[str] = Counter()

    def record(self, route: str, status_code: int, latency_ms: float) -> None:
        with self._lock:
            self._requests_total += 1
            self._latency_total_ms += latency_ms
            self._by_route[route] += 1
            self._by_status[str(status_code)] += 1

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            requests_total = self._requests_total
            avg_latency_ms = self._latency_total_ms / requests_total if requests_total else 0.0
            return {
                "requests_total": requests_total,
                "by_route": dict(self._by_route),
                "by_status": dict(self._by_status),
                "avg_latency_ms": round(avg_latency_ms, 3),
            }


def _resolve_route(request: Request) -> str:
    route = request.scope.get("route")
    if route is not None:
        route_path = getattr(route, "path", None)
        if isinstance(route_path, str) and route_path:
            return route_path
    return request.url.path


class APIMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        started = perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            elapsed_ms = (perf_counter() - started) * 1000
            get_api_metrics_store().record(_resolve_route(request), status_code, elapsed_ms)


_api_metrics_store = APIMetricsStore()


def get_api_metrics_store() -> APIMetricsStore:
    return _api_metrics_store
