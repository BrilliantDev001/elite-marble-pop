import { z } from "zod";

// A missing value (undefined or null) becomes "", so the friendly "Please enter..." message is
// shown instead of a technical one.
export function blankIfMissing(value) {
  return value === undefined || value === null ? "" : value;
}

// Normalizes line breaks and removes invisible control characters from text.
export function cleanText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

// A whole number between 1 and `max`, read from the web address (where everything is text).
export const wholeNumber = (name, max) =>
  z
    .string()
    .regex(/^\d{1,6}$/, `${name} must be a whole number.`)
    .transform(Number)
    .refine(
      (value) => value >= 1 && value <= max,
      `${name} must be between 1 and ${max}.`,
    );

// One of a fixed list of values. A missing value becomes "", so the friendly message is shown.
export function oneOf(values, message) {
  return z.preprocess(
    blankIfMissing,
    z.string().refine((value) => values.includes(value), message),
  );
}
