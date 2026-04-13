from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import User, Rating
from app.schemas.rating import RatingCreate, RatingUpdate, RatingResponse, LocationRatingSummary
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/ratings", tags=["评分"])


@router.post("", response_model=RatingResponse)
def create_or_update_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.location == rating_data.location
    ).first()

    if existing_rating:
        existing_rating.score = rating_data.score
        if rating_data.comment is not None:
            existing_rating.comment = rating_data.comment
        db.commit()
        db.refresh(existing_rating)
        return RatingResponse(
            **existing_rating.__dict__,
            username=current_user.username
        )

    new_rating = Rating(
        user_id=current_user.id,
        location=rating_data.location,
        score=rating_data.score,
        comment=rating_data.comment
    )
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)

    return RatingResponse(
        **new_rating.__dict__,
        username=current_user.username
    )


@router.get("/location/{location}", response_model=LocationRatingSummary)
def get_location_ratings(location: str, db: Session = Depends(get_db)):
    ratings = db.query(Rating).filter(
        Rating.location == location
    ).order_by(Rating.created_at.desc()).limit(5).all()

    if not ratings:
        return LocationRatingSummary(
            location=location,
            avg_score=0.0,
            total_reviews=0,
            recent_reviews=[]
        )

    avg_score = db.query(func.avg(Rating.score)).filter(Rating.location == location).scalar()
    total_reviews = db.query(Rating).filter(Rating.location == location).count()

    return LocationRatingSummary(
        location=location,
        avg_score=round(float(avg_score), 1),
        total_reviews=total_reviews,
        recent_reviews=[
            RatingResponse(
                id=r.id,
                user_id=r.user_id,
                location=r.location,
                score=r.score,
                comment=r.comment,
                created_at=r.created_at,
                username=r.user.username
            ) for r in ratings
        ]
    )


@router.get("/my", response_model=List[RatingResponse])
def get_my_ratings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).order_by(Rating.created_at.desc()).all()

    return [
        RatingResponse(
            id=r.id,
            user_id=r.user_id,
            location=r.location,
            score=r.score,
            comment=r.comment,
            created_at=r.created_at,
            username=current_user.username
        ) for r in ratings
    ]


@router.delete("/{rating_id}")
def delete_rating(
    rating_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="评分不存在")

    if rating.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="没有权限删除此评分")

    db.delete(rating)
    db.commit()
    return {"message": "删除成功"}
