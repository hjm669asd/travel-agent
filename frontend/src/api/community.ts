import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      username,
      email,
      password
    });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password
    });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
  },

  getMe: async () => {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  updateMe: async (data: { email?: string; bio?: string; avatar_url?: string }) => {
    const response = await axios.put(`${API_BASE}/auth/me`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export interface Diary {
  id: number;
  title: string;
  content: string;
  location: string;
  travel_date: string;
  view_count: number;
  like_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  images: { id: number; image_url: string; sort_order: number }[];
  author_username: string;
  is_liked?: boolean;
}

export interface DiaryListItem {
  id: number;
  title: string;
  location: string;
  travel_date: string;
  view_count: number;
  like_count: number;
  created_at: string;
  author_username: string;
  author_avatar?: string;
  cover_image?: string;
}

export const diaryAPI = {
  create: async (data: {
    title: string;
    content: string;
    location: string;
    travel_date: string;
    images?: string[];
  }) => {
    const response = await axios.post(`${API_BASE}/diaries`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getAll: async (params?: { location?: string; page?: number; page_size?: number }) => {
    const response = await axios.get<DiaryListItem[]>(`${API_BASE}/diaries`, { params });
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await axios.get<Diary>(`${API_BASE}/diaries/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  update: async (id: number, data: Partial<Diary>) => {
    const response = await axios.put(`${API_BASE}/diaries/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axios.delete(`${API_BASE}/diaries/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  like: async (id: number) => {
    const response = await axios.post(`${API_BASE}/diaries/${id}/like`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE}/diaries/upload`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export interface Rating {
  id: number;
  location: string;
  score: number;
  comment?: string;
  created_at: string;
  username?: string;
}

export const ratingAPI = {
  create: async (data: { location: string; score: number; comment?: string }) => {
    const response = await axios.post(`${API_BASE}/ratings`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getByLocation: async (location: string) => {
    const response = await axios.get(`${API_BASE}/ratings/location/${encodeURIComponent(location)}`);
    return response.data;
  },

  getMyRatings: async () => {
    const response = await axios.get<Rating[]>(`${API_BASE}/ratings/my`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axios.delete(`${API_BASE}/ratings/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export const adminAPI = {
  getAllUsers: async (params?: { page?: number; page_size?: number }) => {
    const response = await axios.get(`${API_BASE}/admin/users`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  deleteUser: async (userId: number) => {
    const response = await axios.delete(`${API_BASE}/admin/users/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getAllDiaries: async (params?: { page?: number; page_size?: number }) => {
    const response = await axios.get(`${API_BASE}/admin/diaries`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  deleteDiary: async (diaryId: number) => {
    const response = await axios.delete(`${API_BASE}/admin/diaries/${diaryId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export const travelAPI = {
  savePlan: async (query: string, planData: any) => {
    const response = await axios.post(`${API_BASE}/travel/save`, {
      query,
      plan_data: planData
    }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getSavedPlans: async () => {
    const response = await axios.get(`${API_BASE}/travel/saved`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getSavedPlan: async (planId: number) => {
    const response = await axios.get(`${API_BASE}/travel/saved/${planId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  deleteSavedPlan: async (planId: number) => {
    const response = await axios.delete(`${API_BASE}/travel/saved/${planId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};
