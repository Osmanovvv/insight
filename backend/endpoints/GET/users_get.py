"""
GET /api/v1/users — User data retrieval
Access: admin (full list), any auth user (own profile)
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from datetime import datetime

from database.connection import get_db
from database.models import Users, Subscription
from schemas.users import UserOut
from middlewares.auth_middleware import get_current_user, require_admin

router = APIRouter()


class UserWithSubOut(UserOut):
    subscription_plan: Optional[str] = None
    subscription_expires: Optional[datetime] = None
    subscription_active: bool = False


@router.get("/me", response_model=UserOut)
async def get_me(current_user: Users = Depends(get_current_user)):
    """Текущий пользователь — данные своего профиля."""
    return current_user


@router.get("/me/subscription")
async def get_my_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Активная подписка текущего пользователя."""
    from database.models import Plan
    result = await db.execute(
        select(Subscription, Plan).join(Plan, Subscription.plan_id == Plan.id).where(
            (Subscription.user_id == current_user.id) & (Subscription.is_active == True)
        ).order_by(Subscription.started_at.desc())
    )
    row = result.first()
    if not row:
        return {"plan": "Free", "is_active": False, "expires_at": None}
    sub, plan = row
    return {
        "plan": plan.name,
        "is_active": sub.is_active,
        "expires_at": sub.expires_at,
        "started_at": sub.started_at,
    }


@router.get("/", response_model=list[UserWithSubOut])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    """Список всех пользователей с подпиской (только admin)."""
    from database.models import Plan
    result = await db.execute(select(Users).offset(skip).limit(limit))
    users = result.scalars().all()

    enriched = []
    for user in users:
        sub_result = await db.execute(
            select(Subscription, Plan).join(Plan, Subscription.plan_id == Plan.id).where(
                (Subscription.user_id == user.id) & (Subscription.is_active == True)
            ).order_by(Subscription.started_at.desc())
        )
        row = sub_result.first()
        data = UserWithSubOut.model_validate(user)
        if row:
            sub, plan = row
            data.subscription_plan = plan.name
            data.subscription_expires = sub.expires_at
            data.subscription_active = sub.is_active
        enriched.append(data)
    return enriched


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Получить пользователя по ID. Admin — любой; остальные — только себя."""
    if current_user.role.value != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    result = await db.execute(select(Users).where(Users.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user
