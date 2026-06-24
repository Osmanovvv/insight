"""
POST /api/v1/payments — Create subscription and payment
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta

from database.connection import get_db
from database.models import Payment, Plan, Subscription, Users, SubscriptionStatus, PaymentStatus, utcnow
from schemas.payments import PaymentCreate, PaymentOut, SubscriptionCreate, SubscriptionOut
from schemas.checkout import CheckoutRequest, CheckoutResponse
from middlewares.auth_middleware import get_current_user, require_admin
import asyncio

router = APIRouter()


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    data: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Симулированная оплата подписки по карте (демо, без реального шлюза)."""
    plan_result = await db.execute(select(Plan).where(Plan.id == data.plan_id))
    plan = plan_result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Тарифный план не найден")

    # Имитация обращения к платёжному шлюзу
    await asyncio.sleep(1.2)

    # Эмуляция отказа: карты, оканчивающиеся на 0000 — отклоняются
    if data.card_number.endswith("0000"):
        # Логируем попытку как failed
        transaction_id = f"txn_{uuid.uuid4().hex[:16]}"
        failed_sub = Subscription(
            user_id=current_user.id,
            plan_id=plan.id,
            started_at=utcnow(),
            expires_at=utcnow(),
            is_active=False,
            status=SubscriptionStatus.cancelled,
        )
        db.add(failed_sub)
        await db.commit()
        await db.refresh(failed_sub)
        payment = Payment(
            subscription_id=failed_sub.id,
            amount=plan.price,
            transaction_id=transaction_id,
            status=PaymentStatus.failed,
        )
        db.add(payment)
        await db.commit()
        raise HTTPException(
            status_code=402,
            detail="Банк отклонил операцию. Проверьте данные карты или используйте другую."
        )

    # Деактивируем старые подписки пользователя
    old_subs = await db.execute(
        select(Subscription).where(
            (Subscription.user_id == current_user.id) & (Subscription.is_active == True)
        )
    )
    for old_sub in old_subs.scalars().all():
        old_sub.is_active = False
        old_sub.status = SubscriptionStatus.cancelled

    sub = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        started_at=utcnow(),
        expires_at=utcnow() + timedelta(days=30),
        is_active=True,
        status=SubscriptionStatus.active,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    transaction_id = f"txn_{uuid.uuid4().hex[:16]}"
    payment = Payment(
        subscription_id=sub.id,
        amount=plan.price,
        transaction_id=transaction_id,
        status=PaymentStatus.completed,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return CheckoutResponse(
        success=True,
        subscription_id=sub.id,
        payment_id=payment.id,
        transaction_id=transaction_id,
        amount=float(plan.price),
        card_last4=data.card_number[-4:],
        status="completed",
    )


@router.post("/subscriptions", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    data: SubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Подписаться на тарифный план."""
    plan_result = await db.execute(select(Plan).where(Plan.id == data.plan_id))
    plan = plan_result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Тарифный план не найден")

    sub = Subscription(
        user_id=current_user.id,
        plan_id=data.plan_id,
        started_at=utcnow(),
        expires_at=utcnow() + timedelta(days=30),
        is_active=True,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


@router.post("/subscribe-pro", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
async def simulate_pro_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Симулированная покупка Pro-подписки."""
    plan_result = await db.execute(select(Plan).where(Plan.name == "Pro"))
    plan = plan_result.scalars().first()

    if not plan:
        plan = Plan(name="Pro", price=2500, features=[
            "Безлимитные инсайты",
            "Расширенный AI-анализ",
            "Push + Email уведомления",
            "До 20 компаний",
            "Архив за 90 дней",
            "Экспорт в PDF",
            "Приоритетная поддержка",
        ])
        db.add(plan)
        await db.commit()
        await db.refresh(plan)

    # Деактивируем старые подписки
    old_subs = await db.execute(
        select(Subscription).where(
            (Subscription.user_id == current_user.id) & (Subscription.is_active == True)
        )
    )
    for old_sub in old_subs.scalars().all():
        old_sub.is_active = False
        old_sub.status = SubscriptionStatus.cancelled

    sub = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        started_at=utcnow(),
        expires_at=utcnow() + timedelta(days=30),
        is_active=True,
        status=SubscriptionStatus.active,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    payment = Payment(
        subscription_id=sub.id,
        amount=plan.price,
        transaction_id=str(uuid.uuid4()),
        status=PaymentStatus.completed,
    )
    db.add(payment)
    await db.commit()
    return sub


@router.post("/admin/subscriptions/{user_id}/cancel", status_code=200)
async def admin_cancel_subscription(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    """Отменить активную подписку пользователя (admin)."""
    result = await db.execute(
        select(Subscription).where(
            (Subscription.user_id == user_id) & (Subscription.is_active == True)
        )
    )
    subs = result.scalars().all()
    for sub in subs:
        sub.is_active = False
        sub.status = SubscriptionStatus.cancelled
    await db.commit()
    return {"message": f"Подписки пользователя {user_id} аннулированы"}


@router.post("/admin/subscriptions/{user_id}/extend", status_code=200)
async def admin_extend_subscription(
    user_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    _: Users = Depends(require_admin),
):
    """Продлить подписку пользователя на N дней (admin)."""
    result = await db.execute(
        select(Subscription).where(
            (Subscription.user_id == user_id) & (Subscription.is_active == True)
        )
    )
    sub = result.scalars().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Активная подписка не найдена")
    base = sub.expires_at or utcnow()
    sub.expires_at = base + timedelta(days=days)
    await db.commit()
    return {"message": f"Подписка продлена на {days} дней", "new_expires_at": sub.expires_at}


@router.post("/", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
async def create_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Создать платёж за подписку."""
    sub_result = await db.execute(
        select(Subscription).where(
            (Subscription.id == data.subscription_id) &
            (Subscription.user_id == current_user.id)
        )
    )
    if not sub_result.scalars().first():
        raise HTTPException(status_code=404, detail="Подписка не найдена")

    payment = Payment(**data.model_dump())
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment
