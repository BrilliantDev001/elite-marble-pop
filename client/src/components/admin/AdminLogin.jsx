import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert } from "lucide-react";
import BrandLogo from "../shared/BrandLogo";
import FormField from "../shared/FormField";
import usePageMeta from "../../hooks/usePageMeta";

// FAKE LOGIN, for the prototype only. There is no real authentication yet.
// Real owner login (secure passwords, sessions, protected API routes) is built in the backend phase.
export default function AdminLogin({ onLogin }) {
  usePageMeta("Admin login");

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const found = {};
    const email = values.email.trim();
    if (!email) found.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      found.email = "Please enter a valid email address.";
    if (!values.password) found.password = "Please enter your password.";

    setErrors(found);

    if (found.email) return document.getElementById("email")?.focus();
    if (found.password) return document.getElementById("password")?.focus();

    // Prototype: anything is accepted.
    onLogin();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-4 py-12">
      <div className="w-full max-w-md">
        <BrandLogo />

        <h1 className="mt-10 text-4xl font-medium">Admin login</h1>

        <div className="mt-6 flex gap-3 border border-obsidian/30 p-4 text-sm">
          <CircleAlert
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          <p>
            <strong>Prototype.</strong> This login is not real. Enter any email
            and password to preview the dashboard. Nothing is checked or saved.
          </p>
        </div>

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

          <button type="submit" className="btn-primary w-full">
            Log in
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
