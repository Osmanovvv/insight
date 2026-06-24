"""
DELETE /api/v1/blogs — Delete blog post (admin only)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database.connection import get_db
from database.models import Blog, Users
from middlewares.auth_middleware import require_admin

router = APIRouter()


@router.delete("/{blog_id}", status_code=204)
async def delete_blog(
    blog_id: int,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    result = await db.execute(select(Blog).where(Blog.id == blog_id))
    blog = result.scalars().first()
    if not blog:
        raise HTTPException(status_code=404, detail="Блог не найден")
    await db.delete(blog)
    await db.commit()
