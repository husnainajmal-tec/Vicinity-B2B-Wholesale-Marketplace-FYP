import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getProduct } from "../services/productService";
import {
  activeTierIndex,
  formatPrice,
  formatQty,
} from "../utils/pricing";
import { useAuthStore } from "../store/authStore";
import { toast } from "../store/toastStore";
import StatusPill from "../components/StatusPill";
import VerifiedBadge from "../components/VerifiedBadge";
import FavoriteButton from "../components/FavoriteButton";

/**
 * Public product detail page.
 * - Image gallery.
 * - Live quantity input that highlights the applicable pricing tier (accent).
 * - MOQ prominently displayed.
 * - Message Seller (accent CTA), favorites toggle, Include in RFQ.
 */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProduct(id);
        setData(res);
        setQty(res.product?.moq || 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const product = data?.product;
  const company = data?.company;

  const highlightIndex = useMemo(
    () => (product ? activeTierIndex(product.pricingTiers, qty) : -1),
    [product, qty]
  );

  const belowMoq = product && Number(qty) < Number(product.moq);

  const requireAuth = (action) => {
    if (!token) {
      toast.info("Please sign in to continue.");
      navigate("/login");
      return false;
    }
    if (user?.role !== "buyer") {
      toast.info(`${action} is available to buyer accounts.`);
      return false;
    }
    return true;
  };

  const onMessage = () => {
    if (!requireAuth("Messaging")) return;
    navigate(`/chat?product=${product._id}`);
  };
  const onRfq = () => {
    if (!requireAuth("RFQs")) return;
    navigate("/rfqs/new");
  };
  const onOrder = () => {
    if (!requireAuth("Ordering")) return;
    navigate(`/orders/new?product=${product._id}&qty=${qty}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-text-secondary">
        Loading product…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Product not found
        </h1>
        <p className="mt-2 text-text-secondary">
          {error || "This product does not exist."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
        >
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-xl border border-border bg-background-alt">
            {product.images?.length > 0 ? (
              <img
                src={product.images[activeImage]}
                alt={product.title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-text-secondary">
                No image
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-md border transition ${
                    i === activeImage
                      ? "border-accent"
                      : "border-border hover:border-text-secondary"
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-fill-subtle px-2.5 py-0.5 text-xs font-medium text-text-primary">
              {product.category}
            </span>
            <StatusPill status={product.stockStatus} />
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl font-semibold text-text-primary">
              {product.title}
            </h1>
            <FavoriteButton itemType="product" itemRef={product._id} size="lg" />
          </div>

          {/* Seller / company */}
          {company && (
            <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
              Sold by{" "}
              <Link
                to={`/company/${company._id}`}
                className="font-medium text-accent hover:underline"
              >
                {company.companyName}
              </Link>
              <VerifiedBadge verified={company.isVerified} size="sm" />
            </div>
          )}

          {/* MOQ */}
          <div className="mt-5 rounded-lg border border-border bg-background-alt p-4">
            <span className="text-sm text-text-secondary">
              Minimum Order Quantity
            </span>
            <p className="num text-2xl font-semibold text-text-primary">
              {formatQty(product.moq)} units
            </p>
          </div>

          {/* Quantity + live tier */}
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Quantity to price
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="num w-40 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {belowMoq && (
              <p className="mt-1 text-sm font-medium text-danger">
                Below MOQ ({formatQty(product.moq)} units minimum).
              </p>
            )}
          </div>

          {/* Tiered pricing table */}
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-fill-subtle text-text-secondary">
                <tr>
                  <th className="px-4 py-2 font-medium">Quantity range</th>
                  <th className="px-4 py-2 text-right font-medium">Price / unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.pricingTiers.map((t, i) => {
                  const isActive = i === highlightIndex;
                  const range =
                    t.maxQty == null
                      ? `${formatQty(t.minQty)}+`
                      : `${formatQty(t.minQty)} – ${formatQty(t.maxQty)}`;
                  return (
                    <tr
                      key={i}
                      className={
                        isActive
                          ? "bg-accent/10"
                          : "bg-background"
                      }
                    >
                      <td
                        className={`num px-4 py-2 ${
                          isActive
                            ? "font-semibold text-accent"
                            : "text-text-primary"
                        }`}
                      >
                        {range}
                        {isActive && (
                          <span className="ml-2 align-middle text-xs font-semibold text-accent">
                            ← applies
                          </span>
                        )}
                      </td>
                      <td
                        className={`num px-4 py-2 text-right ${
                          isActive
                            ? "font-semibold text-accent"
                            : "text-text-primary"
                        }`}
                      >
                        {formatPrice(t.pricePerUnit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOrder}
              className="rounded-md bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
            >
              Order Now
            </button>
            <button
              onClick={onMessage}
              className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
            >
              Message Seller
            </button>
            <button
              onClick={onRfq}
              className="rounded-md border border-border bg-background-alt px-5 py-2.5 font-semibold text-text-primary transition hover:bg-fill-subtle"
            >
              Include in RFQ
            </button>
          </div>

          {product.description && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Description
              </h2>
              <p className="mt-2 whitespace-pre-line text-text-primary">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
