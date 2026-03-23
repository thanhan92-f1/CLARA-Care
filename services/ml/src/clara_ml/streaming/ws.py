from __future__ import annotations

import asyncio
from typing import AsyncIterator


async def token_stream(text: str, delay_s: float = 0.02) -> AsyncIterator[str]:
    """Skeleton stream token-by-token cho WebSocket."""
    for token in text.split():
        await asyncio.sleep(delay_s)
        yield token
