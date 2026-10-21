import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleAlert, LoaderCircle, Star } from "lucide-react";
import FormField, { FieldError } from "../shared/FormField";
import { inputClass } from "../shared/formStyles";
import { services } from "../../data/services";
import { getPublishedProjects } from "../../data/projects";

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_REVIEW_LENGTH = 1000;

const emptyValues = {
  name: "",
  rating: 0,
  text: "",
  service: "",
  projectSlug: "",
  photo: null,
  photoConsent: false,
};

// When a form is submitted with mistakes, focus goes to the FIRST problem field.
// This list is in the same order as the form, and pairs each field with the id to focus.
const FOCUS_ORDER = [
  ["name", "name"],
  ["rating", "rating-1"],
  ["text", "text"],
  ["service", "service"],
  ["photo", "photo"],
  ["photoConsent", "photoConsent"],
];

// Checks every field and returns an object of error messages (empty = all good).
// The real backend must run its own checks too. This is only for quick feedback.
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

  if (!values.service)
    errors.service = "Please choose the service this review is about.";

  if (values.photo) {
    if (!ALLOWED_PHOTO_TYPES.includes(values.photo.type)) {
      errors.photo = "Please choose a JPG, PNG or WebP image.";
    } else if (values.photo.size > MAX_PHOTO_BYTES) {
      errors.photo =
        "This photo is larger than 5 MB. Please choose a smaller one.";
    } else if (!values.photoConsent) {
      errors.photoConsent =
        "Please confirm you are happy for the photo to be used.";
    }
  }

  return errors;
}

export default function ReviewForm() {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | error | success
  const [fileInputKey, setFileInputKey] = useState(0); // changing it empties the file input

  const timerRef = useRef(null);
  const successRef = useRef(null);

  // Dev only: add ?state=error to the URL to preview the error message.
  const [searchParams] = useSearchParams();
  const simulateError =
    import.meta.env.DEV && searchParams.get("state") === "error";

  const projects = getPublishedProjects();

  // Stop the pretend-sending timer if the visitor leaves the page.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Move focus to the success message so screen reader users hear it.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  // Updates one field and clears that field's error message.
  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files[0] ?? null;
    setField("photo", file);
    if (!file) setField("photoConsent", false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (status === "submitting") return;

    const found = validate(values);
    setErrors(found);

    const firstProblem = FOCUS_ORDER.find(([key]) => found[key]);
    if (firstProblem) {
      document.getElementById(firstProblem[1])?.focus();
      return;
    }

    // PROTOTYPE: nothing is sent anywhere. We only pretend to wait.
    setStatus("submitting");
    timerRef.current = setTimeout(() => {
      setStatus(simulateError ? "error" : "success");
    }, 1200);
  }

  function handleReset() {
    setValues(emptyValues);
    setErrors({});
    setFileInputKey((key) => key + 1);
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
          Thank you. This is a prototype.
        </h2>
        <p className="mt-4 text-obsidian/85">
          Your review has <strong>not</strong> been sent or saved anywhere,
          because the website is not connected to a backend yet. Once it is,
          every review will be held for the owner's approval and will only
          appear publicly after it has been approved.
        </p>
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
              onChange={(event) => setField("service", event.target.value)}
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

        <FormField id="projectSlug" label="Project" required={false}>
          {(fieldProps) => (
            <select
              {...fieldProps}
              value={values.projectSlug}
              onChange={(event) => setField("projectSlug", event.target.value)}
            >
              <option value="">Not about a specific project</option>
              {projects.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {project.title}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <div className="space-y-4">
        <FormField
          id="photo"
          label="Add a photo"
          required={false}
          error={errors.photo}
          hint="JPG, PNG or WebP, up to 5 MB."
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              key={fileInputKey}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className={`${inputClass(Boolean(errors.photo))} file:mr-4 file:border-0 file:bg-obsidian file:px-4 file:py-2 file:text-sm file:text-ivory`}
            />
          )}
        </FormField>

        {/* The consent box only appears once a photo has been chosen */}
        {values.photo && (
          <div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="photoConsent"
                checked={values.photoConsent}
                onChange={(event) =>
                  setField("photoConsent", event.target.checked)
                }
                aria-describedby={
                  errors.photoConsent ? "photoConsent-error" : undefined
                }
                aria-invalid={errors.photoConsent ? true : undefined}
                className="mt-1 h-5 w-5 shrink-0 accent-obsidian"
              />
              <label htmlFor="photoConsent" className="text-sm">
                I took this photo or have permission to share it, and I am happy
                for ELITE to publish it with my review once it has been
                approved.
              </label>
            </div>
            {errors.photoConsent && (
              <FieldError id="photoConsent-error">
                {errors.photoConsent}
              </FieldError>
            )}
          </div>
        )}
      </div>

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
          <p>
            We could not send your review. Please check your connection and try
            again.
          </p>
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
          Prototype: submitting does not send or save anything yet.
        </p>
      </div>
    </form>
  );
}
