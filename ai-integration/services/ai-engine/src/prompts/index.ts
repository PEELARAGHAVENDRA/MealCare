// ─────────────────────────────────────────────────────────────────────────────
// services/ai-engine/src/prompts/index.ts
// Centralised prompt factory. Each function returns a ready-to-send string.
// Keep AI logic here — providers just call these and forward to the LLM API.
// ─────────────────────────────────────────────────────────────────────────────

import {
  NutritionInput,
  MealPlanInput,
  ParticipationInput,
  WasteInput,
  InventoryItem,
  HolidayPlanInput,
} from "../../../../packages/shared-contracts/src/ai/types";

// ── System Prompt (shared context for all calls) ──────────────────────────────

export const SYSTEM_PROMPT = `
You are an expert nutrition scientist and school meal planner for India's Mid-Day Meal scheme.
You deeply understand:
- Indian dietary norms, regional food habits and seasonal availability
- ICMR (Indian Council of Medical Research) child nutrition guidelines
- Budget constraints of government school meal programs (typically ₹8–15 per student/day)
- Food safety, wastage minimisation, and supply chain realities in rural/semi-urban India

Always respond with ONLY valid JSON. Do not include markdown code fences, explanations, or
any text outside the JSON object. The schema is specified in each prompt.
`.trim();

// ── 1. Nutrition Analysis ─────────────────────────────────────────────────────

export function nutritionPrompt(input: NutritionInput): string {
  return `
Analyze the nutritional content of the following school meal ingredients for Indian students.

Ingredients: ${input.ingredients.join(", ")}
Serving size: ${input.servingSize ?? 100}g per student
Student age group: ${input.studentAge ?? "6-14"}

Respond with this exact JSON schema:
{
  "calories": <number kcal>,
  "protein": <number grams>,
  "carbohydrates": <number grams>,
  "fat": <number grams>,
  "iron": <number mg>,
  "vitaminA": <number mcg>,
  "vitaminC": <number mg>,
  "vitaminScore": <0-100 composite score>,
  "deficiencyAlerts": [
    { "nutrient": "<name>", "severity": "low|medium|high", "message": "<actionable message>" }
  ],
  "recommendations": ["<string>"],
  "overallScore": <0-100>
}
`.trim();
}

// ── 2. Weekly Meal Plan ───────────────────────────────────────────────────────

export function plannerPrompt(input: MealPlanInput): string {
  const inventory = input.availableInventory
    .map((i) => `${i.name}: ${i.quantityKg}kg`)
    .join(", ");

  return `
Create an optimized weekly meal schedule for an Indian government school.

Context:
- Students: ${input.studentCount}
- Budget: ₹${input.budgetPerStudentPerDay} per student per day
- Working days: ${input.workingDays.join(", ")}
- Holidays (skip these dates): ${input.holidayList.join(", ") || "none"}
- Available inventory: ${inventory}
- Previous meals (avoid repetition): ${(input.previousMeals ?? []).join(", ") || "none"}
- Dietary opt-outs/restrictions: ${(input.optOuts ?? []).join(", ") || "none"}

Rules:
1. Follow ICMR nutrition guidelines for school children
2. Must stay within budget
3. Prefer seasonal, locally available ingredients
4. Breakfast should be lighter than lunch
5. No pork or beef (government meal scheme restriction)

Respond with this exact JSON schema:
{
  "weeklySchedule": [
    {
      "date": "<YYYY-MM-DD>",
      "breakfast": {
        "name": "<string>",
        "ingredients": ["<string>"],
        "estimatedCalories": <number>,
        "estimatedCost": <number INR per student>,
        "nutritionHighlights": ["<string>"],
        "prepTime": <minutes>
      },
      "lunch": { <same shape as breakfast> },
      "dinner": null
    }
  ],
  "overallNutritionScore": <0-100>,
  "estimatedCostPerStudent": <number INR for the week>,
  "substitutions": [
    { "original": "<ingredient>", "substitute": "<ingredient>", "reason": "<string>" }
  ],
  "notes": "<string>"
}
`.trim();
}

// ── 3. Participation Prediction ───────────────────────────────────────────────

export function predictionPrompt(input: ParticipationInput): string {
  const recentAttendance = input.historicalAttendance
    .slice(-10)
    .map((r) => `${r.date}: ${r.present}/${r.total}`)
    .join(", ");

  const recentOptOuts = input.mealOptOutData
    .slice(-5)
    .map((o) => `${o.date}: ${o.count} opt-outs`)
    .join(", ");

  return `
Predict student meal participation for an Indian government school.

Date to predict: ${input.date} (${input.dayType})
Total enrolled students: ${input.totalStudents}
Recent attendance (last 10 days): ${recentAttendance}
Recent meal opt-outs (last 5 days): ${recentOptOuts}
Upcoming holidays near this date: ${input.holidayData.map((h) => `${h.date} - ${h.name}`).join(", ") || "none"}

Respond with this exact JSON schema:
{
  "expectedMealCount": <integer>,
  "confidencePercent": <0-100>,
  "attendanceRate": <0.0-1.0>,
  "breakdownByGrade": [
    { "grade": "<string>", "expectedCount": <integer> }
  ],
  "factors": ["<string explaining a factor that influenced prediction>"]
}
`.trim();
}

// ── 4. Food Waste Prediction ──────────────────────────────────────────────────

export function wastagePrompt(input: WasteInput): string {
  const prepared = input.preparedMeals.map((m) => `${m.mealName}: ${m.quantityKg}kg`).join(", ");
  const served = input.servedMeals.map((m) => `${m.mealName}: ${m.quantityKg}kg`).join(", ");
  const historical = input.historicalWaste
    .slice(-7)
    .map((w) => `${w.date} ${w.mealName}: ${w.wasteKg}kg`)
    .join(", ");

  return `
Predict food waste for an Indian government school mid-day meal program.

Date: ${input.date}
Prepared today: ${prepared}
Served so far today: ${served}
Opt-outs today: ${input.optOuts}
Historical waste (last 7 records): ${historical}

Respond with this exact JSON schema:
{
  "predictedLeftoversKg": <number>,
  "wasteRiskLevel": "low|medium|high",
  "wasteRiskPercent": <0-100>,
  "suggestions": ["<actionable suggestion>"],
  "costImpact": <number INR>
}
`.trim();
}

// ── 5. Inventory Analysis ─────────────────────────────────────────────────────

export function inventoryPrompt(inventory: InventoryItem[]): string {
  const items = inventory
    .map(
      (i) =>
        `${i.name}: ${i.quantityKg}kg${i.expiryDate ? ` (expires ${i.expiryDate})` : ""}${i.minStockKg ? ` min:${i.minStockKg}kg` : ""}`
    )
    .join("\n");

  return `
Analyze the current inventory for an Indian government school mid-day meal kitchen.

Current inventory:
${items}

Context: This is a school kitchen serving ~200-500 students daily. Restock cycles are weekly.

Respond with this exact JSON schema:
{
  "lowStockAlerts": [
    { "item": "<string>", "currentStock": <number>, "minRequired": <number>, "daysRemaining": <integer>, "severity": "critical|warning|info" }
  ],
  "expiryWarnings": [
    { "item": "<string>", "expiresIn": <days>, "quantityKg": <number>, "suggestion": "<string>" }
  ],
  "alternativeMenuSuggestions": ["<meal idea that uses current stock optimally>"],
  "priorityConsumptionList": [
    { "name": "<ingredient>", "reason": "<string>", "suggestedMeals": ["<meal name>"] }
  ],
  "overallHealthScore": <0-100>
}
`.trim();
}

// ── 6. Holiday Planning ───────────────────────────────────────────────────────

export function holidayPrompt(input: HolidayPlanInput): string {
  const festivals = input.festivalList
    .map((f) => `${f.date}: ${f.name} (${f.region})${f.dietaryConsiderations ? ` - dietary note: ${f.dietaryConsiderations}` : ""}`)
    .join("\n");

  const calendar = input.schoolCalendar
    .filter((e) => e.affectsMeals)
    .map((e) => `${e.date}: ${e.event}`)
    .join("\n");

  return `
Adjust the school meal schedule for holidays and festivals.

School calendar events affecting meals:
${calendar || "none"}

Festivals and cultural occasions:
${festivals || "none"}

School closures (no meals on these dates): ${input.closures.join(", ") || "none"}

Current meal schedule dates: ${input.currentMealSchedule.map((d) => d.date).join(", ")}

Rules:
1. Disable all meals on closure/holiday dates
2. Suggest special culturally appropriate festival meals
3. Shift displaced meal plans to nearby working days if possible
4. Consider fasting practices (e.g. no non-veg on certain festival days)

Respond with this exact JSON schema:
{
  "disabledMealDates": ["<YYYY-MM-DD>"],
  "shiftedPlans": [
    { "originalDate": "<YYYY-MM-DD>", "newDate": "<YYYY-MM-DD>", "meal": { "name": "<string>", "ingredients": [], "estimatedCalories": 0, "estimatedCost": 0, "nutritionHighlights": [], "prepTime": 0 }, "reason": "<string>" }
  ],
  "adjustedSchedule": [],
  "festivalSpecialMeals": [
    { "date": "<YYYY-MM-DD>", "festival": "<name>", "specialMeal": { "name": "<string>", "ingredients": [], "estimatedCalories": 0, "estimatedCost": 0, "nutritionHighlights": [], "prepTime": 0 } }
  ],
  "notes": "<string>"
}
`.trim();
}

// ── 7. Ingredient Recommendation ─────────────────────────────────────────────

export function recommendationPrompt(
  inventory: InventoryItem[],
  nutritionGaps: string[]
): string {
  const currentItems = inventory.map((i) => i.name).join(", ");

  return `
Recommend ingredients for an Indian government school to procure next week.

Current inventory: ${currentItems}
Identified nutrition gaps: ${nutritionGaps.join(", ") || "none identified"}

Consider: seasonal availability in India, local market prices, storage life, and ICMR child nutrition guidelines.

Respond with this exact JSON schema:
{
  "ingredients": [
    { "name": "<string>", "reason": "<string>", "nutritionBenefit": "<string>", "estimatedCostPerKg": <number INR>, "priority": "high|medium|low" }
  ],
  "mealIdeas": ["<meal name using recommended ingredients>"],
  "nutritionGaps": ["<gap description>"],
  "seasonalSuggestions": ["<currently seasonal ingredient and why>"]
}
`.trim();
}
