import { Router } from "express";
import { z } from "zod";
import { getUploadAuth } from "../controllers/uploadController.js";
import { validateQuery } from "../middleware/validate.js";

const router = Router();

const authQuery = z.object({
  purpose: z.enum(["project", "category"], {
    message: "purpose must be project or category.",
  }),
});

router.get("/auth", validateQuery(authQuery), getUploadAuth);

export default router;
