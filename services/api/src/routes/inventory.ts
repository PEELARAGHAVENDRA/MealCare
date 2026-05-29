import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireSchoolAccess } from "../middleware/scope";
import { validateBody } from "../middleware/validate";
import { inventoryAdjustSchema } from "../schemas";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get("/inventory", async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId ?? "");
    const inventory = await prisma.inventory.findMany({
      where: schoolId ? { schoolId } : undefined,
      include: { ingredient: true },
      orderBy: { ingredient: { name: "asc" } }
    });
    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.post("/inventory/adjust", validateBody(inventoryAdjustSchema), requireSchoolAccess((req) => req.body.schoolId), async (req, res, next) => {
  try {
    const existing = await prisma.inventory.findUnique({
      where: { schoolId_ingredientId: { schoolId: req.body.schoolId, ingredientId: req.body.ingredientId } }
    });

    const quantityAvailable = Math.max(0, (existing?.quantityAvailable ?? 0) + req.body.quantityDelta);
    const inventory = await prisma.inventory.upsert({
      where: { schoolId_ingredientId: { schoolId: req.body.schoolId, ingredientId: req.body.ingredientId } },
      update: { quantityAvailable, unit: req.body.unit },
      create: {
        schoolId: req.body.schoolId,
        ingredientId: req.body.ingredientId,
        quantityAvailable,
        unit: req.body.unit
      }
    });

    res.status(201).json(inventory);
  } catch (error) {
    next(error);
  }
});
