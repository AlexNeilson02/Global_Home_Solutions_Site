import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { LoginData } from "@shared/schema";

type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
};

const defaultValue: AuthContextType = {
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: false,
  error: null
};

const AuthContext = createContext<AuthContextType>(defaultValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth-token"));
  const [error, setError] = useState<Error | null>(null);

  // Get current user data
  const { data, isLoading } = useQuery<{ user: User, roleData: any }>({
    queryKey: ["/api/users/me"],
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const user = data?.user || null;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", loginData);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth-token", data.token);
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (err: Error) => {
      setError(err);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (token) {
        try {
          await apiRequest("POST", "/api/auth/logout", {});
        } catch (error) {
          // Continue with client-side logout even if server request fails
          console.error("Logout request failed:", error);
        }
      }
      return null;
    },
    onSuccess: () => {
      localStorage.removeItem("auth-token");
      setToken(null);
      queryClient.clear();
    },
  });

  // Setup auth header for API requests
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      let url = "";
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof Request) {
        url = input.url;
      }
      
      if (url.includes('/api') && token) {
        init = init || {};
        init.headers = {
          ...init.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      
      return originalFetch(input, init);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  const login = async (loginData: LoginData) => {
    setError(null);
    await loginMutation.mutateAsync(loginData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading: isLoading || loginMutation.isPending, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}