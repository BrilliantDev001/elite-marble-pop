import { ApiError, apiRequest } from "./api";

// Photo rules. The server enforces the same ones again, so these only give quick feedback.
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Returns a message if the file cannot be used, or "" if it is fine.
export function checkPhotoFile(file) {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type))
    return `"${file.name}" is not a JPG, PNG or WebP image.`;
  if (file.size > MAX_PHOTO_BYTES) return `"${file.name}" is larger than 5 MB.`;
  return "";
}

// Uploads ONE photo straight from the browser to ImageKit. The file never passes through our server.
//   purpose: "project" or "category" (decides which ImageKit folder it goes in)
// Returns { url, fileId }. Throws an ApiError with a message that is safe to show.
export async function uploadPhoto(file, purpose) {
  // 1. Ask our API (admin only) for a short-lived upload pass. The private key never leaves the server.
  const pass = await apiRequest(`/api/admin/uploads/auth?purpose=${purpose}`);

  // 2. Send the file to ImageKit with that pass.
  const form = new FormData();
  form.append("file", file);
  form.append("fileName", file.name);
  form.append("publicKey", pass.publicKey);
  form.append("token", pass.token);
  form.append("expire", String(pass.expire));
  form.append("signature", pass.signature);
  form.append("folder", pass.folder);
  form.append("useUniqueFileName", "true");

  let response;
  try {
    response = await fetch(pass.uploadUrl, { method: "POST", body: form });
  } catch {
    throw new ApiError(
      "The photo could not be uploaded. Please check your connection and try again.",
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok || !data?.fileId || !data?.url) {
    throw new ApiError("The photo could not be uploaded. Please try again.", {
      status: response.status,
    });
  }
  return { url: data.url, fileId: data.fileId };
}
