import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, LoaderCircle } from "lucide-react";
import BrandLogo from "../shared/BrandLogo";
import FormField from "../shared/FormField";
import usePageMeta from "../../hooks/usePageMeta";
import { useAdminSession } from "../../context/adminSessionContext";

export default function AdminLogin() {
  usePageMeta("Admin login");

  const { login, notice } = useAdminSession();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    // Quick checks in the browser. The server checks again.
    const found = {};
    const email = values.email.trim();
    if (!email) found.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      found.email = "Please enter a valid email address.";
    if (!values.password) found.password = "Please enter your password.";

    setErrors(found);
    setFormError("");

    if (found.email) return document.getElementById("email")?.focus();
    if (found.password) return document.getElementById("password")?.focus();

    setSubmitting(true);
    try {
      await login(email, values.password);
      // On success the session changes and this screen is replaced by the dashboard.
    } catch (error) {
      setSubmitting(false);

      const fields = error.fields ?? {};
      if (fields.email || fields.password) {
        setErrors(fields);
        document.getElementById(fields.email ? "email" : "password")?.focus();
      } else {
        // For example "Incorrect email or password." or "Too many login attempts...".
        // The password is cleared so it is not left sitting in the form.
        setFormError(error.message);
        setValues((current) => ({ ...current, password: "" }));
        document.getElementById("password")?.focus();
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-4 py-12">
      <div className="w-full max-w-md">
        <BrandLogo />

        <h1 className="mt-10 text-4xl font-medium">Admin login</h1>

        {/* "You have been logged out." or "Your session has ended." */}
        {notice && (
          <p role="status" className="mt-6 border-l-2 border-gold pl-4 text-sm">
            {notice}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
          <FormField id="email" label="Email address" error={errors.email}>
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="email"
                autoComplete="username"
                value={values.email}
                onChange={(event) => setField("email", event.target.value)}
              />
            )}
          </FormField>

          <FormField id="password" label="Password" error={errors.password}>
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="password"
                autoComplete="current-password"
                value={values.password}
                onChange={(event) => setField("password", event.target.value)}
              />
            )}
          </FormField>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-3 border border-red-800 p-4 text-sm"
            >
              <CircleAlert
                size={18}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-red-800"
              />
              <p>{formError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="animate-spin"
                />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <Link
          to="/"
          className="mt-8 inline-block min-h-11 text-sm font-semibold underline underline-offset-4"
        >
          Back to the website
        </Link>
      </div>
    </main>
  );
}
