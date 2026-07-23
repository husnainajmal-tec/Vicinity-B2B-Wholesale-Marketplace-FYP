import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getOrder,
  updateOrderStatus,
  cancelOrder,
  markPaymentReceived,
} from "../services/orderService";
import { getReviewForOrder } from "../services/reviewService";
import { formatPrice, formatQty } from "../utils/pricing";
import { useAuthStore } from "../store/authStore";
import { toast } from "../store/toastStore";
import StatusPill from "../components/StatusPill";
import StatusStepper from "../components/StatusStepper";
import ReviewForm, { ReviewSummary } from "../components/ReviewForm";

const shortId = (id) => (id ? id.slice(-6).toUpperCase() : "—");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

/**
 * Order detail — status stepper, summary, contact info, and role-based
 * actions (seller: mark shipped/delivered; buyer: cancel while pending).
 */
export default function OrderDetail() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [order, setOrder] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const o = await getOrder(id);
        setOrder(o);
        try {
          setReview(await getReviewForOrder(id));
        } catch {
          /* no review yet or not a participant */
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const changeStatus = async (status) => {
    setBusy(true);
    try {
      const updated = await updateOrderStatus(id, status);
      setOrder(updated);
      toast.success(`Order marked ${status}.`);
      if (status === "delivered" && updated.paymentStatus === "pending") {
        toast.info("Confirm COD payment when cash is collected.");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMarkPayment = async () => {
    if (!window.confirm("Confirm that you have received the COD payment?")) return;
    setBusy(true);
    try {
      setOrder(await markPaymentReceived(id));
      toast.success("Payment marked as received.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setBusy(true);
    try {
      setOrder(await cancelOrder(id));
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-text-secondary">
        Loading order…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Order not found
        </h1>
        <p className="mt-2 text-text-secondary">{error || "This order does not exist."}</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
        >
          Back home
        </Link>
      </div>
    );
  }

  const isSeller = user?.role === "seller" && order.sellerRef?._id === user._id;
  const isBuyer = user?.role === "buyer" && order.buyerRef?._id === user._id;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            Order <span className="num">#{shortId(order._id)}</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Placed {fmtDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={order.status} />
          <StatusPill status={order.paymentStatus} />
        </div>
      </div>

      {/* Stepper */}
      <div className="rounded-xl border border-border bg-background p-6">
        <StatusStepper status={order.status} history={order.statusHistory} />
      </div>

      {/* Actions */}
      {(isSeller || isBuyer) && order.status !== "cancelled" && (
        <div className="mt-4 flex flex-wrap gap-3">
          {isSeller && (order.status === "pending_payment" || order.status === "processing") && (
            <button
              onClick={() => changeStatus("shipped")}
              disabled={busy}
              className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Mark as Shipped
            </button>
          )}
          {isSeller && order.status === "shipped" && (
            <button
              onClick={() => changeStatus("delivered")}
              disabled={busy}
              className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Mark as Delivered
            </button>
          )}
          {isSeller &&
            order.status === "delivered" &&
            order.paymentStatus === "pending" && (
              <button
                onClick={handleMarkPayment}
                disabled={busy}
                className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                Mark Payment as Received
              </button>
            )}
          {isBuyer && order.status === "pending_payment" && (
            <button
              onClick={handleCancel}
              disabled={busy}
              className="rounded-md border border-danger px-5 py-2.5 font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-60"
            >
              Cancel Order
            </button>
          )}
        </div>
      )}

      {/* Buyer review (delivered orders only) */}
      {isBuyer && order.status === "delivered" && (
        <div className="mt-4">
          {review ? (
            <ReviewSummary review={review} />
          ) : (
            <ReviewForm orderId={order._id} onSubmitted={setReview} />
          )}
        </div>
      )}

      {/* Summary + contact */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Order summary
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Item">
              {order.productRef ? (
                <Link
                  to={`/product/${order.productRef._id}`}
                  className="text-accent hover:underline"
                >
                  {order.productRef.title}
                </Link>
              ) : order.rfqRef ? (
                <Link
                  to={`/rfqs/${order.rfqRef._id}`}
                  className="text-accent hover:underline"
                >
                  {order.rfqRef.title}
                </Link>
              ) : (
                "—"
              )}
            </Row>
            <Row label="Quantity">
              <span className="num">{formatQty(order.quantity)}</span>
            </Row>
            <Row label="Price / unit">
              <span className="num">{formatPrice(order.agreedPricePerUnit)}</span>
            </Row>
            <Row label="Payment">Cash on Delivery</Row>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-medium text-text-primary">Total</span>
              <span className="num text-lg font-semibold text-text-primary">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            {isSeller ? "Buyer & shipping" : "Seller & shipping"}
          </h2>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="text-text-secondary">
                {isSeller ? "Buyer" : "Seller"}
              </p>
              {(() => {
                const c = isSeller ? order.buyerRef : order.sellerRef;
                return (
                  <div className="text-text-primary">
                    <p className="font-medium">{c?.name}</p>
                    {c?.email && <p className="text-text-secondary">{c.email}</p>}
                    {c?.phone && (
                      <p className="num text-text-secondary">{c.phone}</p>
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <p className="text-text-secondary">Shipping address</p>
              <p className="whitespace-pre-line text-text-primary">
                {order.shippingAddress}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary">{children}</span>
    </div>
  );
}
