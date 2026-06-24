"""
Insight IS — SQLAlchemy ORM Models

Таблицы соответствуют схеме INSIGHT.sql:
  users, category, news, asset, analysis, notification,
  plan, subscription, payment, user_category
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Enum, Float,
    ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database.connection import Base


def utcnow() -> datetime:
    """Naive UTC datetime (замена deprecated datetime.utcnow)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    investor = "investor"
    trader = "trader"
    admin = "admin"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class AssetType(str, enum.Enum):
    stock = "stock"
    crypto = "crypto"
    commodity = "commodity"
    forex = "forex"
    index = "index"


# ─── Models ───────────────────────────────────────────────────────────────────

class Users(Base):
    """Пользователи системы. Роли: investor, trader, admin."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.investor)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=utcnow)

    # Relations
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    user_categories = relationship("UserCategory", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    """Категории новостей / интересов пользователя."""
    __tablename__ = "category"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)

    # Relations
    news = relationship("News", back_populates="category")
    user_categories = relationship("UserCategory", back_populates="category", cascade="all, delete-orphan")


class News(Base):
    """Новости, собранные из внешних API."""
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    source = Column(String(255), nullable=True)
    url = Column(String(1000), nullable=True, unique=True)
    publication_date = Column(DateTime, nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("category.id", ondelete="SET NULL"), nullable=True)
    sentiment_score = Column(Float, nullable=True)   # -1.0 (negative) .. +1.0 (positive)
    impact_score = Column(Float, nullable=True)      # 0.0 .. 1.0

    # Relations
    category = relationship("Category", back_populates="news")
    analyses = relationship("Analysis", back_populates="news", cascade="all, delete-orphan")

    @property
    def category_name(self) -> str | None:
        return self.category.name if self.category else None


class Asset(Base):
    """Финансовые активы (акции, крипто, сырьё и пр.)."""
    __tablename__ = "asset"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    ticker = Column(String(20), nullable=False, unique=True)
    asset_type = Column(Enum(AssetType), nullable=False, default=AssetType.stock)
    exchange = Column(String(100), nullable=True)

    # Relations
    analyses = relationship("Analysis", back_populates="asset")


class Analysis(Base):
    """Результаты ИИ-анализа новостей в привязке к активам."""
    __tablename__ = "analysis"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    news_id = Column(Integer, ForeignKey("news.id", ondelete="CASCADE"), nullable=True)
    asset_id = Column(Integer, ForeignKey("asset.id", ondelete="SET NULL"), nullable=True, index=True)
    summary = Column(Text, nullable=True)
    sentiment = Column(String(20), nullable=True)     # positive / negative / neutral
    impact = Column(String(20), nullable=True)        # high / medium / low
    confidence = Column(Float, nullable=True)         # 0.0 .. 1.0
    created_at = Column(DateTime, nullable=False, default=utcnow, index=True)

    # Relations
    news = relationship("News", back_populates="analyses")
    asset = relationship("Asset", back_populates="analyses")


class Notification(Base):
    """Уведомления пользователей (реальное время через WebSocket)."""
    __tablename__ = "notification"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)

    # Relations
    user = relationship("Users", back_populates="notifications")


class Plan(Base):
    """Тарифные планы подписки."""
    __tablename__ = "plan"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    features = Column(JSON, nullable=True)

    # Relations
    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    """Подписки пользователей на тарифные планы."""
    __tablename__ = "subscription"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plan.id"), nullable=False)
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.active)
    started_at = Column(DateTime, nullable=False, default=utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Relations
    user = relationship("Users", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    payments = relationship("Payment", back_populates="subscription", cascade="all, delete-orphan")


class Payment(Base):
    """Платежи по подпискам."""
    __tablename__ = "payment"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    subscription_id = Column(Integer, ForeignKey("subscription.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_id = Column(String(255), unique=True, nullable=False)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    created_at = Column(DateTime, nullable=False, default=utcnow)

    # Relations
    subscription = relationship("Subscription", back_populates="payments")


class Blog(Base):
    """Блог-посты, создаваемые администратором."""
    __tablename__ = "blog"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)          # JSON string — список ссылок
    is_visible = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=utcnow)


class UserCategory(Base):
    """M2M — интересы пользователя по категориям."""
    __tablename__ = "user_category"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", name="uq_user_category"),
    )

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(Integer, ForeignKey("category.id", ondelete="CASCADE"), primary_key=True)

    # Relations
    user = relationship("Users", back_populates="user_categories")
    category = relationship("Category", back_populates="user_categories")