require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const { specs } = require("./swagger");
const { applySecurityMiddleware } = require("./middleware/security");
const uploadRouter = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 4000;

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "1mb" }));
applySecurityMiddleware(app);

// ── Swagger Docs ───────────────────────────────────────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customSiteTitle: "Sales Insight API",
    customCss: `.swagger-ui .topbar { background: #0f0f0f; } .swagger-ui .topbar-wrapper img { display: none; }`,
  })
);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api", uploadRouter);

// ── Health Check ───────────────────────────────────────────────────────────────
/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is running
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api/docs`);
});

module.exports = app;
