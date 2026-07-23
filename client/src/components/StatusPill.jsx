/**
 * Consistent small status pill, color-coded per the design system:
 *  - pending    -> fill-subtle bg + text-secondary
 *  - progress   -> accent bg (10%) + accent text
 *  - success    -> success bg (10%) + success text
 *  - danger     -> danger bg (10%) + danger text
 *
 * Pass an explicit `tone`, or a known `status` string that maps to a tone.
 */
const TONE_CLASSES = {
  pending: "bg-fill-subtle text-text-secondary",
  progress: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
};

// Map common status strings -> { tone, label }
const STATUS_MAP = {
  in_stock: { tone: "success", label: "In stock" },
  low_stock: { tone: "progress", label: "Low stock" },
  out_of_stock: { tone: "danger", label: "Out of stock" },
  active: { tone: "success", label: "Active" },
  inactive: { tone: "pending", label: "Inactive" },
  // RFQ statuses
  open: { tone: "progress", label: "Open" },
  closed: { tone: "pending", label: "Closed" },
  // Quote statuses
  submitted: { tone: "progress", label: "Submitted" },
  accepted: { tone: "success", label: "Accepted" },
  rejected: { tone: "danger", label: "Rejected" },
  // Order statuses
  pending_payment: { tone: "pending", label: "Pending payment" },
  processing: { tone: "progress", label: "Processing" },
  shipped: { tone: "progress", label: "Shipped" },
  delivered: { tone: "success", label: "Delivered" },
  cancelled: { tone: "danger", label: "Cancelled" },
  // Payment statuses
  pending: { tone: "progress", label: "Pending" },
  paid: { tone: "success", label: "Paid" },
  refunded: { tone: "pending", label: "Refunded" },
};

export default function StatusPill({ status, tone, label, className = "" }) {
  const mapped = status ? STATUS_MAP[status] : null;
  const finalTone = tone || mapped?.tone || "pending";
  const finalLabel = label || mapped?.label || status || "";

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[finalTone]} ${className}`}
    >
      {finalLabel}
    </span>
  );
}
