import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { 
  registerServiceWorker, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications 
} from '../serviceWorkerRegistration';

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

const NotificationContext = createContext();

/**
 * Custom hook to use the notification context
 * @returns {Object} Notification context value
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

/**
 * NotificationProvider Component
 * 
 * Provides notification state and functions to the app
 */
export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated, authToken } = useAuth();
  const { socket } = useSocket();
  
  // State for notifications and settings
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState({
    enabled: true,
    newMessages: true,
    mentions: true,
    contactRequests: true,
    statusUpdates: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [performanceTestStatus, setPerformanceTestStatus] = useState({
    running: false,
    progress: 0,
    results: null
  });
  
  // Initialize service worker registration
  useEffect(() => {
    const initServiceWorker = async () => {
      const registration = await registerServiceWorker();
      setServiceWorkerRegistration(registration);
      
      if (registration) {
        // Check if push is already enabled
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      }
    };
    
    initServiceWorker();
  }, []);
  
  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchNotificationSettings();
      fetchPerformanceMetrics();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPerformanceMetrics(null);
    }
  }, [isAuthenticated]);
  
  // Listen for socket events
  useEffect(() => {
    if (!socket || !isAuthenticated) return;
    
    // Listen for new notifications
    socket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Track notification received event
      trackNotificationEvent(notification.id, 'received', {
        sendTime: notification.createdAt,
        type: notification.type
      });
    });
    
    // Listen for notification updates
    socket.on('notification:update', (updatedNotification) => {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === updatedNotification.id 
            ? updatedNotification 
            : notification
        )
      );
      
      // Recalculate unread count
      calculateUnreadCount();
    });
    
    // Listen for notification deletion
    socket.on('notification:delete', (notificationId) => {
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // Recalculate unread count
      calculateUnreadCount();
    });
    
    // Listen for notification settings updates
    socket.on('notification:settings:update', (updatedSettings) => {
      setSettings(updatedSettings);
    });
    
    // Listen for performance metrics updates
    socket.on('notification:performance:update', () => {
      fetchPerformanceMetrics();
    });
    
    return () => {
      socket.off('notification:new');
      socket.off('notification:update');
      socket.off('notification:delete');
      socket.off('notification:settings:update');
      socket.off('notification:performance:update');
    };
  }, [socket, isAuthenticated]);
  
  /**
   * Calculate unread notification count
   */
  const calculateUnreadCount = useCallback(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);
  
  /**
   * Fetch user notifications
   */
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      
      // Calculate unread count
      const count = response.data.filter(notification => !notification.read).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fetch notification settings
   */
  const fetchNotificationSettings = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/notifications/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };
  
  /**
   * Fetch notification performance metrics
   * @param {string} timeRange - Time range for metrics (hourly, daily, weekly)
   */
  const fetchPerformanceMetrics = async (timeRange = 'daily') => {
    if (!isAuthenticated) return;
    
    setMetricsLoading(true);
    try {
      const response = await api.get(`/notifications/performance?timeRange=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        setPerformanceMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };
  
  /**
   * Start a notification performance test
   * @param {Object} options - Test options
   * @param {number} options.count - Number of notifications to send
   * @param {number} options.delay - Delay between notifications in ms
   * @param {boolean} options.simulateClient - Whether to simulate client-side events
   * @returns {Promise<Object>} Test results
   */
  const startPerformanceTest = async (options = {}) => {
    if (!isAuthenticated || !pushEnabled) {
      throw new Error('User must be authenticated and push notifications enabled');
    }
    
    try {
      const response = await api.post('/notifications/performance/test', {
        count: options.count || 5,
        delay: options.delay || 500,
        simulateClient: options.simulateClient !== false
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      setPerformanceTestStatus({
        running: true,
        progress: 0,
        results: null
      });
      
      return response.data;
    } catch (error) {
      console.error('Error starting performance test:', error);
      throw error;
    }
  };
  
  /**
   * Get the status of the current performance test
   * @returns {Promise<Object>} Test status
   */
  const getPerformanceTestStatus = async () => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated');
    }
    
    try {
      const response = await api.get('/notifications/performance/test/status', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      setPerformanceTestStatus({
        running: response.data.running,
        progress: response.data.current / response.data.total * 100,
        results: response.data.results
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting performance test status:', error);
      throw error;
    }
  };
  
  /**
   * Track a notification event (received, displayed, clicked, closed)
   * @param {string} notificationId - Notification ID
   * @param {string} eventType - Event type (received, displayed, clicked, closed)
   * @param {Object} metadata - Additional metadata
   */
  const trackNotificationEvent = async (notificationId, eventType, metadata = {}) => {
    if (!isAuthenticated || !notificationId || !eventType) return;
    
    try {
      await api.post('/notifications/client/events', {
        notificationId,
        eventType,
        metadata
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
    } catch (error) {
      console.error(`Error tracking ${eventType} event:`, error);
    }
  };
  
  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   */
  const markAsRead = async (id) => {
    if (!isAuthenticated) return;
    
    try {
      await api.put(`/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Track notification clicked event
      trackNotificationEvent(id, 'clicked', {
        receiveTime: Date.now()
      });
      
      // Recalculate unread count
      calculateUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      await api.put('/notifications/read-all');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };
  
  /**
   * Delete a notification
   * @param {string} id - Notification ID
   */
  const deleteNotification = async (id) => {
    if (!isAuthenticated) return;
    
    try {
      await api.delete(`/notifications/${id}`);
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Recalculate unread count
      calculateUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };
  
  /**
   * Update notification settings
   * @param {Object} updatedSettings - Updated settings object
   */
  const updateSettings = async (updatedSettings) => {
    if (!isAuthenticated) return;
    
    try {
      await api.put('/notifications/settings', updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  };
  
  /**
   * Enable push notifications
   * @returns {Promise<boolean>} Success status
   */
  const enablePushNotifications = async () => {
    if (!isAuthenticated || !serviceWorkerRegistration) return false;
    
    try {
      // Get VAPID public key from server
      const response = await api.get('/notifications/vapid-public-key');
      const publicVapidKey = response.data.publicKey;
      
      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications(
        serviceWorkerRegistration, 
        publicVapidKey
      );
      
      if (!subscription) {
        return false;
      }
      
      // Send subscription to server
      await api.post('/notifications/subscribe', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
          }
        },
        userAgent: navigator.userAgent
      });
      
      setPushEnabled(true);
      return true;
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      return false;
    }
  };
  
  /**
   * Disable push notifications
   * @returns {Promise<boolean>} Success status
   */
  const disablePushNotifications = async () => {
    if (!isAuthenticated || !serviceWorkerRegistration) return false;
    
    try {
      // Unsubscribe from push notifications
      const success = await unsubscribeFromPushNotifications(serviceWorkerRegistration);
      
      if (!success) {
        return false;
      }
      
      // Notify server
      await api.post('/notifications/unsubscribe');
      
      setPushEnabled(false);
      return true;
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      return false;
    }
  };
  
  /**
   * Refresh notifications
   */
  const refreshNotifications = () => {
    fetchNotifications();
  };
  
  /**
   * Handle notification click
   */
  const handleNotificationClick = async (notification) => {
    // Mark as read
    await markAsRead(notification.id);
    
    // Track notification clicked event
    trackNotificationEvent(notification.id, 'clicked', {
      receiveTime: notification.receivedAt || Date.now()
    });
    
    // Handle navigation based on notification type
    if (notification.data && notification.data.url) {
      window.location.href = notification.data.url;
    } else if (notification.type === 'message') {
      // Navigate to conversation
      if (notification.data && notification.data.conversationId) {
        window.location.href = `/conversations/${notification.data.conversationId}`;
      }
    } else if (notification.type === 'contact_request') {
      // Navigate to contacts page
      window.location.href = '/contacts';
    }
  };
  
  /**
   * Send a test notification
   */
  const sendTestNotification = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.post('/notifications/test', {}, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to send test notification' };
    }
  };
  
  /**
   * Reset performance metrics
   */
  const resetPerformanceMetrics = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.post('/notifications/performance/reset', {}, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        fetchPerformanceMetrics();
        return { success: true };
      }
      
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Error resetting performance metrics:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to reset metrics' };
    }
  };
  
  // Context value
  const value = {
    notifications,
    unreadCount,
    settings,
    loading,
    pushEnabled,
    performanceMetrics,
    metricsLoading,
    performanceTestStatus,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    enablePushNotifications,
    disablePushNotifications,
    fetchPerformanceMetrics,
    startPerformanceTest,
    getPerformanceTestStatus,
    trackNotificationEvent,
    handleNotificationClick,
    sendTestNotification,
    resetPerformanceMetrics
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
