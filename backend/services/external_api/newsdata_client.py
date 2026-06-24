"""
Insight IS — NewsData.io Client
"""

from typing import List
from datetime import datetime, timezone
import httpx
from loguru import logger


class NewsDataClient:
    BASE = "https://newsdata.io/api/1"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def fetch(self, query: str = "finance", size: int = 50) -> List[dict]:
        if not self.api_key:
            logger.warning("NewsData key not set, skipping")
            return []
        params = {
            "q": query,
            "size": min(size, 10),
            "language": "en",
            "apikey": self.api_key,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(f"{self.BASE}/news", params=params)
                resp.raise_for_status()
                data = resp.json()
                return [self._normalize(a) for a in data.get("results", [])]
            except Exception as e:
                logger.error(f"NewsData error: {e}")
                return []

    @staticmethod
    def _normalize(a: dict) -> dict:
        pub = a.get("pubDate")
        if pub:
            s = str(pub).replace("Z", "+00:00")
            dt = datetime.fromisoformat(s)
            if dt.tzinfo:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            pub = dt
        return {
            "title": a.get("title", ""),
            "content": a.get("content") or a.get("description", ""),
            "source": a.get("source_id", "NewsData"),
            "url": a.get("link"),
            "publication_date": pub,
        }
