"""
POST /api/v1/auth — Registration, Login, Token Refresh
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database.connection import get_db
from database.models import Users
from schemas.users import UserCreate, UserLogin
from schemas.auth import Token, RefreshRequest
from services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token,
)

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Регистрация нового пользователя (инвестор / трейдер)."""
    # Check uniqueness
    result = await db.execute(
        select(Users).where((Users.email == data.email) | (Users.username == data.username))
    )
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Email или username уже заняты")

    user = Users(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        first_name=data.first_name,
        last_name=data.last_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": "Пользователь зарегистрирован", "user_id": user.id}


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Аутентификация — возвращает access + refresh токены. Принимает email ИЛИ username."""
    result = await db.execute(
        select(Users).where((Users.email == data.email) | (Users.username == data.email))
    )
    user: Users | None = result.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный пароль")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт деактивирован")

    payload = {"sub": str(user.id), "role": user.role.value}
    return Token(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload),
    )


@router.post("/refresh", response_model=Token)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Обновление access-токена по refresh-токену."""
    payload = decode_refresh_token(data.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Недействительный refresh-токен")

    user_id = payload.get("sub")
    result = await db.execute(select(Users).where(Users.id == int(user_id)))
    user: Users | None = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    new_payload = {"sub": str(user.id), "role": user.role.value}
    return Token(
        access_token=create_access_token(new_payload),
        refresh_token=create_refresh_token(new_payload),
    )
