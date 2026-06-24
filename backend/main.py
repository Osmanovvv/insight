"""
Insight IS — FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from database.connection import init_db, get_db
from settings.settings import settings
from middlewares.logging_middleware import LoggingMiddleware
from middlewares.throttle_middleware import ThrottleMiddleware
from utils.error_handler import add_exception_handlers
from logging_config import setup_logging

# ── Routers (GET) ──────────────────────────────────────
from endpoints.GET.users_get import router as users_get_router
from endpoints.GET.news_get import router as news_get_router
from endpoints.GET.analysis_get import router as analysis_get_router
from endpoints.GET.notifications_get import router as notifications_get_router
from endpoints.GET.payments_get import router as payments_get_router
from endpoints.GET.categories_get import router as categories_get_router
from endpoints.GET.assets_get import router as assets_get_router
from endpoints.GET.blog_get import router as blog_get_router

# ── Routers (POST) ─────────────────────────────────────
from endpoints.POST.auth_post import router as auth_post_router
from endpoints.POST.users_post import router as users_post_router
from endpoints.POST.news_post import router as news_post_router
from endpoints.POST.analysis_post import router as analysis_post_router
from endpoints.POST.notifications_post import router as notifications_post_router
from endpoints.POST.payments_post import router as payments_post_router
from endpoints.POST.categories_post import router as categories_post_router
from endpoints.POST.blog_post import router as blog_post_router

# ── Routers (PATCH) ────────────────────────────────────
from endpoints.PATCH.users_patch import router as users_patch_router
from endpoints.PATCH.news_patch import router as news_patch_router
from endpoints.PATCH.analysis_patch import router as analysis_patch_router
from endpoints.PATCH.notifications_patch import router as notifications_patch_router
from endpoints.PATCH.blog_patch import router as blog_patch_router

# ── Routers (DELETE) ───────────────────────────────────
from endpoints.DELETE.users_delete import router as users_delete_router
from endpoints.DELETE.news_delete import router as news_delete_router
from endpoints.DELETE.analysis_delete import router as analysis_delete_router
from endpoints.DELETE.notifications_delete import router as notifications_delete_router
from endpoints.DELETE.categories_delete import router as categories_delete_router
from endpoints.DELETE.blog_delete import router as blog_delete_router

# ── WebSocket ──────────────────────────────────────────
from endpoints.WS.notifications_ws import router as ws_router
from services.scheduler_service import start_scheduler, stop_scheduler


async def seed_admin():
    """Создаёт администратора при первом запуске, если его ещё нет."""
    from sqlalchemy.future import select
    from database.models import Users, UserRole
    from services.auth_service import hash_password

    async for db in get_db():
        result = await db.execute(select(Users).where(Users.username == "admin"))
        if result.scalars().first():
            return
        admin = Users(
            username="admin",
            email="admin@insight.local",
            password_hash=hash_password("insight_admin"),
            role=UserRole.admin,
            first_name="Admin",
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        logger.info("Admin user created: admin / insight_admin")
        break


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    setup_logging()
    logger.info("Starting Insight IS API...")
    await init_db()
    logger.info("Database initialized.")
    await seed_admin()
    from services.seed_service import seed_all
    await seed_all()
    start_scheduler()
    yield
    stop_scheduler()
    logger.info("Shutting down Insight IS API...")


app = FastAPI(
    title="Insight IS API",
    description="Централизованная информационная система анализа новостей и финансовых данных",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Custom Middleware ──────────────────────────────────
app.add_middleware(LoggingMiddleware)
app.add_middleware(ThrottleMiddleware)

# ── Exception Handlers ────────────────────────────────
add_exception_handlers(app)

# ── Include Routers ───────────────────────────────────
API = "/api/v1"

# Auth
app.include_router(auth_post_router,          prefix=f"{API}/auth",          tags=["Auth"])

# Users
app.include_router(users_get_router,          prefix=f"{API}/users",         tags=["Users"])
app.include_router(users_post_router,         prefix=f"{API}/users",         tags=["Users"])
app.include_router(users_patch_router,        prefix=f"{API}/users",         tags=["Users"])
app.include_router(users_delete_router,       prefix=f"{API}/users",         tags=["Users"])

# News
app.include_router(news_get_router,           prefix=f"{API}/news",          tags=["News"])
app.include_router(news_post_router,          prefix=f"{API}/news",          tags=["News"])
app.include_router(news_patch_router,         prefix=f"{API}/news",          tags=["News"])
app.include_router(news_delete_router,        prefix=f"{API}/news",          tags=["News"])

# Analysis
app.include_router(analysis_get_router,       prefix=f"{API}/analysis",      tags=["Analysis"])
app.include_router(analysis_post_router,      prefix=f"{API}/analysis",      tags=["Analysis"])
app.include_router(analysis_patch_router,     prefix=f"{API}/analysis",      tags=["Analysis"])
app.include_router(analysis_delete_router,    prefix=f"{API}/analysis",      tags=["Analysis"])

# Notifications
app.include_router(notifications_get_router,  prefix=f"{API}/notifications",  tags=["Notifications"])
app.include_router(notifications_post_router, prefix=f"{API}/notifications",  tags=["Notifications"])
app.include_router(notifications_patch_router,prefix=f"{API}/notifications",  tags=["Notifications"])
app.include_router(notifications_delete_router,prefix=f"{API}/notifications", tags=["Notifications"])

# Payments & Subscriptions
app.include_router(payments_get_router,       prefix=f"{API}/payments",      tags=["Payments"])
app.include_router(payments_post_router,      prefix=f"{API}/payments",      tags=["Payments"])

# Categories
app.include_router(categories_get_router,     prefix=f"{API}/categories",    tags=["Categories"])
app.include_router(categories_post_router,    prefix=f"{API}/categories",    tags=["Categories"])
app.include_router(categories_delete_router,  prefix=f"{API}/categories",    tags=["Categories"])

# Assets
app.include_router(assets_get_router,         prefix=f"{API}/assets",        tags=["Assets"])

# Blogs
app.include_router(blog_get_router,           prefix=f"{API}/blogs",         tags=["Blogs"])
app.include_router(blog_post_router,          prefix=f"{API}/blogs",         tags=["Blogs"])
app.include_router(blog_patch_router,         prefix=f"{API}/blogs",         tags=["Blogs"])
app.include_router(blog_delete_router,        prefix=f"{API}/blogs",         tags=["Blogs"])

# WebSocket
app.include_router(ws_router,                 prefix="/ws",                   tags=["WebSocket"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "Insight IS API", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
