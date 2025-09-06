// Environment detection - disable service worker in development
const isDevelopment = self.location.hostname === 'localhost' || 
                     self.location.hostname.includes('repl') ||
                     self.location.hostname.includes('janeway') ||
                     self.location.search.includes('_t=') ||
                     self.location.port === '5000';

if (isDevelopment) {
  console.log('Service Worker: Development environment detected - FORCE DISABLING and SELF-DESTRUCTING');
  
  // Listen for messages from main thread to self-destruct
  self.addEventListener('message', (event) => {
    if (event.data && (event.data.action === 'SKIP_WAITING' || event.data.action === 'FORCE_DISABLE')) {
      console.log('Service Worker: Received self-destruct command');
      self.skipWaiting();
      // Force unregister this service worker
      self.registration.unregister().then(() => {
        console.log('Service Worker: Successfully self-destructed');
      }).catch(err => {
        console.log('Service Worker: Self-destruct failed:', err);
      });
    }
  });
  
  // Override all event listeners to do absolutely nothing in development
  self.addEventListener('install', (event) => {
    console.log('Service Worker: DEVELOPMENT - Immediately skipping installation');
    self.skipWaiting();
    // Immediately unregister this service worker
    event.waitUntil(
      self.registration.unregister().then(() => {
        console.log('Service Worker: Unregistered during install');
      })
    );
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker: DEVELOPMENT - Force claiming and unregistering');
    event.waitUntil(
      Promise.all([
        self.clients.claim(),
        self.registration.unregister()
      ]).then(() => {
        console.log('Service Worker: Claimed clients and unregistered');
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    // Absolutely do nothing - let all requests pass through
    console.log('Service Worker: DEVELOPMENT - Passthrough for:', event.request.url);
    // Don't call event.respondWith() - let browser handle naturally
  });
  
  // Force immediate self-destruction
  self.registration.unregister().then(() => {
    console.log('Service Worker: Initial self-destruct completed');
  }).catch(err => {
    console.log('Service Worker: Initial self-destruct failed:', err);
  });
  
  // Exit early - don't register any production functionality
  // This prevents any service worker interference in development
} else {
  // Production service worker functionality starts here
  console.log('Service Worker: Production environment detected - enabling full functionality');
  
  const CACHE_NAME = 'global-home-solutions-v2';
  const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
  ];

  // Install event - cache essential resources (production only)
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Service Worker: Caching files');
          return cache.addAll(urlsToCache);
        })
        .catch((err) => {
          console.log('Service Worker: Cache failed', err);
        })
    );
  });

  // Activate event - clean up old caches (production only)
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });

  // Fetch event - serve from cache, fallback to network (production only)
  self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
      return;
    }

    // Handle API requests - always try network first
    if (event.request.url.includes('/api/')) {
      event.respondWith(
        fetch(event.request)
          .catch((error) => {
            // Better error discrimination - only return offline response for actual network errors
            if (error.name === 'NetworkError' || error.message.includes('Failed to fetch')) {
              return new Response(
                JSON.stringify({ error: 'App is offline' }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
            // Re-throw other errors (CORS, timeout, etc.)
            throw error;
          })
      );
      return;
    }

    // Handle static resources - cache first strategy
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request).then((fetchResponse) => {
            // Don't cache non-successful responses
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response
            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          });
        })
        .catch(() => {
          // If both cache and network fail, return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        })
    );
  });

  // Background sync for offline actions (production only)
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      console.log('Service Worker: Background sync triggered');
      // Handle offline actions when connection is restored
    }
  });

  // Push notifications (production only)
  self.addEventListener('push', (event) => {
    if (event.data) {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: data.primaryKey
        },
        actions: [
          {
            action: 'explore',
            title: 'View Details',
            icon: '/icons/icon-96x96.png'
          },
          {
            action: 'close',
            title: 'Close',
            icon: '/icons/icon-96x96.png'
          }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    }
  });

  // Notification click handling (production only)
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
      // Open the app and navigate to relevant page
      event.waitUntil(
        clients.openWindow('/')
      );
    }
  });

} // End of production-only code