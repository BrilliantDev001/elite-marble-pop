import AdminUser from "../models/AdminUser.js";
import { env } from "../config/env.js";
import { SESSION_COOKIE, readSessionToken } from "../utils/session.js";
import { httpError } from "../utils/httpError.js";

// Protects a route: only a logged-in admin gets through. Everyone else receives 401.
// The token alone is not enough. We also check the admin still exists and that the token's
// version matches the database, so logging out really does end the session.
// (Express 5 passes errors from async middleware to the error handler automatically.)
export async function requireAdmin(req, res, next) {
  const payload = readSessionToken(req.cookies?.[SESSION_COOKIE]);
  if (!payload) throw httpError(401, "Please log in.");

  const admin = await AdminUser.findById(payload.sub);
  if (!admin || admin.tokenVersion !== payload.v)
    throw httpError(401, "Please log in.");

  req.admin = admin;
  next();
}

// Extra protection against cross-site request forgery (CSRF).
// Browsers always attach an "Origin" header to POST, PATCH and DELETE requests, and a
// malicious website cannot change it. So any such request that claims to come from a
// different website is refused. (The cookie's SameSite=Lax setting is the first layer;
// this is the second.) Requests with no Origin at all, such as from curl, are allowed:
// they would still need a valid login cookie.
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

export function requireSameOrigin(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();

  const origin = req.get("origin");
  if (origin && origin !== env.clientOrigin) {
    throw httpError(403, "This request is not allowed.");
  }
  next();
}
