"""
GET /api/v1/analysis — Analysis retrieval
Access: all authenticated users (Ч per access matrix)
Free: макс. 10 инсайтов в день; Pro: без ограничений.
"""

from sqlalchemy import and_, func
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database.connection import get_db
from database.models import Analysis, Users, Subscription, Plan, News
from schemas.analysis import AnalysisOut
from middlewares.auth_middleware import get_current_user

router = APIRouter()

FREE_DAILY_LIMIT = 10


async def _user_has_pro(db: AsyncSession, user_id: int) -> bool:
    """Проверяет, есть ли у пользователя активная подписка Pro."""
    r = await db.execute(
        select(Subscription).join(Plan, Subscription.plan_id == Plan.id).where(
            and_(
                Subscription.user_id == user_id,
                Subscription.is_active == True,
                Plan.name == "Pro",
            )
        )
    )
    return r.scalars().first() is not None


@router.get("/count")
async def count_analysis(
    sentiment: str | None = None,
    impact: str | None = None,
    title_search: str | None = Query(None, description="Поиск по заголовку новости"),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Возвращает общее кол-во записей. Для Free — не более FREE_DAILY_LIMIT."""
    query = select(func.count()).select_from(Analysis)
    if title_search and title_search.strip():
        query = query.join(News, Analysis.news_id == News.id).where(
            News.title.ilike(f"%{title_search.strip()}%")
        )
    filters = []
    if sentiment:
        filters.append(Analysis.sentiment == sentiment)
    if impact:
        filters.append(Analysis.impact == impact)
    if filters:
        query = query.where(and_(*filters))
    result = await db.execute(query)
    total = result.scalar_one() or 0
    is_admin = current_user.role.value == "admin"
    if not is_admin and not await _user_has_pro(db, current_user.id):
        total = min(total, FREE_DAILY_LIMIT)
    return {"total": total}


@router.get("/", response_model=list[AnalysisOut])
async def list_analysis(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    asset_id: int | None = None,
    sentiment: str | None = None,
    impact: str | None = None,
    category: str | None = Query(None, description="Название категории"),
    title_search: str | None = Query(None, description="Поиск по заголовку новости"),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Список аналитических записей. Для Free — только первые 10; админ и Pro — без ограничений."""
    is_admin = current_user.role.value == "admin"
    is_pro = await _user_has_pro(db, current_user.id)
    if not is_admin and not is_pro:
        skip = 0
        limit = min(limit, FREE_DAILY_LIMIT)

    from database.models import Category
    query = select(Analysis).options(selectinload(Analysis.news).selectinload(News.category))
    needs_news_join = bool((title_search and title_search.strip()) or category)
    if needs_news_join:
        query = query.join(News, Analysis.news_id == News.id)
    if title_search and title_search.strip():
        query = query.where(News.title.ilike(f"%{title_search.strip()}%"))
    if category:
        query = query.join(Category, News.category_id == Category.id).where(Category.name == category)
    filters = []
    if asset_id:
        filters.append(Analysis.asset_id == asset_id)
    if sentiment:
        filters.append(Analysis.sentiment == sentiment)
    if impact:
        filters.append(Analysis.impact == impact)
    if filters:
        query = query.where(and_(*filters))
    query = query.order_by(Analysis.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{analysis_id}", response_model=AnalysisOut)
async def get_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(get_current_user),
):
    result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Анализ не найден")
    return item
