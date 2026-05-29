// ─────────────────────────────────────────────────────────────────────────────
// services/api/src/routes/ai.ts
//
// AI routes — calls the in-process AI engine (no external service needed).
// Uses the project's existing auth middleware and Prisma client.
//
// Endpoints:
//   POST /nutrition            — Analyze meal nutrition
//   POST /meal-plan            — Generate weekly meal plan
//   POST /participation        — Predict student participation
//   POST /waste                — Predict food waste
//   POST /inventory            — Analyze inventory health
//   POST /holiday-plan         — Adjust schedule for holidays
//   POST /recommendations      — Get ingredient recommendations
//   PATCH /recommendations/:id/approve — Approve a recommendation
//   PATCH /recommendations/:id/reject  — Reject a recommendation
//   POST /admin/provider       — Switch AI provider (district admin)
//   GET  /admin/stats          — View AI usage stats (district admin)
//   GET  /health               — AI health check
//   GET  /nutrition-data       — Existing: read nutrition data table
//   GET  /recommendations      — Existing: list recommendations
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { DayMealPlan } from "@midday/shared-contracts";
import {
  nutritionEngine,
  mealOptimizer,
  participationPredictor,
  wastageAnalyzer,
  inventoryAnalyzer,
  holidayPlanner,
  recommendationEngine,
  getAIProvider,
  analyzeWeeklyPlan,
} from "../ai-engine/modules";
import {
  setAIProvider,
  getCurrentProviderName,
} from "../ai-engine/providers/ProviderFactory";

export const aiRouter = Router();

aiRouter.use(requireAuth);

// ── Helpers ───────────────────────────────────────────────────────────────────

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// ── Existing: Nutrition Data Table ────────────────────────────────────────────
// GET /nutrition-data

aiRouter.get("/nutrition-data", async (_req, res, next) => {
  try {
    const data = await prisma.nutritionData.findMany({ orderBy: { foodItem: "asc" } });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ── 1. Nutrition Analysis ─────────────────────────────────────────────────────
// POST /ai/nutrition

aiRouter.post(
  "/ai/nutrition",
  requireRole("KITCHEN_STAFF", "SCHOOL_HEAD", "NUTRITION_OFFICER", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const result = await nutritionEngine(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 1.5 Food Image Scanning (Google Lens Simulation) ─────────────────────────
// POST /ai/scan-food
aiRouter.post(
  "/ai/scan-food",
  requireRole("STUDENT_PARENT", "TEACHER", "SCHOOL_HEAD", "SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const { image, mimeType } = req.body;
    if (!image) {
      res.status(400).json({ error: "Missing image data (base64 string)" });
      return;
    }
    const result = await getAIProvider().scanFoodImage(image, mimeType || "image/jpeg");
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 2. Meal Plan Generation ───────────────────────────────────────────────────
// POST /ai/meal-plan

aiRouter.post(
  "/ai/meal-plan",
  requireRole("SCHOOL_HEAD", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const result = await mealOptimizer(req.body);

    // Optionally persist the generated plan
    if (req.body.schoolId && req.body.weekStartDate) {
      const saved = await prisma.weeklyPlan.create({
        data: {
          schoolId: req.body.schoolId,
          weekStartDate: new Date(req.body.weekStartDate),
          generatedById: req.user?.sub,
          totalCostEstimate: result.estimatedCostPerStudent,
          weeklyNutritionScore: result.overallNutritionScore,
          days: {
            create: result.weeklySchedule.map((day: DayMealPlan) => ({
              dayOfWeek: day.date,
              menuItems: [day.breakfast.name, day.lunch.name, ...(day.dinner ? [day.dinner.name] : [])],
              calories: day.breakfast.estimatedCalories + day.lunch.estimatedCalories + (day.dinner?.estimatedCalories ?? 0),
              protein: 0,
              vitaminScore: 0,
              costEstimate: day.breakfast.estimatedCost + day.lunch.estimatedCost + (day.dinner?.estimatedCost ?? 0),
            })),
          },
        },
        include: { days: true },
      });

      res.status(201).json({ success: true, data: result, savedPlanId: saved.id, provider: getAIProvider().name });
      return;
    }

    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 3. Participation Prediction ───────────────────────────────────────────────
// POST /ai/participation

aiRouter.post(
  "/ai/participation",
  requireRole("SCHOOL_HEAD", "NUTRITION_OFFICER", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const result = await participationPredictor(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 4. Waste Prediction ───────────────────────────────────────────────────────
// POST /ai/waste

aiRouter.post(
  "/ai/waste",
  requireRole("KITCHEN_STAFF", "SCHOOL_HEAD", "NUTRITION_OFFICER", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const result = await wastageAnalyzer(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 5. Inventory Analysis ─────────────────────────────────────────────────────
// POST /ai/inventory

aiRouter.post(
  "/ai/inventory",
  requireRole("KITCHEN_STAFF", "SCHOOL_HEAD", "NUTRITION_OFFICER", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const result = await inventoryAnalyzer(req.body.inventory ?? req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 6. Holiday Planning ───────────────────────────────────────────────────────
// POST /ai/holiday-plan

aiRouter.post(
  "/ai/holiday-plan",
  requireRole("SCHOOL_HEAD", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const result = await holidayPlanner(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 7. Ingredient Recommendations ────────────────────────────────────────────
// POST /ai/recommendations

aiRouter.post(
  "/ai/recommendations",
  requireRole("SCHOOL_HEAD", "NUTRITION_OFFICER", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const { inventory = [], nutritionGaps = [] } = req.body;
    const result = await recommendationEngine(inventory, nutritionGaps);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 8. Approve / Reject AI Recommendation ────────────────────────────────────
// PATCH /ai/recommendations/:id/approve
// PATCH /ai/recommendations/:id/reject

aiRouter.patch(
  "/ai/recommendations/:id/approve",
  requireRole("SCHOOL_HEAD", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.aiRecommendation.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: req.user?.sub,
        approvedAt: new Date(),
      },
    });
    res.json({ success: true, message: `Recommendation ${id} approved.` });
  })
);

aiRouter.patch(
  "/ai/recommendations/:id/reject",
  requireRole("SCHOOL_HEAD", "DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    await prisma.aiRecommendation.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedBy: req.user?.sub,
        approvedAt: new Date(),
        rejectionNote: note,
      },
    });
    res.json({ success: true, message: `Recommendation ${id} rejected.` });
  })
);

// ── 9. Admin: Switch Provider ─────────────────────────────────────────────────
// POST /ai/admin/provider

aiRouter.post(
  "/ai/admin/provider",
  requireRole("DISTRICT_ADMIN"),
  asyncHandler(async (req, res) => {
    const { provider } = req.body as { provider: "gemini" | "mock" };
    if (!["gemini", "mock"].includes(provider)) {
      res.status(400).json({ error: "Invalid provider. Use: gemini | mock" });
      return;
    }
    setAIProvider(provider);
    res.json({ success: true, message: `AI provider switched to "${provider}".`, current: provider });
  })
);

// ── 10. Admin: Usage Stats ────────────────────────────────────────────────────
// GET /ai/admin/stats

aiRouter.get(
  "/ai/admin/stats",
  requireRole("DISTRICT_ADMIN"),
  asyncHandler(async (_req, res) => {
    const provider = getAIProvider();
    const stats = provider.getLastUsageStats();
    const totalRequests = await prisma.aiRequest.count();
    const fallbackCount = await prisma.aiRequest.count({ where: { fallbackUsed: true } });
    res.json({
      success: true,
      currentProvider: getCurrentProviderName(),
      lastCallStats: stats,
      totalRequests,
      fallbackCount,
    });
  })
);

// ── 11. Health Check ──────────────────────────────────────────────────────────
// GET /ai/health

aiRouter.get(
  "/ai/health",
  asyncHandler(async (_req, res) => {
    const providerName = getCurrentProviderName();
    res.json({
      status: "ok",
      provider: providerName,
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.MODEL_NAME ?? "gemini-2.5-flash",
      fallbackAvailable: true,
    });
  })
);

// ── Existing: List Recommendations ────────────────────────────────────────────
// GET /ai/recommendations

aiRouter.get("/ai/recommendations", async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId ?? "");
    const recommendations = await prisma.aiRecommendation.findMany({
      where: schoolId ? { schoolId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

// ── GET /ai/weekly-plan ───────────────────────────────────────────────────────
aiRouter.get("/ai/weekly-plan", async (req, res, next) => {
  try {
    let schoolId = String(req.query.schoolId ?? req.user?.schoolId ?? "");
    if (!schoolId || schoolId === "demo-school") {
      const school = await prisma.school.findFirst({
        where: { OR: [{ code: "GOV-SCH-001" }, { id: "demo-school" }] }
      }) || await prisma.school.findFirst();
      schoolId = school?.id || "";
    }
    if (!schoolId) {
      return res.json({ success: false, error: "School context required" });
    }
    const plan = await prisma.weeklyPlan.findFirst({
      where: { schoolId },
      orderBy: { weekStartDate: "desc" },
      include: { days: true }
    });
    res.json({ success: true, plan });
  } catch (error) {
    next(error);
  }
});

// ── POST /ai/weekly-plan/save ─────────────────────────────────────────────────
aiRouter.post(
  "/ai/weekly-plan/save",
  requireRole("KITCHEN_STAFF", "SUPER_ADMIN", "NUTRITION_OFFICER", "SCHOOL_HEAD"),
  async (req, res, next) => {
    try {
      let { schoolId, weekStartDate, schedule, status } = req.body;
      if (!schoolId || schoolId === "demo-school") {
        const school = await prisma.school.findFirst({
          where: { OR: [{ code: "GOV-SCH-001" }, { id: "demo-school" }] }
        }) || await prisma.school.findFirst();
        schoolId = school?.id || "";
      }
      if (!schoolId) {
        return res.status(400).json({ error: "schoolId is required and must be valid" });
      }

      const parsedStartDate = new Date(weekStartDate || new Date());

      // Find existing plan for the week, or create a new one
      let plan = await prisma.weeklyPlan.findFirst({
        where: {
          schoolId,
          weekStartDate: parsedStartDate
        }
      });

      if (plan) {
        // Delete existing days
        await prisma.weeklyPlanDay.deleteMany({
          where: { weeklyPlanId: plan.id }
        });
        
        // Update plan status
        plan = await prisma.weeklyPlan.update({
          where: { id: plan.id },
          data: {
            status: status || "DRAFT",
            weeklyNutritionScore: 85,
            totalCostEstimate: 20
          }
        });
      } else {
        plan = await prisma.weeklyPlan.create({
          data: {
            schoolId,
            weekStartDate: parsedStartDate,
            status: status || "DRAFT",
            weeklyNutritionScore: 85,
            totalCostEstimate: 20
          }
        });
      }

      // Create the new days
      await prisma.weeklyPlanDay.createMany({
        data: schedule.map((day: any) => ({
          weeklyPlanId: plan!.id,
          dayOfWeek: day.day,
          menuItems: [day.morning || "", day.afternoon || "", day.evening || "", day.dinner || ""],
          calories: 450,
          protein: 15,
          vitaminScore: 85,
          costEstimate: 20
        }))
      });

      // Retrieve the fully saved plan
      const savedPlan = await prisma.weeklyPlan.findUnique({
        where: { id: plan.id },
        include: { days: true }
      });

      // Analyze plan with Gemini
      const analysis = await analyzeWeeklyPlan(schedule);

      res.json({
        success: true,
        plan: savedPlan,
        analysis
      });
    } catch (error) {
      next(error);
    }
  }
);
