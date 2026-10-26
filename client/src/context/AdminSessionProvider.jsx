import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, SESSION_EXPIRED_EVENT } from "../services/api";
import { AdminSessionContext } from "./adminSessionContext";

const LOGGED_OUT = { status: "loggedOut", admin: null, error: null };

// Keeps track of whether the admin is logged in. The truth lives on the SERVER (a secure cookie
// the page cannot read), so we ask it instead of remembering anything in the browser.
export default function AdminSessionProvider({ children }) {
  const [session, setSession] = useState({
    status: "checking",
    admin: null,
    notice: "",
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  // When the admin page opens (and on "Try again"), ask the server whether we are logged in.
  useEffect(() => {
    const controller = new AbortController();

    apiRequest("/api/admin/auth/me", { signal: controller.signal }).then(
      (data) =>
        setSession({
          status: "loggedIn",
          admin: data.admin,
          notice: "",
          error: null,
        }),
      (error) => {
        if (error.name === "AbortError") return;
        if (error.status === 401)
          setSession({ ...LOGGED_OUT, notice: "" }); // simply not logged in
        else setSession({ status: "error", admin: null, notice: "", error });
      },
    );

    return () => controller.abort();
  }, [attempt]);

  // If any admin request is refused because the login ended, go back to the login screen.
  useEffect(() => {
    function handleExpired() {
      setSession((current) =>
        current.status === "loggedIn"
          ? {
              ...LOGGED_OUT,
              notice: "Your session has ended. Please log in again.",
            }
          : current,
      );
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  // Throws an ApiError when the login fails, so the login form can show why.
  const login = useCallback(async (email, password) => {
    const data = await apiRequest("/api/admin/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setSession({
      status: "loggedIn",
      admin: data.admin,
      notice: "",
      error: null,
    });
  }, []);

  // Only reports "logged out" once the server has confirmed it. If the request fails, it throws
  // and the admin stays logged in. We never claim a logout that did not happen.
  const logout = useCallback(async () => {
    await apiRequest("/api/admin/auth/logout", { method: "POST" });
    setSession({ ...LOGGED_OUT, notice: "You have been logged out." });
  }, []);

  const retry = useCallback(() => {
    setSession({ status: "checking", admin: null, notice: "", error: null });
    setAttempt((count) => count + 1);
  }, []);

  const value = useMemo(
    () => ({ ...session, login, logout, retry }),
    [session, login, logout, retry],
  );

  return <AdminSessionContext value={value}>{children}</AdminSessionContext>;
}
