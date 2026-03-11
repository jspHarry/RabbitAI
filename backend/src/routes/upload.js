const express = require("express");
const multer = require("multer");
const { uploadLimiter } = require("../middleware/security");
const { parseFile } = require("../services/parser");
const { generateSummary } = require("../services/groq");
const { sendSummaryEmail } = require("../services/email");

const router = express.Router();

// ── Multer config — memory storage, 10 MB limit, CSV/XLSX only ───────────────
const ALLOWED_MIMETYPES = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", // some OS report CSV as text/plain
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (!ext.endsWith(".csv") && !ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
      return cb(Object.assign(new Error("Only .csv and .xlsx files are accepted."), { status: 400 }));
    }
    cb(null, true);
  },
});

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Upload a sales file and receive an AI-generated summary via email
 *     tags: [Sales Insights]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - email
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or XLSX sales data file (max 10 MB)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Recipient email for the AI-generated briefing
 *     responses:
 *       200:
 *         description: Summary generated and email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 rowsAnalyzed:
 *                   type: integer
 *                 recipient:
 *                   type: string
 *       400:
 *         description: Bad request (invalid file type, missing fields)
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server or AI error
 */
router.post("/upload", uploadLimiter, upload.single("file"), async (req, res, next) => {
  try {
    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please attach a .csv or .xlsx file." });
    }

    const email = (req.body.email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: "A valid recipient email address is required." });
    }

    // ── Parse file ───────────────────────────────────────────────────────────
    const { preview, totalRows } = parseFile(req.file.buffer, req.file.originalname);

    // ── Generate AI summary ──────────────────────────────────────────────────
    const summary = await generateSummary(preview, totalRows);

    // ── Send email ───────────────────────────────────────────────────────────
    await sendSummaryEmail(email, summary, req.file.originalname);

    res.json({
      message: "Analysis complete. Briefing sent to your inbox.",
      rowsAnalyzed: totalRows,
      recipient: email,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
