import json
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.schemas.travel import TravelIntent, DayPlan, Attraction, Restaurant, TravelResponse, WeatherInfo, DayForecast, Hotel, CityInfo, TransportInfo
from app.services.weather_map import get_weather_seniverse, get_forecast_seniverse, get_amap_link, get_unsplash_image


MOCK_ATTRACTIONS = {
    "东京": [
        {"name": "秋叶原", "address": "东京都千代田区", "rating": 4.5, "description": "动漫、游戏、电器圣地"},
        {"name": "浅草寺", "address": "东京都台东区", "rating": 4.6, "description": "东京最古老的寺院"},
        {"name": "涩谷十字路口", "address": "东京都涩谷区", "rating": 4.4, "description": "世界最繁忙的十字路口"},
        {"name": "东京塔", "address": "东京都港区", "rating": 4.5, "description": "东京地标性建筑"},
        {"name": "新宿御苑", "address": "东京都新宿", "rating": 4.6, "description": "日式、法式、英式园林融合"},
    ],
    "大阪": [
        {"name": "道顿堀", "address": "大阪中央区", "rating": 4.5, "description": "美食街，章鱼小丸子发源地"},
        {"name": "大阪城", "address": "大阪城公园", "rating": 4.6, "description": "日本三大名城之一"},
        {"name": "环球影城", "address": "大阪此花区", "rating": 4.7, "description": "大型主题乐园"},
    ],
    "京都": [
        {"name": "伏见稻荷大社", "address": "京都伏见区", "rating": 4.6, "description": "千本鸟居"},
        {"name": "金阁寺", "address": "京都北区", "rating": 4.5, "description": "金色贴面的禅宗寺庙"},
    ],
}

MOCK_RESTAURANTS = {
    "东京": [
        {"name": "一兰拉面", "cuisine": "拉面", "price_range": "¥60-100", "address": "东京都港区"},
        {"name": "筑地市场", "cuisine": "寿司", "price_range": "¥200-500", "address": "东京都中央区"},
        {"name": "吉野家", "cuisine": "牛肉饭", "price_range": "¥40-80", "address": "东京都多家分店"},
    ],
    "大阪": [
        {"name": "蟹道乐", "cuisine": "螃蟹料理", "price_range": "¥500-1000", "address": "大阪道顿堀"},
        {"name": "章鱼小丸子本家", "cuisine": "小吃", "price_range": "¥30-60", "address": "大阪道顿堀"},
    ],
}


def parse_travel_intent(query: str, llm: ChatOpenAI) -> TravelIntent:
    system_msg = """你是一个旅行规划助手。请从用户输入中提取以下信息：
- destination: 目的地
- days: 天数（数字）
- nights: 住宿晚数（数字，比天数少1）
- budget: 预算（数字，单位是人民币元）
- preferences: 用户偏好（数组，如美食、动漫、购物等）

请用JSON格式输出，只输出JSON，不要有其他文字。
示例输入：帮我规划5天4晚东京旅行，预算8000元，喜欢动漫和美食
示例输出：{"destination": "东京", "days": 5, "nights": 4, "budget": 8000, "preferences": ["动漫", "美食"]}"""

    response = llm.invoke([
        SystemMessage(content=system_msg),
        HumanMessage(content=query)
    ])
    content = response.content.strip()

    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    data = json.loads(content)

    return TravelIntent(
        destination=data.get("destination") or "东京",
        days=int(data.get("days") or 5),
        nights=int(data.get("nights") or 4),
        budget=float(data.get("budget") or 8000),
        preferences=data.get("preferences") or []
    )


def generate_attractions_by_llm(destination: str, preferences: List[str], llm: ChatOpenAI, max_results: int = 5) -> List[Attraction]:
    pref_text = "、".join(preferences) if preferences else "无特殊偏好"
    prompt = f"""你是一个旅行规划专家。请为{destination}推荐{max_results}个热门景点。

用户偏好：{pref_text}

请以JSON数组格式输出每个景点的信息，格式如下：
[{{"name": "景点名称（只需要名称，不要包含URL或其他链接）", "address": "景点地址", "rating": 评分(0-5的小数), "description": "景点简介(20字以内)"}}]

重要提醒：
1. name字段只填写景点名称，绝对不要包含任何URL或链接
2. 不要在name字段中包含()以外的括号
3. 链接会由系统自动生成

只输出JSON，不要有其他文字。"""

    try:
        response = llm.invoke([
            SystemMessage(content="你是一个专业的旅行规划专家。"),
            HumanMessage(content=prompt)
        ])
        content = response.content.strip()

        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        data = json.loads(content)
        attractions = []
        for item in data[:max_results]:
            name = item.get("name", "")
            address = item.get("address", destination)
            attractions.append(Attraction(
                name=name,
                address=address,
                rating=item.get("rating", 4.0),
                description=item.get("description", "热门景点"),
                amap_url=get_amap_link(name) if name else None,
                image_url=get_unsplash_image(name) if name else None
            ))
        return attractions
    except Exception as e:
        print(f"LLM 生成景点失败: {e}")
        return []


def generate_restaurants_by_llm(destination: str, preferences: List[str], llm: ChatOpenAI, max_results: int = 4) -> List[Restaurant]:
    pref_text = "、".join(preferences) if preferences else "无特殊偏好"
    prompt = f"""你是一个美食专家。请为{destination}推荐{max_results}家特色餐厅。

用户偏好：{pref_text}

请以JSON数组格式输出每个餐厅的信息，格式如下：
[{{"name": "餐厅名称（只需要名称，不要包含URL或其他链接）", "cuisine": "菜系", "price_range": "价格区间(如¥50-100)", "address": "餐厅地址"}}]

重要提醒：
1. name字段只填写餐厅名称，绝对不要包含任何URL或链接
2. 不要在name字段中包含()以外的括号
3. 链接会由系统自动生成

只输出JSON，不要有其他文字。"""

    try:
        response = llm.invoke([
            SystemMessage(content="你是一个专业的美食推荐专家。"),
            HumanMessage(content=prompt)
        ])
        content = response.content.strip()

        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        data = json.loads(content)
        restaurants = []
        for item in data[:max_results]:
            name = item.get("name", "")
            address = item.get("address", destination)
            restaurants.append(Restaurant(
                name=name,
                cuisine=item.get("cuisine", "当地菜"),
                price_range=item.get("price_range", "¥50-100"),
                address=address,
                amap_url=get_amap_link(name) if name else None
            ))
        return restaurants
    except Exception as e:
        print(f"LLM 生成餐厅失败: {e}")
        return []


def get_attractions(destination: str, preferences: List[str], llm: ChatOpenAI) -> List[Attraction]:
    mock = MOCK_ATTRACTIONS.get(destination, [])
    if mock:
        if "动漫" in preferences or "二次元" in preferences:
            anime_spots = [a for a in mock if "秋叶原" in a["name"]]
            if anime_spots:
                mock = anime_spots + mock[:3]
        attractions = []
        for a in mock[:5]:
            if 'amap_url' not in a:
                a['amap_url'] = get_amap_link(a['name'])
            attractions.append(Attraction(**a))
        return attractions

    return generate_attractions_by_llm(destination, preferences, llm)


def get_restaurants(destination: str, preferences: List[str], llm: ChatOpenAI) -> List[Restaurant]:
    mock = MOCK_RESTAURANTS.get(destination, [])
    if mock:
        if "美食" in preferences:
            mock = mock[:3] + mock
        restaurants = []
        for r in mock[:4]:
            if 'amap_url' not in r:
                r['amap_url'] = get_amap_link(r['name'])
            restaurants.append(Restaurant(**r))
        return restaurants

    return generate_restaurants_by_llm(destination, preferences, llm)


def generate_hotels_by_llm(destination: str, budget_per_night: float, evening_place_name: str, llm: ChatOpenAI, max_results: int = 1) -> List[Hotel]:
    pref_text = f"价格 ¥{budget_per_night*0.8:.0f}-{budget_per_night*1.2:.0f}/晚"
    prompt = f"""你是一个酒店预订专家。请为{destination}推荐靠近{evening_place_name}的1家合适酒店。

预算：{pref_text}
要求：靠近{evening_place_name}，交通便利

请以JSON数组格式输出，格式如下：
[{{"name": "酒店名称", "address": "酒店地址", "price": 价格(数字), "description": "酒店简介(15字以内)"}}]

只输出JSON，不要有其他文字。"""

    try:
        response = llm.invoke([
            SystemMessage(content="你是一个专业的酒店预订专家。"),
            HumanMessage(content=prompt)
        ])
        content = response.content.strip()

        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        data = json.loads(content)
        hotels = []
        for item in data[:max_results]:
            name = item.get("name", f"{destination}市区酒店")
            hotels.append(Hotel(
                name=name,
                address=item.get("address", destination),
                price=int(item.get("price", budget_per_night)),
                description=item.get("description", "交通便利"),
                amap_url=get_amap_link(name) if name else None
            ))
        return hotels
    except Exception as e:
        print(f"LLM 生成酒店失败: {e}")
        fallback_hotel = Hotel(
            name=f"{destination}市区商务酒店",
            address=destination,
            price=int(budget_per_night),
            description="交通便利",
            amap_url=get_amap_link(f"{destination}市区商务酒店")
        )
        return [fallback_hotel]


def calculate_budget_breakdown(budget: float, days: int, nights: int) -> Dict[str, Any]:
    daily_food = budget * 0.30 / days
    daily_transport = budget * 0.15 / days
    daily_attractions = budget * 0.25 / days
    daily_shopping = budget * 0.10 / days
    accommodation = budget * 0.20

    return {
        "total_budget": budget,
        "daily_breakdown": {
            "餐饮": round(daily_food, 2),
            "交通": round(daily_transport, 2),
            "景点门票": round(daily_attractions, 2),
            "购物": round(daily_shopping, 2),
        },
        "accommodation_total": round(accommodation, 2),
        "accommodation_per_night": round(accommodation / nights, 2) if nights > 0 else 0,
    }


def generate_city_info(destination: str, llm: ChatOpenAI) -> CityInfo:
    prompt = f"""请为{destination}生成一份简短的城市介绍，约300字，包含以下三个方面：
1. 历史简介（当地的历史背景或文化渊源）
2. 特色美食（当地必吃的特色菜品或餐厅类型）
3. 特色景点（除行程外当地最值得一看的景点）

请以JSON格式输出，格式如下：
{{"history": "历史简介内容", "food": "特色美食内容", "attractions": "特色景点内容"}}

只输出JSON，不要有其他文字。"""

    try:
        response = llm.invoke([
            SystemMessage(content="你是一个专业的旅行顾问。"),
            HumanMessage(content=prompt)
        ])
        content = response.content.strip()

        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        data = json.loads(content)
        return CityInfo(
            history=data.get("history", "暂无历史信息"),
            food=data.get("food", "暂无美食信息"),
            attractions=data.get("attractions", "暂无景点信息")
        )
    except Exception as e:
        print(f"LLM 生成城市信息失败: {e}")
        return CityInfo(
            history=f"{destination}历史悠久，是一座充满魅力的城市。",
            food=f"{destination}特色美食丰富，值得一试。",
            attractions=f"{destination}拥有众多热门景点，是旅游的绝佳选择。"
        )


def generate_transport_suggestions_batch(from_to_list: list, destination: str, llm: ChatOpenAI) -> list:
    if not from_to_list:
        return []

    routes_text = "\n".join([f"- {i+1}. 从{ft['from']}到{ft['to']}" for i, ft in enumerate(from_to_list)])

    prompt = f"""你是一个当地交通专家。请为在{destination}的以下路线提供交通建议：

{routes_text}

请以JSON数组格式输出，每个元素格式如下：
{{"method": "交通方式(如地铁/公交/打车/步行)", "duration": "预计时间(如15分钟/30分钟)", "cost": "费用估算(如¥5/¥20/¥35)", "tips": "温馨提示"}}

只输出JSON数组，不要有其他文字。"""

    try:
        response = llm.invoke([
            SystemMessage(content="你是一个专业的当地交通顾问。"),
            HumanMessage(content=prompt)
        ])
        content = response.content.strip()

        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        data = json.loads(content)
        results = []
        for i, item in enumerate(data):
            if i < len(from_to_list):
                results.append(TransportInfo(
                    from_place=from_to_list[i]['from'],
                    to_place=from_to_list[i]['to'],
                    method=item.get("method", "地铁/公交"),
                    duration=item.get("duration", "15-30分钟"),
                    cost=item.get("cost", "¥10-30"),
                    tips=item.get("tips", "建议使用高德地图导航")
                ))
        return results
    except Exception as e:
        print(f"LLM 批量生成交通建议失败: {e}")
        return [TransportInfo(
            from_place=ft['from'],
            to_place=ft['to'],
            method="地铁/公交/打车",
            duration="15-30分钟",
            cost="¥10-30",
            tips="建议使用高德地图导航"
        ) for ft in from_to_list]


def generate_day_plans(intent: TravelIntent, attractions: List[Attraction], restaurants: List[Restaurant], llm: ChatOpenAI) -> List[DayPlan]:
    daily_budget = intent.budget / intent.days
    budget_per_night = (intent.budget * 0.20) / intent.nights if intent.nights > 0 else 500

    if not attractions:
        attractions = [
            Attraction(name=f"{intent.destination}市中心", address=f"{intent.destination}", rating=4.0, description="当地热门景点"),
            Attraction(name=f"{intent.destination}博物馆", address=f"{intent.destination}", rating=4.2, description="了解当地历史文化"),
            Attraction(name=f"{intent.destination}公园", address=f"{intent.destination}", rating=4.3, description="休闲放松好去处"),
        ]

    if not restaurants:
        restaurants = [
            Restaurant(name=f"{intent.destination}特色餐厅", cuisine="当地菜", price_range="¥50-100", address=f"{intent.destination}"),
            Restaurant(name=f"{intent.destination}小吃街", cuisine="小吃", price_range="¥20-50", address=f"{intent.destination}"),
        ]

    routes = []
    day_attractions = []
    for day in range(1, intent.days + 1):
        morning_place = attractions[(day - 1) % len(attractions)]
        afternoon_place = attractions[(day) % len(attractions)]
        evening_place = restaurants[(day - 1) % len(restaurants)]

        from_place = f"{intent.destination}酒店" if day <= intent.nights else f"{intent.destination}出发点"
        routes.append({"from": from_place, "to": morning_place.name, "time": "morning"})
        routes.append({"from": morning_place.name, "to": afternoon_place.name, "time": "afternoon"})
        routes.append({"from": afternoon_place.name, "to": evening_place.name, "time": "evening"})
        day_attractions.append({
            "day": day,
            "morning_place": morning_place,
            "afternoon_place": afternoon_place,
            "evening_place": evening_place
        })

    transport_results = generate_transport_suggestions_batch(routes, intent.destination, llm)

    transport_map = {}
    for t in transport_results:
        for r in routes:
            if r['from'] == t.from_place and r['to'] == t.to_place:
                transport_map[(r['time'], r['from'], r['to'])] = t

    plans = []
    for day_data in day_attractions:
        day = day_data["day"]
        morning_place = day_data["morning_place"]
        afternoon_place = day_data["afternoon_place"]
        evening_place = day_data["evening_place"]

        from_place = f"{intent.destination}酒店" if day <= intent.nights else f"{intent.destination}出发点"
        morning_transport = transport_map.get(("morning", from_place, morning_place.name))
        afternoon_transport = transport_map.get(("afternoon", morning_place.name, afternoon_place.name))
        evening_transport = transport_map.get(("evening", afternoon_place.name, evening_place.name))

        hotel = None
        if day <= intent.nights:
            hotel = generate_hotels_by_llm(intent.destination, budget_per_night, evening_place.name, llm)[0]

        plan = DayPlan(
            day=day,
            date=f"第{day}天",
            morning=f"参观 {morning_place.name}（{morning_place.description[:50]}）",
            morning_transport=morning_transport,
            afternoon=f"游览 {afternoon_place.name}，之后前往 {evening_place.name} 用餐",
            afternoon_transport=afternoon_transport,
            evening=f"在 {evening_place.name}（{evening_place.cuisine}，{evening_place.price_range}）享用晚餐",
            evening_transport=evening_transport,
            accommodation=hotel,
            estimated_cost=round(daily_budget, 2)
        )
        plans.append(plan)

    return plans


def generate_markdown_itinerary(intent: TravelIntent, day_plans: List[DayPlan], budget: Dict, attractions: List[Attraction], restaurants: List[Restaurant]) -> str:
    import re
    from urllib.parse import quote, unquote

    def clean_raw_urls(text: str) -> str:
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, text)
        for url in urls:
            try:
                if 'amap.com' in url:
                    parsed = urlparse(url)
                    name_match = re.search(r'name=([^&]+)', parsed.query)
                    if name_match:
                        name = unquote(name_match.group(1))
                        name = name.replace('(', '\\(').replace(')', '\\)')
                        text = text.replace(url, '')
                        text = text.replace('()', '')
                        text = text.strip()
                        if not text.endswith(')') or text.count('(') == text.count(')'):
                            pass
                        if text:
                            return f"[{name}]({url})"
            except Exception:
                continue
        return text

    def clean_text(text):
        text = re.sub(r'<[^>]+>', '', str(text))
        return text

    def escape_markdown(text):
        text = str(text)
        text = text.replace('\\', '\\\\')
        text = text.replace('(', '\\(').replace(')', '\\)')
        text = text.replace('[', '\\[').replace(']', '\\]')
        return text

    attraction_map = {clean_text(a.name): a.amap_url for a in attractions if a.amap_url}
    restaurant_map = {clean_text(r.name): r.amap_url for r in restaurants if r.amap_url}

    def format_transport(t: TransportInfo) -> str:
        return f"- **交通方式**: {t.method} | **耗时**: {t.duration} | **费用**: {t.cost}" + (f"\n- **提示**: {t.tips}" if t.tips else "")

    def add_map_link(text: str) -> str:
        import re
        from urllib.parse import urlparse, unquote

        existing_markdown_links = {}
        def save_markdown_link(m):
            placeholder = f"__MD_LINK_{len(existing_markdown_links)}__"
            existing_markdown_links[placeholder] = m.group(0)
            return placeholder
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', save_markdown_link, text)

        raw_urls = re.findall(r'https?://[^\s<>"{}|\\^`\[\]\)]+', text)
        for url in raw_urls:
            try:
                parsed = urlparse(url)
                if 'amap.com' in parsed.netloc:
                    name_match = re.search(r'name=([^&]+)', parsed.query)
                    if name_match:
                        name = unquote(name_match.group(1))
                        name = name.replace('(', '\\(').replace(')', '\\)')
                        text = text.replace(url, '')
                        text = f"[{name}]({url})"
            except Exception:
                continue

        for name, url in attraction_map.items():
            escaped_name = escape_markdown(name)
            if name in text and f"[{escaped_name}]" not in text:
                text = text.replace(name, f"[{escaped_name}]({url})")

        for name, url in restaurant_map.items():
            escaped_name = escape_markdown(name)
            if name in text and f"[{escaped_name}]" not in text:
                text = text.replace(name, f"[{escaped_name}]({url})")

        for placeholder, original_link in existing_markdown_links.items():
            text = text.replace(placeholder, original_link)

        return text

    def format_hotel(hotel) -> str:
        if not hotel:
            return ""
        clean_name = escape_markdown(clean_text(hotel.name))
        clean_addr = clean_text(hotel.address)
        name_link = f"[{clean_name}]({hotel.amap_url})" if hotel.amap_url else clean_name
        return f"{name_link}（{clean_addr}，约¥{hotel.price}/晚）"

    md = f"""# 🗾 {intent.destination} {intent.days}天{int(intent.nights)}晚旅行规划

## 📊 基本信息
- **目的地**: {intent.destination}
- **行程天数**: {intent.days}天{int(intent.nights)}晚
- **总预算**: ¥{intent.budget:.0f}
- **用户偏好**: {', '.join(intent.preferences) if intent.preferences else '无特殊偏好'}

## 💰 预算分配
| 项目 | 金额/天 | 说明 |
|------|---------|------|
| 餐饮 | ¥{budget['daily_breakdown']['餐饮']:.0f} | 含午餐和晚餐 |
| 交通 | ¥{budget['daily_breakdown']['交通']:.0f} | 地铁、公交 |
| 景点门票 | ¥{budget['daily_breakdown']['景点门票']:.0f} | 门票及体验 |
| 购物 | ¥{budget['daily_breakdown']['购物']:.0f} | 纪念品等 |
| **住宿** | ¥{budget['accommodation_per_night']:.0f}/晚 | 共{int(intent.nights)}晚 |

---
"""

    for plan in day_plans:
        md += f"""## 📅 {plan.date}

### 🌅 上午
**行程**: {add_map_link(plan.morning)}
"""
        if plan.morning_transport:
            md += f"**🚇 交通**: {format_transport(plan.morning_transport)}\n"
        md += f"""
### 🌞 下午
**行程**: {add_map_link(plan.afternoon)}
"""
        if plan.afternoon_transport:
            md += f"**🚇 交通**: {format_transport(plan.afternoon_transport)}\n"
        md += f"""
### 🌙 晚上
**行程**: {add_map_link(plan.evening)}
"""
        if plan.evening_transport:
            md += f"**🚇 交通**: {format_transport(plan.evening_transport)}\n"
        if plan.accommodation:
            md += f"\n### 🏨 住宿\n{format_hotel(plan.accommodation)}\n"
        md += f"\n> 💵 当天预估费用: ¥{plan.estimated_cost:.0f}\n\n---\n\n"

    md += """
## 📝 旅行小贴士
1. 建议提前查看景点开放时间和门票价格
2. 合理安排体力，避免行程过紧
3. 尝试当地特色美食，体验风土人情
4. 记得携带充电宝和个人洗漱用品

*本行程由 AI 自动生成，仅供参考*
"""
    return md


class TravelAgent:
    def __init__(self, api_key: str):
        self.llm = ChatOpenAI(
            model="deepseek-chat",
            api_key=api_key,
            base_url="https://api.deepseek.com",
            temperature=0.7
        )

    def plan(self, query: str) -> TravelResponse:
        intent = parse_travel_intent(query, self.llm)

        attractions = get_attractions(intent.destination, intent.preferences, self.llm)
        restaurants = get_restaurants(intent.destination, intent.preferences, self.llm)

        budget_breakdown = calculate_budget_breakdown(intent.budget, intent.days, intent.nights)

        day_plans = generate_day_plans(intent, attractions, restaurants, self.llm)

        markdown_itinerary = generate_markdown_itinerary(intent, day_plans, budget_breakdown, attractions, restaurants)

        current_weather = get_weather_seniverse(intent.destination)
        forecast_data = get_forecast_seniverse(intent.destination, intent.days)

        weather_info = None
        forecast_list = None
        if current_weather:
            weather_info = WeatherInfo(
                text=current_weather.get("text", "未知"),
                temperature=current_weather.get("temperature", "?"),
                humidity=current_weather.get("humidity"),
                wind_direction=current_weather.get("wind_direction"),
                wind_scale=current_weather.get("wind_scale"),
                last_update=current_weather.get("last_update")
            )
        if forecast_data and forecast_data.get("forecast"):
            forecast_list = [
                DayForecast(
                    date=d.get("date", ""),
                    text_day=d.get("text_day", "未知"),
                    text_night=d.get("text_night", "未知"),
                    high=d.get("high", "?"),
                    low=d.get("low", "?"),
                    wind_direction=d.get("wind_direction"),
                    wind_scale=d.get("wind_scale")
                )
                for d in forecast_data["forecast"]
            ]

        return TravelResponse(
            intent=intent,
            day_plans=day_plans,
            attractions=attractions,
            restaurants=restaurants,
            budget_breakdown=budget_breakdown,
            markdown_itinerary=markdown_itinerary,
            current_weather=weather_info,
            forecast=forecast_list,
            city_info=generate_city_info(intent.destination, self.llm)
        )
