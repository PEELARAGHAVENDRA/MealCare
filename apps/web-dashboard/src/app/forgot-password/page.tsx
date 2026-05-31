"use client";

import React, { useState } from "react";
import { GraduationCap, Mail, ShieldAlert, ArrowLeft, CheckCircle2, Copy, KeyRound, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification code states
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Popup Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCode, setModalCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success view state (showing the code after reset verification)
  const [resetCompleted, setResetCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process request.");
      } else {
        setSuccessMsg(data.message || "Reset link has been logged to the server console.");
        // Generate a 6-digit random code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setResetToken(data.token || "mock_token");
      }
    } catch (err) {
      setError("Unable to connect to authentication server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // 1. Verify Verification Code
    if (modalCode.trim().toUpperCase() !== generatedCode?.trim().toUpperCase()) {
      setModalError("The verification code you entered is incorrect.");
      return;
    }

    // 2. Verify Passwords Match
    if (newPassword !== confirmPassword) {
      setModalError("New Password and Confirm Password do not match.");
      return;
    }

    // 3. Verify Password strength
    if (newPassword.length < 8) {
      setModalError("Password must be at least 8 characters long.");
      return;
    }

    setIsModalSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setModalError(data.error || "Failed to reset password. Please try again.");
      } else {
        setResetCompleted(true);
        setIsModalOpen(false);
      }
    } catch (err) {
      setModalError("Unable to connect to authentication server. Please try again.");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gov-cream via-slate-50 to-emerald-50/30 p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gov-green text-white shadow-md">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Reset Password
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Smart Mid-Day Meal Nutrition Platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={16} />
              <div>
                <p className="font-bold">Error requested</p>
                <p className="mt-0.5 text-red-700/90 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {resetCompleted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Password Reset Successful</h3>
                
                <div className="my-4 rounded-xl border border-dashed border-gov-green/30 bg-emerald-50/50 p-4 text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                    Verified Reset Code
                  </span>
                  <span className="font-mono text-lg font-bold text-slate-700">
                    {generatedCode}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Your password has been verified with code <strong className="text-slate-805 font-bold">{generatedCode}</strong> and successfully reset. You can now use your new password to sign in.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-xl bg-gov-green py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98]"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : successMsg ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Verification Code Generated</h3>
                
                <div className="mt-4 rounded-xl border border-dashed border-gov-green/30 bg-emerald-50/50 p-4 text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                    Security Code
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-mono font-extrabold tracking-widest text-gov-green">
                      {generatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (generatedCode) {
                          navigator.clipboard.writeText(generatedCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="text-slate-400 hover:text-gov-green transition p-1.5 rounded-lg hover:bg-slate-100"
                      title="Copy code"
                    >
                      {copied ? <span className="text-xs text-emerald-600 font-bold">Copied!</span> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500 leading-normal">
                    Please use this code in the password reset panel to confirm your identity.
                  </p>
                </div>

                <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                  Reset instructions have also been logged to the API server terminal.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(true);
                    setModalCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setModalError(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gov-green py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98]"
                >
                  <KeyRound size={16} />
                  Verify Code & Reset Password
                </button>

                <div className="text-center pt-1">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-gov-green"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Enter the email address associated with your workspace, and we will log password recovery details to the backend console.
              </p>
              
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
                    placeholder="name@school.gov"
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
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Send Reset Instructions"
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-gov-green"
                >
                  <ArrowLeft size={14} /> Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Popup Modal for Password Reset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md transform rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all duration-300 scale-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <KeyRound size={18} className="text-gov-green" />
                Verify Code & Reset Password
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 rounded-lg p-1 transition text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-800">
                <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={15} />
                <div className="leading-relaxed font-medium">{modalError}</div>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={modalCode}
                  onChange={(e) => setModalCode(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-805 placeholder-slate-400 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10 font-mono tracking-widest text-center uppercase"
                  placeholder="Enter Code"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  New Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 pr-10 text-sm text-slate-805 placeholder-slate-400 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-450 hover:text-slate-650"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 pr-10 text-sm text-slate-805 placeholder-slate-400 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-450 hover:text-slate-650"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-55"
                  disabled={isModalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-gov-green py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  disabled={isModalSubmitting}
                >
                  {isModalSubmitting ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
