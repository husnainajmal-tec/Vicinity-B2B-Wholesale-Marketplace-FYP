import { Link } from "react-router-dom";
import { formatPrice, formatQty } from "../utils/pricing";
import VerifiedBadge from "./VerifiedBadge";
import FavoriteButton from "./FavoriteButton";

/**
 * Reusable product card for grids (search results, company page).
 * Shows image, title, category, MOQ and the starting (lowest) price.
 * If `company` is provided (from search), shows the supplier + verified badge.
 * Pass `showFavorite` to render a heart toggle (buyers).
 */
export default function ProductCard({ product, showFavorite = false, onFavoriteChange }) {
  const lowest =
    product.minPrice != null
      ? { pricePerUnit: product.minPrice }
      : [...(product.pricingTiers || [])].sort(
          (a, b) => a.pricePerUnit - b.pricePerUnit
        )[0];

  const company = product.company;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background transition hover:border-accent">
      {showFavorite && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-background/90 shadow-sm">
          <FavoriteButton
            itemType="product"
            itemRef={product._id}
            onChange={onFavoriteChange}
          />
        </div>
      )}

      <Link to={`/product/${product._id}`} className="flex flex-1 flex-col">
        <div className="aspect-video bg-background-alt">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-text-secondary">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <span className="text-xs font-medium text-text-secondary">
            {product.category}
          </span>
          <p className="mt-0.5 font-medium text-text-primary group-hover:text-accent">
            {product.title}
          </p>

          {company?.companyName && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="truncate">{company.companyName}</span>
              <VerifiedBadge verified={company.isVerified} size="sm" />
            </div>
          )}

          <div className="mt-3 flex items-end justify-between pt-2">
            <span className="text-xs text-text-secondary">
              MOQ <span className="num">{formatQty(product.moq)}</span>
            </span>
            {lowest && (
              <span className="num text-sm font-semibold text-text-primary">
                {formatPrice(lowest.pricePerUnit)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
