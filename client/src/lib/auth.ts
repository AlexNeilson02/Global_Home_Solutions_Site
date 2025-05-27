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
  
  // Check for existing token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Loaded stored user:", parsedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Error parsing stored user:", err);
        // Invalid stored user data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Real API login implementation
  const login = async (loginData: LoginData): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Sending login request to API...");
      
      // Call the real API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      console.log("Login response data:", data);
      
      if (!data.user) {
        throw new Error("Server didn't return user data");
      }
      
      // Store token and user in localStorage for persistence
      localStorage.setItem('auth-token', data.token);
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
      // Call the API to logout
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage regardless of API success
      localStorage.removeItem('authToken');
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
