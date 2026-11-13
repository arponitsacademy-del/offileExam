import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:8000/api');
export const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/storage` : 'http://localhost:8000/storage');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor to attach Sanctum bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartomr_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expired
      localStorage.removeItem('smartomr_token');
      localStorage.removeItem('smartomr_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

