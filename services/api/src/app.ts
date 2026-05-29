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
app.use(mealsRouter);
app.use(schoolsRouter);
app.use(inventoryRouter);
app.use(analyticsRouter);
app.use(aiRouter);
app.use(reportsRouter);
app.use(iotRouter);

app.use(errorHandler);
