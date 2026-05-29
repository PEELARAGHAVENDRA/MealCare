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
