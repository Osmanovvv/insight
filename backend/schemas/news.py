"""
Insight IS — Pydantic Schemas: News
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NewsCreate(BaseModel):
    title: str
    content: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None
    publication_date: Optional[datetime] = None
    category_id: Optional[int] = None
    sentiment_score: Optional[float] = None
    impact_score: Optional[float] = None


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None
    category_id: Optional[int] = None
    sentiment_score: Optional[float] = None
    impact_score: Optional[float] = None


class NewsFilter(BaseModel):
    category_id: Optional[int] = None
    source: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_impact: Optional[float] = None
    min_sentiment: Optional[float] = None


class NewsOut(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    source: Optional[str] = None
    url: Optional[str] = None
    publication_date: Optional[datetime] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    sentiment_score: Optional[float] = None
    impact_score: Optional[float] = None

    model_config = {"from_attributes": True}
