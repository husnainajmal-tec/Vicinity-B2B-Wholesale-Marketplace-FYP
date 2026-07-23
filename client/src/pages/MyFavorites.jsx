import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFavorites } from "../services/favoriteService";
import ProductCard from "../components/ProductCard";
import VerifiedBadge from "../components/VerifiedBadge";
import FavoriteButton from "../components/FavoriteButton";

/**
 * Buyer watchlist — Saved Products / Saved Suppliers tabs.
 */
export default function MyFavorites() {
  const [tab, setTab] = useState("products");
  const [data, setData] = useState({ products: [], companies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setData(await getFavorites());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tabs = [
    { id: "products", label: "Saved Products", count: data.products.length },
    { id: "companies", label: "Saved Suppliers", count: data.companies.length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        My Favorites
      </h1>
      <p className="mt-2 text-text-secondary">
        Products and suppliers you&apos;ve bookmarked for later.
      </p>

      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
            <span className="num ml-1.5 text-xs font-medium opacity-80">
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-text-secondary">Loading…</p>
      ) : error ? (
        <p className="mt-8 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : tab === "products" ? (
        data.products.length === 0 ? (
          <EmptyState
            message="No saved products yet."
            linkTo="/search"
            linkLabel="Browse marketplace"
          />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.products.map(({ product }) => (
              <ProductCard
                key={product._id}
                product={product}
                showFavorite
                onFavoriteChange={(fav) => {
                  if (!fav) {
                    setData((d) => ({
                      ...d,
                      products: d.products.filter(
                        (p) => p.product._id !== product._id
                      ),
                    }));
                  }
                }}
              />
            ))}
          </div>
        )
      ) : data.companies.length === 0 ? (
        <EmptyState
          message="No saved suppliers yet."
          linkTo="/search"
          linkLabel="Find suppliers"
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.companies.map(({ company }) => {
            const location = [company.location?.city, company.location?.region]
              .filter(Boolean)
              .join(", ");
            return (
              <div
                key={company._id}
                className="relative rounded-xl border border-border bg-background p-5 transition hover:border-accent"
              >
                <div className="absolute right-3 top-3">
                  <FavoriteButton
                    itemType="company"
                    itemRef={company._id}
                    onChange={(fav) => {
                      if (!fav) {
                        setData((d) => ({
                          ...d,
                          companies: d.companies.filter(
                            (c) => c.company._id !== company._id
                          ),
                        }));
                      }
                    }}
                  />
                </div>
                <Link to={`/company/${company._id}`} className="block pr-8">
                  <div className="flex items-start gap-4">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt=""
                        className="h-14 w-14 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-background-alt text-lg font-semibold text-text-secondary">
                        {company.companyName?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-medium text-text-primary hover:text-accent">
                          {company.companyName}
                        </h2>
                        <VerifiedBadge verified={company.isVerified} size="sm" />
                      </div>
                      <p className="mt-0.5 text-sm text-text-secondary">
                        {company.businessType}
                        {location ? ` · ${location}` : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, linkTo, linkLabel }) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-border bg-background-alt p-12 text-center">
      <p className="text-text-secondary">{message}</p>
      <Link
        to={linkTo}
        className="mt-4 inline-block rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
