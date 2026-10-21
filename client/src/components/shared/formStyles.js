// Shared styling for text inputs, textareas and selects.
// Kept in its own file because React's fast refresh only works when a file
// exports components and nothing else.
export function inputClass(hasError) {
  return `w-full min-h-12 border bg-white/70 px-4 py-3 text-base ${
    hasError ? "border-red-800" : "border-obsidian/40"
  }`;
}
