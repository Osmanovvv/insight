"""
POST /api/v1/blogs — Create blog post (admin only)
"""

import json
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import Blog, Users
from schemas.blog import BlogCreate, BlogOut
from middlewares.auth_middleware import require_admin
from endpoints.GET.blog_get import _blog_to_out

router = APIRouter()


@router.post("/", response_model=BlogOut, status_code=201)
async def create_blog(
    data: BlogCreate,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    blog = Blog(
        title=data.title,
        content=data.content,
        sources=json.dumps(data.sources) if data.sources else None,
        is_visible=True,
    )
    db.add(blog)
    await db.commit()
    await db.refresh(blog)
    return _blog_to_out(blog)
