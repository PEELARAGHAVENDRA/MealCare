"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  MapPinned,
  Sparkles,
  LogOut,
  User,
  GraduationCap,
  Menu,
  X,
  Settings,
  Camera,
  Calendar,
  Award,
  Mail,
  Building2
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3, roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD", "KITCHEN_STAFF", "TEACHER", "STUDENT_PARENT", "FOOD_SERVER"] },
  { href: "/evidence", label: "Meal Evidence", icon: Camera, roles: ["SUPER_ADMIN", "SCHOOL_HEAD", "KITCHEN_STAFF", "FOOD_SERVER"] },
  { href: "/calendar", label: "Meal Calendar", icon: Calendar, roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD", "KITCHEN_STAFF", "TEACHER", "STUDENT_PARENT", "FOOD_SERVER"] },
  { href: "/compliance", label: "Compliance Center", icon: Award, roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD"] },
  { href: "/communication", label: "Communication Center", icon: Mail, roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"] },
  { href: "/schools-monitoring", label: "Schools Directory", icon: Building2, roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"] },
  { href: "/meals", label: "Meal Tracking", icon: ClipboardList, roles: ["SUPER_ADMIN", "SCHOOL_HEAD", "KITCHEN_STAFF", "TEACHER"] },
  { href: "/planner", label: "AI Planner", icon: Sparkles, roles: ["SUPER_ADMIN", "NUTRITION_OFFICER", "KITCHEN_STAFF"] },
  { href: "/schools", label: "Institutions & Codes", icon: MapPinned, roles: ["SUPER_ADMIN", "DISTRICT_ADMIN"] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD"] }
];

function formatRole(role: string) {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  const { user, logout } = useAuth();
  const { isDemoMode, setDemoMode } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const userRole = user?.role || "STUDENT_PARENT";

  // Filter navigation items by active user role permissions
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  const displaySubtitle = user
    ? `${formatRole(user.role)} ${
        user.school
          ? `| ${user.school.type === "SCHOOL" || !user.school.type ? "School" : user.school.type === "COLLEGE" ? "College" : user.school.type} ${user.school.code || user.schoolId}`
          : user.schoolId
          ? `| Institution ${user.schoolId}`
          : user.districtId
          ? `| District ${user.districtId}`
          : ""
      }`
    : subtitle;

  const NavigationContent = () => (
    <div className="flex flex-col h-full justify-between py-6">
      <div className="space-y-6 px-4">
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white overflow-hidden shadow-sm">
            <img src="/logo.png" alt="MealCare logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">MealCare AI</span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition duration-150 ${
                  isActive
                    ? "bg-gov-green text-white shadow-sm shadow-emerald-950/15"
                    : "text-slate-600 hover:bg-slate-50 hover:text-gov-green"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info / Profile card */}
      {user && (
        <div className="border-t border-slate-100 pt-4 px-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-800 truncate leading-tight">{user.name}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 fixed top-0 bottom-0 left-0 z-20">
        <NavigationContent />
      </aside>

      {/* MOBILE HEADER */}
      <header className="lg:hidden w-full h-16 bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white overflow-hidden shadow-sm">
            <img src="/logo.png" alt="MealCare logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">MealCare AI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-gov-green"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-20 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer Body */}
          <aside className="relative flex w-64 max-w-xs flex-col bg-white border-r border-slate-200 h-full pt-16">
            <NavigationContent />
          </aside>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-64 min-w-0 flex flex-col">
        {/* Main Content Header */}
        <header className="hidden lg:flex bg-white border-b border-slate-200 h-16 items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-gov-green">{displaySubtitle}</p>
            <h1 className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5">{title}</h1>
          </div>

          {/* Demo Mode Toggle Switch */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 shadow-inner">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Demo Data</span>
            <button
              type="button"
              onClick={() => setDemoMode(!isDemoMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-gov-green/20 ${
                isDemoMode ? "bg-gov-green" : "bg-slate-300"
              }`}
              title="Toggle Demo Mode vs Live Database"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isDemoMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            {isDemoMode && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
        </header>

        {/* Page Content Panel */}
        <main className="flex-1 px-4 lg:px-8 py-6 mt-16 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
