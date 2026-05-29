import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { startOfDay, recalculateSchoolCompliance, formatDateStr } from "../lib/compliance-engine";
import { getNotifications, addNotification, checkEscalations } from "../lib/notifications";

export const complianceRouter = Router();

complianceRouter.use(requireAuth);

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// 1. Retrieve School Compliance Metrics
// GET /compliance/school/:schoolId
complianceRouter.get(
  "/compliance/school/:schoolId",
  asyncHandler(async (req, res) => {
    const { schoolId } = req.params;

    // Get compliance reports over time (limit to 10)
    const reports = await prisma.complianceReport.findMany({
      where: { schoolId },
      orderBy: { generatedAt: "desc" },
      take: 10
    });

    // Get current calendar days
    const calendar = await prisma.mealCalendar.findMany({
      where: { schoolId },
      orderBy: { date: "desc" },
      take: 30
    });

    res.json({
      success: true,
      current: reports[0] || { score: 100, approvalRate: 100, missingMeals: 0 },
      history: reports.reverse(),
      calendar: calendar.reverse()
    });
  })
);

// 2. Retrieve District-wide Compliance Summary
// GET /compliance/district
complianceRouter.get(
  "/compliance/district",
  requireRole("SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"),
  asyncHandler(async (req, res) => {
    // Get latest compliance reports for all schools
    const schools = await prisma.school.findMany({
      include: {
        complianceReports: {
          orderBy: { generatedAt: "desc" },
          take: 1
        }
      }
    });

    const schoolScores = schools.map(s => {
      const latest = s.complianceReports[0];
      return {
        schoolId: s.id,
        name: s.name,
        code: s.code,
        district: s.district,
        score: latest ? latest.score : 100,
        approvalRate: latest ? latest.approvalRate : 100,
        missingMeals: latest ? latest.missingMeals : 0
      };
    });

    const averageDistrictScore = schoolScores.length > 0
      ? Math.round(schoolScores.reduce((sum, s) => sum + s.score, 0) / schoolScores.length)
      : 100;

    res.json({
      success: true,
      districtScore: averageDistrictScore,
      schools: schoolScores
    });
  })
);

// 3. Trigger Daily End-Of-Day Compliance Verification
// POST /compliance/daily-check
complianceRouter.post(
  "/compliance/daily-check",
  requireRole("SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"),
  asyncHandler(async (req, res) => {
    const today = new Date();
    
    // Check and trigger 24h escalations
    checkEscalations();

    const schools = await prisma.school.findMany();
    const results = [];

    for (const school of schools) {
      const outcome = await recalculateSchoolCompliance(school.id, today);
      results.push({
        schoolName: school.name,
        ...outcome
      });

      // If non-compliant, automatically trigger notification alerts
      if (outcome.uploadStatus === "NON_COMPLIANT") {
        addNotification({
          type: "MISSING_EVIDENCE",
          title: "Meal Evidence Missing",
          message: `Required meal evidence was not uploaded for ${school.name} today.`,
          schoolId: school.id,
          schoolName: school.name,
          mealType: "Breakfast/Lunch",
          dateStr: formatDateStr(today)
        });
      }
    }

    res.json({
      success: true,
      message: "Daily compliance check completed.",
      results
    });
  })
);

// 4. Retrieve Active Alerts & Notifications
// GET /notifications
complianceRouter.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    // Run escalation checker on query
    checkEscalations();
    
    res.json({
      success: true,
      data: getNotifications()
    });
  })
);
