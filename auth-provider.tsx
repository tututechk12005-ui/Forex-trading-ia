import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { User, getMe } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("forex_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("forex_token"));
    
    if (token) {
      getMe()
        .then((u) => {
          setUser(u);
          setIsLoading(false);
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem("forex_token");
          setIsLoading(false);
          setLocation("/");
        });
    } else {
      setIsLoading(false);
    }
  }, [token, setLocation]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("forex_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("forex_token");
    setToken(null);
    setUser(null);
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
