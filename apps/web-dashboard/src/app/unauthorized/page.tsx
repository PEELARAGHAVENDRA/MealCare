"use client";

import React from "react";
import { ShieldAlert, ArrowLeft, LogOut, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gov-cream via-slate-50 to-emerald-50/30 p-4 font-sans">
      <div className="w-full max-w-md text-center">
        {/* Shield Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 border border-red-150 text-red-600 shadow-sm animate-bounce">
          <ShieldAlert size={44} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-semibold uppercase tracking-wider">
          Error 403: Forbidden
        </p>

        {/* Info Card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left">
          <p className="text-sm text-slate-700 leading-relaxed">
            Your current account role does not have permission to view this page. This workspace is restricted to authorized credentials.
          </p>

          {user && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-600 space-y-1">
              <div>
                <span className="font-bold text-slate-700">Account:</span> {user.name}
              </div>
              <div>
                <span className="font-bold text-slate-700">Active Role:</span>{" "}
                <span className="font-bold text-gov-green">
                  {user.role.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-gov-green py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Home size={16} /> Return to Dashboard
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 hover:border-red-100"
          >
            <LogOut size={16} /> Sign Out & Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
