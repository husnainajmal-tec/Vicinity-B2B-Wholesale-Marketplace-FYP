import { useToastStore } from "../store/toastStore";

/**
 * Renders active toasts (top-right). Colors follow the design system:
 *  - success -> success color
 *  - error   -> danger color
 *  - info    -> primary navy
 */
const TYPE_STYLES = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-danger/30 bg-danger/10 text-danger",
  info: "border-border bg-background-alt text-text-primary",
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-sm ${
            TYPE_STYLES[t.type] || TYPE_STYLES.info
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-60 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
