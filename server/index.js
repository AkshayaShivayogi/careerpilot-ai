import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import dotenv from "dotenv";
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

const envPath = path.join(__dirname, ".env");
const envExamplePath = path.join(__dirname, ".env.example");
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.warn("[server] Created server/.env from .env.example — review JWT_SECRET before production");
}

dotenv.config({ path: envPath, quiet: true });

if (!process.env.JWT_SECRET?.trim()) {
  if (process.env.NODE_ENV === "production") {
    console.error("[fatal] JWT_SECRET is required in server/.env");
    process.exit(1);
  }
  process.env.JWT_SECRET = "dev-only-jwt-secret-change-me";
  console.warn("[server] Using development JWT_SECRET — set JWT_SECRET in server/.env for production");
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const devPortFile = path.join(__dirname, ".dev-port");

function clearDevPortFile() {
  try {
    fs.unlinkSync(devPortFile);
  } catch {
    /* not present */
  }
}

clearDevPortFile();

const corsOrigins = (
  process.env.CORS_ORIGIN ||
  "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000"
)
  .split(",")
  .map((s) => s.trim());

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(mongoSanitize());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  const db = getDbStatus();
  res.json({
    success: true,
    ok: true,
    message: "CareerPilot API running",
    service: "careerpilot-ai",
    port: PORT,
    database: db,
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — try again later" },
  skip: (req) =>
    req.method === "POST" &&
    (req.path.includes("/planner/generate") || req.path.includes("/interview/generate")),
});
app.use("/api/", apiLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`[http] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

const uploadsPath = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsPath, { recursive: true });
app.use("/uploads", express.static(uploadsPath));

app.use("/api/auth", authRoutes);
console.log(
  "AUTH ROUTES LOADED → POST /signup, POST /login, GET /me, PUT /profile, POST /logout"
);

app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/interview", interviewRoutes);
console.log("INTERVIEW ROUTES LOADED → POST /generate, POST /submit, GET /history, GET /:id, DELETE /:id");
app.use("/api/resume", resumeRoutes);
console.log("RESUME ROUTES LOADED → POST /analyze, GET /history, GET /:id, DELETE /:id");
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

app.use(errorHandler);

async function start() {
  console.log("[server] Starting CareerPilot API…");
  console.log(`[server] PORT=${PORT}`);

  try {
    await connectDb();
  } catch (err) {
    console.error("[fatal] MongoDB connection failed:", err.message);
    clearDevPortFile();
    process.exit(1);
  }

  try {
    fs.writeFileSync(devPortFile, String(PORT), "utf8");
  } catch (err) {
    console.warn("[server] Could not write .dev-port:", err.message);
  }

  const httpServer = app.listen(PORT, () => {
    try {
      fs.writeFileSync(devPortFile, String(PORT), "utf8");
    } catch {
      /* non-fatal */
    }
    console.log(`[server] Listening → http://127.0.0.1:${PORT}`);
    console.log(`[server] Health: http://127.0.0.1:${PORT}/api/health`);
    console.log(`[server] Auth: http://127.0.0.1:${PORT}/api/auth/signup`);

    if (process.env.SKIP_SEED !== "true") {
      seedInterviewQuestions().catch((e) => {
        console.error("[seed] Background seed failed:", e.message);
      });
    } else {
      console.log("[seed] Skipped (SKIP_SEED=true)");
    }
  });

  httpServer.on("error", (err) => {
    clearDevPortFile();
    if (err.code === "EADDRINUSE") {
      console.error(`[fatal] Port ${PORT} is already in use. Stop the other API process or set PORT in server/.env`);
    } else {
      console.error("[fatal] Server error:", err.message);
    }
    process.exit(1);
  });
}

start();
