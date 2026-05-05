import axios from 'axios';

const api = axios.create({
  baseURL: 'https://jjzvxsnr-8080.inc1.devtunnels.ms/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    // Optionally handle token expiration, e.g., clear localStorage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
