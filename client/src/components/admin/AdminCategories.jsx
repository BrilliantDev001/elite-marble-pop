import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import FormField, { FieldError } from "../shared/FormField";
import { inputClass } from "../shared/formStyles";
import SiteImage from "../shared/SiteImage";
import usePageMeta from "../../hooks/usePageMeta";
import { services, getServiceBySlug } from "../../data/services";
import { normalizeName, slugify } from "../../data/adminMock";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Checks the form and returns an object of error messages (empty = all good).
// The real backend must run its own checks too. This is only for quick feedback.
function validate({ values, image, categories, existing }) {
  const errors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Please enter a category name.";
  } else if (name.length < 3) {
    errors.name = "The name must be at least 3 characters.";
  } else if (name.length > 60) {
    errors.name = "The name must be 60 characters or fewer.";
  } else {
    // Catches near-duplicates: "Kitchen Counter-tops", "kitchen counter-top", "Kitchen  Counter-tops!"
    const duplicate = categories.find(
      (category) =>
        category.slug !== existing?.slug &&
        normalizeName(category.name) === normalizeName(name),
    );
    if (duplicate) {
      const where =
        getServiceBySlug(duplicate.service)?.shortName ?? duplicate.service;
      errors.name = duplicate.active
        ? `A category called "${duplicate.name}" already exists under ${where}.`
        : `A category called "${duplicate.name}" already exists under ${where} (archived). Restore it from the list instead.`;
    } else if (!existing) {
      const slug = slugify(name);
      if (!slug)
        errors.name = "Please use at least one letter or number in the name.";
      else if (categories.some((category) => category.slug === slug)) {
        errors.name =
          "This name is too similar to an existing category. Please choose a different one.";
      }
    }
  }

  if (!existing && !values.service)
    errors.service = "Please choose Marble or POP.";

  const description = values.description.trim();
  if (!description) errors.description = "Please enter a short description.";
  else if (description.length < 10)
    errors.description = "Please write at least 10 characters.";

  if (image && !image.alt.trim()) {
    errors.alt = "Please describe the photo for people who cannot see it.";
  }

  return errors;
}

// ---------- The add / edit form ----------
function CategoryForm({ existing, categories, onSave, onCancel }) {
  const isEditing = Boolean(existing);

  const [values, setValues] = useState({
    name: existing?.name ?? "",
    service: existing?.service ?? "",
    description: existing?.description ?? "",
  });
  const [image, setImage] = useState(existing?.image ?? null);
  const [errors, setErrors] = useState({});
  const [fileProblem, setFileProblem] = useState("");

  // Temporary photo links created in this form. Only these are released when replaced or removed,
  // so we never break a photo that was saved earlier.
  const ownUrls = useRef(new Set());

  useEffect(() => {
    document.getElementById("cat-name")?.focus();
  }, []);

  function releaseImage() {
    if (image && ownUrls.current.has(image.src)) {
      URL.revokeObjectURL(image.src);
      ownUrls.current.delete(image.src);
    }
  }

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    event.target.value = ""; // lets the same file be chosen again
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileProblem(`"${file.name}" is not a JPG, PNG or WebP image.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileProblem(`"${file.name}" is larger than 5 MB.`);
      return;
    }

    setFileProblem("");
    releaseImage();
    // PROTOTYPE: a temporary link to the file on this computer. Nothing is uploaded.
    const src = URL.createObjectURL(file);
    ownUrls.current.add(src);
    setImage({ src, alt: "", caption: "", isPlaceholder: false });
  }

  function removeImage() {
    releaseImage();
    setImage(null);
    setFileProblem("");
    setErrors((current) => ({ ...current, alt: undefined }));
    document.getElementById("cat-photo")?.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const found = validate({ values, image, categories, existing });
    setErrors(found);

    const focusIds = {
      name: "cat-name",
      service: "cat-service",
      description: "cat-description",
      alt: "cat-alt",
    };
    const firstProblem = Object.keys(focusIds).find((key) => found[key]);
    if (firstProblem) {
      document.getElementById(focusIds[firstProblem])?.focus();
      return;
    }

    const name = values.name.trim();
    onSave(
      {
        ...(existing ?? {}),
        slug: existing?.slug ?? slugify(name), // the web address never changes after creation
        service: existing?.service ?? values.service,
        name,
        description: values.description.trim(),
        image: image ? { ...image, alt: image.alt.trim() } : null,
        active: existing?.active ?? true,
      },
      !isEditing,
    );
  }

  const existingService = getServiceBySlug(existing?.service);

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
          hint="Used on the category card. JPG, PNG or WebP, up to 5 MB. Without a photo, the card on the website will show an empty image box."
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className={`${inputClass(false)} file:mr-4 file:border-0 file:bg-obsidian file:px-4 file:py-2 file:text-sm file:text-ivory`}
            />
          )}
        </FormField>

        {fileProblem && (
          <div role="alert">
            <FieldError>{fileProblem}</FieldError>
          </div>
        )}

        {image && (
          <div className="flex flex-col gap-4 sm:flex-row">
            <SiteImage
              image={{
                ...image,
                alt: image.alt || "Preview of the category photo",
              }}
              className="h-32 w-full shrink-0 sm:w-44"
              sizes="176px"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <FormField
                id="cat-alt"
                label="Alt text for the photo"
                error={errors.alt}
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
                      setErrors((current) => ({ ...current, alt: undefined }));
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

      <div className="flex flex-col gap-4 border-t border-obsidian/20 pt-6 sm:flex-row">
        <button type="submit" className="btn-primary">
          {isEditing ? "Save changes" : "Add category"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- The Categories screen ----------
export default function AdminCategories() {
  usePageMeta("Admin: Categories");

  const { categories, setCategories, projects } = useOutletContext();

  // mode: null (form closed), { type: "new" } or { type: "edit", slug }
  const [mode, setMode] = useState(null);
  const [message, setMessage] = useState("");
  const pendingFocus = useRef(null); // id of the element to focus after the screen updates

  // Runs after each change of mode, and moves focus to where the visitor should continue.
  useEffect(() => {
    if (pendingFocus.current) {
      document.getElementById(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  }, [mode]);

  const editing =
    mode?.type === "edit" ? categories.find((c) => c.slug === mode.slug) : null;
  const projectCount = (slug) =>
    projects.filter((project) => project.category === slug).length;

  function handleSave(saved, isNew) {
    setCategories((current) =>
      isNew
        ? [...current, saved]
        : current.map((category) =>
            category.slug === saved.slug ? saved : category,
          ),
    );
    const serviceName = getServiceBySlug(saved.service)?.shortName;
    setMessage(
      isNew
        ? `Added "${saved.name}" under ${serviceName}.`
        : `Saved changes to "${saved.name}".`,
    );
    pendingFocus.current = "category-message";
    setMode(null);
  }

  function handleCancel() {
    pendingFocus.current =
      mode?.type === "edit" ? `edit-${mode.slug}` : "add-category";
    setMode(null);
  }

  // Categories are archived, never deleted, so existing projects never silently break.
  function setActive(category, active) {
    setCategories((current) =>
      current.map((item) =>
        item.slug === category.slug ? { ...item, active } : item,
      ),
    );

    const count = projectCount(category.slug);
    if (active) {
      setMessage(
        `Restored "${category.name}". It can be chosen for projects again.`,
      );
    } else {
      setMessage(
        count > 0
          ? `Archived "${category.name}". The ${count} ${count === 1 ? "project that uses" : "projects that use"} it keep${count === 1 ? "s" : ""} their category and are not affected. It can no longer be chosen for new projects.`
          : `Archived "${category.name}". It can no longer be chosen for new projects.`,
      );
    }
    document.getElementById("category-message")?.focus();
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
          className="btn-primary self-start md:self-auto"
        >
          <Plus size={16} aria-hidden="true" />
          Add category
        </button>
      </div>

      <p className="mt-3 max-w-2xl text-sm text-obsidian/70">
        There is no delete button on purpose: archiving hides a category without
        breaking the projects that use it. Prototype note: changes here do not
        alter the public pages of this demo site.
      </p>

      <p
        id="category-message"
        role="status"
        tabIndex={-1}
        className={`mt-6 border-l-2 border-gold pl-4 text-sm focus:outline-none ${
          message ? "" : "sr-only"
        }`}
      >
        {message}
      </p>

      {mode && (
        <CategoryForm
          key={mode.type === "edit" ? mode.slug : "new"}
          existing={editing}
          categories={categories}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* One list per service */}
      {services.map((service) => {
        const group = categories.filter(
          (category) => category.service === service.slug,
        );

        return (
          <section key={service.slug} className="mt-14">
            <h2 className="text-3xl font-medium">{service.name}</h2>

            {group.length > 0 ? (
              <ul className="mt-6 space-y-5">
                {group.map((category) => {
                  const count = projectCount(category.slug);

                  return (
                    <li key={category.slug}>
                      <article className="flex flex-col gap-5 border border-obsidian/25 p-5 sm:flex-row">
                        {category.image ? (
                          <SiteImage
                            image={category.image}
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
                            {count === 1 ? "project" : "projects"} (any status)
                          </p>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              id={`edit-${category.slug}`}
                              onClick={() =>
                                setMode({ type: "edit", slug: category.slug })
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
                                aria-label={`Archive ${category.name}`}
                                className="btn-outline btn-sm"
                              >
                                Archive
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActive(category, true)}
                                aria-label={`Restore ${category.name}`}
                                className="btn-primary btn-sm"
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
    </div>
  );
}
