import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

// Attach token from localStorage automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/profile'),
};

// Portfolio
export const portfolioAPI = {
  get: () => api.get('/portfolio'),
  buy: (data) => api.post('/portfolio/buy', data),
  sell: (data) => api.post('/portfolio/sell', data),
  getTransactions: () => api.get('/portfolio/transactions'),
  updatePrices: (prices) => api.post('/portfolio/update-prices', { prices }),
};

// Watchlist
export const watchlistAPI = {
  get: () => api.get('/watchlist'),
  add: (data) => api.post('/watchlist', data),
  remove: (symbol) => api.delete(`/watchlist/${symbol}`),
  update: (symbol, data) => api.put(`/watchlist/${symbol}`, data),
};

// Stocks
export const stocksAPI = {
  search: (q) => api.get(`/stocks/search?q=${q}`),
  quote: (symbol) => api.get(`/stocks/${symbol}/quote`),
  history: (symbol, period) => api.get(`/stocks/${symbol}/history?period=${period}`),
  market: () => api.get('/stocks/market'),
};

export default api;
