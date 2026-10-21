import { CircleAlert } from "lucide-react";
import { inputClass } from "./formStyles";

// An error message with an icon, so errors don't rely on colour alone.
// Use it directly for fields that FormField can't wrap (like checkboxes).
export function FieldError({ id, children }) {
  return (
    <p
      id={id}
      className="mt-2 flex items-start gap-2 text-sm font-medium text-red-800"
    >
      <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

// A label + input + optional hint + error message, wired together for screen readers.
//
// Usage (the child is a function that receives the props to spread on the input):
//   <FormField id="name" label="Name" error={errors.name} hint="Optional hint">
//     {(fieldProps) => <input {...fieldProps} type="text" value={...} onChange={...} />}
//   </FormField>
//
// fieldProps contains: id, className, aria-describedby, aria-invalid.
// Fields are required unless you pass required={false}, which adds "(optional)" to the label.
export default function FormField({
  id,
  label,
  required = true,
  hint,
  error,
  children,
}) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const fieldProps = {
    id,
    className: inputClass(Boolean(error)),
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
        {!required && (
          <span className="font-normal text-obsidian/70"> (optional)</span>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-sm text-obsidian/75">
          {hint}
        </p>
      )}
      {children(fieldProps)}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}
