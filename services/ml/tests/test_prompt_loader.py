from pathlib import Path

from clara_ml.prompts.loader import PromptLoader


def test_prompt_loader_reads_yaml_templates():
    base = Path(__file__).resolve().parents[1] / "src" / "clara_ml" / "prompts" / "templates"
    loader = PromptLoader(base)
    prompt = loader.load("normal_user", "selfmed_ddi_check")
    assert prompt["role"] == "normal_user"
    assert "template" in prompt
