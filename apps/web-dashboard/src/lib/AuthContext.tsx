"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "DISTRICT_ADMIN" | "NUTRITION_OFFICER" | "SCHOOL_HEAD" | "KITCHEN_STAFF" | "TEACHER" | "STUDENT_PARENT" | "FOOD_SERVER";
  schoolId: string | null;
  districtId: string | null;
  school?: {
    name: string;
    code: string;
    type: string;
  } | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: string,
    schoolId?: string | null,
    districtId?: string | null
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAuth() {
      let hasToken = false;
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          hasToken = true;
        }
      } catch (e) {
        console.error("Failed to load local auth state", e);
      }

      if (hasToken) {
        setLoading(false);
      }

      try {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
          const res = await fetch(`${apiUrl}/auth/me`, {
            headers: {
              "Authorization": `Bearer ${storedToken}`
            }
          });
          if (res.ok) {
            const freshUser = await res.json();
            if (freshUser) {
              localStorage.setItem("user", JSON.stringify(freshUser));
              setUser(freshUser);
            }
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error("Failed to sync auth state from server", e);
      } finally {
        setLoading(false);
      }
    }
    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Invalid credentials" };
      }

      const { token: receivedToken, user: receivedUser } = data;

      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true };
    } catch (err: any) {
      console.error("Login request failed", err);
      return { success: false, error: "Unable to connect to authentication server. Please try again." };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string,
    schoolId?: string | null,
    districtId?: string | null
  ) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role, schoolId, districtId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      const { token: receivedToken, user: receivedUser } = data;

      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true };
    } catch (err: any) {
      console.error("Registration request failed", err);
      return { success: false, error: "Unable to connect to registration server. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
