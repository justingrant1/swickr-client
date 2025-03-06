/**
 * Service Worker Registration
 * 
 * This file handles the registration of the service worker for push notifications
 * and offline capabilities.
 */

// Check if service workers are supported by the browser
const isServiceWorkerSupported = 'serviceWorker' in navigator;

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration|null>} The service worker registration or null if not supported
 */
export const registerServiceWorker = async () => {
  if (!isServiceWorkerSupported) {
    console.log('Service workers are not supported by this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Unregister all service workers
 * @returns {Promise<boolean>} True if unregistration was successful
 */
export const unregisterServiceWorker = async () => {
  if (!isServiceWorkerSupported) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
};

/**
 * Subscribe to push notifications
 * @param {ServiceWorkerRegistration} registration - The service worker registration
 * @param {string} publicVapidKey - The VAPID public key from the server
 * @returns {Promise<PushSubscription|null>} The push subscription or null if failed
 */
export const subscribeToPushNotifications = async (registration, publicVapidKey) => {
  if (!registration || !publicVapidKey) {
    console.error('Missing registration or VAPID key');
    return null;
  }

  try {
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // If subscription exists, return it
    if (subscription) {
      console.log('Already subscribed to push notifications');
      return subscription;
    }

    // Otherwise create a new subscription
    const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required for Chrome
      applicationServerKey: convertedVapidKey
    });
    
    console.log('Subscribed to push notifications:', subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 * @param {ServiceWorkerRegistration} registration - The service worker registration
 * @returns {Promise<boolean>} True if unsubscription was successful
 */
export const unsubscribeFromPushNotifications = async (registration) => {
  if (!registration) {
    return false;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const success = await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
};

/**
 * Convert a base64 string to a Uint8Array for the applicationServerKey
 * @param {string} base64String - The base64 encoded string
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

// Register the service worker when this module is imported
registerServiceWorker();
