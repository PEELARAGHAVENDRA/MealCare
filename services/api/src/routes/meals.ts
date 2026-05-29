import { Router } from "express";
import { prisma } from "../lib/prisma";
import { calculateWastePercentage } from "../lib/meal-metrics";
import { requireAuth } from "../middleware/auth";
import { requireSchoolAccess } from "../middleware/scope";
import { validateBody } from "../middleware/validate";
import { attendanceSchema, distributionSchema, mealSchema, wastageSchema } from "../schemas";

export const mealsRouter = Router();

mealsRouter.use(requireAuth);

mealsRouter.post("/meals", validateBody(mealSchema), requireSchoolAccess((req) => req.body.schoolId), async (req, res, next) => {
  try {
    const { ingredients, ...meal } = req.body;
    const created = await prisma.meal.create({
      data: {
        ...meal,
        date: new Date(meal.date),
        ingredients: {
          create: ingredients
        }
      },
      include: { ingredients: true }
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

mealsRouter.get("/meals", async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId ?? "");
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const meals = await prisma.meal.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        ...(from || to ? { date: { gte: from, lte: to } } : {})
      },
      include: { foodWastage: true, distribution: true },
      orderBy: { date: "desc" }
    });
    res.json(meals);
  } catch (error) {
    next(error);
  }
});

mealsRouter.post("/attendance", validateBody(attendanceSchema), requireSchoolAccess((req) => req.body.schoolId), async (req, res, next) => {
  try {
    const created = await prisma.attendance.upsert({
      where: { schoolId_date: { schoolId: req.body.schoolId, date: new Date(req.body.date) } },
      update: {
        presentStudents: req.body.presentStudents,
        mealParticipants: req.body.mealParticipants,
        absentees: req.body.absentees
      },
      create: { ...req.body, date: new Date(req.body.date) }
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

mealsRouter.post("/meal-distribution", validateBody(distributionSchema), async (req, res, next) => {
  try {
    const created = await prisma.mealDistribution.upsert({
      where: { mealId: req.body.mealId },
      update: req.body,
      create: req.body
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

mealsRouter.post("/food-wastage", validateBody(wastageSchema), async (req, res, next) => {
  try {
    const wastePercentage = calculateWastePercentage(req.body.preparedQuantity, req.body.leftoverQuantity);

    const created = await prisma.foodWastage.upsert({
      where: { mealId: req.body.mealId },
      update: { ...req.body, wastePercentage },
      create: { ...req.body, wastePercentage }
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

mealsRouter.get("/schools/:schoolId/dashboard/today", requireSchoolAccess((req) => req.params.schoolId), async (req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [school, meals, attendance] = await Promise.all([
      prisma.school.findUnique({ where: { id: req.params.schoolId } }),
      prisma.meal.findMany({
        where: { schoolId: req.params.schoolId, date: { gte: start, lt: end } },
        include: { foodWastage: true }
      }),
      prisma.attendance.findFirst({ where: { schoolId: req.params.schoolId, date: { gte: start, lt: end } } })
    ]);

    const prepared = meals.reduce((sum, meal) => sum + meal.preparedCount, 0);
    const served = meals.reduce((sum, meal) => sum + meal.servedCount, 0);
    const remaining = meals.reduce((sum, meal) => sum + (meal.foodWastage?.leftoverQuantity ?? 0), 0);

    res.json({ school, meals, attendance, prepared, served, remaining });
  } catch (error) {
    next(error);
  }
});
