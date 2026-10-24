import { z } from "zod";
import {
  SERVICES,
  CONTACT_METHODS,
  EMAIL_PATTERN,
  SLUG_PATTERN,
  isValidPhone,
} from "../models/shared.js";
import { blankIfMissing, cleanText } from "./common.js";

// Counts web links in a message. Links are the most common sign of spam.
function countLinks(text) {
  return (text.match(/(?:https?:\/\/|www\.)\S+/gi) ?? []).length;
}

// A required piece of text: trimmed, cleaned, with a length range and (optionally) a link limit.
// The checks run in order, and only the FIRST problem is shown for each field.
function requiredText({ empty, min, minMessage, max, maxMessage, maxLinks }) {
  const linkMessage =
    maxLinks === 0
      ? "Please remove web links from your message."
      : `Please include no more than ${maxLinks} web links.`;

  return z.preprocess(
    (value) => cleanText(blankIfMissing(value)),
    z
      .string()
      .trim()
      .min(1, empty)
      .min(min, minMessage)
      .max(max, maxMessage)
      .refine(
        (value) => maxLinks === undefined || countLinks(value) <= maxLinks,
        linkMessage,
      ),
  );
}

// One of a fixed list of values.
function oneOf(values, message) {
  return z.preprocess(
    blankIfMissing,
    z.string().refine((value) => values.includes(value), message),
  );
}

// An optional web address ending (a project or category slug). Empty becomes null.
const optionalSlug = z.preprocess((value) => {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";
  return slug === "" ? null : slug;
}, z.string().max(120, "That value is too long.").regex(SLUG_PATTERN, "That value is not valid.").nullable());

// ---------- A customer review ----------
// Only these fields are accepted. Anything else (status, featured...) is dropped.
export const reviewSchema = z.object({
  name: requiredText({
    empty: "Please enter your name.",
    min: 2,
    minMessage: "Your name must be at least 2 characters.",
    max: 60,
    maxMessage: "Your name must be 60 characters or fewer.",
  }),
  rating: z.preprocess(
    (value) =>
      value === undefined || value === null || value === "" ? 0 : value,
    z
      .number()
      .int("The rating must be a whole number.")
      .min(1, "Please choose a star rating.")
      .max(5, "Please choose a star rating."),
  ),
  text: requiredText({
    empty: "Please write your review.",
    min: 20,
    minMessage: "Please write at least 20 characters.",
    max: 1000,
    maxMessage: "Your review must be 1000 characters or fewer.",
    maxLinks: 0,
  }),
  service: oneOf(SERVICES, "Please choose the service this review is about."),
  projectSlug: optionalSlug,
});

// ---------- A quotation request ----------
export const enquirySchema = z
  .object({
    name: requiredText({
      empty: "Please enter your name.",
      min: 2,
      minMessage: "Your name must be at least 2 characters.",
      max: 80,
      maxMessage: "Your name must be 80 characters or fewer.",
    }),
    phone: z.preprocess(
      (value) => cleanText(blankIfMissing(value)),
      z
        .string()
        .trim()
        .min(1, "Please enter a phone number.")
        .max(30, "The phone number is too long.")
        .refine(
          isValidPhone,
          "Please enter a valid phone number, for example +234 800 000 0000.",
        ),
    ),
    // Optional, unless the customer chose email as the way to be contacted (checked below).
    email: z.preprocess(
      blankIfMissing,
      z
        .string()
        .trim()
        .toLowerCase()
        .max(120, "The email address is too long.")
        .refine(
          (value) => value === "" || EMAIL_PATTERN.test(value),
          "Please enter a valid email address.",
        ),
    ),
    contactMethod: oneOf(
      CONTACT_METHODS,
      "Please choose how you would like to be contacted.",
    ),
    service: oneOf(SERVICES, "Please choose a service."),
    category: optionalSlug,
    location: requiredText({
      empty: "Please tell us where the work would be done.",
      min: 2,
      minMessage: "Please enter a location.",
      max: 120,
      maxMessage: "The location must be 120 characters or fewer.",
    }),
    description: requiredText({
      empty: "Please describe your project.",
      min: 20,
      minMessage: "Please write at least 20 characters.",
      max: 1500,
      maxMessage: "The description must be 1500 characters or fewer.",
      maxLinks: 2,
    }),
    consent: z.preprocess(
      (value) => value === true,
      z
        .boolean()
        .refine(
          (value) => value === true,
          "Please tick the box so we can contact you about this enquiry.",
        ),
    ),
  })
  .refine((data) => data.contactMethod !== "email" || data.email !== "", {
    path: ["email"],
    message:
      "Please enter your email address, since you chose email as your preferred way to be contacted.",
  });
