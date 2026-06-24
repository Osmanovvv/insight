"""
Insight IS — парсер полного текста статей РИА Новости.
По ссылке на ria.ru загружает страницу и извлекает текст из article__body / article__text.
"""

from typing import Optional
import httpx
from bs4 import BeautifulSoup
from loguru import logger

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
}


async def fetch_ria_article_content(url: str, timeout: float = 15.0) -> Optional[str]:
    """
    Загружает страницу статьи ria.ru и возвращает полный текст из блоков article__text.
    Возвращает None при ошибке или если страница не от РИА.
    """
    if "ria.ru" not in url:
        return None
    try:
        async with httpx.AsyncClient(timeout=timeout, headers=HEADERS) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        logger.warning(f"RIA fetch failed {url}: {e}")
        return None
    soup = BeautifulSoup(html, "lxml")
    article_body = soup.find("div", class_="article__body")
    if not article_body:
        return None
    text_blocks = article_body.find_all("div", class_="article__text")
    if not text_blocks:
        return None
    article_text = "\n\n".join(block.get_text(strip=True) for block in text_blocks)
    return article_text.strip() or None
