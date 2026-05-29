// ─────────────────────────────────────────────────────────────────────────────
// services/ai-engine/src/modules/index.ts
//
// One exported function per AI module.
// Each function:
//   1. Calls the provider (with automatic fallback)
//   2. Logs request + response to ai_requests table
//   3. Returns the typed result
//
// Usage (from API routes):
//   import { nutritionEngine, mealOptimizer, ... } from "./modules";
// ─────────────────────────────────────────────────────────────────────────────

import { getAIProvider } from "../providers/ProviderFactory";
import {
  NutritionInput, NutritionOutput,
  MealPlanInput, MealPlanOutput,
  ParticipationInput, ParticipationOutput,
  WasteInput, WasteOutput,
  InventoryItem, InventoryAnalysisOutput,
  HolidayPlanInput, HolidayPlanOutput,
  RecommendationOutput,
} from "../../../../packages/shared-contracts/src/ai/types";

// ── Simple logger interface (replace with your PrismaClient import) ───────────
// import { prisma } from "../db"; // ← uncomment and adapt to your Prisma setup

async function logAIRequest(
  type: string,
  input: unknown,
  response: unknown,
  stats: ReturnType<ReturnType<typeof getAIProvider>["getLastUsageStats"]>
): Promise<void> {
  // Prisma insert — adapt table names to your schema additions below
  try {
    // await prisma.aiRequest.create({
    //   data: {
    //     type,
    //     input: JSON.stringify(input),
    //     response: JSON.stringify(response),
    //     provider: stats.provider,
    //     model: stats.model,
    //     tokensUsed: stats.tokensUsed,
    //     latencyMs: stats.latencyMs,
    //     fallbackUsed: stats.fallbackUsed,
    //   },
    // });
    console.debug(`[AI Log] ${type} | ${stats.provider} | ${stats.latencyMs}ms | tokens:${stats.tokensUsed} | fallback:${stats.fallbackUsed}`);
  } catch (logErr) {
    console.warn("[AI Log] Failed to persist request log:", logErr);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * MODULE 1: Nutrition Engine
 * Analyze ingredients for calories, macros, micronutrients, and deficiency alerts.
 */
export async function nutritionEngine(input: NutritionInput): Promise<NutritionOutput> {
  const provider = getAIProvider();
  const result = await provider.analyzeNutrition(input);
  await logAIRequest("nutrition-analysis", input, result, provider.getLastUsageStats());
  return result;
}

/**
 * MODULE 2: Meal Optimizer
 * Generate or re-optimize a weekly meal plan within budget and inventory constraints.
 */
export async function mealOptimizer(input: MealPlanInput): Promise<MealPlanOutput> {
  const provider = getAIProvider();
  const result = await provider.generateWeeklyPlan(input);
  await logAIRequest("meal-optimization", input, result, provider.getLastUsageStats());
  return result;
}

/**
 * MODULE 3: Participation Predictor
 * Forecast how many students will show up for meals on a given date.
 */
export async function participationPredictor(
  input: ParticipationInput
): Promise<ParticipationOutput> {
  const provider = getAIProvider();
  const result = await provider.predictParticipation(input);
  await logAIRequest("participation-prediction", input, result, provider.getLastUsageStats());
  return result;
}

/**
 * MODULE 4: Wastage Analyzer
 * Predict food waste and suggest mitigation strategies.
 */
export async function wastageAnalyzer(input: WasteInput): Promise<WasteOutput> {
  const provider = getAIProvider();
  const result = await provider.predictFoodWaste(input);
  await logAIRequest("waste-analysis", input, result, provider.getLastUsageStats());
  return result;
}

/**
 * MODULE 5: Inventory Analyzer
 * Check stock levels, expiry risks, and suggest alternative menus.
 */
export async function inventoryAnalyzer(
  inventory: InventoryItem[]
): Promise<InventoryAnalysisOutput> {
  const provider = getAIProvider();
  const result = await provider.analyzeInventory(inventory);
  await logAIRequest("inventory-analysis", inventory, result, provider.getLastUsageStats());
  return result;
}

/**
 * MODULE 6: Holiday Planner
 * Adjust meal schedule for school closures, festivals, and cultural events.
 */
export async function holidayPlanner(input: HolidayPlanInput): Promise<HolidayPlanOutput> {
  const provider = getAIProvider();
  const result = await provider.suggestHolidayAdjustments(input);
  await logAIRequest("holiday-planning", input, result, provider.getLastUsageStats());
  return result;
}

/**
 * MODULE 7: Recommendation Engine
 * Suggest ingredients to procure based on nutrition gaps and inventory state.
 */
export async function recommendationEngine(
  inventory: InventoryItem[],
  nutritionGaps: string[]
): Promise<RecommendationOutput> {
  const provider = getAIProvider();
  const result = await provider.recommendIngredients(inventory, nutritionGaps);
  await logAIRequest("ingredient-recommendation", { inventory, nutritionGaps }, result, provider.getLastUsageStats());
  return result;
}

/**
 * MODULE 8: Inventory Analyzer alias (re-exported for naming consistency)
 * predictFoodWaste is exposed via wastageAnalyzer above.
 */
export { getAIProvider };
