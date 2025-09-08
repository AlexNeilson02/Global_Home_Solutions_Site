import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./components/ui/theme-provider";

// Lightweight development cache prevention
if (import.meta.env.DEV) {
  // Only disable service workers in development - no aggressive clearing
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
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
