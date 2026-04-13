from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.schemas.travel import TravelRequest, TravelResponse
from app.agent.travel_agent import TravelAgent
from app.routes import auth, diaries, ratings, admin, travel
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="旅行规划 Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/diaries", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(diaries.router)
app.include_router(ratings.router)
app.include_router(admin.router)
app.include_router(travel.router)


@app.post("/api/travel/plan", response_model=TravelResponse)
async def create_travel_plan(request: TravelRequest):
    api_key = request.openai_api_key or os.getenv("DEEPSEEK_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="请提供 DeepSeek API Key，可以通过界面输入或设置 DEEPSEEK_API_KEY 环境变量"
        )

    try:
        agent = TravelAgent(api_key=api_key)
        result = agent.plan(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成旅行计划时出错: {str(e)}")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "旅行规划 Agent 服务运行中"}
