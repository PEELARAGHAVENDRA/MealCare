import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { startOfDay, formatDateStr, recalculateSchoolCompliance } from "../lib/compliance-engine";

export const evidenceRouter = Router();

evidenceRouter.use(requireAuth);

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// 1. Upload Meal Evidence
// POST /evidence/upload
evidenceRouter.post(
  "/evidence/upload",
  requireRole("FOOD_SERVER", "KITCHEN_STAFF", "SCHOOL_HEAD", "SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const { schoolId, imageUrl, remarks, mealType } = req.body;
    if (!schoolId || !imageUrl || !mealType) {
      res.status(400).json({ error: "schoolId, imageUrl, and mealType are required" });
      return;
    }

    // Retrieve user identity
    const userId = req.user?.sub || "unknown-user";
    const userRecord = await prisma.user.findUnique({
      where: { id: userId }
    });
    const userName = userRecord?.name || userRecord?.email?.split("@")[0] || "User";
    const roleName = req.user?.role || "FOOD_SERVER";

    // Format current date and time
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Client-side compressed thumbnail simulator (WebP 20KB-50KB)
    // Simply prepend base64 or pass standard URLs
    const thumbnailUrl = imageUrl; // Under CDN-ready model, same link is processed

    // Create the evidence log entry
    const evidence = await prisma.mealEvidence.create({
      data: {
        schoolId,
        imageUrl,
        thumbnailUrl,
        uploadedBy: userName,
        role: roleName,
        mealType,
        remarks: remarks || "",
        status: "Submitted",
        uploadDate: startOfDay(now),
        uploadTime: timeStr
      }
    });

    // Run compliance calculations asynchronously
    await recalculateSchoolCompliance(schoolId, now);

    res.status(201).json({
      success: true,
      data: evidence
    });
  })
);

// 2. Retrieve School Evidence Timeline
// GET /evidence/school/:schoolId
evidenceRouter.get(
  "/evidence/school/:schoolId",
  asyncHandler(async (req, res) => {
    const { schoolId } = req.params;

    // RBAC: Check if the user is authorized to access this school's evidence timeline
    const userRole = req.user?.role;
    const isGlobalMonitor = ["SUPER_ADMIN", "DISTRICT_ADMIN", "NUTRITION_OFFICER"].includes(userRole || "");
    if (!isGlobalMonitor && req.user?.schoolId !== schoolId) {
      return res.status(403).json({ error: "Access denied. You are not authorized to view details for this institution." });
    }

    const evidences = await prisma.mealEvidence.findMany({
      where: { schoolId },
      orderBy: { uploadDate: "desc" }
    });

    res.json({
      success: true,
      data: evidences
    });
  })
);

// 3. Review & Approve/Reject Evidence
// PATCH /evidence/:id/status
evidenceRouter.patch(
  "/evidence/:id/status",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, remarks } = req.body; // Approved, Rejected, Reviewed

    if (!["Approved", "Rejected", "Reviewed", "Submitted"].includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const currentEvidence = await prisma.mealEvidence.findUnique({
      where: { id }
    });

    if (!currentEvidence) {
      res.status(404).json({ error: "Evidence not found" });
      return;
    }

    const updated = await prisma.mealEvidence.update({
      where: { id },
      data: {
        status,
        remarks: remarks !== undefined ? remarks : currentEvidence.remarks
      }
    });

    // Recalculate school compliance for the upload date
    await recalculateSchoolCompliance(currentEvidence.schoolId, currentEvidence.uploadDate);

    res.json({
      success: true,
      data: updated
    });
  })
);

// 4. Retrieve Summary Evidence Analytics & Verification Stats
// GET /evidence/stats
evidenceRouter.get(
  "/evidence/stats",
  asyncHandler(async (req, res) => {
    const today = startOfDay(new Date());

    const [verifiedToday, pendingReviews, approvedToday, rejectedToday, missingToday] = await Promise.all([
      // Verified Today = Approved or Reviewed uploaded today
      prisma.mealEvidence.count({
        where: {
          uploadDate: today,
          status: { in: ["Approved", "Reviewed"] }
        }
      }),
      // Pending Reviews = Submitted (not yet processed)
      prisma.mealEvidence.count({
        where: { status: "Submitted" }
      }),
      // Total Approved
      prisma.mealEvidence.count({
        where: { status: "Approved" }
      }),
      // Total Rejected
      prisma.mealEvidence.count({
        where: { status: "Rejected" }
      }),
      // Missing calendar slots today
      prisma.mealCalendar.count({
        where: {
          date: today,
          verificationStatus: "MISSING"
        }
      })
    ]);

    // Retrieve schools with missing uploads today
    const missingCalendarEntries = await prisma.mealCalendar.findMany({
      where: {
        date: today,
        verificationStatus: "MISSING"
      },
      include: {
        school: true
      }
    });

    const schoolsWithMissing = missingCalendarEntries.map(entry => ({
      schoolId: entry.schoolId,
      name: entry.school.name,
      code: entry.school.code,
      principalEmail: "head@school.gov", // seeded mock principal contact
      phone: entry.school.address
    }));

    // Average compliance score across all schools
    const complianceReports = await prisma.complianceReport.findMany({
      distinct: ["schoolId"],
      orderBy: { generatedAt: "desc" }
    });

    const averageCompliance = complianceReports.length > 0
      ? Math.round(complianceReports.reduce((sum, r) => sum + r.score, 0) / complianceReports.length)
      : 100;

    res.json({
      success: true,
      stats: {
        verifiedToday,
        pendingReviews,
        approvedMeals: approvedToday,
        rejectedMeals: rejectedToday,
        missingUploads: missingToday,
        complianceScore: averageCompliance,
        schoolsWithMissing
      }
    });
  })
);
