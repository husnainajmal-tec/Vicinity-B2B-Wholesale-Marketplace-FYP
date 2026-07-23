/**
 * Verified supplier badge — the canonical use of the `success` color.
 * success at 10% opacity background + success text + checkmark icon.
 * Renders nothing unless `verified` is true.
 */
export default function VerifiedBadge({ verified, size = "md" }) {
  if (!verified) return null;

  const sizes = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-success/10 font-semibold text-success ${sizes[size]}`}
      title="Verified supplier"
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}
