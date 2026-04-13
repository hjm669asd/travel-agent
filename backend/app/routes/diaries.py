from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Diary, DiaryImage, DiaryLike
from app.schemas.community import DiaryCreate, DiaryUpdate, DiaryResponse, DiaryListResponse, ImageResponse
from app.services.auth import get_current_user
import os
import uuid
import aiofiles

router = APIRouter(prefix="/api/diaries", tags=["日记"])

UPLOAD_DIR = "uploads/diaries"


@router.post("", response_model=DiaryResponse)
async def create_diary(
    diary_data: DiaryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_diary = Diary(
        user_id=current_user.id,
        title=diary_data.title,
        content=diary_data.content,
        location=diary_data.location,
        travel_date=diary_data.travel_date
    )
    db.add(new_diary)
    db.commit()
    db.refresh(new_diary)

    for idx, image_url in enumerate(diary_data.images or []):
        diary_image = DiaryImage(diary_id=new_diary.id, image_url=image_url, sort_order=idx)
        db.add(diary_image)
    db.commit()
    db.refresh(new_diary)

    response = DiaryResponse(
        id=new_diary.id,
        title=new_diary.title,
        content=new_diary.content,
        location=new_diary.location,
        travel_date=new_diary.travel_date,
        user_id=new_diary.user_id,
        view_count=new_diary.view_count,
        like_count=new_diary.like_count,
        is_published=new_diary.is_published,
        created_at=new_diary.created_at,
        updated_at=new_diary.updated_at,
        images=[ImageResponse.model_validate(img) for img in new_diary.images],
        author_username=current_user.username
    )
    return response


@router.get("", response_model=List[DiaryListResponse])
def get_diaries(
    location: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(Diary).filter(Diary.is_published == True)

    if location:
        query = query.filter(Diary.location.contains(location))

    diaries = query.order_by(Diary.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

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


@router.get("/{diary_id}", response_model=DiaryResponse)
def get_diary(diary_id: int, db: Session = Depends(get_db)):
    diary = db.query(Diary).filter(Diary.id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")

    diary.view_count += 1
    db.commit()

    return DiaryResponse(
        id=diary.id,
        title=diary.title,
        content=diary.content,
        location=diary.location,
        travel_date=diary.travel_date,
        user_id=diary.user_id,
        view_count=diary.view_count,
        like_count=diary.like_count,
        is_published=diary.is_published,
        created_at=diary.created_at,
        updated_at=diary.updated_at,
        images=[ImageResponse(id=img.id, image_url=img.image_url, sort_order=img.sort_order, created_at=img.created_at) for img in diary.images],
        author_username=diary.author.username
    )


@router.put("/{diary_id}", response_model=DiaryResponse)
def update_diary(
    diary_id: int,
    diary_update: DiaryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    diary = db.query(Diary).filter(Diary.id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")

    if diary.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="没有权限修改此日记")

    if diary_update.title is not None:
        diary.title = diary_update.title
    if diary_update.content is not None:
        diary.content = diary_update.content
    if diary_update.location is not None:
        diary.location = diary_update.location
    if diary_update.travel_date is not None:
        diary.travel_date = diary_update.travel_date

    if diary_update.images is not None:
        db.query(DiaryImage).filter(DiaryImage.diary_id == diary_id).delete()
        for idx, image_url in enumerate(diary_update.images):
            diary_image = DiaryImage(diary_id=diary_id, image_url=image_url, sort_order=idx)
            db.add(diary_image)

    db.commit()
    db.refresh(diary)

    return DiaryResponse(
        id=diary.id,
        title=diary.title,
        content=diary.content,
        location=diary.location,
        travel_date=diary.travel_date,
        user_id=diary.user_id,
        view_count=diary.view_count,
        like_count=diary.like_count,
        is_published=diary.is_published,
        created_at=diary.created_at,
        updated_at=diary.updated_at,
        images=[ImageResponse(id=img.id, image_url=img.image_url, sort_order=img.sort_order, created_at=img.created_at) for img in diary.images],
        author_username=diary.author.username
    )


@router.delete("/{diary_id}")
def delete_diary(
    diary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    diary = db.query(Diary).filter(Diary.id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")

    if diary.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="没有权限删除此日记")

    db.delete(diary)
    db.commit()
    return {"message": "删除成功"}


@router.post("/{diary_id}/like")
def like_diary(
    diary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    diary = db.query(Diary).filter(Diary.id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")

    existing_like = db.query(DiaryLike).filter(
        DiaryLike.diary_id == diary_id,
        DiaryLike.user_id == current_user.id
    ).first()

    if existing_like:
        db.delete(existing_like)
        diary.like_count = max(0, diary.like_count - 1)
        db.commit()
        return {"message": "取消点赞成功", "liked": False, "like_count": diary.like_count}
    else:
        new_like = DiaryLike(diary_id=diary_id, user_id=current_user.id)
        db.add(new_like)
        diary.like_count += 1
        db.commit()
        return {"message": "点赞成功", "liked": True, "like_count": diary.like_count}


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只能上传图片文件")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    return {"url": f"/{file_path}", "filename": unique_filename}
