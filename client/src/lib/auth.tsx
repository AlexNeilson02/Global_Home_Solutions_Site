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
  phone?: string;
  address?: string;
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
  const [error, setError] = useState<Error | null>(null);

  // Get current user data
  const { data, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const user = data || null;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", loginData);
      return res.json();
    },
    onSuccess: (data) => {
      // Session-based auth - no token needed
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (err: Error) => {
      setError(err);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/auth/logout", {});
      } catch (error) {
        // Continue with client-side logout even if server request fails
        console.error("Logout request failed:", error);
      }
      return null;
    },
    onSuccess: () => {
      setError(null);
      queryClient.clear();
    },
  });

  // No token setup needed for session-based auth

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