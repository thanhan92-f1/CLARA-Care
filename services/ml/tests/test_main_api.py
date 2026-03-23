from fastapi.testclient import TestClient

from clara_ml.main import app

client = TestClient(app)


def test_routed_chat_infer_returns_routing_and_answer():
    response = client.post("/v1/chat/routed", json={"query": "Toi can tu van an uong khi dung thuoc."})
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "normal"
    assert body["emergency"] is False
    assert isinstance(body["retrieved_ids"], list)
    assert body["model_used"] in {"local-synth-v1", "deepseek-v3.2"}
    assert body["answer"]


def test_routed_chat_infer_emergency_fast_path():
    response = client.post("/v1/chat/routed", json={"query": "Kho tho, dau nguc du doi, xin giup."})
    assert response.status_code == 200
    body = response.json()
    assert body["emergency"] is True
    assert body["role"] == "doctor"
    assert body["intent"] == "emergency_triage"
    assert body["model_used"] == "emergency-fastpath-v1"
    assert body["retrieved_ids"] == []
