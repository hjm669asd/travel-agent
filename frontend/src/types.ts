export interface TravelIntent {
  destination: string;
  days: number;
  nights: number;
  budget: number;
  preferences: string[];
}

export interface Hotel {
  name: string;
  address: string;
  price: number;
  description: string;
  amap_url?: string;
}

export interface TransportInfo {
  from_place: string;
  to_place: string;
  method: string;
  duration: string;
  cost: string;
  tips?: string;
}

export interface DayPlan {
  day: number;
  date: string;
  morning: string;
  morning_transport?: TransportInfo;
  afternoon: string;
  afternoon_transport?: TransportInfo;
  evening: string;
  evening_transport?: TransportInfo;
  accommodation: Hotel | null;
  estimated_cost: number;
}

export interface Attraction {
  name: string;
  address: string;
  rating: number | null;
  description: string;
  amap_url?: string;
  image_url?: string;
}

export interface Restaurant {
  name: string;
  cuisine: string;
  price_range: string;
  address: string;
  amap_url?: string;
}

export interface BudgetBreakdown {
  total_budget: number;
  daily_breakdown: {
    餐饮: number;
    交通: number;
    景点门票: number;
    购物: number;
  };
  accommodation_total: number;
  accommodation_per_night: number;
}

export interface WeatherInfo {
  text: string;
  temperature: string;
  humidity?: string;
  wind_direction?: string;
  wind_scale?: string;
  last_update?: string;
}

export interface DayForecast {
  date: string;
  text_day: string;
  text_night: string;
  high: string;
  low: string;
  wind_direction?: string;
  wind_scale?: string;
}

export interface CityInfo {
  history: string;
  food: string;
  attractions: string;
}

export interface TravelResponse {
  intent: TravelIntent;
  day_plans: DayPlan[];
  attractions: Attraction[];
  restaurants: Restaurant[];
  budget_breakdown: BudgetBreakdown;
  markdown_itinerary: string;
  current_weather?: WeatherInfo;
  forecast?: DayForecast[];
  city_info?: CityInfo;
}

export interface TravelRequest {
  query: string;
  openai_api_key?: string;
}
