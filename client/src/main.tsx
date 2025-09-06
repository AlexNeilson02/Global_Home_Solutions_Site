import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./components/ui/theme-provider";

// Aggressive cache prevention in development
if (import.meta.env.DEV) {
  // Clear ALL browser storage on every page load in development
  (async () => {
    console.log('Development mode: Aggressive cache clearing and service worker removal...');
    
    // 1. Force unregister ALL service workers with extreme prejudice
    if ('serviceWorker' in navigator) {
      try {
        // Get all service worker registrations
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`Found ${registrations.length} service worker registrations to remove`);
        
        // Unregister each one
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Service worker unregistered:', registration.scope);
        }
        
        // Force reload the service worker controller if it exists
        if (navigator.serviceWorker.controller) {
          console.log('Posting message to active service worker to self-destruct');
          navigator.serviceWorker.controller.postMessage({ action: 'SKIP_WAITING' });
        }
        
        // Listen for any new service worker installations and immediately unregister them
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service worker controller changed - forcing page reload');
          window.location.reload();
        });
        
      } catch (error) {
        console.warn('Service worker cleanup error:', error);
      }
    }
    
    // 2. Clear ALL caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }
    
    // 3. Clear sessionStorage (except auth data)
    const authToken = sessionStorage.getItem('auth-token');
    sessionStorage.clear();
    if (authToken) sessionStorage.setItem('auth-token', authToken);
    
    // 4. Clear IndexedDB (if exists)
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases?.() || [];
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log('Deleted IndexedDB:', db.name);
        }
      }
    }
    
    // 5. Force reload stylesheets with cache busting
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link: any) => {
      const href = link.href;
      if (href && !href.includes('?')) {
        link.href = href + '?v=' + Date.now();
      }
    });
    
    // 6. Add timestamp to prevent module caching
    if (window.location.search.indexOf('_t=') === -1) {
      const separator = window.location.search ? '&' : '?';
      const newUrl = window.location.href + separator + '_t=' + Date.now();
      window.history.replaceState({}, '', newUrl);
    }
    
    // 7. Force disable any remaining service worker functionality
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log('Active service worker detected - posting kill message');
      navigator.serviceWorker.controller.postMessage({ 
        action: 'FORCE_DISABLE',
        timestamp: Date.now()
      });
    }
    
    // 8. Override fetch to detect any service worker interference
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      console.log('Fetch intercepted:', args[0]);
      return originalFetch.apply(this, args).catch(error => {
        console.error('Fetch error details:', {
          url: args[0],
          error: error.message,
          stack: error.stack
        });
        throw error;
      });
    };
    
    console.log('All caches and storage cleared for development - service workers aggressively removed');
  })();
} else {
  // Production: Register service worker normally
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
