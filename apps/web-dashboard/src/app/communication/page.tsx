"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { 
  Mail, 
  Send, 
  Trash2, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Paperclip,
  CheckCircle
} from "lucide-react";

interface EmailLog {
  id: string;
  sender: string;
  recipients: string[];
  subject: string;
  message: string;
  deliveryStatus: string;
  timestamp: string;
}

const TEMPLATES = [
  {
    name: "Missing Upload Reminder",
    subject: "Urgent: Complete Daily Meal Evidence Upload",
    message: "Dear School Head / Kitchen Staff,\n\nOur system detected missing daily meal photo evidence logs for your school. Please ensure your food server immediately logs the scheduled breakfast and lunch uploads.\n\nWarm regards,\nDistrict Mid-Day Meal Department"
  },
  {
    name: "Compliance Audit Notice",
    subject: "Audit: Monthly Nutritional Compliance Check",
    message: "Dear Principal,\n\nThis is a notification that your compliance quotient has fallen below the recommended threshold (90%). Please audit your weekly planner configuration and correct nutritional gaps.\n\nWarm regards,\nDistrict Nutrition Office"
  },
  {
    name: "Hygiene Standard Compliance",
    subject: "Safety Circular: Mandatory Food Quality Inspection",
    message: "Dear Chefs & Kitchen Staff,\n\nPlease enforce strict hygiene standards during food preparation. Daily preparation photos must be uploaded in the planner evidence logs.\n\nWarm regards,\nMid-Day Meal Authority"
  }
];

export default function CommunicationPage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();

  const [targetType, setTargetType] = useState("missing"); // missing, low-compliance, district, single
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [message, setMessage] = useState(TEMPLATES[0].message);
  
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [sending, setSending] = useState(false);
  const [bulkReminderSending, setBulkReminderSending] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLogs = async () => {
    if (isDemoMode) {
      setLogs([
        {
          id: "log-1",
          sender: "nutrition@district.gov",
          recipients: ["head@school.gov"],
          subject: "Urgent: Complete Monday Meal Evidence Upload",
          message: "Dear Principal, please ensure your food server uploads the Lunch evidence immediately.",
          deliveryStatus: "SENT",
          timestamp: new Date(Date.now() - 3 * 3600 * 1000).toLocaleString()
        },
        {
          id: "log-2",
          sender: "district@district.gov",
          recipients: ["head@girls-school.gov", "head@model-school.gov"],
          subject: "Urgent: Complete Monday Meal Evidence Upload",
          message: "Dear School Heads, please ensure your food servers upload the daily breakfast and lunch evidence.",
          deliveryStatus: "SENT",
          timestamp: new Date(Date.now() - 24 * 3600 * 1000).toLocaleString()
        }
      ]);
    } else {
      try {
        const res = await fetch("http://localhost:4000/api/communication/logs", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setLogs(data.data.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp).toLocaleString()
          })));
        }
      } catch (err) {
        console.error("Failed to load logs:", err);
      }
    }
  };

  useEffect(() => {
    loadLogs();
    const prefilled = localStorage.getItem("prefill_recipient_email");
    if (prefilled) {
      setTargetType("single");
      setRecipientEmail(prefilled);
      localStorage.removeItem("prefill_recipient_email");
    }
  }, [isDemoMode]);

  // Apply template values
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = TEMPLATES.find(t => t.name === e.target.value);
    if (selected) {
      setSubject(selected.subject);
      setMessage(selected.message);
    }
  };

  // Dispatch standard compose form email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const emailPayload = {
      recipients: targetType === "single" ? recipientEmail : [],
      subject,
      message,
      type: targetType
    };

    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newLog: EmailLog = {
        id: `demo-log-${Date.now()}`,
        sender: user?.email || "officer@district.gov",
        recipients: targetType === "single" ? [recipientEmail] : ["Multiple Schools"],
        subject,
        message,
        deliveryStatus: "SENT",
        timestamp: new Date().toLocaleString()
      };
      setLogs(prev => [newLog, ...prev]);
      setSuccessMsg(`Email successfully sent via Demo Dispatcher!`);
      setRecipientEmail("");
      setSending(false);
    } else {
      try {
        const res = await fetch("http://localhost:4000/api/communication/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(emailPayload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message);
          setRecipientEmail("");
          await loadLogs();
        } else {
          setErrorMsg(data.error || "Failed to dispatch email.");
        }
      } catch (err) {
        setErrorMsg("Network error sending email.");
      } finally {
        setSending(false);
      }
    }
  };

  // One-click Send Reminder to Missing Schools
  const triggerBulkReminder = async () => {
    setBulkReminderSending(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newLog: EmailLog = {
        id: `demo-log-bulk-${Date.now()}`,
        sender: user?.email || "officer@district.gov",
        recipients: ["head@girls-school.gov", "head@school.gov"],
        subject: "Urgent: Complete Daily Meal Evidence Upload",
        message: TEMPLATES[0].message,
        deliveryStatus: "SENT",
        timestamp: new Date().toLocaleString()
      };
      setLogs(prev => [newLog, ...prev]);
      setSuccessMsg("Bulk missing evidence notifications sent to all schools!");
      setBulkReminderSending(false);
    } else {
      try {
        const res = await fetch("http://localhost:4000/api/communication/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            subject: TEMPLATES[0].subject,
            message: TEMPLATES[0].message,
            type: "missing"
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message);
          await loadLogs();
        } else {
          setErrorMsg(data.error || "Failed to trigger bulk alerts.");
        }
      } catch (err) {
        setErrorMsg("Network error dispatching bulk reminders.");
      } finally {
        setBulkReminderSending(false);
      }
    }
  };

  return (
    <AppShell title="District Communication Center" subtitle="Direct and bulk school alert dispatcher">
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Composer Panel (Left) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Bulk Reminders Action Bar */}
          <section className="rounded-2xl border border-red-200 bg-red-50/20 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1.5 justify-center sm:justify-start">
                <AlertCircle size={14} />
                <span>Instant Missing Evidence Dispatcher</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Scan compliance database and email daily photo reminders to all missing schools in one click.
              </p>
            </div>
            
            <button
              onClick={triggerBulkReminder}
              disabled={bulkReminderSending}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white font-extrabold text-xs shadow-sm shrink-0 active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send size={12} />
              {bulkReminderSending ? "Sending..." : "Send Reminder to Missing Schools"}
            </button>
          </section>

          {/* Form Composer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Mail className="text-gov-green" size={18} />
              <span>Compose Circular / Alert Email</span>
            </h2>

            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-4 text-xs font-semibold text-green-800">
                <CheckCircle2 className="text-green-600 shrink-0" size={16} />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800">
                <AlertCircle className="text-red-600 shrink-0" size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Target */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Target Recipients
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-55/50 p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-gov-green"
                  >
                    <option value="missing">Schools with Missing Uploads</option>
                    <option value="low-compliance">Schools with Low Compliance (&lt;90%)</option>
                    <option value="district">Entire District (All Schools)</option>
                    <option value="single">Single Recipient Address</option>
                  </select>
                </div>

                {/* Templates */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Load Template
                  </label>
                  <select
                    onChange={handleTemplateChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-55/50 p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-gov-green"
                  >
                    {TEMPLATES.map((t, idx) => (
                      <option key={idx} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Single recipient field */}
              {targetType === "single" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                    placeholder="principal@school.gov"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-gov-green"
                  />
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="Subject details..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-gov-green"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Message Body
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  placeholder="Write message details..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-gov-green"
                />
              </div>

              {/* Attachments (Simulator) */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Paperclip size={13} />
                  Simulated PDF attachments (Compliancy Scorecards)
                </span>
                <span className="text-[9px] font-extrabold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  Enabled
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-xl bg-gov-green hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send size={13} />
                {sending ? "Dispatching..." : "Send Announcement"}
              </button>
            </form>
          </section>

        </div>

        {/* History Audit Logs (Right) */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-h-[700px] overflow-y-auto">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="text-gov-green" size={18} />
              <span>Communication History Audit Logs</span>
            </h2>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="mx-auto text-slate-350 mb-2" size={32} />
                <p className="text-xs font-bold">No emails sent yet</p>
                <p className="text-[10px] mt-0.5">Logs appear here once sent</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-2 hover:bg-slate-50/70 transition text-xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-slate-700 truncate max-w-[190px]">
                        Subject: {log.subject}
                      </span>
                      <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
                        {log.deliveryStatus}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 italic">
                      "{log.message}"
                    </p>

                    <div className="h-[1px] bg-slate-200/50 my-1"></div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        To: {log.recipients.join(", ")}
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>
    </AppShell>
  );
}
