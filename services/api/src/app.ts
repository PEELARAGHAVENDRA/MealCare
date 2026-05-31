import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { analyticsRouter } from "./routes/analytics";
import { aiRouter } from "./routes/ai";
import { authRouter } from "./routes/auth";
import { inventoryRouter } from "./routes/inventory";
import { iotRouter } from "./routes/iot";
import { mealsRouter } from "./routes/meals";
import { reportsRouter } from "./routes/reports";
import { schoolsRouter } from "./routes/schools";
import { evidenceRouter } from "./routes/evidence";
import { complianceRouter } from "./routes/compliance";
import { communicationRouter } from "./routes/communication";
import { errorHandler } from "./middleware/error-handler";
import { swaggerSpec } from "./lib/swagger";


export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRouter);

// Mount routers under both root and /api prefixes for full frontend compatibility
app.use(mealsRouter);
app.use("/api", mealsRouter);

app.use(schoolsRouter);
app.use("/api", schoolsRouter);

app.use(inventoryRouter);
app.use("/api", inventoryRouter);

app.use(analyticsRouter);
app.use("/api", analyticsRouter);

app.use(aiRouter);
app.use("/api", aiRouter);

app.use(reportsRouter);
app.use("/api", reportsRouter);

app.use(iotRouter);
app.use("/api", iotRouter);

app.use(evidenceRouter);
app.use("/api", evidenceRouter);

app.use(complianceRouter);
app.use("/api", complianceRouter);

app.use(communicationRouter);
app.use("/api", communicationRouter);

app.use(errorHandler);
