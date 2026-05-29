import { NextFunction, Request, Response } from "express";

export function requireSchoolAccess(getSchoolId: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Missing authenticated user" });
    }

    if (
      req.user.role === "SUPER_ADMIN" ||
      req.user.role === "DISTRICT_ADMIN" ||
      req.user.role === "NUTRITION_OFFICER"
    ) {
      return next();
    }

    const schoolId = getSchoolId(req);
    if (!schoolId || req.user.schoolId !== schoolId) {
      return res.status(403).json({ error: "Institution access denied" });
    }

    return next();
  };
}
