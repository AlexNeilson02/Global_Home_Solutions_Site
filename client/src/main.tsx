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
    console.log('Development mode: Clearing all caches and storage...');
    
    // 1. Unregister ALL service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service worker unregistered:', registration.scope);
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
    
    console.log('All caches and storage cleared for development');
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
