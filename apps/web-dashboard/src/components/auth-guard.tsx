"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUser } from "@clerk/nextjs";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/unauthorized"];

// Define RBAC allowed roles per path
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/meals": ["SUPER_ADMIN", "SCHOOL_HEAD", "KITCHEN_STAFF", "TEACHER"],
  "/planner": ["SUPER_ADMIN", "KITCHEN_STAFF", "SCHOOL_HEAD"],
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
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isAuthed = !!token || !!isClerkSignedIn;
  const isAuthLoading = loading || !isClerkLoaded;

  useEffect(() => {
    if (!mounted || isAuthLoading) return;

    if (!isAuthed) {
      if (!isPublicPath) {
        router.replace("/login");
      }
    } else {
      if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password") {
        router.replace("/");
      } else {
        const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find((route) => pathname.startsWith(route));
        if (matchedRoute && user) {
          const allowedRoles = ROUTE_PERMISSIONS[matchedRoute];
          if (!allowedRoles.includes(user.role)) {
            router.replace("/unauthorized");
          }
        }
      }
    }
  }, [mounted, isAuthed, isAuthLoading, user, pathname, router, isPublicPath]);

  // For public paths (login, register), always render children directly so SSR and client match 100%
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Show themed loader while checking auth state on protected pages
  if (!mounted || (isAuthLoading && !isAuthed)) {
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

  // Prevent rendering protected content if unauthenticated
  if (!isAuthed && !isPublicPath) {
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
  if (isAuthed && !isPublicPath) {
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
