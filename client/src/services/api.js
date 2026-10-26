// The ONE place the website talks to the API. Components never call fetch() themselves.

// Empty means "the same address as the website" (development uses the Vite proxy for this).
// If the API ever lives on a different address, set VITE_API_URL in client/.env.production.
// This is a public setting and must NEVER contain a secret.
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

// An error from the API (or from reaching it), with messages that are safe to show to a visitor.
// Announced when an admin request is refused because the login has ended.
// The admin session listens for it and shows the login screen again.
export const SESSION_EXPIRED_EVENT = "elite:session-expired";

export class ApiError extends Error {
  constructor(message, { status = 0, fields = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 means "could not reach the server"
    this.fields = fields; // per-field messages, for example { name: "Please enter your name." }
  }
}

// Adds ?filters to a path, leaving out any empty values.
// buildPath("/api/projects", { service: "marble", category: "" }) -> "/api/projects?service=marble"
export function buildPath(path, query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

// Sends a request and returns the parsed JSON. Throws an ApiError if anything goes wrong.
// "credentials: include" sends the admin login cookie along.
export async function apiRequest(path, { method = "GET", body, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error; // the page moved on. This is not a real error.
    throw new ApiError(
      "We could not reach the server. Please check your connection and try again.",
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Some failures (like a gateway error) have no JSON body. We fall back to a general message.
  }

  if (!response.ok) {
    // A refused admin request means the login has ended. (The login routes handle their own 401s.)
    if (response.status === 401 && path.startsWith("/api/admin/") && !path.startsWith("/api/admin/auth/")) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(
      data?.message ?? "Something went wrong. Please try again.",
      {
        status: response.status,
        fields: data?.errors ?? {},
      },
    );
  }
  return data;
}
