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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/auth/user", {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (loginData: LoginData) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Login failed");
      }

      const result = await response.json();
      
      // Fetch user data after successful login
      const userResponse = await fetch("/api/auth/user", {
        credentials: 'include'
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include'
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    setUser(null);
    queryClient.clear();
  };


  const contextValue = {
    user,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}