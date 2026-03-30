from __future__ import annotations

import time
from collections import defaultdict, deque
from dataclasses import dataclass
from threading import Lock

from clara_api.core.config import get_settings


@dataclass
class _LoginGuardState:
    attempts: deque[float]
    locked_until: float = 0.0


class LoginGuard:
    """In-memory login brute-force guard keyed by email + client IP."""

    def __init__(self) -> None:
        self._states: dict[str, _LoginGuardState] = defaultdict(
            lambda: _LoginGuardState(attempts=deque())
        )
        self._lock = Lock()

    def _prune(self, state: _LoginGuardState, now: float, window_seconds: int) -> None:
        cutoff = now - window_seconds
        while state.attempts and state.attempts[0] < cutoff:
            state.attempts.popleft()

    def is_blocked(self, key: str) -> int:
        settings = get_settings()
        now = time.time()
        with self._lock:
            state = self._states[key]
            self._prune(state, now, settings.auth_login_window_seconds)
            if state.locked_until <= now:
                return 0
            return max(1, int(state.locked_until - now))

    def register_failure(self, key: str) -> int:
        settings = get_settings()
        now = time.time()
        with self._lock:
            state = self._states[key]
            self._prune(state, now, settings.auth_login_window_seconds)
            state.attempts.append(now)
            if len(state.attempts) >= settings.auth_login_attempt_limit:
                state.locked_until = now + settings.auth_login_lock_seconds
            if state.locked_until <= now:
                return 0
            return max(1, int(state.locked_until - now))

    def register_success(self, key: str) -> None:
        with self._lock:
            self._states.pop(key, None)


login_guard = LoginGuard()
