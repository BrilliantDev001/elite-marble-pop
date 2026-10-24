import Settings from "../models/Settings.js";
import { toPublicSettings } from "../utils/publicShapes.js";
import { httpError } from "../utils/httpError.js";

// The same fields the public site sees, plus when they were last changed.
function toAdminSettings(settings) {
  return { ...toPublicSettings(settings), updatedAt: settings.updatedAt };
}

// GET /api/admin/settings
export async function getSettings(req, res) {
  const settings = await Settings.getSite();
  res.json({ settings: toAdminSettings(settings) });
}

// PATCH /api/admin/settings
export async function updateSettings(req, res) {
  const changes = Object.fromEntries(
    Object.entries(req.body).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(changes).length === 0)
    throw httpError(400, "There is nothing to change.");

  const settings = await Settings.getSite();
  settings.set(changes);
  await settings.save(); // runs the model's rules as well

  res.json({ settings: toAdminSettings(settings) });
}
