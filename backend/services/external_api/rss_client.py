"""
Insight IS — RSS-клиент.
Загружает ленту (например РИА Новости), оставляет только записи за сегодня (UTC).
"""

from datetime import datetime, timezone
from typing import List
import httpx
import feedparser
from loguru import logger


# Стандартная лента РИА: https://ria.ru/export/rss2/index.xml
DEFAULT_RIA_RSS_URL = "https://ria.ru/export/rss2/index.xml"


def _parse_pubdate(entry) -> datetime | None:
    """Парсит pubDate из RSS-записи в datetime (timezone-aware UTC)."""
    published = getattr(entry, "published_parsed", None) or (entry.get("published_parsed") if isinstance(entry, dict) else None)
    if not published:
        return None
    try:
        import calendar
        # feedparser: published_parsed is struct_time in UTC
        ts = calendar.timegm(published)
        return datetime.fromtimestamp(ts, tz=timezone.utc)
    except Exception:
        return None


async def fetch_ria_rss(
    feed_url: str = DEFAULT_RIA_RSS_URL,
    only_today: bool = True,
    timeout: float = 15.0,
) -> List[dict]:
    """
    Загружает RSS-ленту и возвращает нормализованный список статей.
    При only_today=True оставляет только записи с датой публикации «сегодня» (UTC).
    Формат элемента: {title, content, source, url, publication_date}.
    """
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            resp = await client.get(feed_url)
            resp.raise_for_status()
            xml_text = resp.text
        except Exception as e:
            logger.error(f"RSS fetch failed {feed_url}: {e}")
            return []

    feed = feedparser.parse(xml_text)
    channel_title = getattr(feed.feed, "title", "RSS") or "RSS"
    today_utc = datetime.now(timezone.utc).date()
    articles = []

    for entry in feed.entries:
        link = getattr(entry, "link", None) or entry.get("link")
        if not link:
            continue
        pub_dt = _parse_pubdate(entry)
        if only_today and pub_dt and pub_dt.date() != today_utc:
            continue
        title = (getattr(entry, "title", None) or entry.get("title") or "").strip()
        description = getattr(entry, "description", None) or entry.get("description") or ""
        if hasattr(description, "strip"):
            description = description.strip()
        else:
            description = str(description).strip()

        articles.append({
            "title": title,
            "content": description,  # краткое описание из RSS; полный текст подтянем через ria_parser
            "source": channel_title,
            "url": link,
            "publication_date": pub_dt,
        })

    logger.info(f"RSS {feed_url}: получено {len(articles)} статей за сегодня")
    return articles
