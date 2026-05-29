"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { useRouter } from "next/navigation";
import { 
  Building, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  Calendar as CalendarIcon
} from "lucide-react";

interface SchoolDetails {
  id: string;
  name: string;
  code: string;
  district: string;
  block: string;
  address: string;
  studentCount: number;
  type: string;
  principalName: string;
  email: string;
  phone: string;
  complianceScore: number;
  approvalRate: number;
  missingMeals: number;
  calendarData: Array<{ date: string; status: string; vStatus: string }>;
}

export default function SchoolsMonitoringPage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const router = useRouter();

  const [schools, setSchools] = useState<SchoolDetails[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDirectory() {
      setLoading(true);
      if (isDemoMode) {
        // Seeding multiple mock schools for search/filters monitoring
        const mockData: SchoolDetails[] = [
          {
            id: "cmpppkkv70000b511lbz008lr",
            name: "Government Primary School Nandipur",
            code: "GOV-SCH-001",
            district: "Demo District",
            block: "Central Block",
            address: "Nandipur Main Road",
            studentCount: 240,
            type: "Primary",
            principalName: "Ramesh Kumar",
            email: "head@school.gov",
            phone: "+91 98765 43210",
            complianceScore: 88,
            approvalRate: 90,
            missingMeals: 1,
            calendarData: [
              { date: "Mon", status: "COMPLIANT", vStatus: "APPROVED" },
              { date: "Tue", status: "COMPLIANT", vStatus: "PENDING" },
              { date: "Wed", status: "COMPLIANT", vStatus: "REVIEWED" },
              { date: "Thu", status: "NON_COMPLIANT", vStatus: "MISSING" },
              { date: "Fri", status: "HOLIDAY", vStatus: "NONE" }
            ]
          },
          {
            id: "sch-2",
            name: "Modern Girls Public School",
            code: "GIRLS-SCH-002",
            district: "Demo District",
            block: "G-Block",
            address: "Sector 12, Main Market",
            studentCount: 310,
            type: "Secondary",
            principalName: "Sita Sharma",
            email: "head@girls-school.gov",
            phone: "+91 99887 76655",
            complianceScore: 78,
            approvalRate: 80,
            missingMeals: 3,
            calendarData: [
              { date: "Mon", status: "COMPLIANT", vStatus: "APPROVED" },
              { date: "Tue", status: "NON_COMPLIANT", vStatus: "MISSING" },
              { date: "Wed", status: "NON_COMPLIANT", vStatus: "MISSING" },
              { date: "Thu", status: "NON_COMPLIANT", vStatus: "MISSING" },
              { date: "Fri", status: "COMPLIANT", vStatus: "APPROVED" }
            ]
          },
          {
            id: "sch-3",
            name: "National Secondary School Model",
            code: "GOV-SCH-003",
            district: "Demo District",
            block: "South Block",
            address: "Highway Road Junction",
            studentCount: 450,
            type: "Secondary",
            principalName: "Anil Dev",
            email: "head@model-school.gov",
            phone: "+91 91234 56789",
            complianceScore: 98,
            approvalRate: 100,
            missingMeals: 0,
            calendarData: [
              { date: "Mon", status: "COMPLIANT", vStatus: "APPROVED" },
              { date: "Tue", status: "COMPLIANT", vStatus: "APPROVED" },
              { date: "Wed", status: "COMPLIANT", vStatus: "APPROVED" },
              { date: "Thu", status: "COMPLIANT", vStatus: "APPROVED" },
              { date: "Fri", status: "COMPLIANT", vStatus: "APPROVED" }
            ]
          }
        ];
        setSchools(mockData);
        setSelectedSchool(mockData[0]);
      } else {
        try {
          const res = await fetch("http://localhost:4000/schools", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          });
          const data = await res.json();
          if (data) {
            // Map live database schools
            const mapped: SchoolDetails[] = data.map((s: any) => ({
              id: s.id,
              name: s.name,
              code: s.code,
              district: s.district,
              block: s.block,
              address: s.address,
              studentCount: s.studentCount,
              type: s.type || "Primary",
              principalName: " Ramesh Kumar",
              email: "head@school.gov",
              phone: "+91 98765 43210",
              complianceScore: 100,
              approvalRate: 100,
              missingMeals: 0,
              calendarData: [
                { date: "Mon", status: "COMPLIANT", vStatus: "APPROVED" },
                { date: "Tue", status: "COMPLIANT", vStatus: "APPROVED" },
                { date: "Wed", status: "COMPLIANT", vStatus: "APPROVED" }
              ]
            }));
            setSchools(mapped);
            if (mapped.length > 0) {
              setSelectedSchool(mapped[0]);
            }
          }
        } catch (err) {
          console.error("Failed to load live directory:", err);
        }
      }
      setLoading(false);
    }
    loadDirectory();
  }, [isDemoMode]);

  // Navigate to Email Composer with recipient prefilled
  const handleComposeEmail = (email: string) => {
    // Save state to localStorage to help prefill targetType single and recipientEmail
    localStorage.setItem("prefill_recipient_email", email);
    router.push("/communication");
  };

  const getCalendarDotColor = (vStatus: string, status: string) => {
    if (status === "HOLIDAY") return "bg-slate-350";
    switch (vStatus) {
      case "APPROVED": return "bg-green-500";
      case "PENDING": return "bg-amber-500 animate-pulse";
      case "REVIEWED": return "bg-blue-500";
      case "MISSING": return "bg-red-500";
      default: return "bg-slate-200";
    }
  };

  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || s.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <AppShell title="District School Directory" subtitle="Audit school compliance logs, profiles, and contacts">
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* School Directory list (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[500px]">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="text-gov-green" size={18} />
              <span>District Schools List</span>
            </h2>

            {/* Search and Filters */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search size={15} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by school name or code..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs outline-none focus:border-gov-green"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide transition ${
                    filterType === "all" ? "bg-gov-green text-white border-gov-green" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setFilterType("primary")}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide transition ${
                    filterType === "primary" ? "bg-gov-green text-white border-gov-green" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Primary
                </button>
                <button
                  onClick={() => setFilterType("secondary")}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide transition ${
                    filterType === "secondary" ? "bg-gov-green text-white border-gov-green" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Secondary
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gov-green border-t-transparent"></div>
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No matching institutions found in this district.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSchools.map((school) => {
                  const isSelected = selectedSchool?.id === school.id;
                  return (
                    <button
                      key={school.id}
                      onClick={() => setSelectedSchool(school)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center justify-between gap-4 transition active:scale-[0.99] ${
                        isSelected 
                          ? "bg-slate-100/50 border-gov-green shadow-sm ring-1 ring-gov-green/10" 
                          : "bg-slate-50/20 border-slate-200 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-800 text-xs truncate">{school.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1.5">
                          <span>{school.type} Type</span>
                          <span>|</span>
                          <span>Code: {school.code}</span>
                        </div>
                      </div>
                      <ArrowRight size={14} className={isSelected ? "text-gov-green" : "text-slate-350"} />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Selected School Details Dashboard (Right) */}
        <div className="lg:col-span-7 space-y-6">
          {!selectedSchool ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[500px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Building className="mx-auto mb-2 text-slate-300" size={32} />
                <p className="text-xs font-bold">Select a school from the directory</p>
              </div>
            </section>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Card */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                      {selectedSchool.name}
                    </h2>
                    <p className="text-xs text-slate-400 font-bold mt-1">
                      {selectedSchool.type} School • Code: {selectedSchool.code}
                    </p>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 shrink-0 ${
                    selectedSchool.complianceScore >= 90
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    <Award size={13} />
                    Score: {selectedSchool.complianceScore}%
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  {/* Address */}
                  <div className="space-y-2 rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                    <div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">School Details</div>
                    <div className="space-y-1.5 font-semibold text-slate-700">
                      <p className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        {selectedSchool.address}, {selectedSchool.block}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 shrink-0" />
                        Enrollment: {selectedSchool.studentCount} Students
                      </p>
                    </div>
                  </div>

                  {/* Principal Details */}
                  <div className="space-y-2 rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                    <div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Principal / Head Contact</div>
                    <div className="space-y-1.5 font-semibold text-slate-700">
                      <p className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 shrink-0" />
                        {selectedSchool.principalName}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        {selectedSchool.phone}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        {selectedSchool.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Action */}
                <button
                  onClick={() => handleComposeEmail(selectedSchool.email)}
                  className="w-full py-2.5 rounded-xl bg-gov-green hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  <Send size={13} />
                  Send Reminder Notification Email
                </button>
              </section>

              {/* Compliance Calendar Widget */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="text-gov-green" size={18} />
                    <span>Weekly Compliance Timeline Widget</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">Past 5 Days</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-150">
                  {selectedSchool.calendarData.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                        {item.date}
                      </span>
                      <span className={`h-4 w-4 rounded-full border border-white shadow-inner shrink-0 ${
                        getCalendarDotColor(item.vStatus, item.status)
                      }`} title={`${item.date}: ${item.vStatus}`} />
                    </div>
                  ))}
                </div>

                {/* Micro indicators details */}
                <div className="flex justify-between text-[8px] font-extrabold uppercase tracking-wide text-slate-400">
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500"></span>Approved</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span>Pending</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span>Reviewed</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span>Missing</div>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-350"></span>Holiday</div>
                </div>
              </section>

              {/* Recent Audit Timeline List */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  Verification Records Audit Summary
                </h3>

                <div className="grid gap-3 sm:grid-cols-3 text-center text-xs font-bold">
                  <div className="p-3 bg-green-50 border border-green-150 rounded-xl text-green-800">
                    <div className="text-xl font-extrabold">{selectedSchool.approvalRate}%</div>
                    <div className="text-[9px] text-green-700/80 mt-0.5">Approval Index</div>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-800">
                    <div className="text-xl font-extrabold">{selectedSchool.missingMeals}</div>
                    <div className="text-[9px] text-red-700/80 mt-0.5">Missing Uploads</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                    <div className="text-xl font-extrabold">{selectedSchool.studentCount}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">Active Beneficiaries</div>
                  </div>
                </div>
              </section>

            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
