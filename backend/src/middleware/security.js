const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for the upload endpoint — prevents abuse and resource exhaustion.
 * Allows up to 20 requests per 15-minute window per IP.
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in 15 minutes." },
});

/**
 * General API rate limiter — broad protection across all endpoints.
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded. Slow down." },
});

/**
 * Optional API key guard middleware.
 * If API_KEY is set in env, all /api routes must include it in the
 * x-api-key header. Leave unset to disable in development.
 */
const apiKeyGuard = (req, res, next) => {
  const requiredKey = process.env.API_KEY;
  if (!requiredKey) return next(); // disabled when not configured

  const providedKey = req.headers["x-api-key"];
  if (!providedKey || providedKey !== requiredKey) {
    return res.status(401).json({ error: "Invalid or missing API key." });
  }
  next();
};

const applySecurityMiddleware = (app) => {
  app.use("/api", generalLimiter);
  app.use("/api", apiKeyGuard);
};

module.exports = { applySecurityMiddleware, uploadLimiter };
