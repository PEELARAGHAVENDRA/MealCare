import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { schoolCreateSchema } from "../schemas";

export const schoolsRouter = Router();

// Retrieve all institutions with genuine metrics from database
schoolsRouter.get("/schools", requireAuth, async (req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        meals: { take: 10, orderBy: { date: "desc" }, include: { foodWastage: true } },
        attendance: { take: 10, orderBy: { date: "desc" } }
      },
      orderBy: { name: "asc" }
    });

    const formatted = schools.map((school) => {
      const prepared = school.meals.reduce((sum, meal) => sum + meal.preparedCount, 0);
      const served = school.meals.reduce((sum, meal) => sum + meal.servedCount, 0);
      const wasteEntries = school.meals.flatMap((meal) => meal.foodWastage ? [meal.foodWastage] : []);
      const averageWaste = wasteEntries.length > 0 
        ? Number((wasteEntries.reduce((acc, curr) => acc + curr.wastePercentage, 0) / wasteEntries.length).toFixed(1))
        : 0;

      return {
        id: school.id,
        name: school.name,
        code: school.code,
        district: school.district,
        block: school.block,
        address: school.address,
        studentCount: school.studentCount,
        type: school.type,
        prepared,
        served,
        averageWaste
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// Create new institution (restricted to SUPER_ADMIN & DISTRICT_ADMIN)
schoolsRouter.post(
  "/schools",
  requireAuth,
  requireRole("SUPER_ADMIN", "DISTRICT_ADMIN"),
  validateBody(schoolCreateSchema),
  async (req, res, next) => {
    try {
      const { name, code, district, block, address, studentCount, type } = req.body;

      const existing = await prisma.school.findUnique({ where: { code } });
      if (existing) {
        return res.status(400).json({ error: "Institution code/ID is already in use" });
      }

      const school = await prisma.school.create({
        data: {
          name,
          code,
          district,
          block,
          address,
          studentCount,
          type: type || "SCHOOL"
        }
      });

      res.status(201).json(school);
    } catch (error) {
      next(error);
    }
  }
);

// Delete institution (restricted to SUPER_ADMIN & DISTRICT_ADMIN)
schoolsRouter.delete(
  "/schools/:id",
  requireAuth,
  requireRole("SUPER_ADMIN", "DISTRICT_ADMIN"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const school = await prisma.school.findUnique({ where: { id } });
      if (!school) {
        return res.status(404).json({ error: "Institution not found" });
      }

      // Safely delete or detach all relations in a transaction to satisfy foreign key constraints
      await prisma.$transaction(async (tx) => {
        // 1. Detach users linked to this school
        await tx.user.updateMany({
          where: { schoolId: id },
          data: { schoolId: null }
        });

        // 2. Delete meal related children
        const meals = await tx.meal.findMany({
          where: { schoolId: id },
          select: { id: true }
        });
        const mealIds = meals.map((m) => m.id);

        if (mealIds.length > 0) {
          await tx.foodWastage.deleteMany({ where: { mealId: { in: mealIds } } });
          await tx.mealDistribution.deleteMany({ where: { mealId: { in: mealIds } } });
          await tx.mealIngredient.deleteMany({ where: { mealId: { in: mealIds } } });
          await tx.meal.deleteMany({ where: { id: { in: mealIds } } });
        }

        // 3. Delete attendance
        await tx.attendance.deleteMany({ where: { schoolId: id } });

        // 4. Delete inventory
        await tx.inventory.deleteMany({ where: { schoolId: id } });

        // 5. Delete weekly plans and daily plans
        const weeklyPlans = await tx.weeklyPlan.findMany({
          where: { schoolId: id },
          select: { id: true }
        });
        const planIds = weeklyPlans.map((p) => p.id);
        if (planIds.length > 0) {
          await tx.weeklyPlanDay.deleteMany({ where: { weeklyPlanId: { in: planIds } } });
          await tx.weeklyPlan.deleteMany({ where: { id: { in: planIds } } });
        }

        // 6. Delete reports
        await tx.report.deleteMany({ where: { schoolId: id } });

        // 7. Delete AI predictions and recommendations
        await tx.aiPrediction.deleteMany({ where: { schoolId: id } });
        await tx.aiRecommendation.deleteMany({ where: { schoolId: id } });

        // 8. Delete evidence, calendar, compliance reports
        await tx.mealEvidence.deleteMany({ where: { schoolId: id } });
        await tx.mealCalendar.deleteMany({ where: { schoolId: id } });
        await tx.complianceReport.deleteMany({ where: { schoolId: id } });

        // 9. Delete the school itself
        await tx.school.delete({ where: { id } });
      });

      return res.json({ success: true, message: `Institution "${school.name}" deleted successfully.` });
    } catch (error) {
      next(error);
    }
  }
);
