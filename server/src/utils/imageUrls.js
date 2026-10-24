import { env } from "../config/env.js";

// Decides whether a photo address is one WE control. Photos are only accepted when they are:
//  - one of the local placeholder photos (/placeholders/some-file.jpg), or
//  - served from our own ImageKit address (once it is set in .env during Stage B6).
// Anything else is refused, so nobody can slip in a photo hosted on someone else's website.
export function isAllowedImageUrl(url) {
  if (typeof url !== "string") return false;

  if (/^\/placeholders\/[A-Za-z0-9._-]+$/.test(url)) return true;

  const endpoint = env.imagekitUrlEndpoint;
  if (!endpoint || !url.startsWith(`${endpoint}/`)) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
