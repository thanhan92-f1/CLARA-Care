from typing import Any

from clara_api.core.flow_event_store import FlowEventStore, get_flow_event_store
from clara_api.core.security import TokenPayload


class ChatFlowEventPersister:
    def __init__(self, *, store: FlowEventStore | None = None) -> None:
        self._store = store

    def _resolve_store(self) -> FlowEventStore:
        if self._store is not None:
            return self._store
        return get_flow_event_store()

    def _normalize_flow_events(self, payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, dict):
            return [payload]
        if not isinstance(payload, list):
            return []

        normalized: list[dict[str, Any]] = []
        for index, item in enumerate(payload):
            if isinstance(item, dict):
                normalized.append(item)
                continue
            normalized.append({"type": "raw_flow_event", "index": index, "value": item})
        return normalized

    def persist(
        self,
        *,
        token: TokenPayload,
        role: str,
        ml_response: dict[str, Any],
        source: str = "chat",
    ) -> None:
        raw_intent = ml_response.get("intent")
        intent = raw_intent if isinstance(raw_intent, str) and raw_intent else None
        raw_model_used = ml_response.get("model_used")
        model_used = raw_model_used if isinstance(raw_model_used, str) and raw_model_used else None

        flow_events = self._normalize_flow_events(ml_response.get("flow_events"))
        store = self._resolve_store()
        if flow_events:
            for index, flow_event in enumerate(flow_events):
                event_payload = dict(flow_event)
                event_payload.setdefault("index", index)
                store.append(
                    source=source,
                    user_id=token.sub or "unknown",
                    role=role,
                    intent=intent,
                    model_used=model_used,
                    event=event_payload,
                )
            return

        store.append(
            source=source,
            user_id=token.sub or "unknown",
            role=role,
            intent=intent,
            model_used=model_used,
            flow_events_missing=True,
            event={"type": "flow_events_missing"},
        )


_CHAT_FLOW_EVENT_PERSISTER = ChatFlowEventPersister()


def get_chat_flow_event_persister() -> ChatFlowEventPersister:
    return _CHAT_FLOW_EVENT_PERSISTER
