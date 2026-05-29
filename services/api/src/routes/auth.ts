import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/auth";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { loginSchema } from "../schemas";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
      include: { school: true }
    });
    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({
      sub: user.id,
      role: user.role,
      schoolId: user.schoolId,
      districtId: user.districtId
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        districtId: user.districtId,
        school: user.school ? {
          name: user.school.name,
          code: user.school.code,
          type: user.school.type
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", requireAuth, async (req, res) => {
  const token = signToken(req.user!);
  res.json({ token });
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        schoolId: true, 
        districtId: true,
        school: {
          select: {
            name: true,
            code: true,
            type: true
          }
        }
      }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, schoolId, districtId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    let finalSchoolId: string | null = null;
    if (role !== "DISTRICT_ADMIN" && role !== "SUPER_ADMIN") {
      const lookupCode = (schoolId === "demo-school" || !schoolId) ? "GOV-SCH-001" : schoolId;
      const school = await prisma.school.findFirst({
        where: {
          OR: [
            { id: lookupCode },
            { code: lookupCode }
          ]
        }
      });
      if (!school) {
        return res.status(400).json({ error: `Institution not found with Code or ID: ${lookupCode}` });
      }
      finalSchoolId = school.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        schoolId: finalSchoolId,
        districtId: districtId || null,
        status: "ACTIVE"
      },
      include: { school: true }
    });

    const token = signToken({
      sub: user.id,
      role: user.role,
      schoolId: user.schoolId,
      districtId: user.districtId
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        districtId: user.districtId,
        school: user.school ? {
          name: user.school.name,
          code: user.school.code,
          type: user.school.type
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 for security to prevent email enumeration, but log internally
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({ success: true, message: "Reset token generated" });
    }

    // Generate a temporary mock reset token (using email for simple verification)
    const resetToken = Buffer.from(JSON.stringify({ email, exp: Date.now() + 3600000 })).toString("base64");

    console.log(`\n--- PASSWORD RESET REQUEST ---`);
    console.log(`User: ${user.name} (${email})`);
    console.log(`Token: ${resetToken}`);
    console.log(`Reset URL: http://localhost:3000/reset-password?token=${resetToken}`);
    console.log(`------------------------------\n`);

    // Return success message and the token (in real prod we send an email, returning token helps client testing)
    return res.json({
      success: true,
      message: "Reset instructions have been logged to the server console.",
      token: resetToken
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    } catch {
      return res.status(400).json({ error: "Invalid reset token format" });
    }

    if (!payload.email || !payload.exp || Date.now() > payload.exp) {
      return res.status(400).json({ error: "Expired or malformed reset token" });
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
});
