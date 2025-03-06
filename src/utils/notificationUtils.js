/**
 * Notification Utilities
 * 
 * Helper functions for managing push notifications in the browser
 */

import axios from './axios';

/**
 * Check if push notifications are supported by the browser
 * @returns {boolean} - Whether push notifications are supported
 */
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Get the current notification permission status
 * @returns {string} - Permission status ('default', 'granted', or 'denied')
 */
export const getNotificationPermission = () => {
  return Notification.permission;
};

/**
 * Request permission to show notifications
 * @returns {Promise<string>} - Permission status after request
 */
export const requestNotificationPermission = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
};

/**
 * Register the service worker for push notifications
 * @returns {Promise<ServiceWorkerRegistration>} - Service worker registration
 */
export const registerServiceWorker = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error('Service workers are not supported in this browser');
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    return registration;
  } catch (error) {
    console.error('Error registering service worker:', error);
    throw error;
  }
};

/**
 * Convert base64 string to Uint8Array (for VAPID key)
 * @param {string} base64String - Base64 encoded string
 * @returns {Uint8Array} - Converted array
 */
export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
};

/**
 * Subscribe to push notifications
 * @returns {Promise<Object>} - Subscription object
 */
export const subscribeToPushNotifications = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }
  
  try {
    // Request permission if not already granted
    if (Notification.permission !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }
    
    // Register service worker
    const registration = await registerServiceWorker();
    
    // Get existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // If already subscribed, return the subscription
    if (subscription) {
      return subscription;
    }
    
    // Get VAPID public key from server
    const response = await axios.get('/api/notifications/settings');
    const vapidPublicKey = response.data.vapidPublicKey || process.env.REACT_APP_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not available');
    }
    
    // Convert VAPID key to Uint8Array
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
    
    // Send subscription to server
    await axios.post('/api/notifications/subscribe', {
      subscription: subscription.toJSON()
    });
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
};

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>} - Whether unsubscription was successful
 */
export const unsubscribeFromPushNotifications = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }
  
  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get push subscription
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return true; // Already unsubscribed
    }
    
    // Unsubscribe from push manager
    const result = await subscription.unsubscribe();
    
    if (result) {
      // Send unsubscribe request to server
      await axios.delete('/api/notifications/unsubscribe', {
        data: { endpoint: subscription.endpoint }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
};

/**
 * Get current push subscription
 * @returns {Promise<PushSubscription|null>} - Current subscription or null
 */
export const getCurrentPushSubscription = async () => {
  if (!isPushNotificationSupported()) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Error getting current push subscription:', error);
    return null;
  }
};

/**
 * Send a test notification
 * @returns {Promise<Object>} - Result of the test
 */
export const sendTestNotification = async () => {
  try {
    const response = await axios.post('/api/notifications/test');
    return response.data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

/**
 * Update notification settings
 * @param {Object} settings - Notification settings to update
 * @returns {Promise<Object>} - Updated settings
 */
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await axios.put('/api/notifications/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Get notification settings
 * @returns {Promise<Object>} - Notification settings
 */
export const getNotificationSettings = async () => {
  try {
    const response = await axios.get('/api/notifications/settings');
    return response.data;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
};
