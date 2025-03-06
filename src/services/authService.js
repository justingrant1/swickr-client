import axios from 'axios';
import jwtDecode from 'jwt-decode';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication service
const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Registration failed' 
      };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Login failed' 
      };
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh-token', { refreshToken });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Token refresh failed' 
      };
    }
  },

  // Logout user
  logout: async (refreshToken) => {
    try {
      await api.post('/auth/logout', { refreshToken });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Logout failed' 
      };
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    try {
      if (!token) return true;
      
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Add a buffer of 60 seconds to refresh token before it actually expires
      return decoded.exp < currentTime + 60;
    } catch (error) {
      console.error('Token validation error:', error);
      return true;
    }
  },

  // Get current user from token
  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
};

export default authService;
