import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Create the auth context
const AuthContext = createContext();

/**
 * AuthProvider Component
 * 
 * Provides authentication state and methods to the application
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock user for demo purposes
  useEffect(() => {
    // Simulate loading user data
    const loadUser = async () => {
      try {
        // In a real app, this would be an API call to validate the token
        // and get the user data
        setTimeout(() => {
          const mockUser = {
            id: '1',
            username: 'CurrentUser',
            displayName: 'Current User',
            email: 'user@example.com',
            avatarUrl: 'https://i.pravatar.cc/150?img=1',
            isAuthenticated: true
          };
          
          setUser(mockUser);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Failed to load user data');
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Mock login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would be an API call to authenticate
      // and get a token
      setTimeout(() => {
        const mockUser = {
          id: '1',
          username: credentials.username || 'CurrentUser',
          displayName: 'Current User',
          email: 'user@example.com',
          avatarUrl: 'https://i.pravatar.cc/150?img=1',
          isAuthenticated: true
        };
        
        setUser(mockUser);
        setLoading(false);
        
        return mockUser;
      }, 500);
    } catch (err) {
      setError('Authentication failed');
      setLoading(false);
      throw err;
    }
  };

  // Mock logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would be an API call to invalidate the token
      setTimeout(() => {
        setUser(null);
        setLoading(false);
      }, 300);
    } catch (err) {
      setError('Logout failed');
      setLoading(false);
      throw err;
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * useAuth Hook
 * 
 * Custom hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
