"""
PATCH /api/v1/analysis — Update analysis (admin only)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database.connection import get_db
from database.models import Analysis, Users
from schemas.analysis import AnalysisUpdate, AnalysisOut
from middlewares.auth_middleware import require_admin

router = APIRouter()


@router.patch("/{analysis_id}", response_model=AnalysisOut)
async def update_analysis(
    analysis_id: int,
    data: AnalysisUpdate,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    """Обновить анализ (только admin — И)."""
    result = await db.execute(
        select(Analysis).options(selectinload(Analysis.news)).where(Analysis.id == analysis_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Анализ не найден")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    # Повторно подгружаем с связью news, т.к. refresh не загружает relationships
    result2 = await db.execute(
        select(Analysis).options(selectinload(Analysis.news)).where(Analysis.id == analysis_id)
    )
    item = result2.scalars().first()
    return item
