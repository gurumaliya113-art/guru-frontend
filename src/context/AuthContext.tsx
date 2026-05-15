import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: "student" | "teacher" | "admin";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleData: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = "Login failed.";
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData?.error || errorMessage;
      } catch {
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    setUser(data);
  };

  const signup = async (email: string, password: string) => {
    const response = await fetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = "Signup failed.";
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData?.error || errorMessage;
      } catch {
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    setUser(data);
  };

  const loginWithGoogle = async (googleData: any) => {
    const response = await fetch("/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ googleData }),
    });

    if (!response.ok) {
      let errorMessage = "Google login failed.";
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData?.error || errorMessage;
      } catch {
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    setUser(data);
  };

  const logout = async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
