import React, { createContext, useContext, useState } from "react";

// Use a simple interface rather than importing from schema
interface LoginData {
  username: string;
  password: string;
}

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
  logout: () => void;
  isLoading: boolean;
  error: Error | null;
};

const defaultContext: AuthContextType = {
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  error: null
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const login = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      setUser({
        id: 1,
        username: data.username,
        fullName: "Demo User",
        email: `${data.username}@example.com`,
        role: "admin"
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        login,
        logout,
        isLoading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}