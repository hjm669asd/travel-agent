from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RatingBase(BaseModel):
    location: str = Field(..., min_length=1, max_length=100)
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class RatingCreate(RatingBase):
    pass


class RatingUpdate(BaseModel):
    score: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class RatingResponse(RatingBase):
    id: int
    user_id: int
    username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LocationRatingSummary(BaseModel):
    location: str
    avg_score: float
    total_reviews: int
    recent_reviews: List[RatingResponse]
