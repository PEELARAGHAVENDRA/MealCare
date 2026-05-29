// ─────────────────────────────────────────────────────────────────────────────
// services/api/src/ai-engine/providers/MockProvider.ts
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
} from "@midday/shared-contracts";

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

  async scanFoodImage(
    base64Image: string,
    mimeType: string
  ): Promise<{
    foodItems: string[];
    calories: number;
    macros: { protein: number; carbs: number; fat: number; fiber: number };
    insights: string[];
  }> {
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

    // Select preset based on hash of string length
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
    return {
      warnings: [
        "Protein levels are slightly lower than the ICMR recommended daily allowance (RDA).",
        "No meal scheduled for Monday evening."
      ],
      suggestions: [
        {
          day: "Monday",
          mealTime: "Snacks",
          foodSuggestion: "Boiled Sprouted Green Gram (Moong)",
          reason: "To cover 6.5g protein and boost Vitamin C content."
        },
        {
          day: "Wednesday",
          mealTime: "Afternoon",
          foodSuggestion: "Add boiled egg or paneer to Pulao",
          reason: "To balance carbohydrates and add 8.2g of protein."
        },
        {
          day: "Friday",
          mealTime: "Snacks",
          foodSuggestion: "Roasted Peanuts or Chana Chikki",
          reason: "Provides essential healthy fats and calories for the afternoon gap."
        }
      ],
      overallAnalysis: "Mock analysis: The meal plan is generally budget-efficient but requires a boost in proteins and iron. Adding legumes or sprouts in the snacks slot is highly recommended."
    };
  }

  getLastUsageStats(): AIUsageStats {
    return { provider: "mock", model: "mock-v1", tokensUsed: 0, requestType: "mock", latencyMs: 1, success: true, fallbackUsed: false };
  }
}
