import os
from app.agent.travel_agent import TravelAgent

a = TravelAgent(os.getenv('DEEPSEEK_API_KEY'))
r = a.plan('3T2W CZ 5000')
for p in r.day_plans:
    has_hotel = "YES" if p.accommodation else "NO"
    print(f"Day {p.day}: {has_hotel}")
