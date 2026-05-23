import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { connectDb, getDbStatus } from "./config/db.js";

import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import dsaRoutes from "./routes/dsaRoutes.js";
import plannerRoutes from "./routes/plannerRoutes.js";
import trendingRoutes from "./routes/trendingRoutes.js";
import savedRoutes from "./routes/savedRoutes.js";
import guidanceRoutes from "./routes/guidanceRoutes.js";
import dailyTargetRoutes from "./routes/dailyTargetRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import experienceRoutes from "./routes/experienceRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import achievementsRoutes from "./routes/achievementsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";

import { seedInterviewQuestions } from "./services/questionSeed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

/* =========================
   SECURITY + MIDDLEWARE
========================= */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(mongoSanitize());

app.use(express.json({ limit: "10mb" }));

/* =========================
   RATE LIMITER
========================= */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

/* =========================
   STATIC FILES
========================= */

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

/* =========================
   HEALTH ROUTES
========================= */

app.get("/", (req, res) => {
  res.send("CareerPilot API running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend working successfully 🚀",
    database: getDbStatus(),
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/dsa", dsaRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/trending", trendingRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/guidance", guidanceRoutes);
app.use("/api/daily-targets", dailyTargetRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/achievements", achievementsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/catalog", catalogRoutes);

/* =========================
   ERROR HANDLER
========================= */

app.use(errorHandler);

/* =========================
   START SERVER
========================= */

async function startServer() {
  try {
    console.log("[server] Connecting MongoDB...");

    await connectDb();

    console.log("[server] MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`[server] Running on port ${PORT}`);

      if (process.env.SKIP_SEED !== "true") {
        seedInterviewQuestions().catch((err) => {
          console.error("[seed error]", err.message);
        });
      }
    });
  } catch (error) {
    console.error("[server startup error]", error.message);
    process.exit(1);
  }
}

startServer();