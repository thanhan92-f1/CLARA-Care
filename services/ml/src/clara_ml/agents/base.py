from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class AgentContext:
    role: str
    intent: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class BaseAgent(ABC):
    """Interface chuẩn cho mọi agent trong CLARA."""

    name: str = "base-agent"

    @abstractmethod
    async def arun(self, query: str, ctx: AgentContext) -> Dict[str, Any]:
        raise NotImplementedError
