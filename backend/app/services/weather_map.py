import os
import httpx
from typing import Optional, Dict, Any


SENIVERSE_API_KEY = os.getenv("SENIVERSE_API_KEY", "SZSZzq0kcVz28etZq")
AMAP_API_KEY = os.getenv("AMAP_API_KEY", "d5715e703a2d4d3d56287b2754753dcd")


def get_weather_seniverse(location: str) -> Optional[Dict[str, Any]]:
    try:
        url = "https://api.seniverse.com/v3/weather/now.json"
        params = {
            "key": SENIVERSE_API_KEY,
            "location": location,
            "language": "zh-Hans",
            "unit": "c"
        }
        response = httpx.get(url, params=params, timeout=10)
        data = response.json()

        if "results" in data and len(data["results"]) > 0:
            result = data["results"][0]
            now = result.get("now", {})
            return {
                "text": now.get("text", "未知"),
                "temperature": now.get("temperature", "?"),
                "humidity": now.get("humidity", "?"),
                "wind_direction": now.get("wind_direction", ""),
                "wind_scale": now.get("wind_scale", ""),
                "last_update": result.get("last_update", "")[:16],
                "location_name": result.get("location", {}).get("name", location)
            }
    except Exception as e:
        print(f"Weather API error: {e}")
    return None


def get_forecast_seniverse(location: str, days: int = 3) -> Optional[Dict[str, Any]]:
    try:
        url = "https://api.seniverse.com/v3/weather/daily.json"
        params = {
            "key": SENIVERSE_API_KEY,
            "location": location,
            "language": "zh-Hans",
            "unit": "c",
            "start": 0,
            "days": days
        }
        response = httpx.get(url, params=params, timeout=10)
        data = response.json()

        if "results" in data and len(data["results"]) > 0:
            result = data["results"][0]
            daily = result.get("daily", [])

            forecast = []
            for day in daily[:days]:
                forecast.append({
                    "date": day.get("date", "")[5:],
                    "text_day": day.get("text_day", "未知"),
                    "text_night": day.get("text_night", "未知"),
                    "high": day.get("high", "?"),
                    "low": day.get("low", "?"),
                    "wind_direction": day.get("wind_direction", ""),
                    "wind_scale": day.get("wind_scale", ""),
                    "rain_prob": day.get("rain_prob", "?"),
                })

            return {
                "location_name": result.get("location", {}).get("name", location),
                "forecast": forecast
            }
    except Exception as e:
        print(f"Forecast API error: {e}")
    return None


def search_location_amap(keyword: str, city: str = "") -> Optional[Dict[str, Any]]:
    import re
    try:
        url = "https://restapi.amap.com/v3/place/text"
        params = {
            "key": AMAP_API_KEY,
            "keywords": keyword,
            "city": city,
            "citylimit": True if city else False,
            "output": "json",
            "offset": 1
        }
        response = httpx.get(url, params=params, timeout=10)
        data = response.json()

        if data.get("status") == "1" and data.get("pois"):
            pois = data["pois"]
            if pois:
                poi = pois[0]
                name = poi.get("name", keyword)
                name = re.sub(r'<[^>]+>', '', name)
                address = poi.get("address", "未知地址")
                address = re.sub(r'<[^>]+>', '', address)
                return {
                    "name": name,
                    "address": address,
                    "location": poi.get("location", ""),
                    "tel": poi.get("tel", ""),
                    "type": poi.get("type", ""),
                }
    except Exception as e:
        print(f"AMap search error: {e}")
    return None


def get_static_map_url(address: str, zoom: int = 15, width: int = 400, height: int = 200) -> str:
    try:
        location_info = search_location_amap(address)
        if location_info and location_info.get("location"):
            return f"https://restapi.amap.com/v3/staticmap?location={location_info['location']}&zoom={zoom}&size={width}x{height}&key={AMAP_API_KEY}"
    except Exception as e:
        print(f"Static map error: {e}")
    return ""


def get_amap_link(address: str) -> str:
    import re
    from urllib.parse import quote

    clean_address = re.sub(r'<[^>]+>', '', address).strip()
    if not clean_address:
        clean_address = address

    encoded_name = quote(clean_address, safe='')

    try:
        location_info = search_location_amap(clean_address)
        if location_info and location_info.get("location"):
            lng, lat = location_info["location"].split(",")
            return f"https://uri.amap.com/marker?position={lng},{lat}&name={encoded_name}&src=mypage&coordinate=gaode"
    except Exception as e:
        print(f"AMap link error: {e}")

    return f"https://www.amap.com/search?query={encoded_name}"


def get_unsplash_image(keyword: str) -> str:
    import hashlib
    keyword_hash = hashlib.md5(keyword.encode()).hexdigest()[:8]
    return f"https://picsum.photos/seed/{keyword_hash}/400/200"
