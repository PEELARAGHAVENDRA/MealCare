"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/unauthorized"];

// Define RBAC allowed roles per path
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/meals": ["SUPER_ADMIN", "SCHOOL_HEAD", "KITCHEN_STAFF", "TEACHER"],
  "/planner": ["SUPER_ADMIN", "NUTRITION_OFFICER", "KITCHEN_STAFF"],
  "/schools": ["SUPER_ADMIN", "DISTRICT_ADMIN"],
  "/reports": ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD"],
  "/evidence": ["SUPER_ADMIN", "SCHOOL_HEAD", "KITCHEN_STAFF", "FOOD_SERVER"],
  "/calendar": ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD", "KITCHEN_STAFF", "TEACHER", "STUDENT_PARENT", "FOOD_SERVER"],
  "/compliance": ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD"],
  "/communication": ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"],
  "/schools-monitoring": ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"]
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
      
      if (!token) {
        // Unauthenticated redirect to login
        if (!isPublicPath) {
          router.replace("/login");
        }
      } else {
        // Authenticated redirect away from login/register
        if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password") {
          router.replace("/");
        } else {
          // Check route permissions (RBAC)
          const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find((route) => pathname.startsWith(route));
          if (matchedRoute && user) {
            const allowedRoles = ROUTE_PERMISSIONS[matchedRoute];
            if (!allowedRoles.includes(user.role)) {
              router.replace("/unauthorized");
            }
          }
        }
      }
    }
  }, [token, user, loading, pathname, router]);

  // Show a premium, themed loader while loading the authentication state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gov-green border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Verifying credentials...
          </p>
        </div>
      </div>
    );
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  
  // Prevent rendering protected content if unauthenticated
  if (!token && !isPublicPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gov-green border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering restricted paths if user does not match RBAC roles
  if (token && !isPublicPath) {
    const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find((route) => pathname.startsWith(route));
    if (matchedRoute && user) {
      const allowedRoles = ROUTE_PERMISSIONS[matchedRoute];
      if (!allowedRoles.includes(user.role)) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gov-green border-t-transparent"></div>
              <p className="text-sm font-medium text-slate-500 animate-pulse">Checking authorization...</p>
            </div>
          </div>
        );
      }
    }
  }

  return <>{children}</>;
}
