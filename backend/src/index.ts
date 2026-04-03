import "dotenv/config";
import express from "express";
import cors from "cors";

import intakeRouter from "./routes/intake";
import trialsRouter from "./routes/trials";
import eligibilityRouter from "./routes/eligibility";
import twinRouter from "./routes/twin";
import uploadRouter from "./routes/upload";
import chatRouter from "./routes/chat";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:4173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging ─────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ClinIQ API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/intake", intakeRouter);
app.use("/api/trials", trialsRouter);
app.use("/api/eligibility", eligibilityRouter);
app.use("/api/twin", twinRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/chat", chatRouter);

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error Handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Error]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║       ClinIQ Backend API Server       ║
╠═══════════════════════════════════════╣
║  Port:    ${PORT}                         ║
║  Mode:    ${process.env.NODE_ENV || "development"}                  ║
║  Health:  http://localhost:${PORT}/health ║
╚═══════════════════════════════════════╝
  `);
});

export default app;
