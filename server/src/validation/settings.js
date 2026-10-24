import { z } from "zod";
import { EMAIL_PATTERN, isValidPhone } from "../models/shared.js";
import { blankIfMissing, cleanText } from "./common.js";

// The same rules as the admin Settings screen, now enforced on the server.
// Every field is optional on edit, so the owner can change just one.
export const updateSettingsSchema = z
  .object({
    phoneDisplay: z.preprocess(
      (value) => cleanText(blankIfMissing(value)),
      z
        .string()
        .trim()
        .min(1, "Please enter the business phone number.")
        .max(30, "The phone number is too long.")
        .refine(
          isValidPhone,
          "Please enter a valid phone number, for example +234 800 000 0000.",
        ),
    ),
    whatsappNumber: z.preprocess(
      blankIfMissing,
      z
        .string()
        .trim()
        .min(1, "Please enter the WhatsApp number.")
        .regex(
          /^\d{7,15}$/,
          "Use digits only, with the country code and no + sign, for example 2348000000000.",
        ),
    ),
    email: z.preprocess(
      blankIfMissing,
      z
        .string()
        .trim()
        .toLowerCase()
        .min(1, "Please enter the business email address.")
        .max(120, "The email address is too long.")
        .regex(EMAIL_PATTERN, "Please enter a valid email address."),
    ),
    // Empty is allowed: it means "do not show a physical address on the website".
    address: z.preprocess(
      (value) => cleanText(blankIfMissing(value)),
      z
        .string()
        .trim()
        .max(200, "The address must be 200 characters or fewer."),
    ),
  })
  .partial();
