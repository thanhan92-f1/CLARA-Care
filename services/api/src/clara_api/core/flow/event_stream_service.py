import asyncio
import json
import time

from fastapi import Request
from fastapi.responses import StreamingResponse

from clara_api.core.flow_event_store import FlowEventStore, get_flow_event_store

FLOW_EVENTS_MAX_LIMIT = 500
FLOW_EVENTS_DEFAULT_LIMIT = 100


class FlowEventStreamService:
    def __init__(self, *, store: FlowEventStore | None = None) -> None:
        self._store = store

    def _resolve_store(self) -> FlowEventStore:
        if self._store is not None:
            return self._store
        return get_flow_event_store()

    def coerce_limit(self, limit: int) -> int:
        if limit < 1:
            return 1
        if limit > FLOW_EVENTS_MAX_LIMIT:
            return FLOW_EVENTS_MAX_LIMIT
        return limit

    def list_events(
        self,
        *,
        limit: int,
        after_sequence: int | None = None,
        source: str | None = None,
    ) -> dict[str, object]:
        safe_limit = self.coerce_limit(limit)
        store = self._resolve_store()
        items = store.list_events(limit=safe_limit, after_sequence=after_sequence, source=source)
        return {
            "items": items,
            "limit": safe_limit,
            "after_sequence": after_sequence,
            "latest_sequence": store.latest_sequence(),
            "source": source,
        }

    def stream_response(
        self,
        *,
        request: Request,
        limit: int,
        after_sequence: int | None = None,
        source: str | None = None,
        heartbeat_seconds: int = 15,
        poll_interval_seconds: float = 1.0,
    ) -> StreamingResponse:
        safe_limit = self.coerce_limit(limit)
        safe_heartbeat_seconds = 5 if heartbeat_seconds < 5 else heartbeat_seconds
        safe_poll_interval = min(max(poll_interval_seconds, 0.2), 5.0)

        store = self._resolve_store()
        initial_sequence = after_sequence if after_sequence is not None else store.latest_sequence()

        async def event_stream():
            last_sequence = initial_sequence
            last_heartbeat_at = time.monotonic()
            yield ": connected\n\n"

            while True:
                if await request.is_disconnected():
                    break

                new_items = store.list_events(
                    limit=safe_limit,
                    after_sequence=last_sequence,
                    source=source,
                )
                if new_items:
                    for item in new_items:
                        sequence = item.get("sequence")
                        if isinstance(sequence, int):
                            last_sequence = sequence
                        payload = json.dumps(item, ensure_ascii=False)
                        yield (
                            f"id: {item.get('sequence')}\n"
                            f"event: flow_event\n"
                            f"data: {payload}\n\n"
                        )
                    last_heartbeat_at = time.monotonic()
                    continue

                if time.monotonic() - last_heartbeat_at >= safe_heartbeat_seconds:
                    yield ": keepalive\n\n"
                    last_heartbeat_at = time.monotonic()
                await asyncio.sleep(safe_poll_interval)

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )


_FLOW_EVENT_STREAM_SERVICE = FlowEventStreamService()


def get_flow_event_stream_service() -> FlowEventStreamService:
    return _FLOW_EVENT_STREAM_SERVICE
