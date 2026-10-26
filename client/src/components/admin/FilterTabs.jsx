// The row of status tabs above an admin list.
//   options: [{ value, label, count }]   (count is optional and is shown in brackets)
export default function FilterTabs({ label, options, value, onChange }) {
  return (
    <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-medium transition-colors ${
            value === option.value
              ? "border-obsidian bg-obsidian text-ivory"
              : "border-obsidian/30 hover:border-obsidian"
          }`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="text-xs opacity-80">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
