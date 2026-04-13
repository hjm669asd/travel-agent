from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TravelRequest(BaseModel):
    query: str = Field(..., description="用户输入的自然语言旅行需求")
    openai_api_key: Optional[str] = Field(None, description="用户提供的 OpenAI API Key（可选）")


class TravelIntent(BaseModel):
    destination: str = Field(..., description="目的地")
    days: int = Field(..., description="旅行天数")
    nights: int = Field(..., description="住宿晚数")
    budget: float = Field(..., description="预算金额")
    preferences: List[str] = Field(default_factory=list, description="用户偏好，如['动漫', '美食']")


class Hotel(BaseModel):
    name: str = Field(..., description="酒店名称")
    address: str = Field(..., description="酒店地址")
    price: int = Field(..., description="价格")
    description: str = Field(..., description="简介")
    amap_url: Optional[str] = Field(None, description="高德地图链接")


class TransportInfo(BaseModel):
    from_place: str = Field(..., description="出发地")
    to_place: str = Field(..., description="目的地")
    method: str = Field(..., description="交通方式")
    duration: str = Field(..., description="预计耗时")
    cost: str = Field(..., description="费用估算")
    tips: Optional[str] = Field(None, description="温馨提示")


class DayPlan(BaseModel):
    day: int = Field(..., description="第几天")
    date: str = Field(..., description="日期")
    morning: str = Field(..., description="上午安排")
    morning_transport: Optional[TransportInfo] = Field(None, description="上午交通")
    afternoon: str = Field(..., description="下午安排")
    afternoon_transport: Optional[TransportInfo] = Field(None, description="下午交通")
    evening: str = Field(..., description="晚上安排")
    evening_transport: Optional[TransportInfo] = Field(None, description="晚上交通")
    accommodation: Optional[Hotel] = Field(None, description="住宿")
    estimated_cost: float = Field(..., description="当天预估费用")


class Attraction(BaseModel):
    name: str = Field(..., description="景点名称")
    address: str = Field(..., description="地址")
    rating: Optional[float] = Field(None, description="评分")
    description: str = Field(..., description="简介")
    amap_url: Optional[str] = Field(None, description="高德地图链接")
    image_url: Optional[str] = Field(None, description="景点图片URL")


class Restaurant(BaseModel):
    name: str = Field(..., description="餐厅名称")
    cuisine: str = Field(..., description="菜系")
    price_range: str = Field(..., description="价格区间")
    address: str = Field(..., description="地址")
    amap_url: Optional[str] = Field(None, description="高德地图链接")


class WeatherInfo(BaseModel):
    text: str = Field(..., description="天气文字")
    temperature: str = Field(..., description="温度")
    humidity: Optional[str] = Field(None, description="湿度")
    wind_direction: Optional[str] = Field(None, description="风向")
    wind_scale: Optional[str] = Field(None, description="风力等级")
    last_update: Optional[str] = Field(None, description="更新时间")


class DayForecast(BaseModel):
    date: str = Field(..., description="日期")
    text_day: str = Field(..., description="白天天气")
    text_night: str = Field(..., description="夜晚天气")
    high: str = Field(..., description="最高温度")
    low: str = Field(..., description="最低温度")
    wind_direction: Optional[str] = Field(None, description="风向")
    wind_scale: Optional[str] = Field(None, description="风力")


class CityInfo(BaseModel):
    history: str = Field(..., description="城市历史简介")
    food: str = Field(..., description="特色美食")
    attractions: str = Field(..., description="特色景点")


class SavedTravelPlan(BaseModel):
    id: int
    user_id: int
    query: str
    plan_data: dict
    created_at: datetime

    class Config:
        from_attributes = True


class TravelResponse(BaseModel):
    intent: TravelIntent = Field(..., description="解析的用户意图")
    day_plans: List[DayPlan] = Field(..., description="每日行程计划")
    attractions: List[Attraction] = Field(..., description="推荐景点")
    restaurants: List[Restaurant] = Field(..., description="推荐餐厅")
    budget_breakdown: dict = Field(..., description="预算分配")
    markdown_itinerary: str = Field(..., description="Markdown 格式行程表")
    current_weather: Optional[WeatherInfo] = Field(None, description="当前天气")
    forecast: Optional[List[DayForecast]] = Field(None, description="天气预报")
    city_info: Optional[CityInfo] = Field(None, description="城市介绍")
