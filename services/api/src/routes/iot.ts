import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { weightReadingSchema } from "../schemas";

export const iotRouter = Router();

iotRouter.use(requireAuth);

iotRouter.post("/iot/weight-reading", validateBody(weightReadingSchema), (req, res) => {
  res.status(202).json({
    status: "accepted",
    message: "Weight reading accepted for future device pipeline integration.",
    reading: req.body
  });
});

iotRouter.post("/iot/ingredient-consumption", validateBody(weightReadingSchema), (req, res) => {
  res.status(202).json({
    status: "accepted",
    message: "Ingredient consumption accepted for future automatic inventory updates.",
    reading: req.body
  });
});

iotRouter.get("/iot/devices", (req, res) => {
  res.json({
    schoolId: req.query.schoolId ?? null,
    devices: [
      { id: "scale-demo-001", type: "SMART_SCALE", status: "SIMULATED" }
    ]
  });
});
