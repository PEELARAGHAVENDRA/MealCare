"use client";

import React, { useState, Suspense } from "react";
import { GraduationCap, Lock, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing from the link. Please request a new recovery link.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Reset password request failed.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Unable to connect to authentication server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Invalid link context</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          No verification token was found. Please request a new password recovery link from the sign-in page.
        </p>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-gov-green hover:text-gov-green inline-block"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Password Updated</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Your password has been successfully reset. You can now log in using your new credentials.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-gov-green text-white px-4 py-2 rounded-xl hover:bg-emerald-800 transition"
          >
            Go to Sign In <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={16} />
          <div>
            <p className="font-bold">Error resetting password</p>
            <p className="mt-0.5 text-red-700/90 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        Enter a new secure password for your MealsCare AI account below.
      </p>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          New Password
        </label>
        <div className="relative mt-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock size={15} />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
            placeholder="••••••••"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Confirm New Password
        </label>
        <div className="relative mt-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock size={15} />
          </div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
            placeholder="••••••••"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center rounded-xl bg-gov-green py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <span>Updating...</span>
          </div>
        ) : (
          "Save New Password"
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gov-cream via-slate-50 to-emerald-50/30 p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gov-green text-white shadow-md">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Update Password
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Smart Mid-Day Meal Nutrition Platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <Suspense fallback={
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gov-green border-t-transparent"></div>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
