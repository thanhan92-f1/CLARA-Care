import pytest

from clara_ml.agents.base import AgentContext, BaseAgent
from clara_ml.agents.registry import AgentRegistry


class DummyAgent(BaseAgent):
    name = "dummy"

    async def arun(self, query: str, ctx: AgentContext):
        return {"query": query, "role": ctx.role, "intent": ctx.intent}


def test_registry_register_and_create():
    reg = AgentRegistry()
    reg.register("dummy", DummyAgent)
    agent = reg.create("dummy")
    assert isinstance(agent, DummyAgent)


def test_registry_duplicate_key_raises():
    reg = AgentRegistry()
    reg.register("dummy", DummyAgent)
    with pytest.raises(ValueError):
        reg.register("dummy", DummyAgent)


def test_registry_register_class_decorator():
    reg = AgentRegistry()

    @reg.register_class("decorated")
    class DecoratedAgent(BaseAgent):
        name = "decorated"

        async def arun(self, query: str, ctx: AgentContext):
            return {"ok": True}

    agent = reg.create("decorated")
    assert isinstance(agent, DecoratedAgent)


def test_registry_discover_module():
    reg = AgentRegistry()
    discovered = reg.discover(["clara_ml.agents.langgraph_workflow"])
    assert discovered == 0
