import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { MessagingProvider } from './context/MessagingContext';
import { MediaProvider } from './context/MediaContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Contacts from './pages/Contacts';
import AddContact from './pages/AddContact';
import LoadingScreen from './components/common/LoadingScreen';
import Settings from './pages/Settings';
import PerformanceSettings from './pages/PerformanceSettings';
import NotificationSettingsPage from './pages/NotificationSettingsPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={
              <AuthProvider>
                <Login />
              </AuthProvider>
            } />
            <Route path="/register" element={
              <AuthProvider>
                <Register />
              </AuthProvider>
            } />
            <Route path="/" element={
              <AuthProvider>
                <ProtectedRoute />
              </AuthProvider>
            }>
              <Route element={
                <SocketProvider>
                  <NotificationProvider>
                    <MessagingProvider>
                      <MediaProvider>
                        <MainLayout />
                      </MediaProvider>
                    </MessagingProvider>
                  </NotificationProvider>
                </SocketProvider>
              }>
                <Route index element={<Home />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="contacts/add" element={<AddContact />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/notifications" element={<NotificationSettingsPage />} />
                <Route path="performance-settings" element={<PerformanceSettings />} />
                <Route path="profile" element={<LoadingScreen message="Profile page coming soon" />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
