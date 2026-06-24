# Insight IS

Централизованная информационная система анализа новостей и финансовых данных.
AI-платформа, которая собирает новости из RSS/внешних API, выполняет sentiment/impact-анализ через Google Gemini и в реальном времени уведомляет пользователей о релевантных инсайтах.

## Стек

**Backend**
- Python 3.13, FastAPI, async SQLAlchemy 2.0
- PostgreSQL 17 (asyncpg)
- Alembic — миграции БД
- JWT (access + refresh) авторизация, passlib+bcrypt
- APScheduler — фоновый парсинг источников
- WebSocket — real-time уведомления
- Google Gemini — AI sentiment/impact-анализ
- Loguru, SlowAPI (throttling)

**Frontend**
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui (Radix)
- React Query, React Router v6
- Recharts, html2pdf/jspdf (экспорт PDF)

## Структура

```
insight_project/
├── backend/
│   ├── alembic/               миграции
│   ├── database/              модели + подключение
│   ├── endpoints/             роутеры (GET/POST/PATCH/DELETE/WS)
│   ├── middlewares/           auth, logging, throttle
│   ├── schemas/               pydantic-схемы
│   ├── services/              бизнес-логика, AI, парсеры
│   │   └── external_api/      GNews, NewsAPI, NewsData, RSS
│   ├── settings/              конфиг
│   ├── utils/                 error handler, helpers
│   ├── main.py                entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        UI-компоненты
│   │   ├── pages/             страницы (Index, Dashboard, Admin…)
│   │   ├── lib/               API-клиент, типы, утилиты
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Запуск

### 1. База данных

Создать PostgreSQL-базу `INSIGHT` и пользователя `postgres` с паролем.

```sql
CREATE DATABASE "INSIGHT";
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
```

Создать `backend/.env` (по образцу):

```env
DATABASE_URL=postgresql+asyncpg://postgres:ПАРОЛЬ@localhost:5432/INSIGHT
SECRET_KEY=<случайная_hex_строка>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

GNEWS_API_KEY=
NEWS_API_KEY=
NEWS_DATA_API_KEY=
GEMINI_API_KEY=

DEBUG=True
APP_HOST=0.0.0.0
APP_PORT=8000
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
```

Применить миграции и запустить:

```bash
alembic upgrade head
python main.py
```

API: http://localhost:8000 · Swagger: http://localhost:8000/docs

При первом запуске автоматически создаётся admin-пользователь: `admin` / `insight_admin`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Фронт: http://localhost:8080

## Тесты

```bash
cd backend
pytest
```

## Основные эндпоинты

| Префикс `/api/v1` | Описание |
|---|---|
| `/auth` | регистрация, логин, refresh |
| `/users` | профили, роли, подписка на категории |
| `/news` | лента, CRUD |
| `/analysis` | AI-анализ новостей |
| `/notifications` | уведомления + WS `/ws/notifications` |
| `/payments` | подписки и платежи |
| `/categories` | справочник категорий |
| `/assets` | финансовые активы |
| `/blogs` | блог-посты администратора |

## Роли

- **investor / trader** — обычные пользователи
- **admin** — управление пользователями, новостями, блогом, подписками

## Миграции

```bash
alembic revision --autogenerate -m "описание"
alembic upgrade head
alembic downgrade -1
```
