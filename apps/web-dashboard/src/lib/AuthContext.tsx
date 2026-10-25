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

const CLIENT_DEMO_USERS: Record<string, User> = {
  "super@mealscare.gov": {
    id: "demo-user-super",
    name: "Super Administrator",
    email: "super@mealscare.gov",
    role: "SUPER_ADMIN",
    schoolId: null,
    districtId: "DIST-001",
    school: null
  },
  "peelaraghavendra2005@gmail.com": {
    id: "demo-user-raghavendra",
    name: "Super Admin Live (Raghavendra)",
    email: "peelaraghavendra2005@gmail.com",
    role: "SUPER_ADMIN",
    schoolId: null,
    districtId: "DIST-001",
    school: null
  },
  "district@district.gov": {
    id: "demo-user-district",
    name: "District Administrator",
    email: "district@district.gov",
    role: "DISTRICT_ADMIN",
    schoolId: null,
    districtId: "DIST-001",
    school: null
  },
  "nutrition@district.gov": {
    id: "demo-user-nutrition",
    name: "Nutrition Officer Dr. Sharma",
    email: "nutrition@district.gov",
    role: "NUTRITION_OFFICER",
    schoolId: null,
    districtId: "DIST-001",
    school: null
  },
  "head@school.gov": {
    id: "demo-user-head",
    name: "Principal Roy",
    email: "head@school.gov",
    role: "SCHOOL_HEAD",
    schoolId: "cmpppkkv70000b511lbz008lr",
    districtId: "DIST-001",
    school: { name: "Government Primary School Nandipur", code: "GOV-SCH-001", type: "SCHOOL" }
  },
  "cook@school.gov": {
    id: "demo-user-cook",
    name: "Head Cook Ramu",
    email: "cook@school.gov",
    role: "KITCHEN_STAFF",
    schoolId: "cmpppkkv70000b511lbz008lr",
    districtId: "DIST-001",
    school: { name: "Government Primary School Nandipur", code: "GOV-SCH-001", type: "SCHOOL" }
  },
  "server@school.gov": {
    id: "demo-user-server",
    name: "Food Server Anita",
    email: "server@school.gov",
    role: "FOOD_SERVER",
    schoolId: "cmpppkkv70000b511lbz008lr",
    districtId: "DIST-001",
    school: { name: "Government Primary School Nandipur", code: "GOV-SCH-001", type: "SCHOOL" }
  },
  "teacher@school.gov": {
    id: "demo-user-teacher",
    name: "Teacher Coordinator Verma",
    email: "teacher@school.gov",
    role: "TEACHER",
    schoolId: "cmpppkkv70000b511lbz008lr",
    districtId: "DIST-001",
    school: { name: "Government Primary School Nandipur", code: "GOV-SCH-001", type: "SCHOOL" }
  },
  "parent@school.gov": {
    id: "demo-user-parent",
    name: "Parent Sunita Devi",
    email: "parent@school.gov",
    role: "STUDENT_PARENT",
    schoolId: "cmpppkkv70000b511lbz008lr",
    districtId: "DIST-001",
    school: { name: "Government Primary School Nandipur", code: "GOV-SCH-001", type: "SCHOOL" }
  },
  "student@school.gov": {
    id: "demo-user-student",
    name: "Student Rahul",
    email: "student@school.gov",
    role: "STUDENT_PARENT",
    schoolId: "cmpppkkv70000b511lbz008lr",
    districtId: "DIST-001",
    school: { name: "Government Primary School Nandipur", code: "GOV-SCH-001", type: "SCHOOL" }
  }
};

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
          if (storedToken.startsWith("demo-session-token-")) {
            setLoading(false);
            return;
          }
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
          } else if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.warn("Auth server unreachable, keeping local session active");
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
      console.warn("API server unreachable during login, checking client demo fallback:", err);
      const demoUser = CLIENT_DEMO_USERS[email.toLowerCase()];
      if (demoUser && (password === "Password123!" || password === "2peelaraghavendra" || password.length >= 8)) {
        const demoToken = "demo-session-token-" + Date.now();
        localStorage.setItem("token", demoToken);
        localStorage.setItem("user", JSON.stringify(demoUser));
        localStorage.setItem("demoMode", "true");
        setToken(demoToken);
        setUser(demoUser);
        return { success: true };
      }
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
