import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from './LoadingScreen';

// Protected route component to handle authentication
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while authentication state is being checked
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
