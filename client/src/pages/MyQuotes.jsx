import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyQuotes } from "../services/rfqService";
import { formatPrice } from "../utils/pricing";
import StatusPill from "../components/StatusPill";

/**
 * Seller "My Quotes" — every quote the seller submitted, with a light RFQ
 * summary and the current status (submitted / accepted / rejected).
 */
export default function MyQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setQuotes(await getMyQuotes());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        My Quotes
      </h1>
      <p className="mt-1 text-text-secondary">
        Track the quotes you've submitted and their outcomes.
      </p>

      {loading ? (
        <p className="mt-6 text-text-secondary">Loading…</p>
      ) : error ? (
        <p className="mt-6 text-danger">{error}</p>
      ) : quotes.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-background-alt p-12 text-center">
          <p className="text-text-secondary">
            You haven't submitted any quotes yet.
          </p>
          <Link
            to="/rfqs"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Browse Buying Leads
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-fill-subtle text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">RFQ</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Your price</th>
                <th className="px-4 py-3 font-medium">Delivery</th>
                <th className="px-4 py-3 font-medium">RFQ status</th>
                <th className="px-4 py-3 font-medium">Quote status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((q) => (
                <tr key={q._id} className="bg-background">
                  <td className="px-4 py-3">
                    {q.rfqRef ? (
                      <Link
                        to={`/rfqs/${q.rfqRef._id}`}
                        className="font-medium text-text-primary hover:text-accent"
                      >
                        {q.rfqRef.title}
                      </Link>
                    ) : (
                      <span className="text-text-secondary">RFQ removed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {q.rfqRef?.category || "—"}
                  </td>
                  <td className="num px-4 py-3 font-medium text-text-primary">
                    {formatPrice(q.pricePerUnit)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {q.deliveryEstimate || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {q.rfqRef ? <StatusPill status={q.rfqRef.status} /> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={q.status} />
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
