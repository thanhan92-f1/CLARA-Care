from clara_ml.routing import P1RoleIntentRouter


def test_router_detects_researcher_intent():
    router = P1RoleIntentRouter()
    result = router.route("Need a meta-analysis evidence summary from pubmed data.")
    assert result.role == "researcher"
    assert result.intent == "evidence_review"
    assert result.confidence >= 0.7
    assert result.emergency is False


def test_router_detects_doctor_intent():
    router = P1RoleIntentRouter()
    result = router.route("Bac si can DDI check cho benh nhan trong toa thuoc hien tai.")
    assert result.role == "doctor"
    assert result.intent == "doctor_ddi_check"
    assert result.confidence >= 0.7
    assert result.emergency is False


def test_router_emergency_fast_path():
    router = P1RoleIntentRouter()
    result = router.route("Toi dang kho tho va dau nguc du doi.")
    assert result.role == "doctor"
    assert result.intent == "emergency_triage"
    assert result.emergency is True
    assert result.confidence >= 0.99
