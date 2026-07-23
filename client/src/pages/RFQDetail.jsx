import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRFQ, submitQuote } from "../services/rfqService";
import { formatPrice, formatQty } from "../utils/pricing";
import { useAuthStore } from "../store/authStore";
import { toast } from "../store/toastStore";
import StatusPill from "../components/StatusPill";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

/**
 * RFQ detail page.
 * - Everyone sees the RFQ summary.
 * - Sellers (RFQ open) get the Submit Quote form (pre-filled if they've
 *   already quoted). Competitor prices are not shown to sellers.
 * - The buyer owner gets a link to manage quotes in My RFQs.
 */
export default function RFQDetail() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setData(await getRFQ(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-text-secondary">
        Loading RFQ…
      </div>
    );
  }

  if (error || !data?.rfq) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          RFQ not found
        </h1>
        <p className="mt-2 text-text-secondary">{error || "This RFQ does not exist."}</p>
        <Link
          to="/rfqs"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
        >
          Back to Buying Leads
        </Link>
      </div>
    );
  }

  const { rfq, quotes, myQuote } = data;
  const isOwner = user && rfq.buyerRef?._id === user._id;
  const isSeller = user?.role === "seller";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Summary */}
      <div className="rounded-xl border border-border bg-background-alt p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            {rfq.title}
          </h1>
          <StatusPill status={rfq.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary">
          <span>{rfq.category}</span>
          <span>
            Qty needed <span className="num">{formatQty(rfq.quantityNeeded)}</span>
          </span>
          {rfq.targetPrice != null && (
            <span>
              Target <span className="num">{formatPrice(rfq.targetPrice)}</span>/unit
            </span>
          )}
          <span>Deadline {fmtDate(rfq.deadline)}</span>
          {rfq.buyerRef?.name && <span>Posted by {rfq.buyerRef.name}</span>}
        </div>
        {rfq.description && (
          <p className="mt-4 whitespace-pre-line text-text-primary">
            {rfq.description}
          </p>
        )}
      </div>

      {/* Buyer owner */}
      {isOwner && (
        <div className="mt-6 rounded-xl border border-border bg-background p-5">
          <p className="text-text-primary">
            You've received{" "}
            <span className="num font-semibold">{quotes?.length ?? 0}</span> quote(s)
            on this RFQ.
          </p>
          <Link
            to="/rfqs/mine"
            className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Compare quotes in My RFQs
          </Link>
        </div>
      )}

      {/* Seller submit quote */}
      {isSeller && rfq.status === "open" && (
        <SubmitQuote rfqId={rfq._id} existing={myQuote} onSaved={load} />
      )}

      {isSeller && rfq.status === "closed" && (
        <p className="mt-6 rounded-lg border border-border bg-background-alt p-4 text-sm text-text-secondary">
          This RFQ is closed and no longer accepting quotes.
        </p>
      )}

      {/* Guests */}
      {!user && (
        <p className="mt-6 rounded-lg border border-border bg-background-alt p-4 text-sm text-text-secondary">
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>{" "}
          as a seller to submit a quote.
        </p>
      )}
    </div>
  );
}

function SubmitQuote({ rfqId, existing, onSaved }) {
  const [form, setForm] = useState({
    pricePerUnit: existing?.pricePerUnit ?? "",
    deliveryEstimate: existing?.deliveryEstimate ?? "",
    message: existing?.message ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.pricePerUnit || Number(form.pricePerUnit) <= 0) {
      return setError("Enter a valid price per unit.");
    }
    setSaving(true);
    try {
      await submitQuote(rfqId, {
        pricePerUnit: Number(form.pricePerUnit),
        deliveryEstimate: form.deliveryEstimate,
        message: form.message,
      });
      toast.success(existing ? "Quote updated." : "Quote submitted.");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-border bg-background p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {existing ? "Update your quote" : "Submit a quote"}
        </h2>
        {existing && <StatusPill status={existing.status} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            Price per unit
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.pricePerUnit}
            onChange={update("pricePerUnit")}
            placeholder="320"
            className="num w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            Delivery estimate
          </span>
          <input
            type="text"
            value={form.deliveryEstimate}
            onChange={update("deliveryEstimate")}
            placeholder="e.g. 10–14 days"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-text-primary">
          Message (optional)
        </span>
        <textarea
          value={form.message}
          onChange={update("message")}
          rows={3}
          placeholder="Terms, MOQ notes, samples available…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>

      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Submitting…" : existing ? "Update quote" : "Submit Quote"}
      </button>
    </form>
  );
}
