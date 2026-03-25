from clara_ml.agents.careguard import run_careguard_analyze


def test_high_risk_pair_escalates_to_high() -> None:
    payload = {
        "symptoms": ["nausea"],
        "medications": ["warfarin", "ibuprofen"],
        "allergies": [],
        "labs": {},
    }
    result = run_careguard_analyze(payload)

    assert result["risk"]["level"] in {"high", "critical"}
    assert result["metadata"]["pipeline"] == "p2-careguard-ddi-standard-v2"
    assert isinstance(result["ddi_alerts"], list)
    assert len(result["ddi_alerts"]) >= 1
