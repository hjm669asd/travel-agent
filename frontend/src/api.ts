import axios from 'axios';
import type { TravelRequest, TravelResponse } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export async function createTravelPlan(request: TravelRequest): Promise<TravelResponse> {
  const response = await api.post<TravelResponse>('/travel/plan', request);
  return response.data;
}

export async function healthCheck(): Promise<{ status: string; message: string }> {
  const response = await api.get('/health');
  return response.data;
}
