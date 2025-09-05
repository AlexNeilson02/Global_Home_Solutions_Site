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
  const { data, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const user = data || null;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginData) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth-token", "session");
      setToken("session");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
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

  // Initialize token on first load if user has a session
  useEffect(() => {
    if (!token) {
      fetch('/api/auth/user', { credentials: 'include' })
        .then(response => {
          if (response.ok) {
            localStorage.setItem("auth-token", "session");
            setToken("session");
          }
        })
        .catch(() => {
          // User not authenticated, ignore
        });
    }
  }, []);

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