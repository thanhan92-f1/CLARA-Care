from __future__ import annotations

import hashlib
from typing import List


class BgeM3EmbedderStub:
    """Adapter stub cho BGE-M3 (P0): tạo vector giả định từ hash."""

    def embed(self, text: str) -> List[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        # 16 chiều giả lập để test flow
        return [b / 255.0 for b in digest[:16]]
