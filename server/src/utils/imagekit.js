import crypto from "node:crypto";
import { env } from "../config/env.js";
import { httpError } from "./httpError.js";

// Everything that talks to ImageKit lives in this one file.

const API_BASE = "https://api.imagekit.io/v1";
const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB, the same limit as the admin form
export const UPLOAD_FOLDERS = {
  project: "/elite/projects",
  category: "/elite/categories",
};

const UPLOAD_PASS_SECONDS = 10 * 60; // an upload pass works for 10 minutes (ImageKit allows under 1 hour)

// ---------- Upload pass ----------

// Creates the one-time "pass" the admin's browser needs to upload ONE file straight to ImageKit.
// The signature is an HMAC-SHA1 of (token + expire), signed with the PRIVATE key.
// The private key itself is never sent anywhere.
export function createUploadAuth(purpose) {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + UPLOAD_PASS_SECONDS;
  const signature = crypto
    .createHmac("sha1", env.imagekitPrivateKey)
    .update(`${token}${expire}`)
    .digest("hex");

  return {
    publicKey: env.imagekitPublicKey,
    token,
    expire,
    signature,
    uploadUrl: UPLOAD_URL,
    folder: UPLOAD_FOLDERS[purpose],
    maxBytes: MAX_PHOTO_BYTES,
    allowedTypes: ALLOWED_PHOTO_TYPES,
  };
}

// ---------- Talking to ImageKit's API (private key, server only) ----------

async function callApi(path, method = "GET") {
  const credentials = Buffer.from(`${env.imagekitPrivateKey}:`).toString(
    "base64",
  );

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    console.error(`ImageKit request failed: ${error.message}`);
    throw httpError(
      502,
      "The image service is not responding. Please try again.",
    );
  }

  if (response.status === 401 || response.status === 403) {
    console.error(
      `ImageKit rejected our credentials (${response.status}). Check IMAGEKIT_PRIVATE_KEY.`,
    );
    throw httpError(502, "The image service is not set up correctly.");
  }
  return response;
}

// Returns ImageKit's record of a file, or null if no such file exists.
export async function getFileDetails(fileId) {
  const response = await callApi(
    `/files/${encodeURIComponent(fileId)}/details`,
  );
  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) {
    console.error(
      `ImageKit could not read file ${fileId} (${response.status}).`,
    );
    throw httpError(
      502,
      "The image service is not responding. Please try again.",
    );
  }
  return response.json();
}

// Deletes a file from ImageKit. A file that is already gone counts as success.
export async function deleteFile(fileId) {
  const response = await callApi(
    `/files/${encodeURIComponent(fileId)}`,
    "DELETE",
  );
  if (response.ok) console.log(`ImageKit: deleted file ${fileId}`);
  else if (response.status !== 404)
    console.error(
      `ImageKit: could not delete file ${fileId} (${response.status})`,
    );
}

// ---------- Checking an uploaded file ----------

const withoutQuery = (url) => String(url).split(/[?#]/)[0];

// Asks ImageKit about the file and checks it against our rules. Returns { url } (ImageKit's own
// address for the file, which is the one we save) or { error } with a message for the admin.
export async function verifyUpload({ fileId, url, folder }) {
  const details = await getFileDetails(fileId);

  if (!details)
    return { error: "This photo could not be found. Please upload it again." };
  if (!String(details.filePath ?? "").startsWith(`${folder}/`)) {
    return {
      error:
        "This photo was uploaded to the wrong place. Please upload it again.",
    };
  }
  if (!ALLOWED_PHOTO_TYPES.includes(details.mime))
    return { error: "Photos must be JPG, PNG or WebP images." };
  if (!(details.size <= MAX_PHOTO_BYTES))
    return {
      error: "This photo is larger than 5 MB. Please choose a smaller one.",
    };
  if (details.isPrivateFile === true)
    return { error: "This photo is private. Please upload it again." };

  const canonicalUrl = withoutQuery(details.url);
  if (withoutQuery(url) !== canonicalUrl) {
    return {
      error:
        "This photo's address does not match the uploaded file. Please upload it again.",
    };
  }
  return { url: canonicalUrl };
}
