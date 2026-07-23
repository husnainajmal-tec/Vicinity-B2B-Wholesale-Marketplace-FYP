/**
 * Interactive 1–5 star picker (accent when selected).
 */
export default function StarInput({ value, onChange, label }) {
  return (
    <div>
      {label && (
        <p className="mb-1 text-sm font-medium text-text-primary">{label}</p>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent/40"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <svg
              className={`h-7 w-7 ${n <= value ? "text-accent" : "text-border"}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
