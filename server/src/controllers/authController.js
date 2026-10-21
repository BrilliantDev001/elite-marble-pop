import AdminUser from "../models/AdminUser.js";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  createSessionToken,
  readSessionToken,
  hashPassword,
  verifyPassword,
} from "../utils/session.js";
import { httpError } from "../utils/httpError.js";

// A throwaway hash, used so that a login attempt with an UNKNOWN email takes as long as one with
// a known email. Otherwise, response times could reveal which emails have an account.
const DUMMY_HASH = await hashPassword("a-password-nobody-will-ever-use");

export async function login(req, res) {
  const { email, password } = req.body;

  const admin = await AdminUser.findOne({ email }).select("+passwordHash");

  // Always check a password, even when the account was not found.
  const passwordCorrect = await verifyPassword(
    password,
    admin?.passwordHash ?? DUMMY_HASH,
  );

  // The same message either way: never say WHICH part was wrong.
  if (!admin || !passwordCorrect)
    throw httpError(401, "Incorrect email or password.");

  await AdminUser.updateOne({ _id: admin._id }, { lastLoginAt: new Date() });

  res.cookie(SESSION_COOKIE, createSessionToken(admin), sessionCookieOptions);
  res.json({ admin: { email: admin.email } });
}

// Ends the session on the SERVER (by raising tokenVersion, which invalidates the token even if
// someone copied it) and clears the cookie in the browser. It works even if the session has
// already expired, so the owner can always "log out".
export async function logout(req, res) {
  const payload = readSessionToken(req.cookies?.[SESSION_COOKIE]);
  if (payload) {
    await AdminUser.updateOne(
      { _id: payload.sub, tokenVersion: payload.v },
      { $inc: { tokenVersion: 1 } },
    );
  }

  res.clearCookie(SESSION_COOKIE, sessionCookieOptions);
  res.json({ message: "Logged out." });
}

// "Who am I?" The frontend calls this when the admin page loads, to find out whether
// the browser still has a valid login. (requireAdmin has already done the checking.)
export function me(req, res) {
  res.json({ admin: { email: req.admin.email } });
}
