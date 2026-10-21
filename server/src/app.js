import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Behind a hosting provider's proxy, the real visitor address arrives in a header.
// Without this, the rate limiter would treat every visitor as the same person.
// This will be confirmed against the real host in Stage B8.
if (env.isProduction) app.set("trust proxy", 1);

// Safe security headers on every response.
app.use(helmet());

// Only our own website may call this API from a browser.
// "credentials" is needed later so the login cookie can be sent.
app.use(cors({ origin: env.clientOrigin, credentials: true }));

// Read JSON request bodies, but only small ones. Photos never pass through this server
// (they go straight to ImageKit), so 100 KB is plenty.
app.use(express.json({ limit: "100kb" }));

// A general limit per visitor address. Stricter limits for login, reviews and
// enquiries come in later stages.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

app.use("/api", apiLimiter, routes);

// These two MUST stay last.
app.use(notFound);
app.use(errorHandler);

export default app;
