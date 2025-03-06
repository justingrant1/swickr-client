/**
 * Push Notification Utilities
 * 
 * Utilities for handling push notifications in the client
 */

/**
 * Set up a listener for push messages from the service worker
 * This function should be called when the application initializes
 */
export const setupPushMessageListener = () => {
  if (!navigator.serviceWorker) {
    console.warn('Service workers are not supported in this browser');
    return;
  }

  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
      const notification = event.data.notification;
      
      // Dispatch a custom event that our NotificationToast component can listen for
      window.dispatchEvent(
        new CustomEvent('push-notification', { detail: notification })
      );
      
      // You could also update notification state here if needed
      // For example, refreshing the notification list
    }
  });
};

/**
 * Check if push notifications are supported in this browser
 * @returns {boolean} Whether push notifications are supported
 */
export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
};

/**
 * Request notification permission from the user
 * @returns {Promise<string>} The permission state ('granted', 'denied', or 'default')
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported in this browser');
    return 'denied';
  }
  
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
};

/**
 * Check if notification permission is granted
 * @returns {boolean} Whether notification permission is granted
 */
export const hasNotificationPermission = () => {
  return Notification.permission === 'granted';
};

/**
 * Subscribe to push notifications
 * @param {string} vapidPublicKey - The VAPID public key from the server
 * @returns {Promise<PushSubscription|null>} The push subscription or null if failed
 */
export const subscribeToPushNotifications = async (vapidPublicKey) => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return null;
  }
  
  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }
    
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Convert the VAPID key to the format required by the browser
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>} Whether the unsubscription was successful
 */
export const unsubscribeFromPushNotifications = async () => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return false;
  }
  
  try {
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get the current subscription
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.warn('No push subscription found to unsubscribe from');
      return true; // Already unsubscribed
    }
    
    // Unsubscribe
    const result = await subscription.unsubscribe();
    
    return result;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

/**
 * Get the current push notification subscription
 * @returns {Promise<PushSubscription|null>} The current subscription or null
 */
export const getCurrentPushSubscription = async () => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return null;
  }
  
  try {
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get the current subscription
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
};

/**
 * Convert a URL-safe base64 string to a Uint8Array
 * This is needed for the applicationServerKey
 * @param {string} base64String - The base64 string to convert
 * @returns {Uint8Array} The converted array
 */
function urlBase64ToUint8Array(base64String) {
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
}

/**
 * Send a message to the service worker
 * @param {Object} message - The message to send
 * @returns {Promise<any>} Promise that resolves with the response
 */
export const sendMessageToServiceWorker = async (message) => {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.warn('No active service worker found');
    return null;
  }
  
  try {
    // Create a message channel
    const messageChannel = new MessageChannel();
    
    // Create a promise to wait for the response
    const messagePromise = new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
    });
    
    // Send the message
    navigator.serviceWorker.controller.postMessage(message, [
      messageChannel.port2
    ]);
    
    // Wait for the response
    return await messagePromise;
  } catch (error) {
    console.error('Error sending message to service worker:', error);
    return null;
  }
};
