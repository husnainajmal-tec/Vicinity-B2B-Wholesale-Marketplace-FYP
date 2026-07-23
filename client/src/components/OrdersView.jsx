import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, formatQty } from "../utils/pricing";
import StatusPill from "./StatusPill";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending_payment", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const shortId = (id) => (id ? id.slice(-6).toUpperCase() : "—");

/**
 * Shared orders table with status filter tabs.
 * mode: "buyer" (shows seller counterparty) | "seller" (shows buyer).
 */
export default function OrdersView({ title, subtitle, fetcher, mode }) {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setOrders(await fetcher());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(
    () => (tab === "all" ? orders : orders.filter((o) => o.status === tab)),
    [orders, tab]
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          {title}
        </h1>
        <p className="mt-1 text-text-secondary">{subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
            {counts[t.key] ? (
              <span className="num ml-1.5 text-xs text-text-secondary">
                {counts[t.key]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background-alt p-12 text-center text-text-secondary">
          No orders {tab === "all" ? "yet" : `in "${tab.replace("_", " ")}"`}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-fill-subtle text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">
                  {mode === "buyer" ? "Seller" : "Buyer"}
                </th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => {
                const counterparty =
                  mode === "buyer" ? o.sellerRef : o.buyerRef;
                const itemTitle =
                  o.productRef?.title || o.rfqRef?.title || "—";
                return (
                  <tr key={o._id} className="bg-background hover:bg-background-alt">
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${o._id}`}
                        className="num font-medium text-accent hover:underline"
                      >
                        #{shortId(o._id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-primary">{itemTitle}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {counterparty?.name || "—"}
                    </td>
                    <td className="num px-4 py-3 text-text-primary">
                      {formatQty(o.quantity)}
                    </td>
                    <td className="num px-4 py-3 font-medium text-text-primary">
                      {formatPrice(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={o.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {fmtDate(o.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
