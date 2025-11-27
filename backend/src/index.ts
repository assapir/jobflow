import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jobsRouter from "./routes/jobs.js";
import linkedinRouter from "./routes/linkedin.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 3002;

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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
