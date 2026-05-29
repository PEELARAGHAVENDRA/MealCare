// ─────────────────────────────────────────────────────────────────────────────
// services/ai-engine/src/providers/AIProvider.interface.ts
// The single contract every provider must satisfy.
// Adding a new LLM = implement this interface, register in factory.
// ─────────────────────────────────────────────────────────────────────────────

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
} from "../../../../packages/shared-contracts/src/ai/types";

export interface AIProvider {
  readonly name: string;
  readonly model: string;

  /**
   * Analyze nutritional content of a set of ingredients.
   * Returns scores, deficiency alerts and recommendations.
   */
  analyzeNutrition(input: NutritionInput): Promise<NutritionOutput>;

  /**
   * Generate an optimized weekly meal schedule balancing budget,
   * inventory, nutrition, and student preferences.
   */
  generateWeeklyPlan(input: MealPlanInput): Promise<MealPlanOutput>;

  /**
   * Predict how many students will participate in meals on a given date
   * based on attendance history, opt-outs, and holiday context.
   */
  predictParticipation(input: ParticipationInput): Promise<ParticipationOutput>;

  /**
   * Predict how much food will be wasted and surface actionable suggestions.
   */
  predictFoodWaste(input: WasteInput): Promise<WasteOutput>;

  /**
   * Recommend ingredients to procure based on nutritional gaps
   * and current inventory state.
   */
  recommendIngredients(
    inventory: InventoryItem[],
    nutritionGaps: string[]
  ): Promise<RecommendationOutput>;

  /**
   * Analyse current inventory and return alerts, priorities,
   * expiry warnings, and alternative menu suggestions.
   */
  analyzeInventory(inventory: InventoryItem[]): Promise<InventoryAnalysisOutput>;

  /**
   * Adjust meal schedules for holidays and festivals.
   */
  suggestHolidayAdjustments(input: HolidayPlanInput): Promise<HolidayPlanOutput>;

  /**
   * Re-optimize an existing meal plan given new constraints.
   */
  optimizeMeals(input: MealPlanInput): Promise<MealPlanOutput>;

  /**
   * Return last-call usage statistics (tokens, latency, model).
   */
  getLastUsageStats(): AIUsageStats;
}
