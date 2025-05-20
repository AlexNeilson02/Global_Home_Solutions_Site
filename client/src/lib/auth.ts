import { createContext, useContext, useState } from "react";
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
  logout: () => void;
  isLoading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  error: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Simple login implementation for now
  const login = async (loginData: LoginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API
      console.log("Login attempt with:", loginData);
      
      // Mock successful login
      setUser({
        id: 1,
        username: loginData.username,
        fullName: "Demo User",
        email: `${loginData.username}@example.com`,
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
