// ─────────────────────────────────────────────────────────────────────────────
// packages/shared-contracts/src/ai-types.ts
// Shared AI types used across services and frontend
// ─────────────────────────────────────────────────────────────────────────────

// ── Nutrition ─────────────────────────────────────────────────────────────────

export interface NutritionInput {
  ingredients: string[]; // e.g. ["Rice", "Dal", "Egg", "Spinach", "Banana"]
  servingSize?: number;   // grams per serving, default 100
  studentAge?: string;   // "6-10" | "11-14" | "15-18"
}

export interface NutritionOutput {
  calories: number;
  protein: number;       // grams
  carbohydrates: number; // grams
  fat: number;           // grams
  iron: number;          // mg
  vitaminA: number;      // mcg
  vitaminC: number;      // mg
  vitaminScore: number;  // 0-100 composite
  deficiencyAlerts: DeficiencyAlert[];
  recommendations: string[];
  overallScore: number;  // 0-100
}

export interface DeficiencyAlert {
  nutrient: string;
  severity: "low" | "medium" | "high";
  message: string;
}

// ── Weekly Meal Plan ──────────────────────────────────────────────────────────

export interface MealPlanInput {
  studentCount: number;
  budgetPerStudentPerDay: number; // INR
  workingDays: string[];          // ISO dates e.g. "2025-06-02"
  holidayList: string[];          // ISO dates
  availableInventory: InventoryItem[];
  previousMeals?: string[];       // recent meal names to avoid repetition
  optOuts?: string[];             // dietary restrictions
  schoolId: string;
}

export interface MealPlanOutput {
  weeklySchedule: DayMealPlan[];
  overallNutritionScore: number;
  estimatedCostPerStudent: number;
  substitutions: Substitution[];
  notes: string;
}

export interface DayMealPlan {
  date: string;
  breakfast: Meal;
  lunch: Meal;
  dinner?: Meal;
}

export interface Meal {
  name: string;
  ingredients: string[];
  estimatedCalories: number;
  estimatedCost: number;        // INR per student
  nutritionHighlights: string[];
  prepTime: number;             // minutes
}

export interface Substitution {
  original: string;
  substitute: string;
  reason: string;
}

// ── Participation Prediction ──────────────────────────────────────────────────

export interface ParticipationInput {
  date: string;
  historicalAttendance: AttendanceRecord[];
  mealOptOutData: OptOutRecord[];
  holidayData: HolidayRecord[];
  dayType: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  schoolId: string;
  totalStudents: number;
}

export interface ParticipationOutput {
  expectedMealCount: number;
  confidencePercent: number;
  attendanceRate: number;        // 0-1
  breakdownByGrade?: GradeBreakdown[];
  factors: string[];             // what drove the prediction
}

export interface AttendanceRecord {
  date: string;
  present: number;
  total: number;
}

export interface OptOutRecord {
  date: string;
  count: number;
  reason?: string;
}

export interface HolidayRecord {
  date: string;
  name: string;
  type: "national" | "school" | "local";
}

export interface GradeBreakdown {
  grade: string;
  expectedCount: number;
}

// ── Food Waste Prediction ─────────────────────────────────────────────────────

export interface WasteInput {
  date: string;
  preparedMeals: PreparedMealRecord[];
  servedMeals: ServedMealRecord[];
  optOuts: number;
  historicalWaste: WasteRecord[];
}

export interface WasteOutput {
  predictedLeftoversKg: number;
  wasteRiskLevel: "low" | "medium" | "high";
  wasteRiskPercent: number;
  suggestions: string[];
  costImpact: number; // INR
}

export interface PreparedMealRecord {
  mealName: string;
  quantityKg: number;
}

export interface ServedMealRecord {
  mealName: string;
  quantityKg: number;
}

export interface WasteRecord {
  date: string;
  wasteKg: number;
  mealName: string;
}

// ── Inventory Analysis ────────────────────────────────────────────────────────

export interface InventoryItem {
  name: string;
  quantityKg: number;
  unit?: string;
  expiryDate?: string; // ISO date
  minStockKg?: number;
}

export interface InventoryAnalysisOutput {
  lowStockAlerts: LowStockAlert[];
  expiryWarnings: ExpiryWarning[];
  alternativeMenuSuggestions: string[];
  priorityConsumptionList: PriorityItem[];
  overallHealthScore: number; // 0-100
}

export interface LowStockAlert {
  item: string;
  currentStock: number;
  minRequired: number;
  daysRemaining: number;
  severity: "critical" | "warning" | "info";
}

export interface ExpiryWarning {
  item: string;
  expiresIn: number; // days
  quantityKg: number;
  suggestion: string;
}

export interface PriorityItem {
  name: string;
  reason: string;
  suggestedMeals: string[];
}

// ── Holiday Planning ──────────────────────────────────────────────────────────

export interface HolidayPlanInput {
  schoolCalendar: SchoolCalendarEvent[];
  festivalList: Festival[];
  closures: string[]; // ISO dates
  currentMealSchedule: DayMealPlan[];
}

export interface HolidayPlanOutput {
  disabledMealDates: string[];
  shiftedPlans: ShiftedPlan[];
  adjustedSchedule: DayMealPlan[];
  festivalSpecialMeals: FestivalMeal[];
  notes: string;
}

export interface SchoolCalendarEvent {
  date: string;
  event: string;
  affectsMeals: boolean;
}

export interface Festival {
  date: string;
  name: string;
  region: string;
  dietaryConsiderations?: string;
}

export interface ShiftedPlan {
  originalDate: string;
  newDate: string;
  meal: Meal;
  reason: string;
}

export interface FestivalMeal {
  date: string;
  festival: string;
  specialMeal: Meal;
}

// ── Recommendation ────────────────────────────────────────────────────────────

export interface RecommendationOutput {
  ingredients: IngredientRecommendation[];
  mealIdeas: string[];
  nutritionGaps: string[];
  seasonalSuggestions: string[];
}

export interface IngredientRecommendation {
  name: string;
  reason: string;
  nutritionBenefit: string;
  estimatedCostPerKg: number;
  priority: "high" | "medium" | "low";
}

// ── Provider Meta ─────────────────────────────────────────────────────────────

export type AIProviderName = "gemini" | "mock" | "future";

export interface AIUsageStats {
  provider: AIProviderName;
  model: string;
  tokensUsed: number;
  requestType: string;
  latencyMs: number;
  success: boolean;
  fallbackUsed: boolean;
}
