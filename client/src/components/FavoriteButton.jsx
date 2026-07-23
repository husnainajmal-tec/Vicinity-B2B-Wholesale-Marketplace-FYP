import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useFavoriteStore } from "../store/favoriteStore";
import { toast } from "../store/toastStore";

/**
 * Heart / bookmark toggle.
 * Filled accent when favorited, outline text-secondary when not.
 */
export default function FavoriteButton({
  itemType,
  itemRef,
  className = "",
  size = "md",
  onChange,
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const active = useFavoriteStore((s) =>
    itemType === "product"
      ? s.productIds.has(String(itemRef))
      : s.companyIds.has(String(itemRef))
  );
  const toggle = useFavoriteStore((s) => s.toggle);
  const [busy, setBusy] = useState(false);
  const sizeClass = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-7 w-7" : "h-6 w-6";

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.info("Please sign in to save favorites.");
      navigate("/login");
      return;
    }
    if (user?.role !== "buyer") {
      toast.info("Favorites are available to buyer accounts.");
      return;
    }

    setBusy(true);
    try {
      const favorited = await toggle(itemType, itemRef);
      toast.success(favorited ? "Saved to favorites." : "Removed from favorites.");
      onChange?.(favorited);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      className={`rounded-full p-1.5 transition hover:bg-black/5 disabled:opacity-60 ${className}`}
    >
      <svg
        className={`${sizeClass} ${active ? "text-accent" : "text-text-secondary"}`}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </button>
  );
}
