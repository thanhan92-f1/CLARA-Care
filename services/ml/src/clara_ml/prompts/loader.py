from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import yaml


class PromptLoader:
    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir

    def load(self, role: str, intent: str) -> Dict[str, Any]:
        path = self.base_dir / f"{role}.yaml"
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        intents = data.get("intents", {})
        if intent not in intents:
            raise KeyError(f"Intent '{intent}' not found for role '{role}'")
        return {
            "role": role,
            "intent": intent,
            "system": data.get("system", ""),
            "template": intents[intent],
        }
