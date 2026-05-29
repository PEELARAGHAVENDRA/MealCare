"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send, 
  Mail, 
  Building,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

interface MissingSchool {
  schoolId: string;
  name: string;
  code: string;
  principalEmail: string;
  phone: string;
}

interface ComplianceStats {
  verifiedToday: number;
  pendingReviews: number;
  approvedMeals: number;
  rejectedMeals: number;
  missingUploads: number;
  complianceScore: number;
  schoolsWithMissing: MissingSchool[];
}

export default function CompliancePage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();

  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);

  const loadComplianceStats = async () => {
    setLoading(true);
    if (isDemoMode) {
      // Mock stats
      setStats({
        verifiedToday: 4,
        pendingReviews: 1,
        approvedMeals: 28,
        rejectedMeals: 2,
        missingUploads: 1,
        complianceScore: 88,
        schoolsWithMissing: [
          {
            schoolId: "sch-2",
            name: "Modern Girls Public School",
            code: "GIRLS-SCH-002",
            principalEmail: "head@girls-school.gov",
            phone: "G-Block Sector 12"
          }
        ]
      });
    } else {
      try {
        const res = await fetch("http://localhost:4000/api/evidence/stats", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to load compliance stats:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComplianceStats();
  }, [isDemoMode]);

  // Send single reminder email to school head
  const sendReminder = async (schoolId: string, email: string) => {
    setReminderSending(schoolId);
    setReminderSuccess(null);
    
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setReminderSuccess(`Reminder email successfully sent to ${email}`);
      setReminderSending(null);
    } else {
      try {
        const res = await fetch("http://localhost:4000/api/communication/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            recipients: email,
            subject: "Urgent: Mid-Day Meal Evidence Upload Required",
            message: "This is an automated reminder that your school has missing meal evidence logs for today. Please instruct your food server to capture and upload photos immediately.",
            type: "single"
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setReminderSuccess(`Live email dispatched to ${email}`);
          // Remove from missing list locally for feedback
          if (stats) {
            setStats({
              ...stats,
              schoolsWithMissing: stats.schoolsWithMissing.filter(s => s.schoolId !== schoolId)
            });
          }
        }
      } catch (err) {
        console.error("Failed to send reminder:", err);
      } finally {
        setReminderSending(null);
      }
    }
  };

  if (loading || !stats) {
    return (
      <AppShell title="Compliance Tracking" subtitle="Analyzing school compliance logs...">
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gov-green border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500">Recalculating district consistency quotients...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Compliance & Audit Center" subtitle="Track mid-day meal photo logging verification stats">
      <div className="space-y-6">
        
        {/* Reminder Feedback banner */}
        {reminderSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-4 text-xs font-semibold text-green-800">
            <CheckCircle2 className="text-green-600 shrink-0" size={16} />
            <span>{reminderSuccess}</span>
          </div>
        )}

        {/* Dashboard Grid Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Verified Today</span>
              <CheckCircle2 className="text-gov-green" size={16} />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.verifiedToday}</p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Approved or Reviewed uploads</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Missing Uploads</span>
              <AlertTriangle className="text-red-500" size={16} />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.missingUploads}</p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Compulsory items unscheduled</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending Reviews</span>
              <Clock className="text-amber-500" size={16} />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.pendingReviews}</p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">Awaiting principal verification</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm bg-gradient-to-br from-emerald-500/5 to-slate-50">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gov-green">Compliance Quotient</span>
              <Award className="text-gov-green" size={16} />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-gov-green">{stats.complianceScore}%</p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">District average score</p>
          </div>

        </div>

        {/* Main Panel grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Schools With Missing Uploads (Left) */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-500" size={18} />
                <span>Non-Compliant Schools (Missing Log entries today)</span>
              </h2>

              {stats.schoolsWithMissing.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="mx-auto text-gov-green mb-2" size={32} />
                  <p className="text-xs font-bold">All schools compliant today</p>
                  <p className="text-[10px] mt-0.5">Every active institution has uploaded meal evidence</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.schoolsWithMissing.map((school) => (
                    <div 
                      key={school.schoolId} 
                      className="flex items-center justify-between gap-4 p-4 border border-red-100 rounded-xl bg-red-50/20 hover:bg-red-50/40 transition"
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-800 text-xs truncate">
                          {school.name}
                        </div>
                        <div className="flex flex-wrap gap-2 text-[9px] text-slate-400 font-bold mt-1">
                          <span className="flex items-center gap-0.5">
                            <Building size={10} />
                            Code: {school.code}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Mail size={10} />
                            Principal: {school.principalEmail}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => sendReminder(school.schoolId, school.principalEmail)}
                        disabled={reminderSending === school.schoolId}
                        className="py-2 px-3 rounded-lg bg-red-600 hover:bg-red-750 text-white font-extrabold text-[10px] flex items-center gap-1 shrink-0 active:scale-95 transition disabled:opacity-50"
                      >
                        <Send size={10} />
                        {reminderSending === school.schoolId ? "Alerting..." : "Send Alert"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* District trends (Right) */}
          <div className="lg:col-span-5 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-gov-green" size={18} />
                <span>Monthly Compliance Trends</span>
              </h2>

              {/* Styled trend chart */}
              <div className="space-y-3">
                {[
                  { month: "January 2026", score: 92 },
                  { month: "February 2026", score: 95 },
                  { month: "March 2026", score: 89 },
                  { month: "April 2026", score: 91 },
                  { month: "May 2026", score: 88 }
                ].map((trend) => (
                  <div key={trend.month} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <span>{trend.month}</span>
                      <span className="text-gov-green">{trend.score}%</span>
                    </div>
                    {/* Bar meter */}
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                      <div 
                        className="h-full bg-gov-green rounded-full transition-all duration-500" 
                        style={{ width: `${trend.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compliance Formula Guide */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider">
                  <FileSpreadsheet className="text-gov-green" size={13} />
                  <span>Compliance score variables</span>
                </div>
                <ul className="text-[10px] font-semibold text-slate-500 list-disc list-inside space-y-1 leading-relaxed">
                  <li>Upload consistency checks across compulsory daily slots.</li>
                  <li>Approval metrics completed by principal/admins.</li>
                  <li>Escalations triggered due to late logging.</li>
                  <li>Holidays and excluded meal blocks are skipped.</li>
                </ul>
              </div>
            </section>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
