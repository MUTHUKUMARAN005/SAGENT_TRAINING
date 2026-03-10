import axios from 'axios';
import { isMockApiForced, mockApiAdapter, shouldUseMockFallback } from './mockApi';

const baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isMockApiForced()) {
    config.adapter = mockApiAdapter;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    if (!config.__mockRetried && !isMockApiForced() && shouldUseMockFallback(error)) {
      config.__mockRetried = true;
      return mockApiAdapter(config);
    }

    const status = error.response?.status;
    const requestUrl = String(config.url || '');
    const isAuthRequest = /\/auth\/(login|register)$/i.test(requestUrl);

    if (status === 401 && !isAuthRequest) {
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
