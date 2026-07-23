import { useEffect, useState } from "react";
import { getStats } from "../../services/adminService";
import { formatPrice } from "../../utils/pricing";

/**
 * Admin overview — simple stat cards (primary accents), no complex analytics.
 */
export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setStats(await getStats());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = stats
    ? [
        { label: "Total users", value: stats.totalUsers },
        { label: "Sellers", value: stats.totalSellers },
        { label: "Buyers", value: stats.totalBuyers },
        { label: "Total orders", value: stats.totalOrders },
        { label: "Gross merch. value", value: formatPrice(stats.totalGMV), wide: true },
      ]
    : [];

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Platform overview
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          A snapshot of activity across Vicinity Trade.
        </p>
      </header>

      {loading ? (
        <p className="text-text-secondary">Loading stats…</p>
      ) : error ? (
        <p className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className={`rounded-xl border-l-4 border-primary bg-background p-5 shadow-sm ${
                c.wide ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <p className="text-sm text-text-secondary">{c.label}</p>
              <p className="num mt-2 text-3xl font-semibold text-primary">
                {c.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
