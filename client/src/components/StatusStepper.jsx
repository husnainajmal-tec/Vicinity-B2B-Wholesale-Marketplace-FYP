/**
 * Visual order status stepper.
 *  - completed steps: success fill
 *  - current step:    accent fill
 *  - future steps:    fill-subtle / gray
 *
 * For cancelled orders the normal steps are dimmed and a danger marker
 * is shown instead.
 *
 * Props:
 *   status         current order status
 *   history        [{ status, timestamp }] for per-step timestamps
 */
const STEPS = [
  { key: "pending_payment", label: "Pending payment" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export default function StatusStepper({ status, history = [] }) {
  if (status === "cancelled") {
    const cancelledAt = history.find((h) => h.status === "cancelled")?.timestamp;
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
        This order was cancelled{cancelledAt ? ` on ${fmt(cancelledAt)}` : ""}.
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const timestampFor = (key) =>
    history.find((h) => h.status === key)?.timestamp;

  return (
    <ol className="flex items-start">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;

        const circle = isCompleted
          ? "bg-success text-white border-success"
          : isCurrent
          ? "bg-accent text-white border-accent"
          : "bg-fill-subtle text-text-secondary border-border";

        const connector = i < currentIndex ? "bg-success" : "bg-border";

        return (
          <li key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* left connector */}
              <div
                className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : connector}`}
              />
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${circle}`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              {/* right connector */}
              <div
                className={`h-0.5 flex-1 ${
                  i === STEPS.length - 1
                    ? "opacity-0"
                    : i < currentIndex
                    ? "bg-success"
                    : "bg-border"
                }`}
              />
            </div>
            <div className="mt-2 text-center">
              <p
                className={`text-xs font-medium ${
                  isCurrent ? "text-accent" : "text-text-primary"
                }`}
              >
                {step.label}
              </p>
              {timestampFor(step.key) && (
                <p className="num mt-0.5 text-[10px] text-text-secondary">
                  {fmt(timestampFor(step.key))}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
