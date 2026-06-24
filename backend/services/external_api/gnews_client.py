"""
Insight IS — GNews Client (gnews.io)
"""

from typing import List
from datetime import datetime, timezone
import httpx
from loguru import logger


class GNewsClient:
    BASE = "https://gnews.io/api/v4"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def fetch(self, query: str = "finance", max_results: int = 50) -> List[dict]:
        if not self.api_key:
            logger.warning("GNews key not set, skipping")
            return []
        params = {
            "q": query,
            "max": min(max_results, 100),
            # Русскоязычные новости
            "lang": "ru",
            "country": "ru",
            "sortby": "publishedAt",
            "token": self.api_key,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(f"{self.BASE}/search", params=params)
                resp.raise_for_status()
                data = resp.json()
                return [self._normalize(a) for a in data.get("articles", [])]
            except Exception as e:
                logger.error(f"GNews error: {e}")
                return []

    @staticmethod
    def _normalize(a: dict) -> dict:
        pub = a.get("publishedAt")
        if pub:
            dt = datetime.fromisoformat(pub.replace("Z", "+00:00"))
            if dt.tzinfo:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            pub = dt
        return {
            "title": a.get("title", ""),
            "content": a.get("content") or a.get("description", ""),
            "source": a.get("source", {}).get("name", "GNews"),
            "url": a.get("url"),
            "publication_date": pub,
        }
