// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

// Inject JWT token to request headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workforce_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('workforce_token');
      localStorage.removeItem('workforce_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
