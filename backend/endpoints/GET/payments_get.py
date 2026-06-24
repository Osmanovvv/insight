"""
GET /api/v1/payments — Payments and subscriptions retrieval
Access: investor/trader (own), admin (all) — per access matrix
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database.connection import get_db
from database.models import Payment, Plan, Subscription, Users
from schemas.payments import PaymentOut, SubscriptionOut
from middlewares.auth_middleware import get_current_user, require_admin

router = APIRouter()


@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db)):
    """Публичный список тарифных планов."""
    result = await db.execute(select(Plan).order_by(Plan.price))
    return [
        {"id": p.id, "name": p.name, "price": float(p.price), "features": p.features or []}
        for p in result.scalars().all()
    ]


# ── Subscriptions ─────────────────────────────────────

@router.get("/subscriptions", response_model=list[SubscriptionOut])
async def list_subscriptions(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Подписки текущего пользователя."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/subscriptions/all", response_model=list[SubscriptionOut])
async def list_all_subscriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    """Все подписки (только admin)."""
    result = await db.execute(select(Subscription).offset(skip).limit(limit))
    return result.scalars().all()


# ── Payments ──────────────────────────────────────────

@router.get("/", response_model=list[PaymentOut])
async def list_payments(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Платежи текущего пользователя (через подписки)."""
    subs_result = await db.execute(
        select(Subscription.id).where(Subscription.user_id == current_user.id)
    )
    sub_ids = [r[0] for r in subs_result.all()]
    if not sub_ids:
        return []
    result = await db.execute(
        select(Payment).where(Payment.subscription_id.in_(sub_ids))
    )
    return result.scalars().all()


@router.get("/{payment_id}", response_model=PaymentOut)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalars().first()
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")

    # Restrict non-admin to own payments
    if current_user.role.value != "admin":
        sub_result = await db.execute(
            select(Subscription).where(
                (Subscription.id == payment.subscription_id) &
                (Subscription.user_id == current_user.id)
            )
        )
        if not sub_result.scalars().first():
            raise HTTPException(status_code=403, detail="Доступ запрещён")
    return payment
