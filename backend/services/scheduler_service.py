"""
Insight IS — APScheduler Service
Runs background tasks like fetching news every 30 seconds.
"""

import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger
from sqlalchemy.future import select

from database.connection import async_session_maker
from database.models import News, Analysis, UserCategory, Notification, Users, Category
from services.news_service import news_service
from services.analysis_service import analyze_article
from services.notification_service import manager
from settings.constants import NEWS_FETCH_INTERVAL_SECONDS

scheduler = AsyncIOScheduler()

_CATEGORY_KEYWORDS = {
    "Криптовалюты": ["bitcoin", "биткоин", "крипт", "ethereum", "эфир", "блокчейн", "blockchain", "btc", "eth", "токен", "nft"],
    "Технологии": ["ai", " ии ", "искусственный интеллект", "нейросет", "google", "apple", "microsoft", "openai", "gemini", "чатgpt", "смартфон", "процессор", "it-", "технолог"],
    "Энергетика": ["нефт", "газ", "газпром", "лукойл", "опек", "бензин", "энергет", "топлив", "электроэнерг", "brent", "wti"],
    "Политика": ["президент", "правительств", "санкци", "парламент", "минист", "дипломат", "выбор", "путин", "байден", "нато", "оон"],
    "Здравоохранение": ["здоров", "медиц", "больниц", "врач", "вакцин", "вирус", "covid", "фарма", "лекарств"],
    "Промышленность": ["завод", "производств", "промышлен", "авто", "машиностро", "металлург", "сталь"],
    "Финансы": ["банк", "кредит", "ипотек", "вклад", "инвест", "акци", "рынок", "биржа", "мосбирж", "рубл", "доллар", "евро", "цб "],
    "Экономика": ["ввп", "инфляц", "экономик", "бюджет", "налог", "ставк", "рецесси"],
}


def _match_category(text: str) -> str:
    """Подбирает категорию по ключевым словам. По умолчанию — Экономика."""
    best_name, best_score = "Экономика", 0
    for name, kws in _CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in text)
        if score > best_score:
            best_name, best_score = name, score
    return best_name

def _naive_utc(dt: datetime | None) -> datetime | None:
    """Convert timezone-aware datetime to naive UTC for TIMESTAMP WITHOUT TIME ZONE."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


async def fetch_and_analyze_news_job():
    logger.info("Starting scheduled job: fetch_and_analyze_news_job")
    try:
        # 1. Fetch news
        articles = await news_service.fetch_all(query="finance")
        if not articles:
            logger.info("No news fetched this time.")
            return

        async with async_session_maker() as db:
            for article_data in articles:
                # 2. Check if news already exists by URL
                url = article_data.get("url")
                if not url:
                    continue
                    
                existing_news = await db.execute(select(News).where(News.url == url))
                if existing_news.scalars().first():
                    continue  # Skip already processed news
                
                # Keyword-based категоризация по заголовку + контенту
                text = f"{article_data.get('title','')} {article_data.get('content','')}".lower()
                category_name = _match_category(text)
                cat_result = await db.execute(select(Category).where(Category.name == category_name))
                category = cat_result.scalars().first()
                category_id = category.id if category else None
                
                news = News(
                    title=article_data["title"],
                    content=article_data.get("content", ""),
                    source=article_data.get("source", ""),
                    url=url,
                    publication_date=_naive_utc(article_data.get("publication_date")),
                    category_id=category_id
                )
                db.add(news)
                await db.flush() # get news.id
                
                logger.info(f"Analyzing new article: {news.title}")
                try:
                    ai_result = analyze_article(news.title, news.content)
                    
                    analysis = Analysis(
                        news_id=news.id,
                        summary=ai_result["summary"],
                        sentiment=ai_result["sentiment"],
                        impact=ai_result["impact"],
                        confidence=ai_result["confidence"],
                    )
                    news.sentiment_score = ai_result["sentiment_score"]
                    news.impact_score = ai_result["impact_score"]
                    db.add(analysis)
                    await db.flush()

                    # Send notifications to users subscribed to this category
                    if news.category_id:
                        users_query = await db.execute(
                            select(UserCategory.user_id).where(UserCategory.category_id == news.category_id)
                        )
                        user_ids = [row[0] for row in users_query.all()]
                        
                        for user_id in user_ids:
                            notif = Notification(
                                user_id=user_id,
                                title=f"Новый ИИ Анализ: {ai_result['sentiment'].upper()} сигнал",
                                message=f"{news.title}\n\nРезюме: {ai_result['summary']}\nВажность: {ai_result['impact']}",
                            )
                            db.add(notif)
                            await db.flush()
                            
                            await manager.send_to_user(
                                user_id,
                                {
                                    "type": "notification",
                                    "id": notif.id,
                                    "title": notif.title,
                                    "message": notif.message,
                                }
                            )

                    # Always notify admins so they see the activity
                    admin_query = await db.execute(select(Users.id).where(Users.role == "admin"))
                    for admin_id in [row[0] for row in admin_query.all()]:
                        await manager.send_to_user(
                            admin_id,
                            {
                                "type": "notification",
                                "title": "Анализ завершен",
                                "message": f"{news.title} -> {ai_result['sentiment'].upper()}"
                            }
                        )

                except Exception as e:
                    logger.error(f"Error analyzing article {news.id}: {e}")
                    
            await db.commit()
            logger.info("Finished scheduled job: fetch_and_analyze_news_job")

    except asyncio.CancelledError:
        logger.debug("fetch_and_analyze_news_job cancelled (shutdown)")
        return  # не пробрасываем — задача завершается без исключения, APScheduler не логирует traceback
    except Exception as e:
        logger.error(f"Error in fetch_and_analyze_news_job: {e}")

scheduler.add_job(
    fetch_and_analyze_news_job,
    "interval",
    seconds=NEWS_FETCH_INTERVAL_SECONDS,
    id="fetch_news",
)

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped.")
