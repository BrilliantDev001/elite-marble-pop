import { useEffect, useState } from "react";
import { apiRequest, buildPath } from "../services/api";

// Loads data from the API for a component.
//
//   const { status, data, error, reload } = useApi("/api/projects", { service: "marble" });
//
// status is "loading", "ready", "error" or "idle" (when the path is null, meaning "do not load yet").
// It loads again by itself when the path or the filters change, and cancels a request that is
// no longer needed. reload() tries again (for example, after an error).
export default function useApi(path, query) {
  const url = path ? buildPath(path, query) : null;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  // Identifies THIS request. A stored result only counts if it belongs to the current request,
  // which is how "loading" appears again when the filters change.
  const key = `${url}|${attempt}`;

  useEffect(() => {
    if (!url) return undefined;

    const controller = new AbortController();
    apiRequest(url, { signal: controller.signal }).then(
      (data) => setResult({ key, data, error: null }),
      (error) => {
        if (error.name !== "AbortError") setResult({ key, data: null, error });
      },
    );

    return () => controller.abort();
  }, [url, key]);

  const current = result.key === key ? result : null;

  let status = "loading";
  if (!url) status = "idle";
  else if (current) status = current.error ? "error" : "ready";

  return {
    status,
    data: current?.data ?? null,
    error: current?.error ?? null,
    reload: () => setAttempt((count) => count + 1),
  };
}
