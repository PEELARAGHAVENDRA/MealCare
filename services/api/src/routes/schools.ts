import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { schoolCreateSchema } from "../schemas";

export const schoolsRouter = Router();

const DEFAULT_SCHOOLS = [
  { id: "cmpppkkv70000b511lbz008lr", name: "Government Primary School Nandipur", code: "GOV-SCH-001", district: "Nandipur", block: "Block A", address: "Main Road Nandipur", studentCount: 240, type: "SCHOOL" },
  { id: "sch-2", name: "Modern Girls Public School", code: "GIRLS-SCH-002", district: "Nandipur", block: "Block B", address: "Civil Lines", studentCount: 310, type: "SCHOOL" },
  { id: "sch-3", name: "National Secondary School Model", code: "GOV-SCH-003", district: "Nandipur", block: "Block C", address: "Sector 4", studentCount: 450, type: "SCHOOL" }
];

// Retrieve all schools
schoolsRouter.get("/schools", requireAuth, async (req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: "asc" }
    });
    res.json(schools.length > 0 ? schools : DEFAULT_SCHOOLS);
  } catch (error) {
    res.json(DEFAULT_SCHOOLS);
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
