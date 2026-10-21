import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { login, logout, me } from "../controllers/authController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { EMAIL_PATTERN } from "../models/shared.js";

const router = Router();

// Strict limit on login attempts: 10 FAILED attempts per 15 minutes from one address.
// Successful logins are not counted.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  },
});

// The login form must send exactly two TEXT values. Anything else is rejected before the database.
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Please enter a valid email address.")
    .regex(EMAIL_PATTERN, "Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Please enter your password.")
    .max(128, "Please enter a valid password."),
});

router.post("/login", loginLimiter, validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAdmin, me);

export default router;
