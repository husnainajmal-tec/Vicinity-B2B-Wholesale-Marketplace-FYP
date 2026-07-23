import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getProduct } from "../services/productService";
import { createOrder } from "../services/orderService";
import { formatPrice, formatQty, activeTierIndex } from "../utils/pricing";
import { toast } from "../store/toastStore";

/**
 * Order creation page.
 * Supports two entry points:
 *  - Product page:      /orders/new?product=<id>&qty=<n>
 *  - Accepted offer:    /orders/new?product|rfq=<id>&price=<p>&qty=<n>[&seller=<id>]
 *
 * A negotiated `price` (from an accepted offer) is fixed; otherwise the
 * price follows the product's applicable pricing tier and respects MOQ.
 */
export default function OrderCreate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const productId = params.get("product");
  const rfqId = params.get("rfq");
  const sellerId = params.get("seller");
  const negotiatedPrice = params.get("price");
  const initialQty = params.get("qty");

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(Number(initialQty) || 1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const { product } = await getProduct(productId);
        setProduct(product);
        setQuantity((q) => (q >= product.moq ? q : product.moq));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // Determine unit price: negotiated (fixed) or tier-based (from product).
  const unitPrice = useMemo(() => {
    if (negotiatedPrice) return Number(negotiatedPrice);
    if (product) {
      const idx = activeTierIndex(product.pricingTiers, quantity);
      return idx >= 0 ? product.pricingTiers[idx].pricePerUnit : null;
    }
    return null;
  }, [negotiatedPrice, product, quantity]);

  const belowMoq = product && quantity < product.moq;
  const total = unitPrice != null ? unitPrice * quantity : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!shippingAddress.trim()) return setError("Shipping address is required.");
    if (belowMoq) return setError(`Quantity is below the MOQ of ${product.moq}.`);
    if (unitPrice == null) return setError("No price applies to this quantity.");

    setSaving(true);
    try {
      const order = await createOrder({
        productRef: productId || undefined,
        rfqRef: rfqId || undefined,
        sellerRef: sellerId || undefined,
        quantity: Number(quantity),
        agreedPricePerUnit: unitPrice,
        shippingAddress: shippingAddress.trim(),
      });
      toast.success("Order placed.");
      navigate(`/orders/${order._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-text-secondary">
        Loading…
      </div>
    );
  }

  if (!productId && !rfqId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Nothing to order
        </h1>
        <p className="mt-2 text-text-secondary">
          Start an order from a product page or an accepted offer.
        </p>
        <Link
          to="/search"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        Place order
      </h1>
      <p className="mt-1 text-text-secondary">
        Review the details and confirm. Payment is Cash on Delivery.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-xl border border-border bg-background p-6"
      >
        {product && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background-alt p-3">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt=""
                className="h-14 w-14 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-md border border-border bg-fill-subtle" />
            )}
            <div>
              <p className="font-medium text-text-primary">{product.title}</p>
              <p className="num text-sm text-text-secondary">
                MOQ {formatQty(product.moq)}
              </p>
            </div>
          </div>
        )}

        {negotiatedPrice && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm text-text-primary">
            Using negotiated price of{" "}
            <span className="num font-semibold">
              {formatPrice(Number(negotiatedPrice))}
            </span>{" "}
            per unit.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              Quantity
            </span>
            <input
              type="number"
              min={product?.moq || 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="num w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {belowMoq && (
              <span className="mt-1 block text-xs font-medium text-danger">
                Below MOQ ({formatQty(product.moq)}).
              </span>
            )}
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              Price / unit
            </span>
            <div className="num rounded-md border border-border bg-fill-subtle px-3 py-2 text-sm text-text-primary">
              {unitPrice != null ? formatPrice(unitPrice) : "—"}
            </div>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            Shipping address
          </span>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            rows={3}
            placeholder="Street, city, region, postal code"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />
        </label>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-background-alt p-4">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>
              <span className="num">{formatQty(quantity)}</span> ×{" "}
              {unitPrice != null ? formatPrice(unitPrice) : "—"}
            </span>
            <span>Cash on Delivery</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium text-text-primary">Total</span>
            <span className="num text-lg font-semibold text-text-primary">
              {total != null ? formatPrice(total) : "—"}
            </span>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || belowMoq || unitPrice == null}
            className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Placing order…" : "Place order"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-border bg-background-alt px-5 py-2.5 font-semibold text-text-primary transition hover:bg-fill-subtle"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
