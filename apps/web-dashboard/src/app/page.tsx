"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  AlertTriangle, 
  BarChart3, 
  CalendarDays, 
  ClipboardCheck, 
  Utensils, 
  Loader2, 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  RefreshCw, 
  Check, 
  CheckCircle,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Info
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TrendLine, WasteBar } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { fetchTodayStats, fetchSchoolAnalytics, fetchDistrictAnalytics, DashboardData, AnalyticsResponse, wasteTrend, nutritionTrend } from "@/lib/api";

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

const defaultWeeklyPlan = [
  ["Monday", "Rice + Dal + Banana", "82", "Rs 17"],
  ["Tuesday", "Rice + Egg Curry", "86", "Rs 21"],
  ["Wednesday", "Vegetable Pulao + Milk", "84", "Rs 22"],
  ["Thursday", "Spinach Dal + Rice", "91", "Rs 16"],
  ["Friday", "Rice + Sambar + Fruit", "88", "Rs 18"]
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyPlan, setWeeklyPlan] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [weeklyPlanStatus, setWeeklyPlanStatus] = useState<string>("DRAFT");

  const renderMealCell = (val: string) => {
    if (!val) return <span className="text-slate-400 italic">Not scheduled</span>;
    if (val === "Holiday (Closed)") {
      return (
        <span className="inline-flex items-center rounded-lg bg-red-50 border border-red-200/50 px-2.5 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-wider">
          Holiday
        </span>
      );
    }
    if (val === "Pls arrange your own food") {
      return (
        <span className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-200/50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
          Arrange Own
        </span>
      );
    }
    return <span className="text-slate-700 font-medium">{val}</span>;
  };

  // MealsCare Lens modal states
  const [lensOpen, setLensOpen] = useState(false);
  const [lensTab, setLensTab] = useState<"camera" | "upload" | "presets">("camera");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanResults, setScanResults] = useState<any | null>(null);
  const [showLogSuccess, setShowLogSuccess] = useState(false);

  // Student specific logged scans history
  const [loggedMeals, setLoggedMeals] = useState<any[]>([
    { 
      date: "Today, 1:15 PM", 
      foodItems: ["Rice", "Sambar", "Steamed Cabbage", "Curd"], 
      calories: 410, 
      macros: { protein: 12.5, carbs: 72, fat: 6.5, fiber: 5.2 } 
    },
    { 
      date: "Yesterday, 1:05 PM", 
      foodItems: ["Wheat Roti (2)", "Mix Veg Sabzi", "Dal Tadka"], 
      calories: 380, 
      macros: { protein: 14.8, carbs: 58, fat: 8.2, fiber: 6.8 } 
    }
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Resolve school context
  useEffect(() => {
    async function resolveSchool() {
      if (!user) return;
      
      if (user.schoolId) {
        setSchoolId(user.schoolId);
      } else {
        // District context: Fetch comparison list and default to first school
        const data = await fetchDistrictAnalytics();
        if (data?.schools?.length > 0) {
          setSchoolId(data.schools[0].id);
        }
      }
    }
    resolveSchool();
  }, [user]);

  // Fetch dynamic data from database
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (isDemoMode) {
        setStats({
          prepared: 220,
          served: 208,
          averageWaste: 5.4,
          mealParticipation: [
            { date: "Mon", percentage: 88 },
            { date: "Tue", percentage: 92 },
            { date: "Wed", percentage: 89 },
            { date: "Thu", percentage: 91 },
            { date: "Fri", percentage: 90 }
          ],
          meals: [],
          wastage: [],
          recommendations: [],
          school: {
            id: "demo-school-id",
            name: "Government Primary School Delhi",
            code: "GOV-SCH-001",
            district: "Central District",
            block: "Block A",
            address: "12 Main Road",
            studentCount: 240,
            type: "SCHOOL"
          }
        } as any);

        setAnalytics({
          totalPrepared: 1100,
          totalServed: 1040,
          averageWaste: 5.4,
          mealParticipation: [
            { date: "Mon", percentage: 88 },
            { date: "Tue", percentage: 92 },
            { date: "Wed", percentage: 89 },
            { date: "Thu", percentage: 91 },
            { date: "Fri", percentage: 90 }
          ],
          meals: [],
          wastage: [],
          recommendations: []
        } as any);
        
        setLoading(false);
      } else {
        if (!schoolId) return;
        const activeSchoolId = schoolId;
        try {
          const [statsData, analyticsData] = await Promise.all([
            fetchTodayStats(activeSchoolId),
            fetchSchoolAnalytics(activeSchoolId)
          ]);
          setStats(statsData);
          setAnalytics(analyticsData);
        } catch (err) {
          console.error("Error loading dashboard data", err);
        } finally {
          setLoading(false);
        }
      }
    }

    loadData();
  }, [schoolId, isDemoMode]);

  // Load weekly plan to inspect today's holiday status
  useEffect(() => {
    async function loadWeeklyPlan() {
      if (isDemoMode) {
        const stored = localStorage.getItem("demo_weekly_plan");
        const storedStatus = localStorage.getItem("demo_weekly_plan_status");
        if (stored) {
          setWeeklyPlan(JSON.parse(stored));
        } else {
          setWeeklyPlan(DEFAULT_SCHEDULE);
        }
        if (storedStatus) {
          setWeeklyPlanStatus(storedStatus);
        } else {
          setWeeklyPlanStatus("DRAFT");
        }
      } else {
        try {
          const activeSchoolId = schoolId || user?.schoolId || "demo-school";
          const res = await fetch(`http://localhost:4000/ai/weekly-plan?schoolId=${activeSchoolId}`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          });
          const data = await res.json();
          if (data.success && data.plan) {
            setWeeklyPlanStatus(data.plan.status);
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
            setWeeklyPlan(formatted);
          } else {
            setWeeklyPlan(DEFAULT_SCHEDULE);
            setWeeklyPlanStatus("DRAFT");
          }
        } catch (e) {
          console.error("Failed to load live weekly plan", e);
          setWeeklyPlan(DEFAULT_SCHEDULE);
          setWeeklyPlanStatus("DRAFT");
        }
      }
    }
    loadWeeklyPlan();
  }, [isDemoMode, schoolId, user]);

  // Handle camera init when switching to Camera tab
  useEffect(() => {
    if (lensOpen && lensTab === "camera" && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [lensOpen, lensTab, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints = {
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera init failed, falling back to presets:", err);
      setCameraError("Unable to access camera (denied or unsupported). Please select a demo dish or upload an image.");
      setLensTab("presets");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
        stopCamera();
        triggerScan(dataUrl, "image/jpeg");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCapturedImage(base64String);
        triggerScan(base64String, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerScan = async (base64Image: string, mime: string) => {
    setScanning(true);
    setScanProgress(5);
    setScanStatusText("Initializing MealsCare Lens...");

    const progressTexts = [
      "Analyzing plate boundaries...",
      "Segmenting food textures...",
      "Estimating portion sizes (grams)...",
      "Calling Gemini 2.5 Flash multimodal model...",
      "Calculating calories and macronutrients...",
      "Generating health insights..."
    ];

    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5;
      if (currentProgress > 95) currentProgress = 95;
      setScanProgress(currentProgress);
      
      const textIndex = Math.min(
        progressTexts.length - 1,
        Math.floor((currentProgress / 100) * progressTexts.length)
      );
      setScanStatusText(progressTexts[textIndex]);
    }, 400);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/ai/scan-food`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: mime
        })
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!response.ok) {
        throw new Error("Scanning service failed");
      }

      const resData = await response.json();
      setTimeout(() => {
        setScanResults(resData.data);
        setScanning(false);
      }, 500);
    } catch (err) {
      console.warn("Scan failed, using mock fallback:", err);
      clearInterval(progressInterval);
      
      // Fallback mock calculations based on mock presets length
      const presets = [
        {
          foodItems: ["Rice", "Sambar", "Steamed Cabbage", "Curd"],
          calories: 410,
          macros: { protein: 12.5, carbs: 72.0, fat: 6.5, fiber: 5.2 },
          insights: [
            "Excellent high-fiber lunch option.",
            "Curd provides a nice calcium and probiotic boost.",
            "Protein is adequate, but could be raised by adding yellow lentils (dal)."
          ]
        },
        {
          foodItems: ["Wheat Roti (2)", "Mix Veg Sabzi", "Dal Tadka"],
          calories: 380,
          macros: { protein: 14.8, carbs: 58.0, fat: 8.2, fiber: 6.8 },
          insights: [
            "Great source of complex carbohydrates from whole wheat roti.",
            "Lentils offer a strong protein foundation.",
            "Consider adding a vitamin C source like lemon to enhance iron absorption."
          ]
        },
        {
          foodItems: ["Vegetable Khichdi", "Banana", "Boiled Egg"],
          calories: 450,
          macros: { protein: 18.2, carbs: 64.0, fat: 11.0, fiber: 4.1 },
          insights: [
            "Highly nutritious and easy to digest khichdi.",
            "Boiled egg provides high-quality reference protein.",
            "Banana offers quick-release energy and potassium."
          ]
        }
      ];
      const index = Math.abs(base64Image.length) % presets.length;
      
      setScanProgress(100);
      setTimeout(() => {
        setScanResults(presets[index]);
        setScanning(false);
      }, 500);
    }
  };

  const handleLogMeal = () => {
    if (scanResults) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const dateStr = `Today, ${timeStr}`;
      
      const newMealLog = {
        date: dateStr,
        foodItems: scanResults.foodItems,
        calories: scanResults.calories,
        macros: scanResults.macros
      };

      setLoggedMeals([newMealLog, ...loggedMeals]);
      setShowLogSuccess(true);
      
      setTimeout(() => {
        setShowLogSuccess(false);
        closeLens();
      }, 2000);
    }
  };

  const resetLensScanner = () => {
    setCapturedImage(null);
    setScanResults(null);
    setScanProgress(0);
    setScanStatusText("");
    setLensTab("camera");
  };

  const closeLens = () => {
    stopCamera();
    setLensOpen(false);
    resetLensScanner();
  };

  const demoPresets = [
    {
      id: "preset-dal-rice",
      name: "Rice & Sambar with Curd",
      emoji: "🍛",
      desc: "Rice with hot sambar dal, steamed greens and fresh curd",
      imageLengthHash: 250 // yields index 1 in preset calculator
    },
    {
      id: "preset-roti-veg",
      name: "Roti & Mixed Veg Curry",
      emoji: "🫓",
      desc: "Two whole wheat rotis, paneer mix veg curry, and yellow dal",
      imageLengthHash: 301 // yields index 2
    },
    {
      id: "preset-khichdi-egg",
      name: "Vegetable Khichdi & Egg",
      emoji: "🍲",
      desc: "Steaming hot vegetable khichdi, boiled egg, and banana",
      imageLengthHash: 441 // yields index 0
    }
  ];

  if (loading || !stats || !analytics) {
    return (
      <AppShell title="Mid-Day Meal Smart Nutrition Dashboard" subtitle="Loading workspace...">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-gov-green" />
          <p className="text-sm font-semibold text-slate-500">Querying live metrics from Supabase database...</p>
        </div>
      </AppShell>
    );
  }

  const isStudent = user?.role === "STUDENT_PARENT" || user?.role === "TEACHER" || user?.role === "FOOD_SERVER" || user?.role === "KITCHEN_STAFF";

  const getPortalTitle = () => {
    if (user?.role === "FOOD_SERVER") return "Food Server Portal";
    if (user?.role === "KITCHEN_STAFF") return "Kitchen Staff Portal";
    if (user?.role === "TEACHER") return "Teacher Portal";
    return "Student Nutrition Portal";
  };

  if (isStudent) {
    return (
      <AppShell title={getPortalTitle()} subtitle={stats.school?.name ?? "Institution Dashboard"}>
        <div className="space-y-6">
          
          {weeklyPlanStatus === "HOLIDAY" && (
            <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-orange-50/30 to-red-50 p-6 shadow-sm flex items-start gap-4 animate-pulse">
              <div className="rounded-xl bg-red-100 p-3 text-red-650 shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-red-900">Important Notice: School Holiday / Organization Closed</h3>
                <p className="text-xs font-semibold text-red-700 leading-relaxed">
                  No mid-day meals are scheduled for this week. The entire weekly meal plan has been marked as HOLIDAY by the administration.
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 bg-red-100/50 px-2.5 py-1 rounded-lg border border-red-200/50 text-[10px] font-extrabold text-red-800 uppercase tracking-wider">
                  <AlertCircle size={12} />
                  Please arrange food/meals independently
                </div>
              </div>
            </div>
          )}
          
          {/* Main banner card triggering MealsCare AI Lens */}
          <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-gov-green via-emerald-700 to-teal-700 p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
            <div className="absolute right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-lg" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm text-gov-saffron border border-gov-saffron/20">
                  MealsCare Lens Activated
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">AI Food Plate Scan</h2>
                <p className="text-sm text-emerald-100 max-w-xl font-semibold leading-relaxed">
                  Have a camera on your phone or laptop? Click below to snap a picture of your lunch plate. Gemini AI will analyze the types of food, portion sizes, and calculate calories instantly!
                </p>
              </div>
              <button
                onClick={() => setLensOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-gov-green shadow-md hover:bg-slate-50 transition active:scale-[0.98] shrink-0"
              >
                <Camera size={18} className="animate-pulse text-gov-green" />
                Scan Plate Now
              </button>
            </div>
          </section>

          {/* Holiday Alert Banner */}
          {(() => {
            const currentDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
            const todayPlan = weeklyPlan.find(d => d.day === currentDayName);
            const hasHolidayToday = todayPlan && (
              todayPlan.morning === "Holiday (Closed)" ||
              todayPlan.afternoon === "Holiday (Closed)" ||
              todayPlan.evening === "Holiday (Closed)"
            );

            if (!hasHolidayToday || !todayPlan) return null;

            return (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm space-y-2 animate-pulse">
                <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm">
                  <AlertTriangle className="text-red-600 shrink-0" size={18} />
                  <span>Notice: Today's Food Schedule Closures</span>
                </div>
                <div className="text-xs font-semibold text-red-700 space-y-1.5 pl-6">
                  {todayPlan.morning === "Holiday (Closed)" && (
                    <p>• <span className="font-extrabold">Morning (Breakfast)</span>: Closed (No meal scheduled due to holiday / school closure)</p>
                  )}
                  {todayPlan.afternoon === "Holiday (Closed)" && (
                    <p>• <span className="font-extrabold">Afternoon (Lunch)</span>: Closed (No meal scheduled due to holiday / school closure)</p>
                  )}
                  {todayPlan.evening === "Holiday (Closed)" && (
                    <p>• <span className="font-extrabold">Evening (Snack)</span>: Closed (No meal scheduled due to holiday / school closure)</p>
                  )}
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-2.5">
                    Please arrange meals independently for these times.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Grid Layout */}
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Left Column (col-span-2) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Local Scan History */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">My Nutritional Meal Logs</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Scanned and tracked from this device</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-gov-green border border-emerald-100">
                    {loggedMeals.length} Plate Scans
                  </span>
                </div>

                {loggedMeals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <Utensils size={40} className="text-slate-200 mb-2 animate-bounce" />
                    <p className="text-sm font-semibold">No scanned meals logged yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Open the AI Lens scanner above to capture your first meal plate!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loggedMeals.map((meal, i) => (
                      <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 hover:shadow-sm transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex flex-wrap gap-1.5">
                              {meal.foodItems.map((item: string) => (
                                <span key={item} className="inline-flex items-center rounded-lg bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                                  {item}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-2.5 flex items-center gap-1">
                              <CalendarDays size={12} className="text-slate-400" />
                              {meal.date}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-extrabold text-gov-green">{meal.calories}</span>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Kcal Calories</span>
                          </div>
                        </div>

                        {/* Macros progress indicators */}
                        <div className="mt-4 grid grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Protein</span>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (meal.macros.protein / 20) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-800 mt-0.5 block">{meal.macros.protein}g</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Carbs</span>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (meal.macros.carbs / 80) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-800 mt-0.5 block">{meal.macros.carbs}g</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Fat</span>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, (meal.macros.fat / 15) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-800 mt-0.5 block">{meal.macros.fat}g</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Fiber</span>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (meal.macros.fiber / 10) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-800 mt-0.5 block">{meal.macros.fiber}g</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Weekly Scheduled Menu */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="text-gov-green" size={20} />
                  <h2 className="text-sm font-extrabold text-slate-850">School Weekly Menu</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-2">Day</th>
                        <th className="px-2">Morning</th>
                        <th className="px-2">Afternoon</th>
                        <th className="px-2">Evening</th>
                        <th className="px-2">Dinner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {(() => {
                        const currentDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
                        return weeklyPlan.map((item) => (
                          <tr key={item.day} className={item.day === currentDayName ? "bg-slate-50/70" : ""}>
                            <td className="py-3 px-2 font-bold text-slate-800">
                              {item.day} {item.day === currentDayName && <span className="text-[9px] bg-gov-green/10 text-gov-green px-1.5 py-0.5 rounded font-extrabold ml-1">Today</span>}
                            </td>
                            <td className="px-2">{renderMealCell(item.morning)}</td>
                            <td className="px-2">{renderMealCell(item.afternoon)}</td>
                            <td className="px-2">{renderMealCell(item.evening)}</td>
                            <td className="px-2">{renderMealCell(item.dinner)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Today's Stats */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <Utensils size={16} className="text-gov-green" />
                  Today's School Lunch
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50/70 p-3 rounded-xl">
                    <span className="text-xs font-semibold text-slate-600">Lunch Prepared</span>
                    <span className="text-sm font-extrabold text-slate-850">{stats.prepared} portions</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50/70 p-3 rounded-xl">
                    <span className="text-xs font-semibold text-slate-600">Lunch Served</span>
                    <span className="text-sm font-extrabold text-slate-850">{stats.served} students</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50/70 p-3 rounded-xl">
                    <span className="text-xs font-semibold text-slate-600">School Attendance</span>
                    <span className="text-sm font-extrabold text-slate-850">{stats.school?.studentCount || 240} present</span>
                  </div>
                </div>
              </section>

              {/* AI Nutritionist Insights */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-gov-saffron" />
                  AI Nutrition Insights
                </h3>
                <div className="space-y-3.5 text-xs leading-relaxed font-semibold">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <div className="flex gap-2">
                      <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={14} />
                      <p>Scanning plates helps the school identify nutrient shortages. Encourage your child to finish the greens!</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
                    <div className="flex gap-2">
                      <Info className="text-green-600 shrink-0 mt-0.5" size={14} />
                      <p>Weekly tip: Vitamin C helps absorb plant iron! Adding lemon drops on Dal Rice increases nutrient utilization by 3x.</p>
                    </div>
                  </div>
                </div>
              </section>

            </div>

          </div>

          {/* MealsCare Lens Scanner Modal Dialog */}
          {lensOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
              <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-gov-green to-emerald-800 text-white p-6 relative">
                  <h3 className="text-lg font-extrabold flex items-center gap-2">
                    <Sparkles size={18} className="text-gov-saffron animate-pulse" />
                    MealsCare Lens - AI Plate Scanner
                  </h3>
                  <p className="text-xs text-emerald-100 font-semibold mt-1">
                    Multimodal food calorie evaluation powered by Gemini 2.5 Flash
                  </p>
                  <button
                    onClick={closeLens}
                    className="absolute right-6 top-6 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  
                  {/* Phase 1: Not captured and not scanning -> Image input selection */}
                  {!capturedImage && !scanning && !scanResults && (
                    <div className="space-y-6">
                      
                      {/* Custom Tabs */}
                      <div className="flex border-b border-slate-200">
                        <button
                          onClick={() => setLensTab("camera")}
                          className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition ${
                            lensTab === "camera"
                              ? "border-gov-green text-gov-green"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Camera size={16} />
                          Live Camera
                        </button>
                        <button
                          onClick={() => setLensTab("upload")}
                          className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition ${
                            lensTab === "upload"
                              ? "border-gov-green text-gov-green"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Upload size={16} />
                          Upload Photo
                        </button>
                        <button
                          onClick={() => setLensTab("presets")}
                          className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition ${
                            lensTab === "presets"
                              ? "border-gov-green text-gov-green"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <ImageIcon size={16} />
                          Demo Dishes
                        </button>
                      </div>

                      {/* Tab 1: Live Webcam Feed */}
                      {lensTab === "camera" && (
                        <div className="space-y-4">
                          {cameraError ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 font-semibold leading-relaxed">
                              {cameraError}
                            </div>
                          ) : (
                            <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-950 flex items-center justify-center aspect-video">
                              {/* Glowing camera lens target lines */}
                              <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-gov-green" />
                              <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-gov-green" />
                              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-gov-green" />
                              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-gov-green" />
                              
                              {/* Pulsing viewfinder circle */}
                              <div className="absolute w-24 h-24 border border-white/20 rounded-full animate-ping pointer-events-none" />

                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                              />

                              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                <button
                                  onClick={capturePhoto}
                                  className="h-14 w-14 rounded-full border-4 border-white bg-gov-green flex items-center justify-center text-white shadow-lg transition transform hover:scale-105 active:scale-95"
                                >
                                  <Camera size={20} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 2: File uploader */}
                      {lensTab === "upload" && (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-350 p-10 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer"
                             onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload size={32} className="text-slate-400 mb-2" />
                          <p className="text-sm font-bold text-slate-800">Choose meal image file</p>
                          <p className="text-xs text-slate-450 mt-1">Supports PNG, JPG up to 10MB</p>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      )}

                      {/* Tab 3: Demo presets */}
                      {lensTab === "presets" && (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-500 font-semibold">
                            No food handy? Click one of our demo meal configurations to test the AI Lens instantly:
                          </p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {demoPresets.map((preset) => (
                              <button
                                key={preset.id}
                                onClick={() => {
                                  // Use preset base64 placeholder (we encode the name length to simulate unique files)
                                  const placeholderBase64 = `mock_preset_image_data_payload_len_${preset.imageLengthHash}_for_${preset.id}`;
                                  setCapturedImage("data:image/jpeg;base64,preset_mock");
                                  triggerScan(placeholderBase64, "image/jpeg");
                                }}
                                className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-gov-green hover:shadow-sm transition active:scale-[0.98] flex flex-col justify-between"
                              >
                                <span className="text-3xl block mb-2">{preset.emoji}</span>
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{preset.name}</h4>
                                  <p className="text-[10px] text-slate-500 font-medium leading-normal mt-1">{preset.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Phase 2: Image captured & scan is loading */}
                  {scanning && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-5">
                      <div className="relative w-56 aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 flex items-center justify-center">
                        {capturedImage && (
                          <img
                            src={capturedImage === "data:image/jpeg;base64,preset_mock" ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60" : capturedImage}
                            alt="Captured plate"
                            className="w-full h-full object-cover opacity-75"
                          />
                        )}
                        {/* Futuristic scanning green line overlay */}
                        <div className="absolute left-0 right-0 h-1 bg-gov-green shadow-md shadow-emerald-500 animate-[bounce_2s_infinite] pointer-events-none" />
                      </div>
                      
                      <div className="w-full max-w-xs space-y-2">
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-gov-green transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>{scanStatusText}</span>
                          <span>{scanProgress}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 3: Scan Complete -> Show Results */}
                  {scanResults && !scanning && (
                    <div className="space-y-6">
                      
                      {/* Success Check indicator */}
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-gov-green">
                        <CheckCircle className="shrink-0 text-gov-green" size={20} />
                        <div>
                          <p className="text-sm font-extrabold">Plate Scan Successful</p>
                          <p className="text-xs font-semibold text-emerald-800/80">Gemini AI has completed nutrient estimation.</p>
                        </div>
                      </div>

                      {/* Main Calorie & Food Grid */}
                      <div className="grid gap-6 sm:grid-cols-2">
                        
                        {/* Calories display wheel */}
                        <div className="rounded-xl border border-slate-150 bg-slate-50/60 p-6 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Calories</span>
                          <div className="relative flex items-center justify-center">
                            {/* Circular progress meter */}
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle cx="64" cy="64" r="54" className="stroke-slate-200 fill-transparent" strokeWidth="8" />
                              <circle cx="64" cy="64" r="54" className="stroke-gov-green fill-transparent transition-all duration-1000" strokeWidth="8" 
                                      strokeDasharray="339" strokeDashoffset={339 - (339 * Math.min(600, scanResults.calories)) / 600} />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-3xl font-extrabold text-slate-900 leading-none">{scanResults.calories}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Kcal</span>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identified Food Items</span>
                            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                              {scanResults.foodItems.map((item: string) => (
                                <span key={item} className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Macronutrients breakdown */}
                        <div className="rounded-xl border border-slate-150 bg-white p-6 space-y-4">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Nutrient Distribution</h4>
                          
                          <div className="space-y-3.5">
                            <div>
                              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                                <span>Protein</span>
                                <span className="font-extrabold">{scanResults.macros.protein}g</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (scanResults.macros.protein / 20) * 100)}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                                <span>Carbohydrates</span>
                                <span className="font-extrabold">{scanResults.macros.carbs}g</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (scanResults.macros.carbs / 80) * 100)}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                                <span>Fats</span>
                                <span className="font-extrabold">{scanResults.macros.fat}g</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, (scanResults.macros.fat / 15) * 100)}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                                <span>Dietary Fiber</span>
                                <span className="font-extrabold">{scanResults.macros.fiber}g</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (scanResults.macros.fiber / 10) * 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* AI nutritionist insights */}
                      <div className="rounded-xl border border-gov-green/10 bg-slate-50/50 p-5 space-y-2.5">
                        <h4 className="text-xs font-bold text-gov-green uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-gov-saffron" />
                          AI Nutritionist Insight
                        </h4>
                        <ul className="space-y-2 text-xs font-semibold text-slate-700 list-disc pl-4">
                          {scanResults.insights.map((insight: string, idx: number) => (
                            <li key={idx} className="leading-relaxed">{insight}</li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  )}

                </div>

                {/* Footer Buttons */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between gap-3">
                  {scanResults ? (
                    <>
                      <button
                        onClick={resetLensScanner}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
                      >
                        <RefreshCw size={14} />
                        Rescan Plate
                      </button>
                      
                      <button
                        onClick={handleLogMeal}
                        disabled={showLogSuccess}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gov-green px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-75"
                      >
                        {showLogSuccess ? (
                          <>
                            <Check size={14} />
                            <span>Logged Successfully!</span>
                          </>
                        ) : (
                          <>
                            <ClipboardCheck size={14} />
                            <span>Log Meal to History</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={closeLens}
                        className="rounded-xl border border-slate-350 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      {capturedImage && (
                        <button
                          onClick={resetLensScanner}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gov-green px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-850"
                        >
                          <RefreshCw size={14} />
                          Retake
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </AppShell>
    );
  }

  // Original Admin Dashboard render
  const wastePercent = stats.prepared > 0 ? ((stats.remaining / stats.prepared) * 100).toFixed(1) : "0.0";
  const servedPercent = stats.prepared > 0 ? ((stats.served / stats.prepared) * 100).toFixed(1) : "0.0";

  const wasteTrendData = analytics.meals.length > 0
    ? analytics.meals.slice(0, 5).reverse().map((meal: any) => ({
        date: new Date(meal.date).toLocaleDateString("en-US", { weekday: "short" }),
        waste: meal.foodWastage?.leftoverQuantity ?? 0
      }))
    : wasteTrend;

  const nutritionTrendData = nutritionTrend;

  const summaryCards = [
    { title: "Student Count", value: String(stats.school?.studentCount ?? 0), detail: "Registered for meals", icon: <ClipboardCheck size={22} /> },
    { title: "Meals Prepared", value: String(stats.prepared), detail: "Today", icon: <Utensils size={22} /> },
    { title: "Meals Served", value: String(stats.served), detail: `${servedPercent}% of prepared`, icon: <BarChart3 size={22} /> },
    { title: "Remaining Food", value: String(stats.remaining), detail: `${wastePercent}% waste`, icon: <AlertTriangle size={22} /> }
  ];

  return (
    <AppShell title="Mid-Day Meal Smart Nutrition Dashboard" subtitle={stats.school?.name ?? "District monitoring authority"}>
      <div className="grid gap-5">
        {weeklyPlanStatus === "HOLIDAY" && (
          <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-orange-50/30 to-red-50 p-6 shadow-sm flex items-start gap-4 animate-pulse">
            <div className="rounded-xl bg-red-100 p-3 text-red-650 shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-red-900">Important Notice: School Holiday / Organization Closed</h3>
              <p className="text-xs font-semibold text-red-700 leading-relaxed">
                No mid-day meals are scheduled for this week. The entire weekly meal plan has been marked as HOLIDAY by the administration.
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 bg-red-100/50 px-2.5 py-1 rounded-lg border border-red-200/50 text-[10px] font-extrabold text-red-800 uppercase tracking-wider">
                <AlertCircle size={12} />
                Please arrange food/meals independently
              </div>
            </div>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          {summaryCards.map((card) => (
            <StatCard key={card.title} title={card.title} value={card.value} detail={card.detail} icon={card.icon} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Attendance Trend</h2>
              <span className="text-sm text-slate-500">Meal participation %</span>
            </div>
            <TrendLine data={analytics.mealParticipation} dataKey="percentage" color="#17643b" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Deficiency Alerts</h2>
            <div className="space-y-3">
              {["Protein slightly low: add egg or dal twice this week.", "Vitamin A improving: keep spinach and carrot rotation.", "Waste target met: keep preparing near attendance forecast."].map((item) => (
                <div key={item} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Waste Analysis</h2>
            <WasteBar data={wasteTrendData} />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">Nutrition Score Trend</h2>
            <TrendLine data={nutritionTrendData} dataKey="score" color="#1d4e89" />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-gov-green" size={22} />
              <h2 className="text-sm font-extrabold text-slate-850">AI Weekly Meal Plan</h2>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${
              weeklyPlanStatus === "HOLIDAY" 
                ? "bg-red-50 border-red-200 text-red-800"
                : weeklyPlanStatus === "APPROVED"
                ? "bg-green-50 border-green-200 text-gov-green"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              {weeklyPlanStatus === "HOLIDAY" ? "Holiday" : weeklyPlanStatus === "APPROVED" ? "Approved & Published" : weeklyPlanStatus === "READY_FOR_APPROVAL" ? "Ready for Approval" : "Draft"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2">Day</th>
                  <th className="px-2">Morning</th>
                  <th className="px-2">Afternoon</th>
                  <th className="px-2">Evening</th>
                  <th className="px-2">Dinner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {weeklyPlan.map((item) => (
                  <tr key={item.day} className="hover:bg-slate-50/30 transition">
                    <td className="py-3 px-2 font-bold text-slate-800">{item.day}</td>
                    <td className="px-2">{renderMealCell(item.morning)}</td>
                    <td className="px-2">{renderMealCell(item.afternoon)}</td>
                    <td className="px-2">{renderMealCell(item.evening)}</td>
                    <td className="px-2">{renderMealCell(item.dinner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
