import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import crmRoutes from "./routes/crmRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { rateLimit } from "./middleware/rateLimit.js";

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:5173").split(",").map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error("Origin is not allowed by CORS"));
} }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", rateLimit({ max: 20 }), authRoutes);
app.use("/api", crmRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
