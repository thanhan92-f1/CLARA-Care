from clara_ml.rag.langchain_adapter import build_prompt
from clara_ml.rag.pipeline import RagPipelineP0


def test_rag_pipeline_returns_sources_and_answer():
    pipe = RagPipelineP0()
    result = pipe.run("cảnh báo tương tác thuốc")
    assert len(result.retrieved_ids) > 0
    assert "Trả lời" in result.answer


def test_build_prompt_formats_variables():
    rendered = build_prompt(
        role="doctor",
        intent="doctor_case_review",
        template="Case: {case_summary}",
        variables={"case_summary": "BN nam 65t tăng huyết áp"},
    )
    assert "doctor_case_review" in rendered
    assert "BN nam 65t" in rendered
