// The "we could not load this" message with a Try again button.
// tone="dark" is for dark sections (such as the POP section on the home page).
export default function LoadError({
  message = "We could not load this content.",
  onRetry,
  tone = "light",
}) {
  const isDark = tone === "dark";

  return (
    <div
      role="alert"
      className={`max-w-xl border p-8 ${isDark ? "border-ivory/30" : "border-obsidian/20"}`}
    >
      <p className="font-heading text-2xl">{message}</p>
      <p className={`mt-2 ${isDark ? "text-ivory/80" : "text-obsidian/80"}`}>
        Please check your connection and try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`${isDark ? "btn-outline-light" : "btn-outline"} mt-6`}
        >
          Try again
        </button>
      )}
    </div>
  );
}
