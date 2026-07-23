import { useState } from "react";
import StarInput from "./StarInput";
import StarDisplay from "./StarDisplay";
import { createReview } from "../services/reviewService";
import { toast } from "../store/toastStore";

const EMPTY_RATINGS = {
  productQuality: 0,
  onTimeDelivery: 0,
  communication: 0,
};

/**
 * Review form for a delivered order (buyer only).
 */
export default function ReviewForm({ orderId, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState(EMPTY_RATINGS);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const setRating = (key, val) =>
    setRatings((r) => ({ ...r, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(ratings).some((v) => v < 1)) {
      toast.error("Please rate all three categories.");
      return;
    }
    setBusy(true);
    try {
      const review = await createReview({ orderRef: orderId, ratings, comment });
      toast.success("Thank you for your review!");
      onSubmitted(review);
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
      >
        Leave a Review
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-border bg-background-alt p-5"
    >
      <h3 className="font-display text-lg font-semibold text-text-primary">
        Rate your experience
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Share feedback about this order to help other buyers.
      </p>

      <div className="mt-5 space-y-4">
        <StarInput
          label="Product quality"
          value={ratings.productQuality}
          onChange={(v) => setRating("productQuality", v)}
        />
        <StarInput
          label="On-time delivery"
          value={ratings.onTimeDelivery}
          onChange={(v) => setRating("onTimeDelivery", v)}
        />
        <StarInput
          label="Communication"
          value={ratings.communication}
          onChange={(v) => setRating("communication", v)}
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-text-primary">
          Comment <span className="font-normal text-text-secondary">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="What went well? Anything to improve?"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-md border border-border px-5 py-2.5 font-semibold text-text-primary transition hover:bg-fill-subtle disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Read-only card shown after a review exists. */
export function ReviewSummary({ review }) {
  const avg =
    (review.ratings.productQuality +
      review.ratings.onTimeDelivery +
      review.ratings.communication) /
    3;

  return (
    <div className="mt-4 rounded-xl border border-border bg-background-alt p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-lg font-semibold text-text-primary">
          Your review
        </h3>
        <StarDisplay value={avg} />
        <span className="num text-sm font-medium text-text-secondary">
          {avg.toFixed(1)} / 5
        </span>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-text-primary">{review.comment}</p>
      )}
      <p className="mt-2 text-xs text-text-secondary">
        Submitted{" "}
        {new Date(review.createdAt).toLocaleDateString(undefined, {
          dateStyle: "medium",
        })}
      </p>
    </div>
  );
}
