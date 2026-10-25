"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { GraduationCap, Lock, Mail, ShieldAlert, User, MapPin, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const clerk = useClerk();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("STUDENT_PARENT");
  const [schoolId, setSchoolId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [roles, setRoles] = useState<{ value: string; label: string }[]>([
    { value: "STUDENT_PARENT", label: "Student / Parent" },
    { value: "TEACHER", label: "Teacher" },
    { value: "KITCHEN_STAFF", label: "Kitchen Staff" },
    { value: "FOOD_SERVER", label: "Food Server" },
    { value: "SCHOOL_HEAD", label: "School/College Head" },
    { value: "NUTRITION_OFFICER", label: "Nutrition Officer" },
    { value: "DISTRICT_ADMIN", label: "District Admin" }
  ]);

  React.useEffect(() => {
    async function fetchRoles() {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mealcare-production.up.railway.app";
        const res = await fetch(`${apiBaseUrl}/auth/roles`);
        if (res.ok) {
          const data = await res.json();
          setRoles(data);
        }
      } catch (err) {
        console.warn("Failed to fetch roles from API, using static defaults:", err);
      }
    }
    fetchRoles();
  }, []);

  // OTP Verification States
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSignInFlow, setIsSignInFlow] = useState(false);

  const handleResendOtp = async () => {
    setOtpError(null);
    try {
      if (clerk.loaded && clerk.client) {
        if (isSignInFlow && clerk.client.signIn) {
          const firstFactor = clerk.client.signIn.supportedFirstFactors?.find(
            (f: any) => f.strategy === "email_code"
          ) as any;
          if (firstFactor) {
            await clerk.client.signIn.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: firstFactor.emailAddressId
            });
          }
        } else if (clerk.client.signUp) {
          await clerk.client.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        }
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || "Failed to resend verification email.";
      setOtpError(msg);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setIsSubmitting(true);

    try {
      if (clerk.loaded && clerk.client) {
        let verified = false;

        if (isSignInFlow && clerk.client.signIn) {
          const completeSignIn = await clerk.client.signIn.attemptFirstFactor({
            strategy: "email_code",
            code: enteredOtp.trim()
          });
          if (completeSignIn.status === "complete") {
            verified = true;
            if (completeSignIn.createdSessionId) {
              await clerk.setActive({ session: completeSignIn.createdSessionId });
            }
          }
        } else if (clerk.client.signUp) {
          const completeSignUp = await clerk.client.signUp.attemptEmailAddressVerification({
            code: enteredOtp.trim()
          });

          if (completeSignUp.status === "complete") {
            verified = true;
            if (completeSignUp.createdSessionId) {
              await clerk.setActive({ session: completeSignUp.createdSessionId });
            }
          }
        }

        if (verified) {
          // Persist user record with chosen password directly in Supabase Database (via MealCare API)
          const dbRes = await register(
            name.trim(),
            email.trim(),
            password,
            role,
            role !== "DISTRICT_ADMIN" && role !== "SUPER_ADMIN" ? schoolId || "demo-school" : null,
            role === "DISTRICT_ADMIN" ? districtId || "DEMO-DISTRICT" : null
          );

          if (!dbRes.success) {
            setOtpError(dbRes.error || "Failed to save user in Supabase database.");
            setIsSubmitting(false);
            return;
          }

          setOtpModalOpen(false);
          router.replace("/");
          return;
        } else {
          setOtpError("Verification incomplete. Please check your verification code.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await register(
          name.trim(),
          email.trim(),
          password,
          role,
          role !== "DISTRICT_ADMIN" && role !== "SUPER_ADMIN" ? schoolId || "demo-school" : null,
          role === "DISTRICT_ADMIN" ? districtId || "DEMO-DISTRICT" : null
        );

        if (res.success) {
          setOtpModalOpen(false);
          router.replace("/");
        } else {
          setOtpError(res.error || "Registration failed in database.");
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      const clerkErrMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message;
      setOtpError(clerkErrMsg || "Invalid or expired verification code.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !role) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (clerk.loaded && clerk.client) {
      setIsSubmitting(true);
      try {
        // Clerk is used strictly as the email OTP delivery & verification provider.
        // We supply an internal unbreached secret for Clerk's temporary verification session,
        // and store the user's actual chosen credentials directly in the Supabase database.
        const internalClerkSecret = `ClerkVerify_${Math.random().toString(36).slice(2)}_${Date.now()}!Aa9`;

        try {
          await clerk.client.signUp.create({
            emailAddress: email.trim(),
            password: internalClerkSecret,
            firstName: name.trim()
          });

          await clerk.client.signUp.prepareEmailAddressVerification({
            strategy: "email_code"
          });
          setIsSignInFlow(false);
        } catch (createErr: any) {
          const errCode = createErr?.errors?.[0]?.code;
          // If identifier already exists in Clerk, fallback to sending email verification code via signIn factor
          if (errCode === "form_identifier_exists" || createErr?.message?.includes("already exists")) {
            const signInAttempt = await clerk.client.signIn.create({
              identifier: email.trim()
            });
            const emailFactor = signInAttempt.supportedFirstFactors?.find(
              (f: any) => f.strategy === "email_code"
            ) as any;
            if (emailFactor) {
              await clerk.client.signIn.prepareFirstFactor({
                strategy: "email_code",
                emailAddressId: emailFactor.emailAddressId
              });
              setIsSignInFlow(true);
            } else {
              throw createErr;
            }
          } else {
            throw createErr;
          }
        }

        setOtpError(null);
        setEnteredOtp("");
        setOtpModalOpen(true);
      } catch (err: any) {
        console.error("Clerk verification dispatch error:", err);
        const clerkErrMsg =
          err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          err?.message;
        setError(clerkErrMsg || "Failed to initiate email verification.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setOtpError(null);
      setEnteredOtp("");
      setOtpModalOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gov-cream via-slate-50 to-emerald-50/30 p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-white overflow-hidden shadow-md">
            <img src="/logo.png" alt="MealCare logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Create Account
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Smart Mid-Day Meal Nutrition Platform
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={16} />
              <div>
                <p className="font-bold">Registration failed</p>
                <p className="mt-0.5 text-red-700/90 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                  placeholder="Rahul Kumar"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

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
                  className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                  placeholder="rahul@school.gov"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full mt-1 rounded-xl border border-slate-200 bg-white py-3 px-3 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                  disabled={isSubmitting}
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {role !== "DISTRICT_ADMIN" && role !== "SUPER_ADMIN" ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Institution Code/ID
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <MapPin size={15} />
                    </div>
                    <input
                      type="text"
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-gov-green"
                      placeholder="e.g. GOV-SCH-001, GOV-COL-001, NGO-KIT-001"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ) : role === "DISTRICT_ADMIN" ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    District Code/ID
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <MapPin size={15} />
                    </div>
                    <input
                      type="text"
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-gov-green"
                      placeholder="DEMO-DISTRICT"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ) : (
                <div />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
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
                  minLength={6}
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">At least 6 characters</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Confirm Password
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have a workspace?{" "}
            <Link href="/login" className="font-semibold text-gov-green hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-gov-green">
                <Mail size={22} className="text-gov-green" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Email Verification Code</h3>
              <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">
                A 6-digit verification code was sent to <span className="text-slate-900 font-bold">{email}</span> via Gmail.
              </p>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">
                Please check your inbox or spam folder and enter the code below.
              </p>
            </div>

            {otpError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-bold text-center">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                  className="block w-full text-center tracking-[0.5em] font-mono text-xl font-extrabold rounded-xl border border-slate-200 bg-white py-3 outline-none focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                  placeholder="000000"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOtpModalOpen(false);
                    setIsSubmitting(false);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-[0.98] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gov-green py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
                >
                  Confirm & Register
                </button>
              </div>
            </form>

            <p className="mt-5 text-center text-[10px] text-slate-400 font-bold">
              Didn't get the code?{" "}
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-gov-green hover:underline font-bold"
              >
                Resend OTP
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
