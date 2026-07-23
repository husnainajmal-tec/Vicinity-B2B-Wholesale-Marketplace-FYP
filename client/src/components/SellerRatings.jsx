import StarDisplay from "./StarDisplay";

const CATEGORIES = [
  { key: "productQuality", label: "Product quality" },
  { key: "onTimeDelivery", label: "On-time delivery" },
  { key: "communication", label: "Communication" },
];

/**
 * Seller rating summary — overall stars + per-category breakdown bars.
 */
export default function SellerRatings({ ratings }) {
  if (!ratings || ratings.count === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-border bg-background p-5">
      <h2 className="font-display text-lg font-semibold text-text-primary">
        Seller ratings
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <StarDisplay value={ratings.overall} size="lg" />
          <span className="num text-2xl font-semibold text-text-primary">
            {ratings.overall.toFixed(1)}
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          Based on{" "}
          <span className="num font-medium text-text-primary">{ratings.count}</span>{" "}
          review{ratings.count !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {CATEGORIES.map(({ key, label }) => {
          const avg = ratings.averages[key];
          const pct = (avg / 5) * 100;
          return (
            <div key={key} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm">
              <span className="text-text-secondary">{label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-fill-subtle">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="num text-right font-medium text-text-primary">
                {avg.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
