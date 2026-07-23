import { Link } from "react-router-dom";

/**
 * Shared Vicinity Trade mark — circular logo + optional wordmark.
 * Used in navbar, footer, admin sidebar, and auth screens.
 */
export default function BrandLogo({
  to = "/",
  label = "Vicinity Trade",
  size = "md",
  showLabel = true,
  className = "",
  invertLabel = true,
}) {
  const sizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };

  const content = (
    <>
      <img
        src="/logo.png"
        alt=""
        className={`${sizes[size] || sizes.md} shrink-0 rounded-full object-cover`}
        width={size === "lg" ? 48 : size === "sm" ? 28 : 36}
        height={size === "lg" ? 48 : size === "sm" ? 28 : 36}
      />
      {showLabel && (
        <span
          className={`font-display text-lg font-semibold tracking-tight ${
            invertLabel ? "text-white" : "text-text-primary"
          }`}
        >
          {label}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`flex items-center gap-2.5 ${className}`}>{content}</div>;
}
