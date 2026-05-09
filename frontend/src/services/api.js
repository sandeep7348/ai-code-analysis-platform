import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Session-Id'] = getSessionId();
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

function getSessionId() {
  let id = sessionStorage.getItem('session_id');
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('session_id', id); }
  return id;
}

// Auth
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me')
};

// Analysis
export const analyzeApi = {
  analyze: (code, mode, language) => api.post('/api/analyze', { code, mode, language }),
  chat: (question, history, language) => api.post('/api/analyze/chat', { question, history, language })
};

// History
export const historyApi = {
  getHistory: (page = 1, limit = 10) => api.get(`/api/history?page=${page}&limit=${limit}`),
  getStats: () => api.get('/api/history/stats'),
  deleteAnalysis: (id) => api.delete(`/api/history/${id}`),
  rateAnalysis: (id, rating, feedback = '') => api.put(`/api/history/${id}/rate`, { rating, feedback }),
  pinAnalysis: (id) => api.put(`/api/history/${id}/pin`),
  archiveAnalysis: (id) => api.put(`/api/history/${id}/archive`)
};

export default api;
