import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: "student" | "teacher" | "admin";
}

const apiUrl = (p: string) => p;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  /** `identifier` may be an email, username, or phone number. */
  login: (identifier: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (options: { credential: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch(apiUrl("/auth/me"), {
          credentials: "include",
        });
        if (!mounted) return;
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (mounted) {
          console.error("Auth check failed:", error);
          setUser(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const syncGoogleUser = async (credential: string) => {
    const response = await fetch(apiUrl("/auth/google"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      let errorMessage = "Firebase login failed.";
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
    return data;
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

  const loginWithGoogle = async ({ credential }: { credential: string }) => {
    if (!credential) {
      throw new Error("Google credential is required.");
    }

    const userData = await syncGoogleUser(credential);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      window.location.href = "/onboarding";
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
