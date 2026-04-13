from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


class ImageBase(BaseModel):
    image_url: str
    sort_order: int = 0


class ImageCreate(ImageBase):
    pass


class ImageResponse(ImageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DiaryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1, max_length=100)
    travel_date: date


class DiaryCreate(DiaryBase):
    images: Optional[List[str]] = []


class DiaryUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    travel_date: Optional[date] = None
    images: Optional[List[str]] = None


class DiaryResponse(DiaryBase):
    id: int
    user_id: int
    view_count: int
    like_count: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    images: List[ImageResponse] = []
    author_username: Optional[str] = None
    is_liked: Optional[bool] = False

    class Config:
        from_attributes = True


class DiaryListResponse(BaseModel):
    id: int
    title: str
    location: str
    travel_date: date
    view_count: int
    like_count: int
    created_at: datetime
    author_username: str
    author_avatar: Optional[str] = None
    cover_image: Optional[str] = None

    class Config:
        from_attributes = True
