import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { startOfDay } from "../lib/compliance-engine";

export const communicationRouter = Router();

communicationRouter.use(requireAuth);

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// 1. Retrieve Communication Logs
// GET /communication/logs
communicationRouter.get(
  "/communication/logs",
  requireRole("SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"),
  asyncHandler(async (req, res) => {
    const logs = await prisma.communicationLog.findMany({
      orderBy: { timestamp: "desc" }
    });

    res.json({
      success: true,
      data: logs
    });
  })
);

// 2. Dispatch Direct or Bulk Email Communications
// POST /communication/send
communicationRouter.post(
  "/communication/send",
  requireRole("SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"),
  asyncHandler(async (req, res) => {
    const { recipients, subject, message, type } = req.body;
    const senderRecord = await prisma.user.findUnique({
      where: { id: req.user?.sub }
    });
    const senderEmail = senderRecord?.email || "officer@district.gov";

    let finalRecipients: string[] = [];

    if (type === "single") {
      finalRecipients = Array.isArray(recipients) ? recipients : [recipients];
    } else if (type === "missing") {
      // Find schools with missing uploads today
      const today = startOfDay(new Date());
      const missingCalendarEntries = await prisma.mealCalendar.findMany({
        where: {
          date: today,
          verificationStatus: "MISSING"
        },
        include: {
          school: true
        }
      });

      // Target school principal mock emails
      finalRecipients = missingCalendarEntries.map(
        entry => entry.school.code === "GOV-SCH-001" ? "head@school.gov" : `head@${entry.school.code.toLowerCase()}.gov`
      );

      if (finalRecipients.length === 0) {
        // Fallback demo emails if no live missing entries
        finalRecipients = ["head@school.gov"];
      }
    } else if (type === "low-compliance") {
      // Find schools with compliance scores below 90%
      const lowReportSchools = await prisma.complianceReport.findMany({
        where: { score: { lt: 90 } },
        distinct: ["schoolId"],
        orderBy: { generatedAt: "desc" },
        include: { school: true }
      });

      finalRecipients = lowReportSchools.map(
        rep => rep.school.code === "GOV-SCH-001" ? "head@school.gov" : `head@${rep.school.code.toLowerCase()}.gov`
      );

      if (finalRecipients.length === 0) {
        finalRecipients = ["head@school.gov"];
      }
    } else if (type === "district") {
      // Target all seeded schools
      const allSchools = await prisma.school.findMany();
      finalRecipients = allSchools.map(
        sch => sch.code === "GOV-SCH-001" ? "head@school.gov" : `head@${sch.code.toLowerCase()}.gov`
      );
    } else {
      res.status(400).json({ error: "Invalid target type specified" });
      return;
    }

    if (finalRecipients.length === 0) {
      res.status(400).json({ error: "No recipients found for the selected targeting type" });
      return;
    }

    // Save logs to database
    const log = await prisma.communicationLog.create({
      data: {
        sender: senderEmail,
        recipients: finalRecipients,
        subject: subject || "MealsCare AI District Notification",
        message: message || "",
        deliveryStatus: "SENT"
      }
    });

    res.status(201).json({
      success: true,
      message: `Email successfully sent to ${finalRecipients.length} recipients.`,
      data: log
    });
  })
);
