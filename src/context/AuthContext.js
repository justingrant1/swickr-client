import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// Create context for authentication
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem('user');
        const tokens = localStorage.getItem('tokens');
        
        if (userData && tokens) {
          const parsedUser = JSON.parse(userData);
          const parsedTokens = JSON.parse(tokens);
          
          // Check if token is expired and needs refresh
          const isTokenExpired = authService.isTokenExpired(parsedTokens.accessToken);
          
          if (isTokenExpired) {
            // Try to refresh the token
            const refreshResult = await authService.refreshToken(parsedTokens.refreshToken);
            if (refreshResult.success) {
              // Update tokens in localStorage
              localStorage.setItem('tokens', JSON.stringify(refreshResult.data.tokens));
              setUser(parsedUser);
            } else {
              // If refresh fails, log out
              handleLogout();
            }
          } else {
            // Token is still valid
            setUser(parsedUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [navigate]);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        const { user, tokens } = response.data;
        
        // Store user data and tokens in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tokens', JSON.stringify(tokens));
        
        setUser(user);
        return { success: true };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      if (response.success) {
        const { user, tokens } = response.data;
        
        // Store user data and tokens in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tokens', JSON.stringify(tokens));
        
        setUser(user);
        return { success: true };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Get refresh token from localStorage
      const tokens = localStorage.getItem('tokens');
      if (tokens) {
        const parsedTokens = JSON.parse(tokens);
        // Call logout API
        await authService.logout(parsedTokens.refreshToken);
      }
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('tokens');
      
      // Reset state
      setUser(null);
      
      // Redirect to login page
      navigate('/login');
      
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local data even if API call fails
      localStorage.removeItem('user');
      localStorage.removeItem('tokens');
      setUser(null);
      navigate('/login');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout: handleLogout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
