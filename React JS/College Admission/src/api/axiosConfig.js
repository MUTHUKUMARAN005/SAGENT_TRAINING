import axios from 'axios';

const rawBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
const baseURL = rawBaseUrl.replace(/\/+$/, '');

const API = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const requestUrl = `${config.baseURL || ''}${config.url || ''}`.toLowerCase();
  const isAuthRoute = /\/auth\/(login|register)\b/.test(requestUrl);
  const token = localStorage.getItem('auth_token');
  const hasInvalidToken = token === 'undefined' || token === 'null';
  if (hasInvalidToken) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  // Skip auth header on auth endpoints and drop stale token placeholders.
  if (!isAuthRoute && token && !hasInvalidToken) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestConfig = error?.config || {};
    const requestUrl = `${requestConfig.baseURL || ''}${requestConfig.url || ''}`.toLowerCase();
    const isAuthRoute = /\/auth\/(login|register)\b/.test(requestUrl);

    // Some backend builds throw 500 for malformed/expired auth headers on public GET endpoints.
    // Retry once without Authorization to recover read-only fetch flows.
    if (
      status === 500
      && requestConfig?.method?.toLowerCase() === 'get'
      && requestConfig?.headers?.Authorization
      && !requestConfig.__retryWithoutAuth
      && !isAuthRoute
    ) {
      const retryConfig = {
        ...requestConfig,
        headers: { ...(requestConfig.headers || {}) },
        __retryWithoutAuth: true,
      };
      delete retryConfig.headers.Authorization;
      return API.request(retryConfig);
    }

    if (status === 401 || status === 403) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default API;
