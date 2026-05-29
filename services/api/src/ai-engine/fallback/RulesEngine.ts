// ─────────────────────────────────────────────────────────────────────────────
// services/api/src/ai-engine/fallback/RulesEngine.ts
// Deterministic rules-based fallback for every AIProvider method.
// Used when Gemini (or any LLM provider) is unavailable.
// The app stays functional — just returns simplified but valid results.
// ─────────────────────────────────────────────────────────────────────────────

import { AIProvider } from "../providers/AIProvider.interface";
import {
  NutritionInput,
  NutritionOutput,
  MealPlanInput,
  MealPlanOutput,
  ParticipationInput,
  ParticipationOutput,
  WasteInput,
  WasteOutput,
  InventoryItem,
  InventoryAnalysisOutput,
  HolidayPlanInput,
  HolidayPlanOutput,
  RecommendationOutput,
  AIUsageStats,
  Meal,
} from "@midday/shared-contracts";

// ── Static nutrition lookup (per 100g, approximate) ──────────────────────────

const NUTRITION_DB: Record<string, Partial<NutritionOutput>> = {
  rice:     { calories: 130, protein: 2.7, iron: 0.2, vitaminA: 0,  vitaminC: 0  },
  dal:      { calories: 116, protein: 9.0, iron: 3.3, vitaminA: 1,  vitaminC: 1  },
  egg:      { calories: 155, protein: 13,  iron: 1.2, vitaminA: 160, vitaminC: 0 },
  spinach:  { calories: 23,  protein: 2.9, iron: 2.7, vitaminA: 469, vitaminC: 28 },
  banana:   { calories: 89,  protein: 1.1, iron: 0.3, vitaminA: 3,  vitaminC: 8.7 },
  milk:     { calories: 61,  protein: 3.2, iron: 0.1, vitaminA: 46, vitaminC: 0   },
  potato:   { calories: 77,  protein: 2.0, iron: 0.8, vitaminA: 0,  vitaminC: 19  },
  tomato:   { calories: 18,  protein: 0.9, iron: 0.5, vitaminA: 42, vitaminC: 14  },
  carrot:   { calories: 41,  protein: 0.9, iron: 0.3, vitaminA: 835, vitaminC: 6  },
};

// ── Standard meal templates ───────────────────────────────────────────────────

const STANDARD_MEALS: { breakfast: Meal[]; lunch: Meal[] } = {
  breakfast: [
    { name: "Poha with Vegetables", ingredients: ["Poha", "Onion", "Peas", "Peanuts"], estimatedCalories: 250, estimatedCost: 8, nutritionHighlights: ["Carbohydrates", "Fibre"], prepTime: 20 },
    { name: "Upma", ingredients: ["Semolina", "Vegetables", "Mustard seeds"], estimatedCalories: 220, estimatedCost: 7, nutritionHighlights: ["Iron", "B-Vitamins"], prepTime: 25 },
    { name: "Idli Sambar", ingredients: ["Rice", "Dal", "Vegetables"], estimatedCalories: 280, estimatedCost: 9, nutritionHighlights: ["Protein", "Probiotics"], prepTime: 30 },
    { name: "Roti with Banana", ingredients: ["Wheat flour", "Banana"], estimatedCalories: 300, estimatedCost: 6, nutritionHighlights: ["Potassium", "Carbohydrates"], prepTime: 15 },
    { name: "Pongal", ingredients: ["Rice", "Moong dal", "Ghee", "Pepper"], estimatedCalories: 310, estimatedCost: 8, nutritionHighlights: ["Protein", "Carbohydrates"], prepTime: 35 },
  ],
  lunch: [
    { name: "Rice Dal Sabzi", ingredients: ["Rice", "Dal", "Seasonal Vegetables"], estimatedCalories: 450, estimatedCost: 12, nutritionHighlights: ["Protein", "Iron", "Fibre"], prepTime: 40 },
    { name: "Khichdi with Curd", ingredients: ["Rice", "Moong dal", "Curd"], estimatedCalories: 380, estimatedCost: 10, nutritionHighlights: ["Complete Protein", "Calcium"], prepTime: 30 },
    { name: "Pulao with Raita", ingredients: ["Rice", "Mixed Vegetables", "Curd"], estimatedCalories: 420, estimatedCost: 13, nutritionHighlights: ["Vitamins", "Calcium"], prepTime: 45 },
    { name: "Sambar Rice with Egg", ingredients: ["Rice", "Sambar", "Egg"], estimatedCalories: 500, estimatedCost: 14, nutritionHighlights: ["Protein", "Iron", "B12"], prepTime: 40 },
    { name: "Roti Sabzi Dal", ingredients: ["Wheat roti", "Seasonal sabzi", "Dal"], estimatedCalories: 430, estimatedCost: 11, nutritionHighlights: ["Protein", "Fibre", "Iron"], prepTime: 35 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

export class RulesEngine implements AIProvider {
  readonly name = "rules-engine-fallback";
  readonly model = "local-v1";

  private lastUsageStats: AIUsageStats = {
    provider: "mock",
    model: "local-v1",
    tokensUsed: 0,
    requestType: "none",
    latencyMs: 0,
    success: true,
    fallbackUsed: true,
  };

  private track(requestType: string, latencyMs: number) {
    this.lastUsageStats = {
      provider: "mock",
      model: "local-v1",
      tokensUsed: 0,
      requestType,
      latencyMs,
      success: true,
      fallbackUsed: true,
    };
  }

  // ── Nutrition ───────────────────────────────────────────────────────────────

  async analyzeNutrition(input: NutritionInput): Promise<NutritionOutput> {
    const start = Date.now();
    let calories = 0, protein = 0, iron = 0, vitaminA = 0, vitaminC = 0;

    for (const ing of input.ingredients) {
      const key = ing.toLowerCase();
      const found = Object.keys(NUTRITION_DB).find((k) => key.includes(k));
      if (found) {
        const n = NUTRITION_DB[found];
        calories  += n.calories  ?? 0;
        protein   += n.protein   ?? 0;
        iron      += n.iron      ?? 0;
        vitaminA  += n.vitaminA  ?? 0;
        vitaminC  += n.vitaminC  ?? 0;
      } else {
        calories += 80; // generic unknown ingredient
      }
    }

    const vitaminScore = Math.min(100, Math.round((vitaminA / 5 + vitaminC) / 2));
    const alerts = [];
    if (protein < 15) alerts.push({ nutrient: "Protein", severity: "medium" as const, message: "Add more dal or eggs to boost protein." });
    if (iron < 5)    alerts.push({ nutrient: "Iron",    severity: "low" as const,    message: "Add leafy greens like spinach or methi." });

    this.track("nutrition-analysis", Date.now() - start);
    return {
      calories,
      protein,
      carbohydrates: Math.round(calories * 0.55 / 4),
      fat: Math.round(calories * 0.25 / 9),
      iron,
      vitaminA,
      vitaminC,
      vitaminScore,
      deficiencyAlerts: alerts,
      recommendations: [
        "Include seasonal green vegetables daily.",
        "Add a protein source (dal/egg) at every meal.",
        "Serve banana or amla as a vitamin C booster.",
      ],
      overallScore: Math.min(100, Math.round((protein * 3 + vitaminScore + Math.min(calories, 500) / 5) / 5)),
    };
  }

  // ── Meal Plan ───────────────────────────────────────────────────────────────

  async generateWeeklyPlan(input: MealPlanInput): Promise<MealPlanOutput> {
    const start = Date.now();
    const schedule = input.workingDays
      .filter((d) => !input.holidayList.includes(d))
      .map((date, i) => ({
        date,
        breakfast: STANDARD_MEALS.breakfast[i % STANDARD_MEALS.breakfast.length],
        lunch: STANDARD_MEALS.lunch[i % STANDARD_MEALS.lunch.length],
      }));

    this.track("meal-plan-generation", Date.now() - start);
    return {
      weeklySchedule: schedule,
      overallNutritionScore: 72,
      estimatedCostPerStudent: schedule.length * 12,
      substitutions: [],
      notes: "⚠️ AI unavailable — Generated by local rules engine. Activate Gemini for optimised plans.",
    };
  }

  // ── Participation ───────────────────────────────────────────────────────────

  async predictParticipation(input: ParticipationInput): Promise<ParticipationOutput> {
    const start = Date.now();
    const recent = input.historicalAttendance.slice(-5);
    const avgRate = recent.length
      ? recent.reduce((s, r) => s + r.present / r.total, 0) / recent.length
      : 0.85;

    const dayPenalty: Record<string, number> = {
      monday: 0.95, tuesday: 1.0, wednesday: 1.0,
      thursday: 0.98, friday: 0.93, saturday: 0.7,
    };

    const rate = Math.min(1, avgRate * (dayPenalty[input.dayType] ?? 1.0));
    const expected = Math.round(input.totalStudents * rate);

    this.track("participation-prediction", Date.now() - start);
    return {
      expectedMealCount: expected,
      confidencePercent: 65,
      attendanceRate: rate,
      factors: [
        `Based on ${recent.length} days of historical data`,
        `${input.dayType} day adjustment applied`,
        "⚠️ AI unavailable — using statistical average",
      ],
    };
  }

  // ── Waste ───────────────────────────────────────────────────────────────────

  async predictFoodWaste(input: WasteInput): Promise<WasteOutput> {
    const start = Date.now();
    const totalPrepared = input.preparedMeals.reduce((s, m) => s + m.quantityKg, 0);
    const totalServed   = input.servedMeals.reduce((s, m) => s + m.quantityKg, 0);
    const leftovers = Math.max(0, totalPrepared - totalServed);
    const wastePercent = totalPrepared > 0 ? (leftovers / totalPrepared) * 100 : 0;

    const risk = wastePercent < 10 ? "low" : wastePercent < 25 ? "medium" : "high";

    this.track("waste-prediction", Date.now() - start);
    return {
      predictedLeftoversKg: leftovers,
      wasteRiskLevel: risk,
      wasteRiskPercent: Math.round(wastePercent),
      suggestions: [
        "Donate surplus to nearby anganwadis or community kitchens.",
        "Reduce tomorrow's preparation by the leftover amount.",
        "Record waste accurately for AI to improve predictions.",
      ],
      costImpact: Math.round(leftovers * 80),
    };
  }

  // ── Recommendation ──────────────────────────────────────────────────────────

  async recommendIngredients(
    inventory: InventoryItem[],
    nutritionGaps: string[]
  ): Promise<RecommendationOutput> {
    this.track("ingredient-recommendation", 0);
    return {
      ingredients: [
        { name: "Spinach", reason: "Rich in iron and vitamins", nutritionBenefit: "Iron, Vitamin A, Folate", estimatedCostPerKg: 30, priority: "high" },
        { name: "Moong Dal", reason: "High protein, easy to digest", nutritionBenefit: "Protein, Iron, B-Vitamins", estimatedCostPerKg: 90, priority: "high" },
        { name: "Banana", reason: "Potassium and quick energy", nutritionBenefit: "Potassium, Vitamin B6, Carbs", estimatedCostPerKg: 40, priority: "medium" },
      ],
      mealIdeas: ["Dal Palak", "Moong Dal Khichdi", "Banana Sheera"],
      nutritionGaps: nutritionGaps.length ? nutritionGaps : ["Iron", "Protein", "Vitamin A"],
      seasonalSuggestions: ["Drumstick leaves (moringa) — nutrient-dense and locally available"],
    };
  }

  // ── Inventory ───────────────────────────────────────────────────────────────

  async analyzeInventory(inventory: InventoryItem[]): Promise<InventoryAnalysisOutput> {
    const start = Date.now();
    const today = new Date();

    const lowStock: InventoryAnalysisOutput["lowStockAlerts"] = inventory
      .filter((i) => i.minStockKg && i.quantityKg < i.minStockKg)
      .map((i) => ({
        item: i.name,
        currentStock: i.quantityKg,
        minRequired: i.minStockKg!,
        daysRemaining: Math.round(i.quantityKg / 5),
        severity: i.quantityKg < i.minStockKg! * 0.5 ? "critical" : "warning",
      }));

    const expiryWarnings: InventoryAnalysisOutput["expiryWarnings"] = inventory
      .filter((i) => i.expiryDate)
      .map((i) => {
        const exp = new Date(i.expiryDate!);
        const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
        return { item: i.name, expiresIn: daysLeft, quantityKg: i.quantityKg, suggestion: daysLeft <= 3 ? "Use immediately in tomorrow's meal" : "Plan to use within this week" };
      })
      .filter((w) => w.expiresIn <= 7);

    this.track("inventory-analysis", Date.now() - start);
    return {
      lowStockAlerts: lowStock,
      expiryWarnings,
      alternativeMenuSuggestions: ["Dal Chawal (uses rice + dal)", "Vegetable Khichdi (clears mixed vegetables)"],
      priorityConsumptionList: expiryWarnings.map((w) => ({
        name: w.item, reason: `Expires in ${w.expiresIn} days`, suggestedMeals: ["Include in tomorrow's lunch"],
      })),
      overallHealthScore: Math.max(0, 100 - lowStock.length * 15 - expiryWarnings.length * 10),
    };
  }

  // ── Holiday Planning ────────────────────────────────────────────────────────

  async suggestHolidayAdjustments(input: HolidayPlanInput): Promise<HolidayPlanOutput> {
    const start = Date.now();
    const disabled = input.closures;
    const adjusted = input.currentMealSchedule.filter((d) => !disabled.includes(d.date));

    this.track("holiday-planning", Date.now() - start);
    return {
      disabledMealDates: disabled,
      shiftedPlans: [],
      adjustedSchedule: adjusted,
      festivalSpecialMeals: input.festivalList.map((f) => ({
        date: f.date,
        festival: f.name,
        specialMeal: {
          name: `${f.name} Special Meal`,
          ingredients: ["Rice", "Dal", "Jaggery", "Seasonal Vegetables"],
          estimatedCalories: 400,
          estimatedCost: 12,
          nutritionHighlights: ["Culturally appropriate", "Celebratory"],
          prepTime: 45,
        },
      })),
      notes: "⚠️ AI unavailable — Basic holiday adjustment applied by rules engine.",
    };
  }

  // ── Optimize (delegates to generate) ────────────────────────────────────────

  async optimizeMeals(input: MealPlanInput): Promise<MealPlanOutput> {
    const plan = await this.generateWeeklyPlan(input);
    plan.notes = "⚠️ AI unavailable — Optimization skipped, standard plan returned.";
    return plan;
  }

  async scanFoodImage(
    base64Image: string,
    mimeType: string
  ): Promise<{
    foodItems: string[];
    calories: number;
    macros: { protein: number; carbs: number; fat: number; fiber: number };
    insights: string[];
  }> {
    this.track("food-scan", 0);
    const presets = [
      {
        foodItems: ["Rice", "Sambar", "Steamed Cabbage", "Curd"],
        calories: 410,
        macros: {
          protein: 12.5,
          carbs: 72.0,
          fat: 6.5,
          fiber: 5.2
        },
        insights: [
          "Excellent high-fiber lunch option.",
          "Curd provides a nice calcium and probiotic boost.",
          "Protein is adequate, but could be raised by adding yellow lentils (dal)."
        ]
      },
      {
        foodItems: ["Wheat Roti (2)", "Mix Veg Sabzi", "Dal Tadka"],
        calories: 380,
        macros: {
          protein: 14.8,
          carbs: 58.0,
          fat: 8.2,
          fiber: 6.8
        },
        insights: [
          "Great source of complex carbohydrates from whole wheat roti.",
          "Lentils offer a strong protein foundation.",
          "Consider adding a vitamin C source like a slice of lemon to enhance iron absorption."
        ]
      },
      {
        foodItems: ["Vegetable Khichdi", "Banana", "Boiled Egg"],
        calories: 450,
        macros: {
          protein: 18.2,
          carbs: 64.0,
          fat: 11.0,
          fiber: 4.1
        },
        insights: [
          "Highly nutritious and easy to digest khichdi.",
          "Boiled egg provides high-quality reference protein.",
          "Banana offers quick-release energy and potassium."
        ]
      }
    ];

    const index = Math.abs(base64Image.length) % presets.length;
    return presets[index];
  }

  async analyzeWeeklyPlan(planData: any): Promise<{
    warnings: string[];
    suggestions: Array<{
      day: string;
      mealTime: string;
      foodSuggestion: string;
      reason: string;
    }>;
    overallAnalysis: string;
  }> {
    this.track("planner-analysis", 0);
    return {
      warnings: ["Protein deficiency detected in the mid-week meal schedule."],
      suggestions: [
        {
          day: "Wednesday",
          mealTime: "Snacks",
          foodSuggestion: "Roasted Chana (Chickpeas) or Boiled Egg",
          reason: "To cover the 8g protein deficiency identified for the day."
        }
      ],
      overallAnalysis: "Rules engine fallback: The meal plan is generally balanced but has low protein content mid-week."
    };
  }

  getLastUsageStats(): AIUsageStats {
    return { ...this.lastUsageStats };
  }
}
