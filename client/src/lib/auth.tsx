import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// LoginData is now imported from shared schema

type AuthContextType = {
  user: User | null;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { throw new Error("AuthProvider not initialized"); },
  logout: async () => { throw new Error("AuthProvider not initialized"); },
  isLoading: false,
  error: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Clear any old auth tokens on startup
  useEffect(() => {
    // Clear all possible localStorage keys that might contain user data
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("storedUser");
    localStorage.removeItem("authUser");
    localStorage.clear(); // Nuclear option - clear everything
  }, []);

  // Get current user data
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      console.log('🔍 Fetching user data...');
      const response = await fetch("/api/auth/user", {
        credentials: 'include' // Important for session-based auth
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.log('⛔ Not authenticated');
          return null; // Not authenticated
        }
        throw new Error('Failed to fetch user');
      }
      const userData = await response.json();
      console.log('👤 User data received:', userData);
      return userData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Important for session-based auth
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Login failed");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      setError(null);
      console.log('✅ Login successful, response:', data);
      await refetch(); // Refetch user data after successful login
      console.log('✅ User data refetched');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: 'include'
        });
      } catch (error) {
        console.error("Logout request failed:", error);
      }
      return null;
    },
    onSuccess: () => {
      setError(null);
      queryClient.clear();
    },
  });

  const login = async (loginData: LoginData) => {
    setError(null);
    await loginMutation.mutateAsync(loginData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
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