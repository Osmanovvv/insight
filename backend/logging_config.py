"""
Insight IS — Logging Configuration (loguru)
"""

import sys
import logging
from loguru import logger


def setup_logging():
    # Подавляем шумные INFO-логи SQLAlchemy (SQL-запросы и транзакции)
    for noisy in ("sqlalchemy.engine", "sqlalchemy.pool", "sqlalchemy.dialects",
                  "sqlalchemy.orm", "asyncpg"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logger.remove()

    # Console
    logger.add(
        sys.stdout,
        colorize=True,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> — "
            "<level>{message}</level>"
        ),
        level="DEBUG",
    )

    # File — all logs
    logger.add(
        "logs/insight.log",
        rotation="10 MB",
        retention="30 days",
        compression="zip",
        level="INFO",
        encoding="utf-8",
    )

    # File — errors only
    logger.add(
        "logs/errors.log",
        rotation="5 MB",
        retention="60 days",
        compression="zip",
        level="ERROR",
        encoding="utf-8",
    )
