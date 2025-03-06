/* Swickr Service Worker for Push Notifications */

// Cache name for offline support
const CACHE_NAME = 'swickr-cache-v1';

// Assets to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/assets/icon-192x192.png',
  '/assets/icon-512x512.png',
  '/assets/badge.png',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker');
  
  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Network-first strategy for API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Cache new static assets
            if (response.status === 200 && 
                (event.request.url.endsWith('.js') || 
                 event.request.url.endsWith('.css') || 
                 event.request.url.endsWith('.png') || 
                 event.request.url.endsWith('.jpg') || 
                 event.request.url.endsWith('.svg'))) {
              
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // Fallback to offline page if network request fails
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received');
  
  let notification = {
    title: 'Swickr',
    body: 'You have a new notification',
    icon: '/assets/icon-192x192.png',
    badge: '/assets/badge.png',
    data: {
      url: '/'
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notification = {
        ...notification,
        ...data
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }
  
  const options = {
    body: notification.body,
    icon: notification.icon,
    badge: notification.badge,
    vibrate: notification.vibrate || [100, 50, 100],
    data: notification.data,
    actions: notification.actions || [],
    silent: notification.silent || false,
    tag: notification.tag || 'swickr-notification'
  };
  
  // Send the notification to all clients
  const notifyClients = async () => {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    
    for (const client of clients) {
      client.postMessage({
        type: 'PUSH_NOTIFICATION',
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          data: notification.data,
          timestamp: new Date().toISOString()
        }
      });
    }
  };
  
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notification.title, options),
      notifyClients()
    ])
  );
});

// Notification click event - handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  // Check if there is already a window/tab open with this URL
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // If a window already exists with the URL, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window exists, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event - handle notification dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed', event);
});

// Message event - handle messages from the client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  // If the client sends a port, use it to respond
  if (event.ports && event.ports[0]) {
    // Handle different message types
    switch (event.data.type) {
      case 'GET_VERSION':
        event.ports[0].postMessage({
          version: '1.0.0'
        });
        break;
        
      case 'PING':
        event.ports[0].postMessage({
          pong: true,
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        event.ports[0].postMessage({
          error: 'Unknown message type',
          receivedType: event.data.type
        });
    }
  }
});
