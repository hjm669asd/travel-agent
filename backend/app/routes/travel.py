from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from app.database import get_db
from app.models import User, SavedTravelPlan
from app.schemas.travel import SavedTravelPlan as SavedTravelPlanSchema
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/travel", tags=["旅行计划"])


@router.post("/save")
def save_travel_plan(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = data.get("query", "")
    plan_data = data.get("plan_data", {})

    saved_plan = SavedTravelPlan(
        user_id=current_user.id,
        query=query,
        plan_data=json.dumps(plan_data, ensure_ascii=False)
    )
    db.add(saved_plan)
    db.commit()
    db.refresh(saved_plan)

    return {"id": saved_plan.id, "message": "保存成功"}


@router.get("/saved", response_model=List[SavedTravelPlanSchema])
def get_saved_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plans = db.query(SavedTravelPlan).filter(
        SavedTravelPlan.user_id == current_user.id
    ).order_by(SavedTravelPlan.created_at.desc()).all()

    result = []
    for plan in plans:
        result.append(SavedTravelPlanSchema(
            id=plan.id,
            user_id=plan.user_id,
            query=plan.query,
            plan_data=json.loads(plan.plan_data),
            created_at=plan.created_at
        ))
    return result


@router.get("/saved/{plan_id}")
def get_saved_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(SavedTravelPlan).filter(
        SavedTravelPlan.id == plan_id,
        SavedTravelPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="计划不存在")

    return {
        "id": plan.id,
        "query": plan.query,
        "plan_data": json.loads(plan.plan_data),
        "created_at": plan.created_at.isoformat()
    }


@router.delete("/saved/{plan_id}")
def delete_saved_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(SavedTravelPlan).filter(
        SavedTravelPlan.id == plan_id,
        SavedTravelPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="计划不存在")

    db.delete(plan)
    db.commit()
    return {"message": "删除成功"}
