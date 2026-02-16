import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jobsRouter from "./routes/jobs.js";
import linkedinRouter from "./routes/linkedin.js";
import authRouter from "./routes/auth.js";
import logger from "./lib/logger.js";
import { httpLogger, requestIdMiddleware } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/auth.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

const app = express();
const PORT = process.env.PORT || 3002;
const startTime = Date.now();

// Request logging and correlation ID middleware (must be first)
app.use(httpLogger);
app.use(requestIdMiddleware);

// CORS configuration for credentials (cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/linkedin", linkedinRouter);

// Health endpoint — public, minimal info (used by monitoring/load balancers)
app.get("/api/health", async (_req, res) => {
  let dbStatus = "ok";
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = "error";
  }

  res.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint — authenticated, detailed system info
app.get("/api/metrics", requireAuth, (_req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.json({
    uptime,
    memory: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
  });
});

// Error handling (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
