"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { 
  Loader2, 
  Pencil, 
  MinusCircle, 
  Check, 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle,
  Undo2
} from "lucide-react";

interface ScheduleItem {
  day: string;
  morning: string;
  afternoon: string;
  evening: string;
  dinner: string;
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { day: "Monday", morning: "Sprouted Moong", afternoon: "Rice + Dal + Banana", evening: "Soya Chunks Snack", dinner: "Wheat Roti & Veg Curry" },
  { day: "Tuesday", morning: "Fortified Milk", afternoon: "Rice + Egg Curry", evening: "Roasted Peanuts", dinner: "Rice + Dal Tadka" },
  { day: "Wednesday", morning: "Dalia Khichdi", afternoon: "Vegetable Pulao + Milk", evening: "Mixed Seeds", dinner: "Paneer & Roti" },
  { day: "Thursday", morning: "Poha with Veggies", afternoon: "Spinach Dal + Rice", evening: "Banana", dinner: "Khichdi & Curd" },
  { day: "Friday", morning: "Sprouted Gram", afternoon: "Rice + Sambar + Fruit", evening: "Peanut Chikki", dinner: "Roti & Mix Veg" },
  { day: "Saturday", morning: "Milk", afternoon: "Lemon Rice + Groundnuts", evening: "Roasted Chana", dinner: "Pulao & Raita" },
  { day: "Sunday", morning: "Wheat Roti", afternoon: "Rice + Veg Curry + Milk", evening: "Apple", dinner: "Egg Rice & Salad" }
];

const MOCK_GEMINI_ANALYSIS = {
  warnings: [
    "Protein deficiency detected on Monday and Thursday evenings due to light snack choices.",
    "Iron levels are slightly lower than the recommended daily allowance (RDA) of 15mg for age group 6-14."
  ],
  suggestions: [
    {
      day: "Monday",
      mealTime: "Evening",
      foodSuggestion: "Add boiled eggs or double the Soya Chunks portion.",
      reason: "To cover 8.5g protein and boost iron intake."
    },
    {
      day: "Wednesday",
      mealTime: "Morning",
      foodSuggestion: "Mix drumstick leaves (Moringa) into Dalia Khichdi.",
      reason: "Improves overall Vitamin A and iron absorption by 24%."
    },
    {
      day: "Thursday",
      mealTime: "Evening",
      foodSuggestion: "Pair Banana with roasted Chana.",
      reason: "Adds 6.2g of protein to bridge the Thursday afternoon nutrient gap."
    }
  ],
  overallAnalysis: "Demo Analysis: The meal planner is highly budget-efficient (average ₹11 per student) but exhibits minor protein and micronutrient gaps mid-week. Resolving these via sprouts or seeds in the evening slot will satisfy all ICMR norms."
};

export default function PlannerPage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();

  const [schedule, setSchedule] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [history, setHistory] = useState<Record<string, ScheduleItem>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("DRAFT");
  const [analysis, setAnalysis] = useState<any | null>(null);

  // Editing state
  const [editingCell, setEditingCell] = useState<{ day: string; slot: "morning" | "afternoon" | "evening" | "dinner" } | null>(null);
  const [editValue, setEditValue] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_HEAD" || user?.role === "NUTRITION_OFFICER" || user?.role === "KITCHEN_STAFF";
  const isPrincipalOrAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_HEAD";
  const isSchool = !user?.school || user.school.type === "SCHOOL";

  // Day-level exclusion state
  const [dayForHolidayPrompt, setDayForHolidayPrompt] = useState<string | null>(null);

  const getCellClassName = (val: string) => {
    if (val === "Holiday (Closed)") {
      return "text-red-505 italic bg-red-50 px-2 py-0.5 rounded border border-red-100/60";
    }
    if (val === "Pls arrange your own food") {
      return "text-amber-600 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-100/60";
    }
    return "text-slate-700";
  };

  async function loadPlan() {
    setLoading(true);
    setMessage(null);

    if (isDemoMode) {
      // Load static demo schedule
      const stored = localStorage.getItem("demo_weekly_plan");
      if (stored) {
        setSchedule(JSON.parse(stored));
      } else {
        setSchedule(DEFAULT_SCHEDULE);
      }
      setAnalysis(MOCK_GEMINI_ANALYSIS);
      setStatus("READY_FOR_APPROVAL");
      setLoading(false);
    } else {
      // Call backend API
      try {
        const schoolId = user?.schoolId || "demo-school";
        const res = await fetch(`http://localhost:4000/ai/weekly-plan?schoolId=${schoolId}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (data.success && data.plan) {
          setStatus(data.plan.status);
          // Convert database days list to grid format
          const formatted: ScheduleItem[] = DEFAULT_SCHEDULE.map((defaultDay) => {
            const dbDay = data.plan.days.find((d: any) => d.dayOfWeek === defaultDay.day);
            if (dbDay && dbDay.menuItems && dbDay.menuItems.length >= 3) {
              return {
                day: defaultDay.day,
                morning: dbDay.menuItems[0] || "",
                afternoon: dbDay.menuItems[1] || "",
                evening: dbDay.menuItems[2] || "",
                dinner: dbDay.menuItems[3] || ""
              };
            }
            return defaultDay;
          });
          setSchedule(formatted);
          // Retrieve saved analysis context if any, or trigger audit
          setAnalysis(null);
        } else {
          setSchedule(DEFAULT_SCHEDULE);
          setAnalysis(null);
        }
      } catch (err) {
        console.error("Error loading weekly plan from database:", err);
        setMessage({ type: "error", text: "Could not fetch weekly plan from live database." });
      } finally {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadPlan();
  }, [isDemoMode]);

  const handleEditClick = (day: string, slot: "morning" | "afternoon" | "evening" | "dinner", currentValue: string) => {
    if (!canEdit) return;
    setEditingCell({ day, slot });
    setEditValue(
      currentValue === "Holiday (Closed)" || currentValue === "Pls arrange your own food" 
        ? "" 
        : currentValue
    );
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    setSchedule(prev => 
      prev.map(item => {
        if (item.day === editingCell.day) {
          return {
            ...item,
            [editingCell.slot]: editValue.trim()
          };
        }
        return item;
      })
    );
    setEditingCell(null);
    setEditValue("");
  };

  const handleToggleHoliday = (day: string, slot: "morning" | "afternoon" | "evening" | "dinner", currentValue: string) => {
    if (!canEdit) return;
    const nextValue = currentValue === "Holiday (Closed)" ? "" : "Holiday (Closed)";
    setSchedule(prev => 
      prev.map(item => {
        if (item.day === day) {
          return {
            ...item,
            [slot]: nextValue
          };
        }
        return item;
      })
    );
  };

  const handleDayMinusClick = (day: string) => {
    setDayForHolidayPrompt(day);
  };

  const handleApplyDayExclusion = (day: string, option: string) => {
    const currentItem = schedule.find(item => item.day === day);
    if (currentItem) {
      setHistory(prev => ({
        ...prev,
        [day]: { ...currentItem }
      }));
    }

    setSchedule(prev => 
      prev.map(item => {
        if (item.day === day) {
          return {
            ...item,
            morning: option,
            afternoon: option,
            evening: option,
            dinner: option
          };
        }
        return item;
      })
    );
    setDayForHolidayPrompt(null);
  };

  const handleUndoDayExclusion = (day: string) => {
    const previousItem = history[day];
    if (!previousItem) return;

    setSchedule(prev => 
      prev.map(item => {
        if (item.day === day) {
          return { ...previousItem };
        }
        return item;
      })
    );

    setHistory(prev => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  };

  const handleSavePlan = async () => {
    setIsSaving(true);
    setMessage(null);

    if (isDemoMode) {
      // Save locally to localStorage to simulate DB persistence
      localStorage.setItem("demo_weekly_plan", JSON.stringify(schedule));
      localStorage.setItem("demo_weekly_plan_status", status);
      setAnalysis(MOCK_GEMINI_ANALYSIS);
      setMessage({ type: "success", text: "Planner changes saved locally. Gemini nutrition analysis completed!" });
      setIsSaving(false);
    } else {
      // Post to Express API
      try {
        const schoolId = user?.schoolId || "demo-school";
        const res = await fetch("http://localhost:4000/ai/weekly-plan/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            schoolId,
            weekStartDate: new Date(),
            schedule,
            status
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setMessage({ type: "success", text: "Weekly planner saved to live database. AI evaluated the plan!" });
          if (data.analysis) {
            setAnalysis(data.analysis);
          }
        } else {
          setMessage({ type: "error", text: data.error || "Failed to save weekly planner." });
        }
      } catch (err) {
        console.error("Save planner request failed:", err);
        setMessage({ type: "error", text: "Network error saving planner to server." });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <AppShell title="Weekly AI Planner" subtitle="Audit and plan school meals">
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gov-green" />
          <p className="text-sm font-semibold text-slate-500">Querying weekly schedule...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Weekly AI Planner" subtitle="Configure daily menus, holiday closures, and verify nutrition gaps">
      <div className="space-y-6">
        
        {/* Alerts / Info bar */}
        {message && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-semibold ${
            message.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <CheckCircle2 className={message.type === "success" ? "text-green-600 shrink-0" : "text-red-600 shrink-0"} size={16} />
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          
          {/* Main Grid Card */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">7-Day Mid-Day Meal Schedule</h2>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Click the pencil icon to edit, or the minus icon to schedule holidays</p>
                </div>
                
                {/* Workflow Status Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Status:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!canEdit || isSaving}
                    className="rounded-xl border border-slate-200 bg-slate-55 py-1.5 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-gov-green focus:ring-1 focus:ring-gov-green/10"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="READY_FOR_APPROVAL">Ready for Approval</option>
                    <option value="APPROVED">Approved & Published</option>
                    {isPrincipalOrAdmin && <option value="HOLIDAY">Holiday (Closed)</option>}
                    {!isPrincipalOrAdmin && status === "HOLIDAY" && <option value="HOLIDAY">Holiday (Closed)</option>}
                  </select>
                </div>
              </div>

              {/* Grid Planner Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                    <tr className="border-b border-slate-200">
                      <th className="py-3.5 px-4 rounded-l-xl w-32">Day</th>
                      <th className="px-4">Morning (Breakfast)</th>
                      <th className="px-4">Afternoon (Lunch)</th>
                      <th className="px-4">Evening (Snack)</th>
                      <th className="px-4 rounded-r-xl">Dinner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedule.map((item) => (
                      <tr key={item.day} className="hover:bg-slate-50/40 transition">
                        <td className="py-4 px-4 font-bold text-slate-800">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{item.day}</span>
                            <div className="flex items-center gap-1.5">
                              {history[item.day] && (
                                <button
                                  onClick={() => handleUndoDayExclusion(item.day)}
                                  className="text-emerald-600 hover:text-emerald-850 hover:bg-emerald-50 rounded p-1 transition"
                                  title="Undo day exclusion and restore meals"
                                >
                                  <Undo2 size={13} />
                                </button>
                              )}
                              {(isPrincipalOrAdmin || user?.role === "KITCHEN_STAFF") && (
                                <button
                                  onClick={() => handleDayMinusClick(item.day)}
                                  className="text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded p-1 transition"
                                  title="Exclude all meals for this day"
                                >
                                  <MinusCircle size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Morning Meal Slot */}
                        <td className="px-4">
                          {editingCell?.day === item.day && editingCell?.slot === "morning" ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveCell()}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-gov-green"
                                placeholder="Meal description"
                                autoFocus
                              />
                              <button onClick={handleSaveCell} className="p-1 text-green-600 hover:bg-slate-100 rounded">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="p-1 text-red-650 hover:bg-slate-100 rounded">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="group flex items-center justify-between gap-2 max-w-[190px]">
                              <span className={`text-xs font-semibold ${getCellClassName(item.morning)}`}>
                                {item.morning || <span className="text-slate-400 italic">Not scheduled</span>}
                              </span>
                              {canEdit && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">
                                  <button
                                    onClick={() => handleEditClick(item.day, "morning", item.morning)}
                                    className="p-1 text-slate-400 hover:text-gov-green rounded"
                                    title="Edit meal"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleHoliday(item.day, "morning", item.morning)}
                                    className={`p-1 rounded ${
                                      item.morning === "Holiday (Closed)" ? "text-red-500 hover:text-red-750" : "text-slate-400 hover:text-red-500"
                                    }`}
                                    title={item.morning === "Holiday (Closed)" ? "Add Meal Slot" : "Mark Holiday / No Meal"}
                                  >
                                    <MinusCircle size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Afternoon Meal Slot */}
                        <td className="px-4">
                          {editingCell?.day === item.day && editingCell?.slot === "afternoon" ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveCell()}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-gov-green"
                                placeholder="Meal description"
                                autoFocus
                              />
                              <button onClick={handleSaveCell} className="p-1 text-green-600 hover:bg-slate-100 rounded">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="p-1 text-red-650 hover:bg-slate-100 rounded">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="group flex items-center justify-between gap-2 max-w-[190px]">
                              <span className={`text-xs font-semibold ${getCellClassName(item.afternoon)}`}>
                                {item.afternoon || <span className="text-slate-400 italic">Not scheduled</span>}
                              </span>
                              {canEdit && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">
                                  <button
                                    onClick={() => handleEditClick(item.day, "afternoon", item.afternoon)}
                                    className="p-1 text-slate-400 hover:text-gov-green rounded"
                                    title="Edit meal"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleHoliday(item.day, "afternoon", item.afternoon)}
                                    className={`p-1 rounded ${
                                      item.afternoon === "Holiday (Closed)" ? "text-red-500 hover:text-red-750" : "text-slate-400 hover:text-red-500"
                                    }`}
                                    title={item.afternoon === "Holiday (Closed)" ? "Add Meal Slot" : "Mark Holiday / No Meal"}
                                  >
                                    <MinusCircle size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Evening Meal Slot */}
                        <td className="px-4">
                          {editingCell?.day === item.day && editingCell?.slot === "evening" ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveCell()}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-gov-green"
                                placeholder="Meal description"
                                autoFocus
                              />
                              <button onClick={handleSaveCell} className="p-1 text-green-600 hover:bg-slate-100 rounded">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="p-1 text-red-650 hover:bg-slate-100 rounded">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="group flex items-center justify-between gap-2 max-w-[190px]">
                              <span className={`text-xs font-semibold ${getCellClassName(item.evening)}`}>
                                {item.evening || <span className="text-slate-400 italic">Not scheduled</span>}
                              </span>
                              {canEdit && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">
                                  <button
                                    onClick={() => handleEditClick(item.day, "evening", item.evening)}
                                    className="p-1 text-slate-400 hover:text-gov-green rounded"
                                    title="Edit meal"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleHoliday(item.day, "evening", item.evening)}
                                    className={`p-1 rounded ${
                                      item.evening === "Holiday (Closed)" ? "text-red-500 hover:text-red-750" : "text-slate-400 hover:text-red-500"
                                    }`}
                                    title={item.evening === "Holiday (Closed)" ? "Add Meal Slot" : "Mark Holiday / No Meal"}
                                  >
                                    <MinusCircle size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Dinner Meal Slot */}
                        <td className="px-4">
                          {editingCell?.day === item.day && editingCell?.slot === "dinner" ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveCell()}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-gov-green"
                                placeholder="Meal description"
                                autoFocus
                              />
                              <button onClick={handleSaveCell} className="p-1 text-green-600 hover:bg-slate-100 rounded">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingCell(null)} className="p-1 text-red-650 hover:bg-slate-100 rounded">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="group flex items-center justify-between gap-2 max-w-[190px]">
                              <span className={`text-xs font-semibold ${getCellClassName(item.dinner)}`}>
                                {item.dinner || <span className="text-slate-400 italic">Not scheduled</span>}
                              </span>
                              {canEdit && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">
                                  <button
                                    onClick={() => handleEditClick(item.day, "dinner", item.dinner)}
                                    className="p-1 text-slate-400 hover:text-gov-green rounded"
                                    title="Edit meal"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleHoliday(item.day, "dinner", item.dinner)}
                                    className={`p-1 rounded ${
                                      item.dinner === "Holiday (Closed)" ? "text-red-500 hover:text-red-750" : "text-slate-400 hover:text-red-500"
                                    }`}
                                    title={item.dinner === "Holiday (Closed)" ? "Add Meal Slot" : "Mark Holiday / No Meal"}
                                  >
                                    <MinusCircle size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Save Button */}
              {canEdit && (
                <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                  <button
                    onClick={handleSavePlan}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-gov-green px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition active:scale-[0.98]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving & Auditing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Save & Analyze Nutrition</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>

            {/* AI NUTRITION ANALYSIS SUMMARY CARD */}
            {analysis && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="text-gov-green" size={18} />
                  <h3 className="text-sm font-extrabold text-slate-800">Gemini 2.5 Nutrition Insights & Snack Suggestions</h3>
                </div>

                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {analysis.overallAnalysis}
                </p>

                {/* Warnings list */}
                {analysis.warnings && analysis.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle size={15} />
                      Identified Nutrient Deficiencies
                    </h4>
                    <ul className="list-disc pl-5 text-[11px] text-amber-900 font-medium space-y-1.5 leading-normal">
                      {analysis.warnings.map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations timeline */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">Recommended Snack & Day Adjustments</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {analysis.suggestions.map((s: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                          <div>
                            <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200/50 px-2 py-0.5 text-[9px] font-extrabold text-gov-green uppercase tracking-wider">
                              {s.day} • {s.mealTime}
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-2">{s.foodSuggestion}</p>
                            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-normal">{s.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Rules panel */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Mid-Day Meal Guidelines</h3>
              <ul className="mt-4 space-y-3 text-xs text-slate-600 font-semibold leading-relaxed">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-gov-green mt-1.5 shrink-0" />
                  <span>Must satisfy average of 450 calories and 12g protein per primary student daily.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-gov-green mt-1.5 shrink-0" />
                  <span>Stay under the daily budget restriction of ₹15 per student.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-gov-green mt-1.5 shrink-0" />
                  <span>Holidays must be toggled (minus icon) so all portal users are informed of school kitchen status.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-gov-green mt-1.5 shrink-0" />
                  <span>Snacks/Evenings represent optimal spots to add supplements (sprouts, eggs, chiki).</span>
                </li>
              </ul>
            </section>
            
            {isSchool && (
              <section className="rounded-2xl border border-slate-200 bg-amber-50/50 p-5 shadow-sm text-xs border-amber-200/50">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="text-amber-600 shrink-0" size={16} />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-amber-900">Workflow Approval Policy</h4>
                    <p className="text-amber-800 font-semibold leading-normal">
                      Plans must be analyzed and set as "Ready for Approval" by the chef/kitchen staff before the District Nutrition Officer can finalize published versions.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </aside>
          
        </div>
      </div>
      {/* Day Exclusion Modal */}
      {dayForHolidayPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm border-b border-slate-100 pb-3">
              <MinusCircle className="text-red-505" size={18} />
              <span>Exclude Meals for {dayForHolidayPrompt}</span>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Choose how to mark the entire schedule for <span className="font-extrabold text-slate-800">{dayForHolidayPrompt}</span>:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleApplyDayExclusion(dayForHolidayPrompt, "Holiday (Closed)")}
                className="w-full rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 text-left transition flex items-center justify-between"
              >
                <span>Holiday (Closed)</span>
                <span className="text-[10px] text-red-500 uppercase tracking-wider font-extrabold bg-red-100/50 px-1.5 py-0.5 rounded">All Slots</span>
              </button>
              <button
                onClick={() => handleApplyDayExclusion(dayForHolidayPrompt, "Pls arrange your own food")}
                className="w-full rounded-xl border border-amber-250 bg-amber-50/50 hover:bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 text-left transition flex items-center justify-between"
              >
                <span>Pls arrange your own food</span>
                <span className="text-[10px] text-amber-500 uppercase tracking-wider font-extrabold bg-amber-100/50 px-1.5 py-0.5 rounded">All Slots</span>
              </button>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setDayForHolidayPrompt(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
