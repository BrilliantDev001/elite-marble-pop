// Grey placeholder cards shown while a list of projects or categories is loading.
// Give it the same grid classes as the real list, so nothing jumps when the content arrives.
export default function CardGridSkeleton({
  count = 4,
  className = "",
  tone = "light",
}) {
  const block = tone === "dark" ? "bg-ivory/15" : "bg-stone/20";

  return (
    <div className={className}>
      <p className="sr-only" role="status">
        Loading...
      </p>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="animate-pulse">
          <div className={`aspect-[4/3] ${block}`} />
          <div className={`mt-4 h-6 w-2/3 ${block}`} />
          <div className={`mt-2 h-4 w-1/3 ${block}`} />
        </div>
      ))}
    </div>
  );
}
