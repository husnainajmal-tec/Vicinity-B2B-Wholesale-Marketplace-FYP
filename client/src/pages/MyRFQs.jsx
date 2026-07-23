import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyRFQs, closeRFQ, setQuoteStatus } from "../services/rfqService";
import { formatPrice, formatQty } from "../utils/pricing";
import { toast } from "../store/toastStore";
import StatusPill from "../components/StatusPill";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

/**
 * Buyer "My RFQs" — each RFQ with a sortable comparison table of quotes.
 * Actions per quote: Accept / Reject / Start Negotiation (chat, Phase 6).
 */
export default function MyRFQs() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRfqs(await getMyRFQs());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleClose = async (id) => {
    if (!window.confirm("Close this RFQ? Sellers won't be able to quote.")) return;
    try {
      const updated = await closeRFQ(id);
      setRfqs((prev) => prev.map((r) => (r._id === id ? { ...r, status: updated.status } : r)));
      toast.success("RFQ closed.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleQuoteStatus = async (rfqId, quoteId, status) => {
    try {
      const updated = await setQuoteStatus(quoteId, status);
      setRfqs((prev) =>
        prev.map((r) =>
          r._id !== rfqId
            ? r
            : {
                ...r,
                quotes: r.quotes.map((q) =>
                  q._id === quoteId ? { ...q, status: updated.status } : q
                ),
              }
        )
      );
      toast.success(`Quote ${status}.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            My RFQs
          </h1>
          <p className="mt-1 text-text-secondary">
            Review and compare quotes from sellers.
          </p>
        </div>
        <Link
          to="/rfqs/new"
          className="rounded-md bg-accent px-4 py-2.5 font-semibold text-white transition hover:opacity-90"
        >
          Post RFQ
        </Link>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : rfqs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background-alt p-12 text-center">
          <p className="text-text-secondary">You haven't posted any RFQs yet.</p>
          <Link
            to="/rfqs/new"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Post your first RFQ
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {rfqs.map((rfq) => (
            <RFQCard
              key={rfq._id}
              rfq={rfq}
              onClose={handleClose}
              onQuoteStatus={handleQuoteStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RFQCard({ rfq, onClose, onQuoteStatus }) {
  const navigate = useNavigate();
  const [sortAsc, setSortAsc] = useState(true);

  const quotes = [...(rfq.quotes || [])].sort((a, b) =>
    sortAsc ? a.pricePerUnit - b.pricePerUnit : b.pricePerUnit - a.pricePerUnit
  );

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={`/rfqs/${rfq._id}`}
              className="font-display text-lg font-semibold text-text-primary hover:text-accent"
            >
              {rfq.title}
            </Link>
            <StatusPill status={rfq.status} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-text-secondary">
            <span>{rfq.category}</span>
            <span>
              Qty <span className="num">{formatQty(rfq.quantityNeeded)}</span>
            </span>
            {rfq.targetPrice != null && (
              <span>
                Target <span className="num">{formatPrice(rfq.targetPrice)}</span>
              </span>
            )}
            <span>Deadline {fmtDate(rfq.deadline)}</span>
          </div>
        </div>
        {rfq.status === "open" && (
          <button
            onClick={() => onClose(rfq._id)}
            className="rounded-md border border-danger/30 px-3 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/10"
          >
            Close RFQ
          </button>
        )}
      </div>

      {/* Quotes comparison */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            Quotes received (<span className="num">{quotes.length}</span>)
          </span>
          {quotes.length > 1 && (
            <button
              onClick={() => setSortAsc((s) => !s)}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Sort by price {sortAsc ? "↑" : "↓"}
            </button>
          )}
        </div>

        {quotes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-background-alt p-4 text-sm text-text-secondary">
            No quotes yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-fill-subtle text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">Seller</th>
                  <th className="px-3 py-2 font-medium">Price / unit</th>
                  <th className="px-3 py-2 font-medium">Est. total</th>
                  <th className="px-3 py-2 font-medium">Delivery</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotes.map((q, i) => (
                  <tr
                    key={q._id}
                    className={i === 0 && sortAsc ? "bg-accent/5" : "bg-background"}
                  >
                    <td className="px-3 py-2 text-text-primary">
                      {q.sellerRef?.name || "Seller"}
                      {i === 0 && sortAsc && (
                        <span className="ml-2 text-xs font-semibold text-accent">
                          lowest
                        </span>
                      )}
                    </td>
                    <td className="num px-3 py-2 font-medium text-text-primary">
                      {formatPrice(q.pricePerUnit)}
                    </td>
                    <td className="num px-3 py-2 text-text-secondary">
                      {formatPrice(q.pricePerUnit * rfq.quantityNeeded)}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {q.deliveryEstimate || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={q.status} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/chat?rfq=${rfq._id}&participant=${q.sellerRef?._id}`
                            )
                          }
                          className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                        >
                          Negotiate
                        </button>
                        {rfq.status === "open" && q.status !== "accepted" && (
                          <button
                            onClick={() => onQuoteStatus(rfq._id, q._id, "accepted")}
                            className="rounded-md border border-success/30 px-2.5 py-1.5 text-xs font-semibold text-success transition hover:bg-success/10"
                          >
                            Accept
                          </button>
                        )}
                        {rfq.status === "open" && q.status !== "rejected" && (
                          <button
                            onClick={() => onQuoteStatus(rfq._id, q._id, "rejected")}
                            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-fill-subtle"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
