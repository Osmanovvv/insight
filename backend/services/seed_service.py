"""
Seed initial demo data on application startup.
Идемпотентно: повторный запуск не создаёт дубликатов.
"""

import json
from loguru import logger
from sqlalchemy.future import select

from database.connection import get_db
from database.models import (
    Users, UserRole, Category, Asset, AssetType, Plan, Blog, News, Analysis,
)
from services.auth_service import hash_password
from services.scheduler_service import _match_category


CATEGORIES = [
    "Экономика",
    "Политика",
    "Технологии",
    "Криптовалюты",
    "Энергетика",
    "Финансы",
    "Промышленность",
    "Здравоохранение",
]

ASSETS = [
    ("Сбербанк", "SBER", AssetType.stock, "MOEX"),
    ("Газпром", "GAZP", AssetType.stock, "MOEX"),
    ("Лукойл", "LKOH", AssetType.stock, "MOEX"),
    ("Яндекс", "YDEX", AssetType.stock, "MOEX"),
    ("Bitcoin", "BTC", AssetType.crypto, "Binance"),
    ("Ethereum", "ETH", AssetType.crypto, "Binance"),
    ("Apple", "AAPL", AssetType.stock, "NASDAQ"),
    ("Tesla", "TSLA", AssetType.stock, "NASDAQ"),
    ("Нефть Brent", "BRENT", AssetType.commodity, "ICE"),
    ("Золото", "XAU", AssetType.commodity, "LBMA"),
]

PLANS = [
    {
        "name": "Free",
        "price": 0,
        "features": [
            "До 10 инсайтов в день",
            "Базовый AI-анализ",
            "Email-уведомления",
            "До 3 компаний",
            "Архив за 7 дней",
        ],
    },
    {
        "name": "Pro",
        "price": 2500,
        "features": [
            "Безлимитные инсайты",
            "Расширенный AI-анализ",
            "Push + Email уведомления",
            "До 20 компаний",
            "Архив за 90 дней",
            "Экспорт в PDF",
            "Приоритетная поддержка",
        ],
    },
]

USERS = [
    {
        "username": "investor",
        "email": "investor@insight.local",
        "password": "Investor123",
        "role": UserRole.investor,
        "first_name": "Алексей",
        "last_name": "Инвесторов",
    },
    {
        "username": "trader",
        "email": "trader@insight.local",
        "password": "Trader123",
        "role": UserRole.trader,
        "first_name": "Мария",
        "last_name": "Трейдерова",
    },
]

DEMO_NEWS = [
    # (title, content, source, category_name, sentiment, impact)
    ("Bitcoin пробил отметку в $80 000 на фоне роста институциональных инвестиций",
     "Курс биткоина впервые в истории достиг отметки в $80 тысяч. Аналитики связывают рост с массовым притоком капитала в спотовые ETF и ослаблением регуляторного давления в США.",
     "CoinDesk", "Криптовалюты", "positive", "high"),
    ("Ethereum обновил алгоритм консенсуса, комиссии упали на 40%",
     "Фонд Ethereum Foundation внедрил обновление Pectra. Снижение комиссий уже отразилось на активности DeFi-протоколов.",
     "The Block", "Криптовалюты", "positive", "medium"),

    ("АвтоВАЗ увеличил производство Lada на 22% за квартал",
     "Завод в Тольятти нарастил выпуск автомобилей до рекордных 170 тыс. единиц. Рост связан с программой господдержки и восстановлением цепочек поставок.",
     "Коммерсантъ", "Промышленность", "positive", "medium"),
    ("Северсталь зафиксировала снижение спроса на металлопрокат в Европе",
     "По итогам квартала экспорт стали упал на 14%. Компания переориентирует поставки на внутренний рынок.",
     "РБК", "Промышленность", "negative", "medium"),

    ("Минздрав утвердил новую программу вакцинации от гриппа",
     "В рамках программы будет привито до 60% населения. Закупка вакцин обойдётся бюджету в 12 млрд рублей.",
     "ТАСС", "Здравоохранение", "neutral", "low"),
    ("Российские учёные разработали препарат против устойчивых штаммов бактерий",
     "Клинические испытания показали эффективность на 87% выше зарубежных аналогов. Препарат ожидает регистрации в Минздраве.",
     "Медвестник", "Здравоохранение", "positive", "high"),

    ("ЦБ снизил ключевую ставку до 14% — первое снижение за полгода",
     "Решение связано с замедлением инфляции до 6.2%. Рынок ждал снижения на 100 б.п.",
     "Banki.ru", "Финансы", "positive", "high"),
    ("Ипотечные ставки в России впервые опустились ниже 10%",
     "Ведущие банки начали снижать ставки по льготным программам на фоне смягчения ДКП.",
     "Ведомости", "Финансы", "positive", "medium"),

    ("Tesla представила новый чип Dojo 3 для обучения нейросетей",
     "Производительность чипа в 8 раз превосходит предыдущее поколение. Чип будет использоваться для автопилота и Optimus.",
     "TechCrunch", "Технологии", "positive", "high"),
    ("Apple представила iPhone с ИИ-ассистентом нового поколения",
     "Персональный AI использует on-device обработку без отправки данных в облако.",
     "The Verge", "Технологии", "positive", "high"),

    ("ОПЕК+ договорилась о продлении квот на добычу до конца 2026 года",
     "Цена Brent выросла на 3.4% после объявления решения. Россия сохранит добычу на уровне 9.9 млн б/с.",
     "Reuters", "Энергетика", "positive", "high"),
    ("Газпром снизил прогноз экспорта газа в Европу на 18%",
     "Причина — продолжение диверсификации маршрутов и теплая зима. Компания переориентируется на Азию.",
     "Интерфакс", "Энергетика", "negative", "medium"),
]


BLOGS = [
    {
        "title": "Как AI меняет рынок финансовых данных",
        "content": (
            "Современные системы искусственного интеллекта способны обрабатывать "
            "тысячи новостей в минуту и мгновенно оценивать их влияние на рынок. "
            "В этой статье мы разбираем, как Insight IS использует Gemini для "
            "sentiment-анализа и оценки импакта."
        ),
        "sources": ["https://ria.ru"],
    },
    {
        "title": "5 способов использовать Insight для трейдинга",
        "content": (
            "Разбираем практические сценарии: подписка на тикеры, настройка "
            "уведомлений, экспорт аналитики в PDF, работа с архивом новостей."
        ),
        "sources": [],
    },
]


async def seed_all():
    """Идемпотентная инициализация демо-данных."""
    async for db in get_db():
        try:
            await _seed_categories(db)
            await _seed_assets(db)
            await _seed_plans(db)
            await _seed_users(db)
            await _seed_blogs(db)
            await db.commit()
            await _recategorize_news(db)
            await _seed_demo_news(db)
            await db.commit()
            logger.info("Seed completed.")
        except Exception as e:
            await db.rollback()
            logger.error(f"Seed failed: {e}")
        break


async def _seed_categories(db):
    existing = (await db.execute(select(Category.name))).scalars().all()
    for name in CATEGORIES:
        if name not in existing:
            db.add(Category(name=name))


async def _seed_assets(db):
    existing = (await db.execute(select(Asset.ticker))).scalars().all()
    for name, ticker, atype, exch in ASSETS:
        if ticker not in existing:
            db.add(Asset(name=name, ticker=ticker, asset_type=atype, exchange=exch))


async def _seed_plans(db):
    existing = (await db.execute(select(Plan.name))).scalars().all()
    for p in PLANS:
        if p["name"] not in existing:
            db.add(Plan(name=p["name"], price=p["price"], features=p["features"]))


async def _seed_users(db):
    existing = (await db.execute(select(Users.username))).scalars().all()
    for u in USERS:
        if u["username"] not in existing:
            db.add(Users(
                username=u["username"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                first_name=u["first_name"],
                last_name=u["last_name"],
                is_active=True,
            ))


async def _recategorize_news(db):
    """Перепривязывает категории для новостей без category_id на основе ключевых слов."""
    cats = {c.name: c.id for c in (await db.execute(select(Category))).scalars().all()}
    news_list = (await db.execute(select(News).where(News.category_id.is_(None)))).scalars().all()
    updated = 0
    for n in news_list:
        text = f"{n.title or ''} {n.content or ''}".lower()
        name = _match_category(text)
        if name in cats:
            n.category_id = cats[name]
            updated += 1
    if updated:
        logger.info(f"Recategorized {updated} news items")


async def _seed_demo_news(db):
    """Добавляет демо-новости + анализ для категорий, где мало контента."""
    cats = {c.name: c.id for c in (await db.execute(select(Category))).scalars().all()}
    existing_urls = set(
        (await db.execute(select(News.url))).scalars().all()
    )
    added = 0
    for idx, (title, content, source, cat_name, sentiment, impact) in enumerate(DEMO_NEWS):
        demo_url = f"https://demo.insight.local/news/{idx+1}"
        if demo_url in existing_urls:
            continue
        news = News(
            title=title,
            content=content,
            source=source,
            url=demo_url,
            category_id=cats.get(cat_name),
        )
        db.add(news)
        await db.flush()
        analysis = Analysis(
            news_id=news.id,
            summary=content[:200],
            sentiment=sentiment,
            impact=impact,
            confidence=0.85,
        )
        db.add(analysis)
        added += 1
    if added:
        logger.info(f"Seeded {added} demo news + analyses")


async def _seed_blogs(db):
    existing_count = len((await db.execute(select(Blog.id))).scalars().all())
    if existing_count > 0:
        return
    for b in BLOGS:
        db.add(Blog(title=b["title"], content=b["content"], sources=json.dumps(b["sources"])))
