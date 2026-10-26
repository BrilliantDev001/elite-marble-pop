import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import FormField, { FieldError } from "../shared/FormField";
import { inputClass } from "../shared/formStyles";
import SiteImage from "../shared/SiteImage";
import LoadError from "../shared/LoadError";
import AdminFeedback from "./AdminFeedback";
import usePagedApi from "../../hooks/usePagedApi";
import usePageMeta from "../../hooks/usePageMeta";
import { apiRequest } from "../../services/api";
import { toImage } from "../../services/mappers";
import { checkPhotoFile, uploadPhoto } from "../../services/uploads";
import { services, getServiceBySlug } from "../../data/services";

// When the form is submitted with mistakes, focus goes to the FIRST problem field.
// Each pair is [name of the error, id of the field to focus]. The server's names for photo
// problems are "image.url" and "image.alt".
const FOCUS_ORDER = [
  ["name", "cat-name"],
  ["service", "cat-service"],
  ["description", "cat-description"],
  ["image.url", "cat-photo"],
  ["image.alt", "cat-alt"],
];

// Quick checks in the browser. The server checks everything again (including duplicate names).
function validate(values, image, isEditing) {
  const errors = {};

  const name = values.name.trim();
  if (!name) errors.name = "Please enter a category name.";
  else if (name.length < 3)
    errors.name = "The name must be at least 3 characters.";
  else if (name.length > 60)
    errors.name = "The name must be 60 characters or fewer.";

  if (!isEditing && !values.service)
    errors.service = "Please choose Marble or POP.";

  const description = values.description.trim();
  if (!description) errors.description = "Please enter a short description.";
  else if (description.length < 10)
    errors.description = "Please write at least 10 characters.";

  if (image && !image.alt.trim()) {
    errors["image.alt"] =
      "Please describe the photo for people who cannot see it.";
  }

  return errors;
}

// The photo as the server wants it.
function cleanImage(image) {
  return {
    url: image.url,
    fileId: image.fileId ?? "",
    alt: image.alt.trim(),
    caption: image.caption ?? "",
  };
}

// Compares the saved photo with the one in the form.
// Returns undefined (no change), null (photo removed) or the new photo.
function diffImage(original, current) {
  if (!original && !current) return undefined;
  if (!current) return null;
  const unchanged =
    original &&
    original.url === current.url &&
    (original.fileId ?? "") === (current.fileId ?? "") &&
    original.alt === current.alt.trim();
  return unchanged ? undefined : cleanImage(current);
}

// ---------- The add / edit form ----------
function CategoryForm({ existing, onSaved, onCancel }) {
  const isEditing = Boolean(existing);

  const [values, setValues] = useState({
    name: existing?.name ?? "",
    service: existing?.service ?? "",
    description: existing?.description ?? "",
  });
  const [image, setImage] = useState(existing?.image ?? null); // { url, fileId, alt, caption }
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [fileProblem, setFileProblem] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.getElementById("cat-name")?.focus();
  }, []);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError("");
  }

  async function handleFileChange(event) {
    const file = event.target.files[0];
    event.target.value = ""; // lets the same file be chosen again
    if (!file) return;

    const problem = checkPhotoFile(file);
    if (problem) {
      setFileProblem(problem);
      return;
    }

    setFileProblem("");
    setUploading(true);
    try {
      const uploaded = await uploadPhoto(file, "category");
      // The photo is now in ImageKit. It still needs alt text before the category can be saved.
      setImage({ ...uploaded, alt: "", caption: "" });
      setErrors((current) => ({ ...current, "image.url": undefined }));
      requestAnimationFrame(() => document.getElementById("cat-alt")?.focus());
    } catch (error) {
      setFileProblem(error.message);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImage(null);
    setFileProblem("");
    setErrors((current) => ({
      ...current,
      "image.url": undefined,
      "image.alt": undefined,
    }));
    document.getElementById("cat-photo")?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || uploading) return;

    const found = validate(values, image, isEditing);
    setErrors(found);
    setFormError("");

    const firstProblem = FOCUS_ORDER.find(([key]) => found[key]);
    if (firstProblem) {
      document.getElementById(firstProblem[1])?.focus();
      return;
    }

    const name = values.name.trim();
    const description = values.description.trim();

    let path = "/api/admin/categories";
    let method = "POST";
    let body = {
      name,
      service: values.service,
      description,
      image: image ? cleanImage(image) : null,
    };

    if (isEditing) {
      // Send only what changed.
      const changes = {};
      if (name !== existing.name) changes.name = name;
      if (description !== existing.description)
        changes.description = description;
      const imageChange = diffImage(existing.image, image);
      if (imageChange !== undefined) changes.image = imageChange;

      if (Object.keys(changes).length === 0) {
        setFormError("Nothing has changed yet.");
        return;
      }
      path = `/api/admin/categories/${existing.slug}`;
      method = "PATCH";
      body = changes;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest(path, { method, body });
      onSaved(data.category, !isEditing);
    } catch (error) {
      setSubmitting(false);

      // The server found a problem with specific fields (like a duplicate name): show it there.
      const serverErrors = error.fields ?? {};
      const first = FOCUS_ORDER.find(([key]) => serverErrors[key]);
      if (first) {
        setErrors(serverErrors);
        document.getElementById(first[1])?.focus();
      } else {
        setFormError(error.message);
      }
    }
  }

  const existingService = getServiceBySlug(existing?.service);
  const busy = submitting || uploading;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="category-form-title"
      className="mt-8 max-w-2xl space-y-8 border border-obsidian/30 p-6"
    >
      <h2 id="category-form-title" className="text-3xl font-medium">
        {isEditing ? `Edit "${existing.name}"` : "Add a category"}
      </h2>

      <FormField id="cat-name" label="Category name" error={errors.name}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="text"
            maxLength={60}
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
          />
        )}
      </FormField>

      {isEditing ? (
        <div className="text-sm">
          <p>
            <span className="font-semibold">Service:</span>{" "}
            {existingService?.name}
          </p>
          <p className="mt-1">
            <span className="font-semibold">Web address:</span> ?category=
            {existing.slug}
          </p>
          <p className="mt-2 text-obsidian/75">
            The service and web address cannot be changed, because projects and
            shared links depend on them. You can rename the category freely.
          </p>
        </div>
      ) : (
        <FormField id="cat-service" label="Service" error={errors.service}>
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
      )}

      <FormField
        id="cat-description"
        label="Short description"
        error={errors.description}
        hint="Shown on the category card, for example: Marble worktops and islands cut to fit your kitchen."
      >
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            rows={3}
            maxLength={120}
            value={values.description}
            onChange={(event) => setField("description", event.target.value)}
          />
        )}
      </FormField>

      <div className="space-y-4">
        <FormField
          id="cat-photo"
          label="Category photo"
          required={false}
          error={errors["image.url"]}
          hint="Used on the category card. JPG, PNG or WebP, up to 5 MB. It is uploaded as soon as you choose it."
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={handleFileChange}
              className={`${inputClass(Boolean(errors["image.url"]))} file:mr-4 file:border-0 file:bg-obsidian file:px-4 file:py-2 file:text-sm file:text-ivory`}
            />
          )}
        </FormField>

        {uploading && (
          <p role="status" className="flex items-center gap-2 text-sm">
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="animate-spin"
            />
            Uploading the photo...
          </p>
        )}

        {fileProblem && (
          <div role="alert">
            <FieldError>{fileProblem}</FieldError>
          </div>
        )}

        {image && (
          <div className="flex flex-col gap-4 sm:flex-row">
            <SiteImage
              image={toImage({
                ...image,
                alt: image.alt || "Preview of the category photo",
              })}
              className="h-32 w-full shrink-0 sm:w-44"
              sizes="176px"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <FormField
                id="cat-alt"
                label="Alt text for the photo"
                error={errors["image.alt"]}
                hint="Describe what the photo shows, for people who cannot see it."
              >
                {(fieldProps) => (
                  <input
                    {...fieldProps}
                    type="text"
                    maxLength={200}
                    value={image.alt}
                    onChange={(event) => {
                      setImage({ ...image, alt: event.target.value });
                      setErrors((current) => ({
                        ...current,
                        "image.alt": undefined,
                      }));
                    }}
                  />
                )}
              </FormField>
              <button
                type="button"
                onClick={removeImage}
                className="btn-outline btn-sm"
              >
                Remove photo
              </button>
            </div>
          </div>
        )}
      </div>

      {formError && (
        <div role="alert">
          <FieldError>{formError}</FieldError>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-obsidian/20 pt-6 sm:flex-row">
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <>
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="animate-spin"
              />
              Saving...
            </>
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Add category"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- The Categories screen ----------
export default function AdminCategories() {
  usePageMeta("Admin: Categories");

  // Categories are few, so one request loads them all.
  const list = usePagedApi("/api/admin/categories", {}, 100);

  // mode: null (form closed), { type: "new" } or { type: "edit", slug }
  const [mode, setMode] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [busySlug, setBusySlug] = useState(null); // the category an archive or restore is running for
  const feedbackRef = useRef(null);
  const pendingFocus = useRef(null); // the id of the element to focus after the screen updates

  // Runs after the form opens or closes, and moves focus to where the admin should continue.
  useEffect(() => {
    if (pendingFocus.current) {
      document.getElementById(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  }, [mode]);

  const editing =
    mode?.type === "edit"
      ? list.items.find((category) => category.slug === mode.slug)
      : null;
  const formOpen = mode?.type === "new" || Boolean(editing);

  function handleSaved(category, isNew) {
    list.patchItems((items) =>
      isNew
        ? [...items, category]
        : items.map((item) => (item.slug === category.slug ? category : item)),
    );
    const where = getServiceBySlug(category.service)?.shortName;
    setFeedback({
      type: "success",
      text: isNew
        ? `Added "${category.name}" under ${where}.`
        : `Saved changes to "${category.name}".`,
    });
    setMode(null);
    feedbackRef.current?.focus();
  }

  function handleCancel() {
    pendingFocus.current =
      mode?.type === "edit" ? `edit-${mode.slug}` : "add-category";
    setMode(null);
  }

  // Categories are archived, never deleted, so existing projects never silently break.
  async function setActive(category, active) {
    if (busySlug) return;
    setBusySlug(category.slug);
    setFeedback(null);

    try {
      const data = await apiRequest(`/api/admin/categories/${category.slug}`, {
        method: "PATCH",
        body: { active },
      });
      const updated = data.category;
      list.patchItems((items) =>
        items.map((item) => (item.slug === updated.slug ? updated : item)),
      );

      const count = updated.projectCount;
      if (active) {
        setFeedback({
          type: "success",
          text: `Restored "${updated.name}". It can be chosen for projects again.`,
        });
      } else {
        setFeedback({
          type: "success",
          text:
            count > 0
              ? `Archived "${updated.name}". The ${count} ${count === 1 ? "project that uses" : "projects that use"} it keep${count === 1 ? "s" : ""} their category and are not affected. It can no longer be chosen for new projects.`
              : `Archived "${updated.name}". It can no longer be chosen for new projects.`,
        });
      }
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
    } finally {
      setBusySlug(null);
      feedbackRef.current?.focus();
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-medium md:text-5xl">Categories</h1>
          <p className="mt-3 max-w-2xl text-obsidian/80">
            Categories group your projects and power the gallery filters. Each
            one belongs to Marble or POP. They are proposed categories until you
            confirm your real list of services.
          </p>
        </div>
        <button
          type="button"
          id="add-category"
          onClick={() => setMode({ type: "new" })}
          disabled={list.status !== "ready"}
          className="btn-primary self-start disabled:cursor-not-allowed disabled:opacity-70 md:self-auto"
        >
          <Plus size={16} aria-hidden="true" />
          Add category
        </button>
      </div>

      <p className="mt-3 max-w-2xl text-sm text-obsidian/70">
        There is no delete button on purpose: archiving hides a category without
        breaking the projects that use it.
      </p>

      <AdminFeedback feedback={feedback} ref={feedbackRef} />

      {list.status === "loading" && (
        <div className="mt-8 space-y-5">
          <p className="sr-only" role="status">
            Loading categories...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-32 animate-pulse bg-stone/20"
            />
          ))}
        </div>
      )}

      {list.status === "error" && (
        <div className="mt-8">
          <LoadError
            message="We could not load the categories."
            onRetry={list.reload}
          />
        </div>
      )}

      {list.status === "ready" && (
        <>
          {formOpen && (
            <CategoryForm
              key={mode.type === "edit" ? mode.slug : "new"}
              existing={editing}
              onSaved={handleSaved}
              onCancel={handleCancel}
            />
          )}

          {/* One list per service */}
          {services.map((service) => {
            const group = list.items.filter(
              (category) => category.service === service.slug,
            );

            return (
              <section key={service.slug} className="mt-14">
                <h2 className="text-3xl font-medium">{service.name}</h2>

                {group.length > 0 ? (
                  <ul className="mt-6 space-y-5">
                    {group.map((category) => {
                      const count = category.projectCount;
                      const busy = busySlug === category.slug;

                      return (
                        <li key={category.slug}>
                          <article className="flex flex-col gap-5 border border-obsidian/25 p-5 sm:flex-row">
                            {category.image ? (
                              <SiteImage
                                image={toImage(category.image)}
                                className="h-32 w-full shrink-0 sm:h-24 sm:w-32"
                                sizes="128px"
                              />
                            ) : (
                              <div className="flex h-32 w-full shrink-0 items-center justify-center bg-stone/20 text-xs sm:h-24 sm:w-32">
                                No photo
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-2xl font-medium">
                                  {category.name}
                                </h3>
                                <span
                                  className={`inline-block border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                                    category.active
                                      ? "border-obsidian bg-obsidian text-ivory"
                                      : "border-obsidian/40 text-obsidian/70"
                                  }`}
                                >
                                  {category.active ? "Active" : "Archived"}
                                </span>
                              </div>

                              <p className="mt-2 text-sm text-obsidian/85">
                                {category.description}
                              </p>
                              <p className="mt-2 text-sm text-obsidian/70">
                                Used by {count}{" "}
                                {count === 1 ? "project" : "projects"} (any
                                status)
                              </p>

                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  id={`edit-${category.slug}`}
                                  onClick={() =>
                                    setMode({
                                      type: "edit",
                                      slug: category.slug,
                                    })
                                  }
                                  aria-label={`Edit ${category.name}`}
                                  className="btn-outline btn-sm"
                                >
                                  Edit
                                </button>

                                {category.active ? (
                                  <button
                                    type="button"
                                    onClick={() => setActive(category, false)}
                                    disabled={busy}
                                    aria-busy={busy}
                                    aria-label={`Archive ${category.name}`}
                                    className="btn-outline btn-sm disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    Archive
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setActive(category, true)}
                                    disabled={busy}
                                    aria-busy={busy}
                                    aria-label={`Restore ${category.name}`}
                                    className="btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-6 max-w-xl border border-obsidian/20 p-6 text-obsidian/80">
                    No {service.shortName} categories yet.
                  </p>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
