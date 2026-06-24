"""
Pydantic schemas for Blog resource.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class BlogCreate(BaseModel):
    title: str
    content: str
    sources: Optional[List[str]] = None


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    sources: Optional[List[str]] = None
    is_visible: Optional[bool] = None


class BlogOut(BaseModel):
    id: int
    title: str
    content: str
    sources: Optional[List[str]] = None
    is_visible: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
