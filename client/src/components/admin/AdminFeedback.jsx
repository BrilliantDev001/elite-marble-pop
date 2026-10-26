// The confirmation or error message shown after an admin action.
// The screen gives it a ref and focuses it, so keyboard and screen reader users hear the result.
//   feedback: null, or { type: "success" | "error", text }
export default function AdminFeedback({ feedback, ref }) {
  const isError = feedback?.type === "error";

  return (
    <p
      ref={ref}
      role="status"
      tabIndex={-1}
      className={`mt-6 border-l-2 pl-4 text-sm focus:outline-none ${
        feedback
          ? isError
            ? "border-red-800 font-medium text-red-800"
            : "border-gold"
          : "sr-only"
      }`}
    >
      {isError && <span className="sr-only">Error: </span>}
      {feedback?.text}
    </p>
  );
}
