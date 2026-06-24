"""
PATCH /api/v1/blogs — Update blog post (admin only)
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database.connection import get_db
from database.models import Blog, Users
from schemas.blog import BlogUpdate, BlogOut
from middlewares.auth_middleware import require_admin
from endpoints.GET.blog_get import _blog_to_out

router = APIRouter()


@router.patch("/{blog_id}", response_model=BlogOut)
async def update_blog(
    blog_id: int,
    data: BlogUpdate,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    result = await db.execute(select(Blog).where(Blog.id == blog_id))
    blog = result.scalars().first()
    if not blog:
        raise HTTPException(status_code=404, detail="Блог не найден")

    if data.title is not None:
        blog.title = data.title
    if data.content is not None:
        blog.content = data.content
    if data.sources is not None:
        blog.sources = json.dumps(data.sources)
    if data.is_visible is not None:
        blog.is_visible = data.is_visible

    await db.commit()
    await db.refresh(blog)
    return _blog_to_out(blog)
