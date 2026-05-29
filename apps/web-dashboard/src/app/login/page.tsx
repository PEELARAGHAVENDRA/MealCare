"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { 
  Lock, 
  Mail, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  ShieldCheck, 
  Map, 
  Apple, 
  Award, 
  ChefHat, 
  BookOpen, 
  Users, 
  User as UserIcon 
} from "lucide-react";
import { useRouter } from "next/navigation";

const ROLE_ICONS: Record<string, React.ComponentType<any>> = {
  "Super Admin": ShieldCheck,
  "District Admin": Map,
  "Nutrition Officer": Apple,
  "School Head": Award,
  "Kitchen Staff": ChefHat,
  "Teacher User": BookOpen,
  "Student Parent": Users,
  "Student": UserIcon
};
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const { isDemoMode, setDemoMode } = useDemo();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (rememberMe) {
          localStorage.setItem("remembered_email", email);
        } else {
          localStorage.removeItem("remembered_email");
        }
        router.replace("/");
      } else {
        setError(res.error || "Authentication failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* LEFT PANEL: Platform Statistics & Marketing (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden bg-slate-900">
        {/* Background Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img src="/login-bg.jpg" alt="MealCare Background" className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-slate-900/90 to-slate-950/95 mix-blend-multiply"></div>
        </div>
        
        {/* Decorative Grid Overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>
        
        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white overflow-hidden shadow-sm">
            <img src="/logo.png" alt="MealCare logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight">MealCare AI</span>
        </div>

        {/* Dynamic Graphics & Analytics Preview */}
        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Optimizing School Nutrition through Intelligence.
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            MealsCare AI helps districts manage inventory, forecast student attendance, predict wastage, and plan weekly balanced diets with Gemini AI integration.
          </p>

          {/* Analytics Statistics Cards */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-gov-saffron">
                <TrendingUp size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
              </div>
              <p className="mt-2 text-2xl font-bold">94.7%</p>
              <p className="text-[10px] text-slate-400 mt-1">Average district participation</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Nutrition Target</span>
              </div>
              <p className="mt-2 text-2xl font-bold">Met (88/100)</p>
              <p className="text-[10px] text-slate-400 mt-1">High protein & iron score</p>
            </div>

            <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Wastage Reduction</span>
                </div>
                <p className="mt-1 text-lg font-bold">5.2% Daily Average</p>
              </div>
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/30">
                -3.4% this week
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400">
          © 2026 Department of School Education. Powered by Google Gemini.
        </div>
      </div>

      {/* RIGHT PANEL: Login Form (Responsive) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Header Mobile Brand */}
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto lg:mx-0 mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white overflow-hidden shadow-md">
              <img src="/logo.png" alt="MealCare logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              MealCare <span className="text-gov-green">AI</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Smart Mid-Day Meal Nutrition Platform
            </p>
          </div>

          {/* Login Form Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-800">
                Sign in to your workspace
              </h2>
              {/* Demo Mode Toggle Switch */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Demo Data</span>
                <button
                  type="button"
                  onClick={() => setDemoMode(!isDemoMode)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                    isDemoMode ? "bg-gov-green" : "bg-slate-300"
                  }`}
                  title="Toggle Demo Mode vs Live Database"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isDemoMode ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={16} />
                <div>
                  <p className="font-bold">Authentication failed</p>
                  <p className="mt-0.5 text-red-700/90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition duration-150 focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                    placeholder="name@school.gov"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-gov-green hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition duration-150 focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-gov-green focus:ring-gov-green/20"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-slate-600">
                  Remember my session details
                </label>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-xl bg-gov-green py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              New user?{" "}
              <Link href="/register" className="font-semibold text-gov-green hover:underline">
                Create a school workspace
              </Link>
            </p>

            {isDemoMode && (
              <>
                {/* Quick Demo logins divider */}
                <div className="my-6 flex items-center justify-center gap-2">
                  <span className="h-[1px] w-full bg-slate-100"></span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">DEMO WORKSPACES</span>
                  <span className="h-[1px] w-full bg-slate-100"></span>
                </div>

                {/* Demo buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Super Admin", email: "super@mealscare.gov" },
                    { name: "District Admin", email: "district@district.gov" },
                    { name: "Nutrition Officer", email: "nutrition@district.gov" },
                    { name: "School Head", email: "head@school.gov" },
                    { name: "Kitchen Staff", email: "cook@school.gov" },
                    { name: "Teacher User", email: "teacher@school.gov" },
                    { name: "Student Parent", email: "parent@school.gov" },
                    { name: "Student", email: "student@school.gov" }
                  ].map((demo) => (
                    <button
                      key={demo.name}
                      type="button"
                      onClick={() => handleDemoFill(demo.email)}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2 text-left text-xs transition hover:border-gov-green hover:bg-white"
                      disabled={isSubmitting}
                    >
                      <div className="font-bold text-slate-700 leading-tight truncate">{demo.name}</div>
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">{demo.email}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
