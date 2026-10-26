// A trap for spam bots. This field is invisible to real visitors and unreachable by keyboard
// or screen reader ("inert"), but bots that fill in every field they find will fill it in.
// The server then pretends to succeed and saves nothing.
//
// It must be called "website": the server looks for that name.
export default function HoneypotField({ value, onChange }) {
  return (
    <div
      inert
      className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
    >
      <label htmlFor="website">Website (leave this empty)</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
