import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSettlementSummary } from "../services/orderService";
import { formatPrice, formatQty } from "../utils/pricing";
import StatusPill from "../components/StatusPill";

const shortId = (id) => (id ? id.slice(-6).toUpperCase() : "—");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

/**
 * Seller settlement ledger — mock COD tracking (no payment gateway).
 * Running totals for pending vs paid amounts + order table.
 */
export default function SettlementSummary() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ pendingTotal: 0, paidTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getSettlementSummary();
        setOrders(data.orders);
        setSummary(data.summary);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Settlement summary
        </h1>
        <p className="mt-2 text-text-secondary">
          Track Cash on Delivery collections across your fulfilled orders.
        </p>
      </header>

      <div className="mb-6 rounded-lg border border-border bg-background-alt p-4 text-sm text-text-secondary">
        <p>
          <span className="font-medium text-text-primary">Simulation only.</span>{" "}
          This module records payment status in the database — there is no real
          payment gateway (Stripe, JazzCash, Easypaisa, etc.). Real gateway
          integration is scoped as future work for production deployment.
        </p>
      </div>

      {!loading && !error && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border-l-4 border-accent bg-background p-5 shadow-sm">
            <p className="text-sm text-text-secondary">Pending collection</p>
            <p className="num mt-2 text-3xl font-semibold text-accent">
              {formatPrice(summary.pendingTotal)}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              COD not yet confirmed as received
            </p>
          </div>
          <div className="rounded-xl border-l-4 border-success bg-background p-5 shadow-sm">
            <p className="text-sm text-text-secondary">Paid / settled</p>
            <p className="num mt-2 text-3xl font-semibold text-success">
              {formatPrice(summary.paidTotal)}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Payment marked as received
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-text-secondary">Loading settlement data…</p>
      ) : error ? (
        <p className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background-alt p-12 text-center text-text-secondary">
          No orders to settle yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-fill-subtle text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Order status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o._id} className="bg-background hover:bg-background-alt">
                  <td className="px-4 py-3">
                    <Link
                      to={`/orders/${o._id}`}
                      className="num font-medium text-accent hover:underline"
                    >
                      #{shortId(o._id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {o.buyerRef?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {o.productRef?.title || o.rfqRef?.title || "—"}
                  </td>
                  <td className="num px-4 py-3">{formatQty(o.quantity)}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
