"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  ZoomIn, 
  MapPin, 
  User, 
  Clock, 
  Search, 
  Building,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface CalendarDay {
  dateStr: string; // ISO date string
  dayNum: number;
  uploadStatus: string;
  verificationStatus: string;
}

interface EvidenceDetails {
  id: string;
  schoolId: string;
  imageUrl: string;
  thumbnailUrl: string;
  uploadedBy: string;
  role: string;
  mealType: string;
  remarks: string;
  status: string;
  uploadDate: string;
  uploadTime: string;
}

interface SchoolItem {
  id: string;
  name: string;
  code: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 15)); // Default to May 2026 for demo seeding consistency
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [days, setDays] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [evidencesForDay, setEvidencesForDay] = useState<EvidenceDetails[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const userRole = user?.role || "FOOD_SERVER";
  const isApprover = ["SUPER_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD"].includes(userRole);
  const canSwitchSchools = ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"].includes(userRole);

  const activeSchoolId = selectedSchool || user?.schoolId || "demo-school";

  // Format month name
  const monthName = currentDate.toLocaleString("en-US", { month: "long" });
  const yearNum = currentDate.getFullYear();

  // Load School List (for district/super admins)
  useEffect(() => {
    async function loadSchools() {
      if (isDemoMode) {
        setSchools([
          { id: "cmpppkkv70000b511lbz008lr", name: "Government Primary School Nandipur", code: "GOV-SCH-001" },
          { id: "sch-2", name: "Modern Girls Public School", code: "GIRLS-SCH-002" },
          { id: "sch-3", name: "National Secondary School Model", code: "GOV-SCH-003" }
        ]);
        setSelectedSchool("cmpppkkv70000b511lbz008lr");
      } else {
        try {
          const res = await fetch("http://localhost:4000/schools", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          });
          const data = await res.json();
          if (data) {
            setSchools(data);
            if (data.length > 0) {
              setSelectedSchool(data[0].id);
            }
          }
        } catch (err) {
          console.error("Failed to load schools:", err);
        }
      }
    }
    loadSchools();
  }, [isDemoMode]);

  // Load calendar days status
  const loadCalendarDays = async () => {
    setLoadingDays(true);
    
    // Generate dates for current month grid (35 days grid)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const generatedDays: CalendarDay[] = [];

    // Helper to format ISO date
    const getISODate = (day: number) => {
      const d = new Date(year, month, day);
      d.setHours(0,0,0,0);
      return d.toISOString();
    };

    if (isDemoMode) {
      // Mock calendar status seeding (Nandipur school)
      // Seeding Monday (May 11) to Friday (May 15)
      for (let i = 1; i <= totalDays; i++) {
        const iso = getISODate(i);
        const dayOfWeek = new Date(iso).getDay();
        
        let uploadStatus = "COMPLIANT";
        let verificationStatus = "NONE";

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          uploadStatus = "NO_MEAL";
          verificationStatus = "NONE";
        } else if (i === 11) { // Monday
          uploadStatus = "COMPLIANT";
          verificationStatus = "APPROVED";
        } else if (i === 12) { // Tuesday
          uploadStatus = "COMPLIANT";
          verificationStatus = "PENDING";
        } else if (i === 13) { // Wednesday
          uploadStatus = "COMPLIANT";
          verificationStatus = "REVIEWED";
        } else if (i === 14) { // Thursday
          uploadStatus = "NON_COMPLIANT";
          verificationStatus = "MISSING";
        } else if (i === 15) { // Friday
          uploadStatus = "HOLIDAY";
          verificationStatus = "NONE";
        } else if (i < 11) {
          // Past days
          uploadStatus = "COMPLIANT";
          verificationStatus = "APPROVED";
        } else {
          // Future days
          uploadStatus = "NO_MEAL";
          verificationStatus = "NONE";
        }

        generatedDays.push({
          dateStr: iso,
          dayNum: i,
          uploadStatus,
          verificationStatus
        });
      }
    } else {
      try {
        // Query live backend
        const res = await fetch(`http://localhost:4000/api/compliance/school/${activeSchoolId}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        
        const dbCalendar = data.calendar || [];
        
        for (let i = 1; i <= totalDays; i++) {
          const iso = getISODate(i);
          const formattedDateStr = new Date(iso).toDateString();
          
          const dbMatch = dbCalendar.find((c: any) => new Date(c.date).toDateString() === formattedDateStr);
          
          generatedDays.push({
            dateStr: iso,
            dayNum: i,
            uploadStatus: dbMatch ? dbMatch.uploadStatus : "NO_MEAL",
            verificationStatus: dbMatch ? dbMatch.verificationStatus : "NONE"
          });
        }
      } catch (err) {
        console.error("Failed to load live compliance calendar:", err);
      }
    }

    setDays(generatedDays);
    setLoadingDays(false);
  };

  useEffect(() => {
    loadCalendarDays();
    setSelectedDay(null);
    setEvidencesForDay([]);
  }, [currentDate, activeSchoolId, isDemoMode]);

  // Handle click on calendar day to fetch detail audit evidence logs
  const handleDayClick = async (day: CalendarDay) => {
    setSelectedDay(day);
    setEvidencesForDay([]);

    const dayDate = new Date(day.dateStr);

    if (isDemoMode) {
      // Return mock evidence
      if (day.verificationStatus !== "NONE" && day.verificationStatus !== "MISSING") {
        setEvidencesForDay([
          {
            id: `demo-detail-${day.dayNum}`,
            schoolId: activeSchoolId,
            imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
            thumbnailUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80",
            uploadedBy: "server@school.gov",
            role: "FOOD_SERVER",
            mealType: "Lunch",
            remarks: "Warm khichdi served successfully under hygiene compliance norms.",
            status: day.verificationStatus === "APPROVED" ? "Approved" : day.verificationStatus === "REVIEWED" ? "Reviewed" : "Submitted",
            uploadDate: dayDate.toLocaleDateString(),
            uploadTime: "12:15 PM"
          }
        ]);
      }
    } else {
      // Query database
      try {
        const res = await fetch(`http://localhost:4000/api/evidence/school/${activeSchoolId}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (data.success) {
          const dateStr = dayDate.toDateString();
          const filtered = data.data.filter((e: any) => new Date(e.uploadDate).toDateString() === dateStr);
          setEvidencesForDay(filtered);
        }
      } catch (err) {
        console.error("Error loading day evidence details:", err);
      }
    }
  };

  // Perform quick approve or reject actions
  const handleVerifyAction = async (evidenceId: string, status: "Approved" | "Rejected") => {
    setSubmittingAction(true);
    if (isDemoMode) {
      // Update local state
      setEvidencesForDay(prev => prev.map(e => e.id === evidenceId ? { ...e, status } : e));
      if (selectedDay) {
        setDays(prev => prev.map(d => d.dateStr === selectedDay.dateStr ? {
          ...d,
          verificationStatus: status === "Approved" ? "APPROVED" : "REJECTED"
        } : d));
      }
      setSubmittingAction(false);
    } else {
      try {
        const res = await fetch(`http://localhost:4000/api/evidence/${evidenceId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ status })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          setEvidencesForDay(prev => prev.map(e => e.id === evidenceId ? data.data : e));
          // Refresh calendar grid status
          await loadCalendarDays();
        }
      } catch (err) {
        console.error("Action submit failed:", err);
      } finally {
        setSubmittingAction(false);
      }
    }
  };

  // Color classes mapping
  const getDayColorClass = (day: CalendarDay) => {
    if (day.uploadStatus === "HOLIDAY" || day.uploadStatus === "NO_MEAL") {
      return "bg-slate-100/70 text-slate-400 border-slate-200/50 hover:bg-slate-200/40";
    }
    switch (day.verificationStatus) {
      case "APPROVED":
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100/50";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50 animate-pulse";
      case "REVIEWED":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/50";
      case "MISSING":
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50 font-extrabold";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/50";
    }
  };

  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell title="Meal Verification Calendar" subtitle="Color-coded daily compliance auditing logs">
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Main Grid Calendar & School Selector (Left) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* School Selector (visible to administrators) */}
          {canSwitchSchools && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                District Monitoring - Switch Institutional View
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={15} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search schools by name or code..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-gov-green focus:ring-1 focus:ring-gov-green/10"
                  />
                </div>
                
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-55/50 px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-gov-green"
                >
                  {filteredSchools.map(sch => (
                    <option key={sch.id} value={sch.id}>{sch.name} ({sch.code})</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {/* Grid Calendar */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-gov-green" size={18} />
                <h2 className="text-base font-extrabold text-slate-900">{monthName} {yearNum}</h2>
              </div>

              {/* Month switches */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(yearNum, currentDate.getMonth() - 1, 15))}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(yearNum, currentDate.getMonth() + 1, 15))}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Loading Indicator */}
            {loadingDays ? (
              <div className="grid grid-cols-7 gap-2 min-h-[250px] items-center justify-center">
                <div className="col-span-7 flex flex-col items-center gap-2 py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gov-green border-t-transparent"></div>
                  <p className="text-xs text-slate-400 font-semibold">Aligning calendar grids...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Pad first week offset */}
                {Array.from({ length: new Date(yearNum, currentDate.getMonth(), 1).getDay() }).map((_, idx) => (
                  <div key={`pad-${idx}`} className="aspect-square rounded-xl bg-slate-50/20 border border-transparent"></div>
                ))}

                {/* Days Grid */}
                {days.map((day) => {
                  const isSelected = selectedDay?.dateStr === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-2 transition active:scale-95 focus:ring-1 focus:ring-gov-green/10 ${getDayColorClass(day)} ${
                        isSelected ? "ring-2 ring-gov-green border-gov-green shadow-sm" : ""
                      }`}
                    >
                      <span className="text-xs font-bold">{day.dayNum}</span>
                      
                      {/* Short state indicator */}
                      <span className="text-[7px] font-extrabold uppercase tracking-wider scale-90">
                        {day.uploadStatus === "HOLIDAY" ? "Holiday" : day.verificationStatus === "APPROVED" ? "Approved" : day.verificationStatus === "PENDING" ? "Pending" : day.verificationStatus === "REVIEWED" ? "Reviewed" : day.verificationStatus === "MISSING" ? "Missing" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Color Guides */}
          <div className="flex flex-wrap gap-4 rounded-xl bg-slate-100/50 p-4 border border-slate-200/50 justify-between text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500 border border-green-600"></span>Approved</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500 border border-amber-600 animate-pulse"></span>Pending Review</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500 border border-blue-600"></span>Reviewed</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500 border border-red-600"></span>Missing Upload</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-350 border border-slate-400"></span>No Meal / Holiday</div>
          </div>

        </div>

        {/* Verification Detail Sidebar (Right) */}
        <div className="lg:col-span-4 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[450px]">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <CalendarIcon className="text-gov-green" size={18} />
              <span>Evidence Verification Logs</span>
            </h2>

            {!selectedDay ? (
              <div className="text-center py-24 text-slate-400">
                <p className="text-xs font-bold">Select a date grid box</p>
                <p className="text-[10px] mt-0.5">Click any calendar box to view uploaded food photos, remarks, and metadata.</p>
              </div>
            ) : evidencesForDay.length === 0 ? (
              <div className="text-center py-20 space-y-2">
                <AlertTriangle className="mx-auto text-amber-500 animate-bounce" size={24} />
                <p className="text-xs font-bold text-slate-700">
                  {selectedDay.verificationStatus === "MISSING" ? "COMPLIANCE FAIL: Missing uploads" : "No meals scheduled / Holiday"}
                </p>
                <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto mt-0.5">
                  {selectedDay.verificationStatus === "MISSING" ? "Food server did not submit evidence for required meals today." : "No verification logs required for this day."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {evidencesForDay.map((ev) => (
                  <div key={ev.id} className="space-y-4">
                    {/* Visual Card */}
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[180px]">
                      <img src={ev.imageUrl} alt="Meal Verification" className="w-full h-full object-cover max-h-[220px]" />
                      <button
                        onClick={() => setZoomImage(ev.imageUrl)}
                        className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 text-white p-2 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition shadow active:scale-90"
                        title="View Fullscreen"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>

                    {/* Metadata Panel */}
                    <div className="space-y-2.5 rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Status</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          ev.status === "Approved" 
                            ? "bg-green-50 border-green-200 text-green-800" 
                            : ev.status === "Reviewed"
                            ? "bg-blue-50 border-blue-200 text-blue-800"
                            : ev.status === "Rejected"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}>
                          {ev.status}
                        </span>
                      </div>

                      <div className="h-[1px] bg-slate-200/50 my-1"></div>

                      <div className="grid grid-cols-[20px_1fr] gap-2 text-[10px] text-slate-600 font-semibold">
                        <Building size={12} className="text-slate-400 mt-0.5" />
                        <div>
                          <div className="font-extrabold text-slate-700">Institution Context</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Nandipur School | GOV-SCH-001</div>
                        </div>

                        <User size={12} className="text-slate-400 mt-0.5" />
                        <div>
                          <div className="font-extrabold text-slate-700">Uploaded By</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{ev.uploadedBy} ({ev.role})</div>
                        </div>

                        <Clock size={12} className="text-slate-400 mt-0.5" />
                        <div>
                          <div className="font-extrabold text-slate-700">Timestamp Log</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{ev.mealType} at {ev.uploadTime}</div>
                        </div>
                      </div>

                      <div className="h-[1px] bg-slate-200/50 my-1"></div>

                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Remarks</div>
                        <p className="text-[10px] font-semibold text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                          "{ev.remarks || "No remarks logged by server"}"
                        </p>
                      </div>
                    </div>

                    {/* Quick Approve / Reject Actions */}
                    {isApprover && ev.status === "Submitted" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleVerifyAction(ev.id, "Approved")}
                          disabled={submittingAction}
                          className="py-2.5 rounded-xl bg-gov-green hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-[0.98] disabled:opacity-50"
                        >
                          <Check size={14} />
                          Approve Meal
                        </button>
                        <button
                          onClick={() => handleVerifyAction(ev.id, "Rejected")}
                          disabled={submittingAction}
                          className="py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-[0.98] disabled:opacity-50"
                        >
                          <X size={14} />
                          Reject Meal
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>

      {/* Smart Zoom Overlay */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl border border-white/10">
            <img src={zoomImage} alt="Zoomed Evidence View" className="object-contain w-full h-full" />
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white p-2.5 transition active:scale-95"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
