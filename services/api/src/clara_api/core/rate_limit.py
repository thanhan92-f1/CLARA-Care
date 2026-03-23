import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from clara_api.core.config import get_settings


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """In-memory global rate limiter for P0.

    Keyed by client ip + path. Suitable for skeleton/dev.
    """

    def __init__(self, app):
        super().__init__(app)
        self._buckets: dict[str, Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        key = f"{request.client.host if request.client else 'unknown'}:{request.url.path}"
        now = time.time()
        cutoff = now - settings.rate_limit_window_seconds

        q = self._buckets[key]
        while q and q[0] < cutoff:
            q.popleft()

        if len(q) >= settings.rate_limit_requests:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Quá giới hạn request, vui lòng thử lại sau"},
            )

        q.append(now)
        return await call_next(request)
