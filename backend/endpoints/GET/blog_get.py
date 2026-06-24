"""
GET /api/v1/blogs — Blog retrieval
"""

import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from database.connection import get_db
from database.models import Blog, Users, News
from schemas.blog import BlogOut
from middlewares.auth_middleware import get_current_user, require_admin

router = APIRouter()


def _parse_sources(raw: str | None) -> list[str] | None:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return []


def _blog_to_out(b: Blog) -> BlogOut:
    return BlogOut(
        id=b.id,
        title=b.title,
        content=b.content,
        sources=_parse_sources(b.sources),
        is_visible=b.is_visible,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )


@router.get("/", response_model=list[BlogOut])
async def list_blogs(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Публичный список блогов: только опубликованные записи."""
    q = select(Blog).where(Blog.is_visible == True)
    q = q.order_by(Blog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    blogs = result.scalars().all()
    return [_blog_to_out(b) for b in blogs]


@router.get("/admin", response_model=list[BlogOut])
async def list_blogs_admin(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    """Список всех блогов (admin) включая скрытые."""
    q = select(Blog).order_by(Blog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    blogs = result.scalars().all()
    return [_blog_to_out(b) for b in blogs]


@router.get("/stats", response_model=dict)
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    """Статистика для дашборда администратора."""
    today = datetime.now(timezone.utc).date()
    today_start = datetime(today.year, today.month, today.day)

    users_today = await db.execute(
        select(func.count(Users.id)).where(Users.created_at >= today_start)
    )
    news_today = await db.execute(
        select(func.count(News.id)).where(News.publication_date >= today_start)
    )
    total_blogs = await db.execute(select(func.count(Blog.id)))
    total_users = await db.execute(select(func.count(Users.id)))
    total_news = await db.execute(select(func.count(News.id)))

    return {
        "users_today": users_today.scalar() or 0,
        "news_today": news_today.scalar() or 0,
        "total_blogs": total_blogs.scalar() or 0,
        "total_users": total_users.scalar() or 0,
        "total_news": total_news.scalar() or 0,
    }


@router.get("/{blog_id}", response_model=BlogOut)
async def get_blog(blog_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Blog).where(Blog.id == blog_id))
    blog = result.scalars().first()
    if not blog:
        raise HTTPException(status_code=404, detail="Блог не найден")
    if not blog.is_visible:
        raise HTTPException(status_code=404, detail="Блог недоступен")
    return _blog_to_out(blog)
