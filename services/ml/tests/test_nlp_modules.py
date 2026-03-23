from pathlib import Path

from clara_ml.nlp.bge_adapter import BgeM3Pipeline
from clara_ml.nlp.pii_filter import redact_pii
from clara_ml.nlp.seed_loader import load_seed_json
from clara_ml.nlp.tokenizer import tokenize_vi_medical
from clara_ml.nlp.unicode_utils import has_tone_marks, normalize_nfc, validate_tone_marks


def test_unicode_normalization_and_tone_marks():
    txt = normalize_nfc("bệnh")
    assert txt
    assert has_tone_marks(txt)
    ok, _ = validate_tone_marks(txt)
    assert ok


def test_tokenizer_compound_words():
    tokens = tokenize_vi_medical("Bệnh nhân đái tháo đường và huyết áp cao")
    assert "đái_tháo_đường" in tokens
    assert "huyết_áp" in tokens


def test_pii_redaction():
    rs = redact_pii("SĐT 0912345678 email a@b.com CMND 123456789")
    assert rs.flags["phone"] == 1
    assert "REDACTED" in rs.redacted_text


def test_seed_loader_empty(tmp_path: Path):
    data = load_seed_json(tmp_path / "missing")
    assert data == []


def test_bge_adapter_batch():
    pipe = BgeM3Pipeline()
    out = pipe.embed_batch(["a", "b"])
    assert len(out) == 2
    assert len(out[0].vector) == 16
