import axios from 'axios';

// Base URL is configured via environment variables; never hardcode URLs
// inside components. See .env.example.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
});

// Simple response interceptor: normalize errors so UI code stays clean.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Unknown API error';
    return Promise.reject(new Error(message));
  },
);

export default api;
