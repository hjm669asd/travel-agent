from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Diary
from app.schemas.auth import UserResponse
from app.schemas.community import DiaryListResponse
from app.services.auth import get_current_admin_user

router = APIRouter(prefix="/api/admin", tags=["管理员"])


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).offset((page - 1) * page_size).limit(page_size).all()
    return users


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="不能删除自己的管理员账户")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    db.delete(user)
    db.commit()
    return {"message": "用户删除成功"}


@router.get("/diaries", response_model=List[DiaryListResponse])
def get_all_diaries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    diaries = db.query(Diary).order_by(Diary.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for diary in diaries:
        cover_image = None
        if diary.images:
            cover_image = diary.images[0].image_url

        result.append(DiaryListResponse(
            id=diary.id,
            title=diary.title,
            location=diary.location,
            travel_date=diary.travel_date,
            view_count=diary.view_count,
            like_count=diary.like_count,
            created_at=diary.created_at,
            author_username=diary.author.username,
            author_avatar=diary.author.avatar_url,
            cover_image=cover_image
        ))

    return result


@router.delete("/diaries/{diary_id}")
def admin_delete_diary(
    diary_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    diary = db.query(Diary).filter(Diary.id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")

    db.delete(diary)
    db.commit()
    return {"message": "日记删除成功"}
