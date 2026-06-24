"""
Pytest fixtures — in-memory SQLite + ASGI httpx-клиент.
"""

import os
import sys
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Используем SQLite для тестов (aiosqlite)
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret"

from database import connection as db_conn  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from database.connection import Base  # noqa: E402

# Подменяем engine и sessionmaker на SQLite
test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
TestSession = async_sessionmaker(test_engine, expire_on_commit=False)

db_conn.engine = test_engine
db_conn.async_session_maker = TestSession


async def override_get_db():
    async with TestSession() as session:
        yield session


from main import app  # noqa: E402
from database import models  # noqa: E402,F401
from database.connection import get_db  # noqa: E402

app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
