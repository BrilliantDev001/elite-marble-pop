import { Router } from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/adminSettingsController.js";
import { validateBody } from "../middleware/validate.js";
import { updateSettingsSchema } from "../validation/settings.js";

const router = Router();

router.get("/", getSettings);
router.patch("/", validateBody(updateSettingsSchema), updateSettings);

export default router;
