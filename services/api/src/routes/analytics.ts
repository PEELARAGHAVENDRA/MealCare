import { Router } from "express";
import { prisma } from "../lib/prisma";
import { average, calculateMealParticipation } from "../lib/analytics-metrics";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireSchoolAccess } from "../middleware/scope";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/analytics/school/:schoolId", requireSchoolAccess((req) => req.params.schoolId), async (req, res, next) => {
  try {
    const schoolId = req.params.schoolId;
    const [meals, attendance, wastage, recommendations] = await Promise.all([
      prisma.meal.findMany({ where: { schoolId }, orderBy: { date: "asc" }, take: 30 }),
      prisma.attendance.findMany({ where: { schoolId }, orderBy: { date: "asc" }, take: 30 }),
      prisma.foodWastage.findMany({ where: { meal: { schoolId } }, include: { meal: true }, take: 30 }),
      prisma.aiRecommendation.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, take: 10 })
    ]);

    const totalPrepared = meals.reduce((sum, meal) => sum + meal.preparedCount, 0);
    const totalServed = meals.reduce((sum, meal) => sum + meal.servedCount, 0);
    const averageWaste = average(wastage.map((item) => item.wastePercentage));
    const mealParticipation = attendance.map((item) => ({
      date: item.date,
      percentage: calculateMealParticipation(item.presentStudents, item.mealParticipants)
    }));

    res.json({ totalPrepared, totalServed, averageWaste, mealParticipation, meals, wastage, recommendations });
  } catch (error) {
    next(error);
  }
});

analyticsRouter.get("/analytics/district", requireRole("SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"), async (_req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        meals: { take: 10, orderBy: { date: "desc" }, include: { foodWastage: true } },
        attendance: { take: 10, orderBy: { date: "desc" } }
      }
    });

    const comparison = schools.map((school) => {
      const prepared = school.meals.reduce((sum, meal) => sum + meal.preparedCount, 0);
      const served = school.meals.reduce((sum, meal) => sum + meal.servedCount, 0);
      const wasteEntries = school.meals.flatMap((meal) => meal.foodWastage ? [meal.foodWastage] : []);
      const averageWaste = average(wasteEntries.map((item) => item.wastePercentage));

      return { id: school.id, name: school.name, code: school.code, district: school.district, type: school.type, prepared, served, averageWaste };
    });

    res.json({ schools: comparison });
  } catch (error) {
    next(error);
  }
});
