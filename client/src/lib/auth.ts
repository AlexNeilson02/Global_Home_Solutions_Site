import React, { createContext, useContext, useState, useEffect } from "react";
import { LoginData } from "@shared/schema";

type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  phone?: string | null;
};

type AuthContextType = {
  user: User | null;
  login: (data: LoginData) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { throw new Error("AuthContext not initialized"); },
  logout: () => {},
  isLoading: false,
  error: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Check for existing user session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔐 PWA Auth: Starting authentication check...");
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("🔐 PWA Auth: Found stored user:", parsedUser.username);
          
          // Set user immediately from localStorage for better UX (no flash)
          setUser(parsedUser);
          
          // Verify session is still valid with server (with longer timeout for PWA)
          try {
            // Increased timeout for PWA context (was 5000ms, now 15000ms)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              console.warn("🔐 PWA Auth: Session check timeout after 15s");
              controller.abort();
            }, 15000);
            
            console.log("🔐 PWA Auth: Verifying session with server...");
            const response = await fetch('/api/auth/user', {
              credentials: 'include', // Important for session cookies
              signal: controller.signal,
              cache: 'no-cache' // Prevent caching issues in PWA
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const serverUser = await response.json();
              console.log("✅ PWA Auth: Session verified successfully");
              setUser(serverUser);
              localStorage.setItem('user', JSON.stringify(serverUser));
            } else {
              // Session expired, clear stored user
              console.warn("❌ PWA Auth: Session expired on server, status:", response.status);
              localStorage.removeItem('user');
              setUser(null);
            }
          } catch (error) {
            // Check if it's a timeout or network error
            if (error.name === 'AbortError') {
              console.warn("⏰ PWA Auth: Session check timed out - keeping stored user for offline use");
            } else {
              console.warn("🌐 PWA Auth: Network error during session check:", error.message);
            }
            // Keep stored user if network error or timeout - allows offline/PWA use
            console.log("🔄 PWA Auth: Using cached user data due to network issue");
            setUser(parsedUser);
          }
        } catch (err) {
          console.error("💥 PWA Auth: Error parsing stored user:", err);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log("🔐 PWA Auth: No stored user found");
      }
    };
    
    checkAuth();
  }, []);

  // Real API login implementation
  const login = async (loginData: LoginData): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Sending login request to API...");
      
      let response;
      try {
        // Call the real API endpoint
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for session cookies
          body: JSON.stringify(loginData),
        });
      } catch (fetchError) {
        console.error("Network error during login:", fetchError);
        throw new Error("Unable to connect to server. Please check your internet connection and try again.");
      }
      
      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use status-based message
          if (response.status === 401) {
            errorMessage = 'Invalid username or password';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (response.status === 404) {
            errorMessage = 'Login service not available. Please try again later.';
          }
        }
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing login response:", parseError);
        throw new Error("Invalid response from server. Please try again.");
      }
      
      console.log("Login response data:", data);
      
      if (!data.user) {
        throw new Error("Server didn't return user data. Please try again.");
      }
      
      // Store user in localStorage for persistence (session-based auth, no token needed)
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update state with user info
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Login error:", err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the API to logout (session-based)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Important for session cookies
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage regardless of API success
      localStorage.removeItem('user');
      setUser(null);
      
      // Redirect to login page after logout
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    error
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
