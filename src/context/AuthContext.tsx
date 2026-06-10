import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: "student" | "teacher" | "admin";
}

/**
 * API base URL. In production on Vercel, set `VITE_API_BASE_URL` to the
 * deployed backend origin (e.g. https://api.example.com). Empty in dev.
 */
function normalizeBaseUrl(raw: string): string {
  let v = (raw || "").trim().replace(/\/$/, "");
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v;
}
const API_BASE_URL: string = normalizeBaseUrl(
  (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.DEV
      ? "http://localhost:4000"
      : ""
);
const apiUrl = (p: string) => (p.startsWith("http") ? p : `${API_BASE_URL}${p}`);

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  /** `identifier` may be an email, username, or phone number. */
  login: (identifier: string, password: string) => Promise<void>;
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
      const response = await fetch(apiUrl("/auth/me"), {
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

  const login = async (identifier: string, password: string) => {
    const response = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ identifier, password }),
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
    const response = await fetch(apiUrl("/auth/signup"), {
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

  const loginWithGoogle = async (data: { credential: string }) => {
    const response = await fetch(apiUrl("/auth/google"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
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

    const userData = await response.json();
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(apiUrl("/auth/logout"), {
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
