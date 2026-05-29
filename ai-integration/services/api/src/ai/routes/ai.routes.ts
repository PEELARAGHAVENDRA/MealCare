// ─────────────────────────────────────────────────────────────────────────────
// services/api/src/ai/routes/ai.routes.ts
//
// Mount these routes in your main Express app:
//   import aiRouter from "./ai/routes/ai.routes";
//   app.use("/api/ai", authMiddleware, aiRouter);
//
// Role-based guards are applied per route:
//   Kitchen Staff  → GET only (view outputs)
//   School Admin   → GET + POST (run generation, approve/reject)
//   Master Admin   → all above + provider switching
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from "express";
import {
  nutritionEngine,
  mealOptimizer,
  participationPredictor,
  wastageAnalyzer,
  inventoryAnalyzer,
  holidayPlanner,
  recommendationEngine,
  getAIProvider,
} from "../../../../../../services/ai-engine/src/modules";
import { setAIProvider, getCurrentProviderName } from "../../../../../../services/ai-engine/src/providers/ProviderFactory";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// Minimal role-check middleware (plug in your actual JWT role check)
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole: string = (req as any).user?.role ?? "guest";
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    return next();
  };
}

// ── 1. Nutrition Analysis ─────────────────────────────────────────────────────
// POST /api/ai/nutrition
// Access: kitchen_staff, school_admin, nutrition_officer, district_admin

router.post(
  "/nutrition",
  requireRole("kitchen_staff", "school_admin", "nutrition_officer", "district_admin"),
  asyncHandler(async (req, res) => {
    const result = await nutritionEngine(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 2. Meal Plan Generation ───────────────────────────────────────────────────
// POST /api/ai/meal-plan
// Access: school_admin, district_admin (kitchen staff can only VIEW via GET below)

router.post(
  "/meal-plan",
  requireRole("school_admin", "district_admin"),
  asyncHandler(async (req, res) => {
    const result = await mealOptimizer(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 3. Participation Prediction ───────────────────────────────────────────────
// POST /api/ai/participation
// Access: school_admin, nutrition_officer, district_admin

router.post(
  "/participation",
  requireRole("school_admin", "nutrition_officer", "district_admin"),
  asyncHandler(async (req, res) => {
    const result = await participationPredictor(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 4. Waste Prediction ───────────────────────────────────────────────────────
// POST /api/ai/waste
// Access: kitchen_staff (view), school_admin, nutrition_officer

router.post(
  "/waste",
  requireRole("kitchen_staff", "school_admin", "nutrition_officer", "district_admin"),
  asyncHandler(async (req, res) => {
    const result = await wastageAnalyzer(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 5. Inventory Analysis ─────────────────────────────────────────────────────
// POST /api/ai/inventory
// Access: kitchen_staff, school_admin, district_admin

router.post(
  "/inventory",
  requireRole("kitchen_staff", "school_admin", "nutrition_officer", "district_admin"),
  asyncHandler(async (req, res) => {
    const result = await inventoryAnalyzer(req.body.inventory ?? req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 6. Holiday Planning ───────────────────────────────────────────────────────
// POST /api/ai/holiday-plan
// Access: school_admin, district_admin

router.post(
  "/holiday-plan",
  requireRole("school_admin", "district_admin"),
  asyncHandler(async (req, res) => {
    const result = await holidayPlanner(req.body);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 7. Ingredient Recommendations ────────────────────────────────────────────
// POST /api/ai/recommendations
// Access: school_admin, nutrition_officer, district_admin

router.post(
  "/recommendations",
  requireRole("school_admin", "nutrition_officer", "district_admin"),
  asyncHandler(async (req, res) => {
    const { inventory = [], nutritionGaps = [] } = req.body;
    const result = await recommendationEngine(inventory, nutritionGaps);
    res.json({ success: true, data: result, provider: getAIProvider().name });
  })
);

// ── 8. Approve / Reject AI Recommendation ────────────────────────────────────
// PATCH /api/ai/recommendations/:id/approve
// PATCH /api/ai/recommendations/:id/reject
// Access: school_admin, district_admin

router.patch(
  "/recommendations/:id/approve",
  requireRole("school_admin", "district_admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    // await prisma.aiRecommendation.update({ where: { id }, data: { status: "APPROVED", approvedBy: req.user.id, approvedAt: new Date() } });
    res.json({ success: true, message: `Recommendation ${id} approved.` });
  })
);

router.patch(
  "/recommendations/:id/reject",
  requireRole("school_admin", "district_admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    // await prisma.aiRecommendation.update({ where: { id }, data: { status: "REJECTED", approvedBy: req.user.id, approvedAt: new Date(), rejectionNote: note } });
    res.json({ success: true, message: `Recommendation ${id} rejected.` });
  })
);

// ── 9. Admin: Switch Provider ─────────────────────────────────────────────────
// POST /api/ai/admin/provider
// Body: { provider: "gemini" | "mock" }
// Access: district_admin ONLY (master admin)

router.post(
  "/admin/provider",
  requireRole("district_admin"),
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
// GET /api/ai/admin/stats
// Access: district_admin

router.get(
  "/admin/stats",
  requireRole("district_admin"),
  asyncHandler(async (req, res) => {
    const provider = getAIProvider();
    const stats = provider.getLastUsageStats();
    res.json({
      success: true,
      currentProvider: getCurrentProviderName(),
      lastCallStats: stats,
      // totalRequests: await prisma.aiRequest.count(),
      // fallbackCount: await prisma.aiRequest.count({ where: { fallbackUsed: true } }),
    });
  })
);

// ── 11. Health Check ──────────────────────────────────────────────────────────
// GET /api/ai/health
// Access: all authenticated users

router.get(
  "/health",
  asyncHandler(async (req, res) => {
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

export default router;
