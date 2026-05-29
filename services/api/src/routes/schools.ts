import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { schoolCreateSchema } from "../schemas";

export const schoolsRouter = Router();

// Retrieve all schools
schoolsRouter.get("/schools", requireAuth, async (req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: "asc" }
    });
    res.json(schools);
  } catch (error) {
    next(error);
  }
});

// Create new school (restricted to SUPER_ADMIN)
schoolsRouter.post(
  "/schools",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  validateBody(schoolCreateSchema),
  async (req, res, next) => {
    try {
      const { name, code, district, block, address, studentCount, type } = req.body;

      const existing = await prisma.school.findUnique({ where: { code } });
      if (existing) {
        return res.status(400).json({ error: "School code/ID is already in use" });
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
