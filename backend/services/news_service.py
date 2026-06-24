"""
Insight IS — News Collection Service.
Сбор новостей из RSS (РИА и др.), подтягивание полного текста со страниц ria.ru.
"""

import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from loguru import logger

from settings.settings import settings
from services.external_api.rss_client import fetch_ria_rss
from services.ria_parser import fetch_ria_article_content


def _naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Привести дату к naive UTC для TIMESTAMP WITHOUT TIME ZONE."""
    if dt is None:
        return None
    if getattr(dt, "tzinfo", None) is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class NewsService:
    def __init__(self):
        self.rss_feed_url = getattr(settings, "rss_feed_url", "https://ria.ru/export/rss2/index.xml")

    async def fetch_all(self, query: str = "finance", max_per_source: int = 50) -> List[dict]:
        """
        Собирает новости из RSS (только за сегодня).
        Для статей ria.ru подтягивает полный текст со страницы и отдаёт его в content.
        Возвращает список: {title, content, source, url, publication_date}.
        """
        articles = await fetch_ria_rss(
            feed_url=self.rss_feed_url,
            only_today=True,
        )
        if not articles:
            logger.info("RSS: статей за сегодня нет.")
            return []

        # Для каждой статьи с ria.ru подтягиваем полный текст
        for a in articles:
            a["publication_date"] = _naive_utc(a.get("publication_date"))
            url = a.get("url") or ""
            if "ria.ru" in url:
                full_text = await fetch_ria_article_content(url)
                if full_text:
                    a["content"] = full_text
                # иначе остаётся description из RSS

        logger.info(f"Итого статей за сегодня: {len(articles)}")
        return articles


news_service = NewsService()
