import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, LoaderCircle, Star } from "lucide-react";
import FormField, { FieldError } from "../shared/FormField";
import HoneypotField from "../shared/HoneypotField";
import useApi from "../../hooks/useApi";
import { useSettings } from "../../context/settingsContext";
import { apiRequest } from "../../services/api";
import { services } from "../../data/services";
import { getWhatsAppLink } from "../../data/siteConfig";
import { countLinks } from "../../utils/forms";

const MAX_REVIEW_LENGTH = 1000;

const emptyValues = {
  name: "",
  rating: 0,
  text: "",
  service: "",
  projectSlug: "",
  website: "", // the hidden spam trap. It must stay empty for real visitors.
};

// When a form is submitted with mistakes, focus goes to the FIRST problem field.
// This list is in the same order as the form, and pairs each field with the id to focus.
const FOCUS_ORDER = [
  ["name", "name"],
  ["rating", "rating-1"],
  ["text", "text"],
  ["service", "service"],
  ["projectSlug", "projectSlug"],
];

// Quick checks in the browser, for fast feedback. The server checks everything again.
function validate(values) {
  const errors = {};

  const name = values.name.trim();
  if (!name) errors.name = "Please enter your name.";
  else if (name.length < 2)
    errors.name = "Your name must be at least 2 characters.";
  else if (name.length > 60)
    errors.name = "Your name must be 60 characters or fewer.";

  if (!values.rating) errors.rating = "Please choose a star rating.";

  const text = values.text.trim();
  if (!text) errors.text = "Please write your review.";
  else if (text.length < 20)
    errors.text = "Please write at least 20 characters.";
  else if (countLinks(text) > 0)
    errors.text = "Please remove web links from your message.";

  if (!values.service)
    errors.service = "Please choose the service this review is about.";

  return errors;
}

export default function ReviewForm() {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | error | success
  const [errorMessage, setErrorMessage] = useState("");
  const [thanks, setThanks] = useState("");
  const successRef = useRef(null);

  const { contact } = useSettings();

  // Every published project, for the optional "which project is this about?" menu.
  const projectsRequest = useApi("/api/projects/options");
  const allProjects = projectsRequest.data?.items ?? [];
  const projectOptions = values.service
    ? allProjects.filter((project) => project.service === values.service)
    : allProjects;

  // Move focus to the success message so screen reader users hear it.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  // Updates one field and clears that field's error message.
  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  // Changing the service clears the chosen project if it belongs to the other service.
  function handleServiceChange(value) {
    setValues((current) => {
      const stillValid = allProjects.some(
        (project) =>
          project.slug === current.projectSlug &&
          (!value || project.service === value),
      );
      return {
        ...current,
        service: value,
        projectSlug: stillValid ? current.projectSlug : "",
      };
    });
    setErrors((current) => ({
      ...current,
      service: undefined,
      projectSlug: undefined,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "submitting") return;

    const found = validate(values);
    setErrors(found);

    const firstProblem = FOCUS_ORDER.find(([key]) => found[key]);
    if (firstProblem) {
      document.getElementById(firstProblem[1])?.focus();
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const data = await apiRequest("/api/reviews", {
        method: "POST",
        body: {
          name: values.name,
          rating: values.rating,
          text: values.text,
          service: values.service,
          projectSlug: values.projectSlug,
          website: values.website,
        },
      });
      // We only say "thank you" now, after the server has really confirmed the save.
      setThanks(data.message);
      setStatus("success");
    } catch (error) {
      // The server found problems with specific fields: show them next to the fields.
      const serverErrors = error.fields ?? {};
      const first = FOCUS_ORDER.find(([key]) => serverErrors[key]);

      if (first) {
        setErrors(serverErrors);
        setStatus("idle");
        document.getElementById(first[1])?.focus();
      } else {
        setErrorMessage(error.message);
        setStatus("error");
      }
    }
  }

  function handleReset() {
    setValues(emptyValues);
    setErrors({});
    setErrorMessage("");
    setStatus("idle");
  }

  // ---------- Success screen ----------
  if (status === "success") {
    return (
      <div className="border border-obsidian/20 p-8 md:p-10">
        <h2
          ref={successRef}
          tabIndex={-1}
          className="text-3xl font-medium focus:outline-none"
        >
          Thank you.
        </h2>
        <p className="mt-4 text-obsidian/85">{thanks}</p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button type="button" onClick={handleReset} className="btn-outline">
            Write another review
          </button>
          <Link to="/reviews" className="btn-outline">
            Back to reviews
          </Link>
        </div>
      </div>
    );
  }

  // ---------- The form ----------
  return (
    // noValidate turns off the browser's own pop-up messages so ours are shown instead
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <HoneypotField
        value={values.website}
        onChange={(value) => setField("website", value)}
      />

      <p className="text-sm text-obsidian/75">
        All fields are required unless marked optional.
      </p>

      <FormField
        id="name"
        label="Your name"
        error={errors.name}
        hint="This is shown with your review. A first name or initials is fine."
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="text"
            autoComplete="name"
            maxLength={60}
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
          />
        )}
      </FormField>

      {/* Star rating: a group of 5 radio buttons drawn as stars */}
      <fieldset
        aria-describedby={errors.rating ? "rating-error" : undefined}
        aria-invalid={errors.rating ? true : undefined}
      >
        <legend className="mb-2 text-sm font-semibold">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((number) => (
            <div key={number} className="relative">
              <input
                type="radio"
                id={`rating-${number}`}
                name="rating"
                value={number}
                checked={values.rating === number}
                onChange={() => setField("rating", number)}
                className="peer sr-only"
              />
              <label
                htmlFor={`rating-${number}`}
                className="flex h-11 w-11 cursor-pointer items-center justify-center peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-obsidian"
              >
                <span className="sr-only">
                  {number === 1 ? "1 star" : `${number} stars`}
                </span>
                <Star
                  size={28}
                  aria-hidden="true"
                  className={
                    number <= values.rating
                      ? "fill-gold stroke-gold"
                      : "stroke-obsidian/50"
                  }
                />
              </label>
            </div>
          ))}
        </div>
        {errors.rating && (
          <FieldError id="rating-error">{errors.rating}</FieldError>
        )}
      </fieldset>

      <FormField id="text" label="Your review" error={errors.text}>
        {(fieldProps) => (
          <>
            <textarea
              {...fieldProps}
              rows={6}
              maxLength={MAX_REVIEW_LENGTH}
              value={values.text}
              onChange={(event) => setField("text", event.target.value)}
            />
            <p className="mt-1 text-right text-xs text-obsidian/70">
              {values.text.length}/{MAX_REVIEW_LENGTH}
            </p>
          </>
        )}
      </FormField>

      <div className="grid gap-8 sm:grid-cols-2">
        <FormField id="service" label="Service" error={errors.service}>
          {(fieldProps) => (
            <select
              {...fieldProps}
              value={values.service}
              onChange={(event) => handleServiceChange(event.target.value)}
            >
              <option value="">Choose a service</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          id="projectSlug"
          label="Project"
          required={false}
          error={errors.projectSlug}
          hint={
            projectsRequest.status === "error"
              ? "Projects could not be loaded. You can still send your review."
              : undefined
          }
        >
          {(fieldProps) => (
            <select
              {...fieldProps}
              disabled={projectsRequest.status !== "ready"}
              value={values.projectSlug}
              onChange={(event) => setField("projectSlug", event.target.value)}
            >
              <option value="">
                {projectsRequest.status === "loading"
                  ? "Loading projects..."
                  : "Not about a specific project"}
              </option>
              {projectOptions.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {project.title}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      {/* Reviews are text only. Photos can be sent on WhatsApp instead. */}
      {contact && (
        <p className="text-sm text-obsidian/80">
          Have a photo of the finished work? You can send it to us on{" "}
          <a
            href={getWhatsAppLink(
              "Hello ELITE, I would like to share a photo of the finished work.",
              contact,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-4"
          >
            WhatsApp
          </a>
          .
        </p>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-800 p-4 text-sm"
        >
          <CircleAlert
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-red-800"
          />
          <p>{errorMessage}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={status === "submitting"}
          aria-busy={status === "submitting"}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? (
            <>
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="animate-spin"
              />
              Sending...
            </>
          ) : (
            "Submit review"
          )}
        </button>
        <p className="mt-4 text-sm text-obsidian/75">
          Every review is checked by the owner before it appears on the website.
        </p>
      </div>
    </form>
  );
}
