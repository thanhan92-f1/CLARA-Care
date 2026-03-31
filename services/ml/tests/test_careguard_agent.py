from clara_ml.agents.careguard import _load_local_ddi_rules, run_careguard_analyze


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


def test_local_ddi_rules_loaded_from_versioned_seed_file() -> None:
    rules, version = _load_local_ddi_rules()

    assert version == "v1"
    assert len(rules) >= 50


def test_external_ddi_flag_source_metadata_runtime_vs_env() -> None:
    env_result = run_careguard_analyze({"medications": ["warfarin"]})
    runtime_result = run_careguard_analyze(
        {"medications": ["warfarin"], "external_ddi_enabled": True}
    )

    assert env_result["metadata"]["external_ddi_flag_source"] == "env"
    assert runtime_result["metadata"]["external_ddi_flag_source"] == "runtime"
