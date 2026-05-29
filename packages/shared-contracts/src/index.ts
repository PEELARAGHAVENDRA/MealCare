export const roles = [
  "SUPER_ADMIN",
  "DISTRICT_ADMIN",
  "NUTRITION_OFFICER",
  "SCHOOL_HEAD",
  "KITCHEN_STAFF",
  "TEACHER",
  "STUDENT_PARENT"
] as const;

export type UserRole = (typeof roles)[number];

export const mealTypes = ["BREAKFAST", "LUNCH", "SNACK"] as const;
export type MealType = (typeof mealTypes)[number];

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  iron: number;
  calcium: number;
  vitaminA: number;
  vitaminB: number;
  vitaminC: number;
  vitaminD: number;
  fiber: number;
};

export type Deficiency = {
  nutrient: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  suggestedAdditions: string[];
};

export type WeeklyPlanDay = {
  dayOfWeek: string;
  menuItems: string[];
  calories: number;
  protein: number;
  vitaminScore: number;
  costEstimate: number;
};

// ── AI Engine Types ───────────────────────────────────────────────────────────
export * from "./ai-types";

