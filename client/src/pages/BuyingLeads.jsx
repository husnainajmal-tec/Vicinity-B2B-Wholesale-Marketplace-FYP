import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRFQs } from "../services/rfqService";
import { PRODUCT_CATEGORIES } from "../constants/categories";
import { formatPrice, formatQty } from "../utils/pricing";
import { useAuthStore } from "../store/authStore";
import StatusPill from "../components/StatusPill";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

/**
 * Public "Buying Leads" feed (also the seller "Browse RFQs" view).
 * Filterable by category. Shows open RFQs by default.
 */
export default function BuyingLeads() {
  const user = useAuthStore((s) => s.user);
  const [rfqs, setRfqs] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const list = await listRFQs({ category, status: "open" });
        if (!cancelled) setRfqs(list);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            Buying Leads
          </h1>
          <p className="mt-1 text-text-secondary">
            Open requests for quotation from buyers.
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            Filter by category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : rfqs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background-alt p-12 text-center text-text-secondary">
          No open buying leads{category ? " in this category" : ""} right now.
        </div>
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => (
            <Link
              key={rfq._id}
              to={`/rfqs/${rfq._id}`}
              className="block rounded-xl border border-border bg-background p-5 transition hover:border-accent"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-semibold text-text-primary">
                      {rfq.title}
                    </span>
                    <StatusPill status={rfq.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-text-secondary">
                    <span>{rfq.category}</span>
                    <span>
                      Qty <span className="num">{formatQty(rfq.quantityNeeded)}</span>
                    </span>
                    {rfq.targetPrice != null && (
                      <span>
                        Target{" "}
                        <span className="num">{formatPrice(rfq.targetPrice)}</span>
                      </span>
                    )}
                    <span>by {fmtDate(rfq.deadline)}</span>
                  </div>
                </div>
                <div className="text-right text-sm text-text-secondary">
                  <div>
                    <span className="num font-medium text-text-primary">
                      {rfq.quoteCount ?? 0}
                    </span>{" "}
                    quotes
                  </div>
                  {rfq.buyerRef?.name && <div>by {rfq.buyerRef.name}</div>}
                </div>
              </div>
              {rfq.description && (
                <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
                  {rfq.description}
                </p>
              )}
              {user?.role === "seller" && (
                <span className="mt-3 inline-block text-sm font-semibold text-accent">
                  View &amp; submit quote →
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
