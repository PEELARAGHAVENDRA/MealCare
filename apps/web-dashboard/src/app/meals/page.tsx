"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { fetchMealsList } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { Loader2 } from "lucide-react";

const MOCK_MEALS_LIST = [
  { id: "m1", date: new Date().toISOString(), menuItems: ["Rice", "Sambar", "Banana"], plannedCount: 220, preparedCount: 215, servedCount: 208, foodWastage: { leftoverQuantity: 7 } },
  { id: "m2", date: new Date(Date.now() - 86400000).toISOString(), menuItems: ["Poha", "Egg Curry", "Milk"], plannedCount: 220, preparedCount: 220, servedCount: 218, foodWastage: { leftoverQuantity: 2 } },
  { id: "m3", date: new Date(Date.now() - 86400000 * 2).toISOString(), menuItems: ["Khichdi", "Apple", "Gram"], plannedCount: 220, preparedCount: 210, servedCount: 198, foodWastage: { leftoverQuantity: 12 } },
  { id: "m4", date: new Date(Date.now() - 86400000 * 3).toISOString(), menuItems: ["Pulao", "Fruit Salad", "Chana"], plannedCount: 220, preparedCount: 215, servedCount: 211, foodWastage: { leftoverQuantity: 4 } },
];

export default function MealsPage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMeals() {
      if (!user) return;
      if (isDemoMode) {
        setMeals(MOCK_MEALS_LIST);
        setLoading(false);
      } else {
        try {
          const data = await fetchMealsList(user.schoolId || undefined);
          setMeals(data);
        } catch (err) {
          console.error("Error loading meals", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadMeals();
  }, [user, isDemoMode]);

  if (loading) {
    return (
      <AppShell title="Meal Tracking" subtitle="Loading meal logs...">
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gov-green" />
          <p className="text-sm font-semibold text-slate-500">Querying meal logs from Supabase...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Meal Tracking" subtitle="Kitchen operations">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Prepared vs Served Logs</h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold uppercase">
            {meals.length} Logs Found
          </span>
        </div>
        
        {meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <p className="font-semibold">No meal logs recorded yet.</p>
            <p className="text-xs mt-1">Use the mobile Flutter app to submit daily meal entries.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-slate-600">
                <tr className="border-b border-slate-200">
                  <th className="py-3">Date</th>
                  <th>Menu</th>
                  <th>Planned</th>
                  <th>Prepared</th>
                  <th>Served</th>
                  <th>Leftover</th>
                </tr>
              </thead>
              <tbody>
                {meals.map((meal) => {
                  const dateStr = new Date(meal.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  });
                  return (
                    <tr key={meal.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-950">{dateStr}</td>
                      <td className="text-slate-700">{meal.menuItems.join(" + ")}</td>
                      <td className="text-slate-700 font-semibold">{meal.plannedCount}</td>
                      <td className="text-slate-700 font-semibold">{meal.preparedCount}</td>
                      <td className="text-slate-700 font-semibold">{meal.servedCount}</td>
                      <td className="text-slate-700">
                        {meal.foodWastage?.leftoverQuantity ?? (meal.preparedCount - meal.servedCount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
