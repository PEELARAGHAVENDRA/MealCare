import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { reportSchema } from "../schemas";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get("/reports/:id", async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

reportsRouter.post("/reports", validateBody(reportSchema), async (req, res, next) => {
  try {
    const report = await prisma.report.create({
      data: {
        ...req.body,
        periodStart: new Date(req.body.periodStart),
        periodEnd: new Date(req.body.periodEnd),
        generatedById: req.user?.sub
      }
    });
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});
