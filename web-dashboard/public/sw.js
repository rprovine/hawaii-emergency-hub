// Service Worker for Hawaii Emergency Hub
const CACHE_NAME = 'hawaii-emergency-v1';
const API_CACHE_NAME = 'api-cache-v1';

// Resources to cache immediately
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/v1/alerts',
  '/api/v1/dashboard-metrics',
  '/api/v1/alert-trends'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Network failed, try cache
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                console.log('Serving from cache:', request.url);
                return cachedResponse;
              }
              // Return offline page or error
              return new Response(
                JSON.stringify({ 
                  error: 'Network unavailable', 
                  cached: false 
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
          });
      })
    );
    return;
  }

  // Static resources - Cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((response) => {
        // Cache successful GET requests
        if (request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: 'Hawaii Emergency Alert',
    body: 'New emergency information available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'emergency-alert',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ],
    data: {
      url: '/?notification=true'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
      
      // Set appropriate icon and urgency based on severity
      if (pushData.severity === 'extreme') {
        notificationData.icon = '/icons/extreme-alert.png';
        notificationData.requireInteraction = true;
        notificationData.silent = false;
      } else if (pushData.severity === 'severe') {
        notificationData.icon = '/icons/severe-alert.png';
        notificationData.requireInteraction = true;
      }
      
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'alert-fetch') {
    event.waitUntil(
      // Fetch latest alerts when back online
      fetch('/api/v1/alerts')
        .then((response) => response.json())
        .then((alerts) => {
          // Store in cache for offline access
          return caches.open(API_CACHE_NAME).then((cache) => {
            return cache.put('/api/v1/alerts', new Response(JSON.stringify(alerts)));
          });
        })
        .catch((error) => {
          console.error('Background sync failed:', error);
        })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag);
  
  if (event.tag === 'alert-check') {
    event.waitUntil(
      // Check for new alerts periodically
      fetch('/api/v1/alerts')
        .then((response) => response.json())
        .then((alerts) => {
          // Check if there are new critical alerts
          const criticalAlerts = alerts.filter(alert => 
            alert.severity === 'extreme' || alert.severity === 'severe'
          );
          
          if (criticalAlerts.length > 0) {
            // Show notification for critical alerts
            return self.registration.showNotification('Critical Emergency Alert', {
              body: `${criticalAlerts.length} critical alert(s) active`,
              icon: '/icons/critical-alert.png',
              tag: 'critical-alert',
              requireInteraction: true,
              data: { url: '/?tab=active' }
            });
          }
        })
        .catch((error) => {
          console.error('Periodic sync failed:', error);
        })
    );
  }
});