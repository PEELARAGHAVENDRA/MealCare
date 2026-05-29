import { prisma } from "./prisma";

/**
 * Normalizes Date to start of day in local timezone
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formats a Date to "DD MMMM YYYY" (e.g. 15 June 2026)
 */
export function formatDateStr(date: Date): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Helper to check if a meal slot text represents an exclusion/holiday
 */
export function isExcludedMeal(menuText: string): boolean {
  if (!menuText) return true;
  const lower = menuText.toLowerCase();
  return lower.includes("holiday") || lower.includes("closed") || lower.includes("pls arrange") || lower.includes("own food");
}

/**
 * Recalculate daily compliance and update MealCalendar & ComplianceReport
 */
export async function recalculateSchoolCompliance(schoolId: string, date: Date) {
  const targetDate = startOfDay(date);
  
  // 1. Get Day of Week
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = daysOfWeek[targetDate.getDay()];

  // 2. Find weekly plan for the week containing this date
  // For simplicity, find the most recent weekly plan or one starting within 7 days
  const plan = await prisma.weeklyPlan.findFirst({
    where: {
      schoolId,
      weekStartDate: {
        lte: targetDate
      }
    },
    orderBy: {
      weekStartDate: "desc"
    },
    include: {
      days: true
    }
  });

  let requiredMeals: string[] = []; // e.g. ["morning", "afternoon", "evening", "dinner"]
  let isHolidayWeek = false;

  if (plan) {
    if (plan.status === "HOLIDAY") {
      isHolidayWeek = true;
    } else {
      const planDay = plan.days.find(d => d.dayOfWeek === dayName);
      if (planDay && planDay.menuItems) {
        // menuItems structure: [morning, afternoon, evening, dinner]
        const slots = ["morning", "afternoon", "evening", "dinner"];
        slots.forEach((slot, index) => {
          const menuText = planDay.menuItems[index];
          if (menuText && !isExcludedMeal(menuText)) {
            requiredMeals.push(slot);
          }
        });
      }
    }
  } else {
    // Default fallback if no plan exists: Breakfast (morning) and Lunch (afternoon) required
    requiredMeals = ["morning", "afternoon"];
  }

  // 3. Query existing evidences for this date
  const evidences = await prisma.mealEvidence.findMany({
    where: {
      schoolId,
      uploadDate: {
        gte: targetDate,
        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  });

  let uploadStatus = "COMPLIANT";
  let verificationStatus = "NONE";

  if (isHolidayWeek) {
    uploadStatus = "HOLIDAY";
    verificationStatus = "NONE";
  } else if (requiredMeals.length === 0) {
    uploadStatus = "NO_MEAL";
    verificationStatus = "NONE";
  } else {
    // Check if all required meals have an upload
    const uploadedTypes = evidences.map(e => e.role === "KITCHEN_STAFF" ? e.mealType : e.mealType.toLowerCase());
    
    // Check missing
    const missing = requiredMeals.filter(req => {
      return !uploadedTypes.some(uploaded => uploaded.toLowerCase().includes(req.toLowerCase()));
    });

    if (missing.length > 0) {
      uploadStatus = "NON_COMPLIANT";
      verificationStatus = "MISSING";
    } else {
      uploadStatus = "COMPLIANT";
      
      // Determine verificationStatus
      // If any is Rejected -> REJECTED
      // Else if all Approved -> APPROVED
      // Else if any Submitted -> PENDING
      // Else -> REVIEWED
      const statuses = evidences.map(e => e.status.toLowerCase());
      if (statuses.includes("rejected")) {
        verificationStatus = "REJECTED";
      } else if (statuses.every(s => s === "approved")) {
        verificationStatus = "APPROVED";
      } else if (statuses.includes("submitted")) {
        verificationStatus = "PENDING";
      } else {
        verificationStatus = "REVIEWED";
      }
    }
  }

  // 4. Upsert MealCalendar
  await prisma.mealCalendar.upsert({
    where: {
      schoolId_date: {
        schoolId,
        date: targetDate
      }
    },
    update: {
      uploadStatus,
      verificationStatus
    },
    create: {
      schoolId,
      date: targetDate,
      uploadStatus,
      verificationStatus
    }
  });

  // 5. Recalculate School Overall Compliance Score (last 30 days)
  const thirtyDaysAgo = new Date(targetDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const calendarDays = await prisma.mealCalendar.findMany({
    where: {
      schoolId,
      date: {
        gte: thirtyDaysAgo,
        lte: targetDate
      }
    }
  });

  const activeDays = calendarDays.filter(c => c.uploadStatus !== "HOLIDAY" && c.uploadStatus !== "NO_MEAL");
  let score = 100;
  let approvalRate = 100;
  let missingMealsCount = 0;

  if (activeDays.length > 0) {
    const compliantDays = activeDays.filter(c => c.uploadStatus === "COMPLIANT").length;
    score = Math.round((compliantDays / activeDays.length) * 100);

    const approvedDays = activeDays.filter(c => c.verificationStatus === "APPROVED").length;
    approvalRate = Math.round((approvedDays / activeDays.length) * 100);

    missingMealsCount = activeDays.filter(c => c.verificationStatus === "MISSING").length;
  }

  // Update/create compliance report
  await prisma.complianceReport.create({
    data: {
      schoolId,
      score,
      approvalRate,
      missingMeals: missingMealsCount
    }
  });

  return { uploadStatus, verificationStatus, score };
}
