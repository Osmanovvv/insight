"""
GET /api/v1/news — News retrieval with filtering and pagination
Access: all authenticated users (Ч per access matrix)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
from datetime import datetime

from database.connection import get_db
from database.models import News, Users
from schemas.news import NewsOut
from middlewares.auth_middleware import get_current_user

router = APIRouter()


@router.get("/", response_model=list[NewsOut])
async def list_news(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    source: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(get_current_user),
):
    """Список новостей с фильтрацией по категории, источнику, дате."""
    filters = []
    if category_id:
        filters.append(News.category_id == category_id)
    if source:
        filters.append(News.source.ilike(f"%{source}%"))
    if date_from:
        filters.append(News.publication_date >= date_from)
    if date_to:
        filters.append(News.publication_date <= date_to)

    query = select(News)
    if filters:
        query = query.where(*filters)
    query = query.order_by(News.publication_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{news_id}", response_model=NewsOut)
async def get_news(
    news_id: int,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(get_current_user),
):
    """Получить одну новость по ID."""
    result = await db.execute(select(News).where(News.id == news_id))
    news = result.scalars().first()
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    return news
