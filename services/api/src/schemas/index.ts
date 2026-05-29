import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const mealSchema = z.object({
  schoolId: z.string(),
  date: z.string().datetime(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "SNACK"]).default("LUNCH"),
  menuItems: z.array(z.string()).min(1),
  plannedCount: z.number().int().nonnegative(),
  preparedCount: z.number().int().nonnegative(),
  servedCount: z.number().int().nonnegative(),
  notes: z.string().optional(),
  ingredients: z.array(z.object({
    ingredientId: z.string(),
    quantityUsed: z.number().nonnegative(),
    unit: z.string()
  })).default([])
});

export const attendanceSchema = z.object({
  schoolId: z.string(),
  date: z.string().datetime(),
  presentStudents: z.number().int().nonnegative(),
  mealParticipants: z.number().int().nonnegative(),
  absentees: z.number().int().nonnegative()
});

export const distributionSchema = z.object({
  mealId: z.string(),
  servedCount: z.number().int().nonnegative(),
  remainingAmount: z.number().nonnegative(),
  distributionNotes: z.string().optional()
});

export const wastageSchema = z.object({
  mealId: z.string(),
  preparedQuantity: z.number().nonnegative(),
  servedQuantity: z.number().nonnegative(),
  leftoverQuantity: z.number().nonnegative()
});

export const inventoryAdjustSchema = z.object({
  schoolId: z.string(),
  ingredientId: z.string(),
  quantityDelta: z.number(),
  unit: z.string()
});

export const reportSchema = z.object({
  schoolId: z.string(),
  reportType: z.string(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  payloadJson: z.record(z.unknown())
});

export const weightReadingSchema = z.object({
  schoolId: z.string(),
  deviceId: z.string(),
  ingredientName: z.string().optional(),
  weight: z.number().nonnegative(),
  unit: z.string(),
  recordedAt: z.string().datetime()
});

export const schoolCreateSchema = z.object({
  name: z.string().min(1, "School name is required"),
  code: z.string().min(1, "School code/ID is required"),
  district: z.string().min(1, "District is required"),
  block: z.string().min(1, "Block is required"),
  address: z.string().min(1, "Address is required"),
  studentCount: z.number().int().nonnegative().default(0),
  type: z.string().default("SCHOOL")
});

