import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import nutritionSeed from "../../../packages/seed-data/nutrition-data.json";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const school = await prisma.school.upsert({
    where: { code: "GOV-SCH-001" },
    update: {},
    create: {
      name: "Government Primary School Nandipur",
      code: "GOV-SCH-001",
      district: "Demo District",
      block: "Central Block",
      address: "Nandipur Main Road",
      studentCount: 240
    }
  });

  const users = [
    { name: "Super Admin", email: "super@mealscare.gov", role: "SUPER_ADMIN" as UserRole, schoolId: null, districtId: null, password: "Password123!" },
    { name: "Super Admin Live", email: "peelaraghavendra2005@gmail.com", role: "SUPER_ADMIN" as UserRole, schoolId: null, districtId: null, password: "2peelaraghavendra" },
    { name: "District Admin", email: "district@district.gov", role: "DISTRICT_ADMIN" as UserRole, schoolId: null, districtId: "DEMO-DISTRICT" },
    { name: "Nutrition Officer", email: "nutrition@district.gov", role: "NUTRITION_OFFICER" as UserRole, schoolId: null, districtId: "DEMO-DISTRICT" },
    { name: "School Head", email: "head@school.gov", role: "SCHOOL_HEAD" as UserRole, schoolId: school.id, districtId: null },
    { name: "Kitchen Staff", email: "cook@school.gov", role: "KITCHEN_STAFF" as UserRole, schoolId: school.id, districtId: null },
    { name: "Food Server", email: "server@school.gov", role: "FOOD_SERVER" as UserRole, schoolId: school.id, districtId: null },
    { name: "Teacher User", email: "teacher@school.gov", role: "TEACHER" as UserRole, schoolId: school.id, districtId: null },
    { name: "Student Parent", email: "parent@school.gov", role: "STUDENT_PARENT" as UserRole, schoolId: school.id, districtId: null },
    { name: "Student", email: "student@school.gov", role: "STUDENT_PARENT" as UserRole, schoolId: school.id, districtId: null }
  ];

  for (const user of users) {
    const userPasswordHash = user.password 
      ? await bcrypt.hash(user.password, 10) 
      : passwordHash;
    
    const { password, ...userFields } = user;

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        schoolId: user.schoolId,
        districtId: user.districtId ?? null,
        passwordHash: userPasswordHash
      },
      create: {
        ...userFields,
        passwordHash: userPasswordHash
      }
    });
  }

  for (const item of nutritionSeed) {
    await prisma.nutritionData.upsert({
      where: { foodItem: item.foodItem },
      update: item,
      create: item
    });

    await prisma.ingredient.upsert({
      where: { name: item.foodItem },
      update: {},
      create: {
        name: item.foodItem,
        unit: "serving",
        category: item.category,
        defaultCostPerUnit: item.defaultCostPerServing
      }
    });
  }

  const ingredients = await prisma.ingredient.findMany();
  for (const ingredient of ingredients.slice(0, 10)) {
    await prisma.inventory.upsert({
      where: { schoolId_ingredientId: { schoolId: school.id, ingredientId: ingredient.id } },
      update: {},
      create: {
        schoolId: school.id,
        ingredientId: ingredient.id,
        quantityAvailable: 100,
        unit: ingredient.unit
      }
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const meal = await prisma.meal.create({
    data: {
      schoolId: school.id,
      date: today,
      mealType: "LUNCH",
      menuItems: ["Rice", "Sambar", "Banana"],
      plannedCount: 240,
      preparedCount: 230,
      servedCount: 218,
      notes: "Demo meal entry for dashboard charts."
    }
  });

  await prisma.attendance.upsert({
    where: { schoolId_date: { schoolId: school.id, date: today } },
    update: {},
    create: {
      schoolId: school.id,
      date: today,
      presentStudents: 225,
      mealParticipants: 218,
      absentees: 15
    }
  });

  await prisma.foodWastage.upsert({
    where: { mealId: meal.id },
    update: {},
    create: {
      mealId: meal.id,
      preparedQuantity: 230,
      servedQuantity: 218,
      leftoverQuantity: 12,
      wastePercentage: 5.22
    }
  });

  // Seed MealCalendar and MealEvidence for NANDIPUR
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }

  const statuses = [
    { uploadStatus: "COMPLIANT", verificationStatus: "APPROVED" },
    { uploadStatus: "COMPLIANT", verificationStatus: "PENDING" },
    { uploadStatus: "COMPLIANT", verificationStatus: "REVIEWED" },
    { uploadStatus: "NON_COMPLIANT", verificationStatus: "MISSING" },
    { uploadStatus: "HOLIDAY", verificationStatus: "NONE" }
  ];

  for (let i = 0; i < 5; i++) {
    const date = dates[i];
    const status = statuses[i];

    await prisma.mealCalendar.upsert({
      where: { schoolId_date: { schoolId: school.id, date } },
      update: status,
      create: {
        schoolId: school.id,
        date,
        ...status
      }
    });

    if (status.verificationStatus !== "NONE" && status.verificationStatus !== "MISSING") {
      await prisma.mealEvidence.create({
        data: {
          schoolId: school.id,
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
          thumbnailUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80",
          uploadedBy: "Food Server",
          role: "FOOD_SERVER",
          mealType: "Lunch",
          remarks: "Fresh hot lunch served on time.",
          status: status.verificationStatus === "APPROVED" ? "Approved" : status.verificationStatus === "REVIEWED" ? "Reviewed" : "Submitted",
          uploadDate: date,
          uploadTime: "12:15 PM"
        }
      });
    }
  }

  // Seed Compliance Report
  await prisma.complianceReport.create({
    data: {
      schoolId: school.id,
      score: 85.5,
      approvalRate: 90.0,
      missingMeals: 2
    }
  });

  // Seed Communication Logs
  await prisma.communicationLog.create({
    data: {
      sender: "nutrition@district.gov",
      recipients: ["head@school.gov"],
      subject: "Urgent: Complete Monday Meal Evidence Upload",
      message: "Dear Principal, please ensure your food server uploads the Lunch evidence immediately.",
      deliveryStatus: "SENT"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
