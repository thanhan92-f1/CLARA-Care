from clara_ml.llm.deepseek_client import DeepSeekResponse
from clara_ml.rag.langchain_adapter import build_prompt
from clara_ml.rag.pipeline import RagPipelineP0


def test_rag_pipeline_returns_sources_and_answer():
    pipe = RagPipelineP0(deepseek_api_key="")
    result = pipe.run("canh bao tuong tac thuoc")
    assert len(result.retrieved_ids) > 0
    assert "Tra loi" in result.answer
    assert result.model_used == "local-synth-v1"


def test_build_prompt_formats_variables():
    rendered = build_prompt(
        role="doctor",
        intent="doctor_case_review",
        template="Case: {case_summary}",
        variables={"case_summary": "BN nam 65t tang huyet ap"},
    )
    assert "doctor_case_review" in rendered
    assert "BN nam 65t" in rendered


class _FailingClient:
    @property
    def model(self) -> str:
        return "deepseek-v3.2"

    def generate(self, prompt: str, system_prompt: str | None = None):
        raise RuntimeError("provider down")


class _SuccessfulClient:
    @property
    def model(self) -> str:
        return "deepseek-v3.2"

    def generate(self, prompt: str, system_prompt: str | None = None) -> DeepSeekResponse:
        return DeepSeekResponse(content="provider-answer", model="deepseek-v3.2")


def test_rag_pipeline_uses_provider_when_key_exists():
    pipe = RagPipelineP0(
        deepseek_api_key="test-key",
        llm_client=_SuccessfulClient(),
    )
    result = pipe.run("canh bao nsaid")
    assert result.answer == "provider-answer"
    assert result.model_used == "deepseek-v3.2"


def test_rag_pipeline_fallback_when_deepseek_fails():
    pipe = RagPipelineP0(
        deepseek_api_key="test-key",
        llm_client=_FailingClient(),
    )
    result = pipe.run("canh bao tuong tac nsaid")
    assert result.model_used == "local-synth-v1"
    assert "Sources=[" in result.answer
