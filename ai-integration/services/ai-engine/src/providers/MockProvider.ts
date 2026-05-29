// ─────────────────────────────────────────────────────────────────────────────
// services/ai-engine/src/providers/MockProvider.ts
// Returns static fixtures — used in tests and CI pipelines.
// Switch via: AI_PROVIDER=mock
// ─────────────────────────────────────────────────────────────────────────────

import { AIProvider } from "./AIProvider.interface";
import {
  NutritionInput, NutritionOutput,
  MealPlanInput, MealPlanOutput,
  ParticipationInput, ParticipationOutput,
  WasteInput, WasteOutput,
  InventoryItem, InventoryAnalysisOutput,
  HolidayPlanInput, HolidayPlanOutput,
  RecommendationOutput, AIUsageStats,
} from "../../../../packages/shared-contracts/src/ai/types";

export class MockProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "mock-v1";

  async analyzeNutrition(_: NutritionInput): Promise<NutritionOutput> {
    return {
      calories: 450, protein: 18, carbohydrates: 65, fat: 10,
      iron: 6.5, vitaminA: 320, vitaminC: 22, vitaminScore: 78,
      deficiencyAlerts: [{ nutrient: "Calcium", severity: "low", message: "Add milk or curd." }],
      recommendations: ["Include seasonal greens.", "Add jaggery for iron boost."],
      overallScore: 82,
    };
  }

  async generateWeeklyPlan(_: MealPlanInput): Promise<MealPlanOutput> {
    return {
      weeklySchedule: [
        {
          date: new Date().toISOString().split("T")[0],
          breakfast: { name: "Mock Poha", ingredients: ["Poha", "Onion"], estimatedCalories: 260, estimatedCost: 8, nutritionHighlights: ["Iron"], prepTime: 20 },
          lunch:     { name: "Mock Dal Rice", ingredients: ["Rice", "Dal"], estimatedCalories: 450, estimatedCost: 12, nutritionHighlights: ["Protein"], prepTime: 40 },
        },
      ],
      overallNutritionScore: 80,
      estimatedCostPerStudent: 20,
      substitutions: [],
      notes: "Mock provider — no real AI used.",
    };
  }

  async predictParticipation(_: ParticipationInput): Promise<ParticipationOutput> {
    return { expectedMealCount: 180, confidencePercent: 90, attendanceRate: 0.9, factors: ["Mock prediction"] };
  }

  async predictFoodWaste(_: WasteInput): Promise<WasteOutput> {
    return { predictedLeftoversKg: 5, wasteRiskLevel: "low", wasteRiskPercent: 8, suggestions: ["Mock suggestion"], costImpact: 400 };
  }

  async recommendIngredients(_inv: InventoryItem[], _gaps: string[]): Promise<RecommendationOutput> {
    return { ingredients: [{ name: "Spinach", reason: "Iron-rich", nutritionBenefit: "Iron, Vit A", estimatedCostPerKg: 30, priority: "high" }], mealIdeas: ["Palak Dal"], nutritionGaps: ["Iron"], seasonalSuggestions: ["Drumstick leaves"] };
  }

  async analyzeInventory(_: InventoryItem[]): Promise<InventoryAnalysisOutput> {
    return { lowStockAlerts: [], expiryWarnings: [], alternativeMenuSuggestions: ["Khichdi"], priorityConsumptionList: [], overallHealthScore: 90 };
  }

  async suggestHolidayAdjustments(_: HolidayPlanInput): Promise<HolidayPlanOutput> {
    return { disabledMealDates: [], shiftedPlans: [], adjustedSchedule: [], festivalSpecialMeals: [], notes: "Mock holiday adjustment." };
  }

  async optimizeMeals(input: MealPlanInput): Promise<MealPlanOutput> {
    return this.generateWeeklyPlan(input);
  }

  getLastUsageStats(): AIUsageStats {
    return { provider: "mock", model: "mock-v1", tokensUsed: 0, requestType: "mock", latencyMs: 1, success: true, fallbackUsed: false };
  }
}
