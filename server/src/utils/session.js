import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// The name of the login cookie.
export const SESSION_COOKIE = "elite_admin";

const SESSION_DAYS = 7; // how long a login lasts
const BCRYPT_ROUNDS = 12; // how slow (and so how hard to brute-force) password hashing is

// ---------- Passwords ----------

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ---------- Session token ----------

// Creates a signed token that proves "this is the admin". It contains only the admin's ID and
// their tokenVersion. If the tokenVersion in the database is later raised (on logout or a
// password change), every older token stops working immediately.
export function createSessionToken(admin) {
  return jwt.sign({ v: admin.tokenVersion }, env.jwtSecret, {
    algorithm: "HS256",
    subject: admin.id,
    expiresIn: `${SESSION_DAYS}d`,
  });
}

// Returns the token's contents if it is genuine and not expired, otherwise null.
export function readSessionToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}

// ---------- The login cookie ----------

export const sessionCookieOptions = {
  httpOnly: true, // JavaScript on the page can never read this cookie
  secure: env.isProduction, // in production, only ever sent over HTTPS
  sameSite: "lax", // not sent with requests started by other websites
  path: "/api/admin", // only sent to admin routes, never to public ones
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
};
