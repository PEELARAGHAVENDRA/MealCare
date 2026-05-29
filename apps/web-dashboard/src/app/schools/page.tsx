"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { fetchDistrictAnalytics, createSchool } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { Loader2, Plus, PlusCircle, Building2, MapPin, Users, Hash, FileText, CheckCircle2, Copy, Check } from "lucide-react";

const MOCK_SCHOOLS_LIST = [
  { id: "cmpppkkv70000b511lbz008lr", name: "Government Primary School Delhi", code: "GOV-SCH-001", district: "Central District", type: "SCHOOL", prepared: 1100, served: 1040, averageWaste: 5.4 },
  { id: "cmpppkkv70000b511lbz008ls", name: "State Science College Delhi", code: "GOV-COL-001", district: "Central District", type: "COLLEGE", prepared: 1800, served: 1720, averageWaste: 4.2 },
  { id: "cmpppkkv70000b511lbz008lt", name: "Anganwadi Center Block IV", code: "NGO-KIT-001", district: "Central District", type: "ORGANIZATION", prepared: 450, served: 410, averageWaste: 8.9 }
];

export default function SchoolsPage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [address, setAddress] = useState("");
  const [studentCount, setStudentCount] = useState<number>(100);
  const [type, setType] = useState("SCHOOL");
  const [customType, setCustomType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const getNamePlaceholder = () => {
    if (type === "SCHOOL") return "e.g. Government School Delhi";
    if (type === "COLLEGE") return "e.g. State Science College";
    return "e.g. NGO Kitchen, Anganwadi Center";
  };

  const getCodePlaceholder = () => {
    if (type === "SCHOOL") return "e.g. GOV-SCH-005";
    if (type === "COLLEGE") return "e.g. GOV-COL-101";
    return "e.g. NGO-KIT-201";
  };

  const handleCopyCode = (codeToCopy: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(codeToCopy);
      setCopiedCode(codeToCopy);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  async function loadSchools() {
    try {
      if (isDemoMode) {
        setSchools(MOCK_SCHOOLS_LIST);
      } else {
        const data = await fetchDistrictAnalytics();
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error("Error loading schools list", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, [isDemoMode]);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name || !code || !district || !block || !address) {
      setFormError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const resolvedType = type === "OTHER" ? customType.trim() : type;
      await createSchool({
        name,
        code: code.trim().toUpperCase(),
        district,
        block,
        address,
        studentCount: Number(studentCount) || 0,
        type: resolvedType || "SCHOOL"
      });

      setFormSuccess(`Institution "${name}" registered successfully with code ${code}!`);
      // Reset form
      setName("");
      setCode("");
      setDistrict("");
      setBlock("");
      setAddress("");
      setStudentCount(100);
      setType("SCHOOL");
      setCustomType("");
      
      // Reload lists
      await loadSchools();
      
      // Auto-hide form after delay
      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess(null);
      }, 3000);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && schools.length === 0) {
    return (
      <AppShell title="Institutions & Registration Codes" subtitle="Loading registry...">
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gov-green" />
          <p className="text-sm font-semibold text-slate-500">Comparing district institution metrics from Supabase...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Institutions & Registration Codes" subtitle="Register and monitor schools, colleges, and organizations">
      <div className="space-y-6">
        {/* SUPER ADMIN: Add School panel */}
        {isSuperAdmin && showAddForm && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <PlusCircle className="text-gov-green" size={18} />
                Register New Institution & Code
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
              >
                Close Panel
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 font-semibold">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-800 font-semibold">
                <CheckCircle2 className="text-green-600 shrink-0" size={16} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Institution Name
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Building2 size={14} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                      placeholder={getNamePlaceholder()}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Institution Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="block w-full mt-1 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                    disabled={submitting}
                  >
                    <option value="SCHOOL">School</option>
                    <option value="COLLEGE">College</option>
                    <option value="OTHER">Other (Custom Type...)</option>
                  </select>
                </div>

                {type === "OTHER" && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Custom Org / Type
                    </label>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Building2 size={14} />
                      </div>
                      <input
                        type="text"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                        placeholder="e.g. NGO Kitchen, Anganwadi"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Institution Code / ID (Unique)
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Hash size={14} />
                    </div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                      placeholder={getCodePlaceholder()}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    District
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <MapPin size={14} />
                    </div>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                      placeholder="e.g. Central District"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Block
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <MapPin size={14} />
                    </div>
                    <input
                      type="text"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                      placeholder="e.g. Block IV"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Student Count
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Users size={14} />
                    </div>
                    <input
                      type="number"
                      value={studentCount}
                      onChange={(e) => setStudentCount(Number(e.target.value))}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                      placeholder="100"
                      required
                      min={0}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Address
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <MapPin size={14} />
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-gov-green focus:ring-2 focus:ring-gov-green/10"
                      placeholder="e.g. 12, Main Street, Delhi"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gov-green px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    "Register Institution"
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Multi-Institution Monitoring</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Database of active institutions in the district</p>
            </div>
            {isSuperAdmin && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gov-green px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98]"
              >
                <Plus size={14} />
                Add Institution
              </button>
            )}
          </div>

          {schools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <Building2 size={40} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No registered institutions found.</p>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 text-xs font-bold text-gov-green hover:underline"
                >
                  Create the first institution registration code
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 rounded-l-xl">Institution Name</th>
                    <th className="px-4">Registration Code</th>
                    <th className="px-4">Type</th>
                    <th className="px-4">District</th>
                    <th className="px-4">Meals Prepared</th>
                    <th className="px-4">Meals Served</th>
                    <th className="px-4 rounded-r-xl">Average Waste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schools.map((school) => {
                    const wastePercent = school.averageWaste ? `${school.averageWaste.toFixed(1)}%` : "0.0%";
                    const activeCode = school.code || school.id;
                    return (
                      <tr key={school.id} className="hover:bg-slate-50/40 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                          <Building2 size={16} className="text-gov-green/75" />
                          <div>
                            <p className="leading-normal">{school.name}</p>
                          </div>
                        </td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-sm">
                              {activeCode}
                            </span>
                            <button
                              onClick={() => handleCopyCode(activeCode)}
                              className="text-slate-400 hover:text-gov-green transition p-1 hover:bg-slate-50 rounded"
                              title="Copy code to clipboard"
                            >
                              {copiedCode === activeCode ? (
                                <Check size={13} className="text-green-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4">
                          {school.type === "SCHOOL" || !school.type ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-100">
                              School
                            </span>
                          ) : school.type === "COLLEGE" ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800 border border-blue-100">
                              College
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-100 uppercase tracking-wider">
                              {school.type}
                            </span>
                          )}
                        </td>
                        <td className="px-4 font-semibold text-slate-605">{school.district}</td>
                        <td className="px-4 text-slate-700 font-extrabold">{school.prepared || 0}</td>
                        <td className="px-4 text-slate-700 font-extrabold">{school.served || 0}</td>
                        <td className="px-4 text-slate-700">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            (school.averageWaste || 0) > 6 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                          }`}>
                            {wastePercent}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
