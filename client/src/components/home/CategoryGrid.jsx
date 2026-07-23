import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../Reveal";
import { iconForCategory } from "../Icons";
import { getCategoryCounts } from "../../services/productService";
import { PRODUCT_CATEGORIES } from "../../constants/categories";

/**
 * "Browse by Category" grid. Shows the 8 categories with the most active
 * listings (server-sorted); falls back to the first 8 known categories if
 * the fetch fails or there are no active listings yet. Each tile links into
 * the existing Search page pre-filtered via ?category=.
 */
export default function CategoryGrid() {
  const [categories, setCategories] = useState(null); // null = loading
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getCategoryCounts();
        if (cancelled) return;
        if (rows && rows.length > 0) {
          setCategories(rows.slice(0, 8));
        } else {
          setCategories(
            PRODUCT_CATEGORIES.slice(0, 8).map((c) => ({ category: c, count: 0 }))
          );
        }
      } catch {
        if (cancelled) return;
        setError(true);
        setCategories(
          PRODUCT_CATEGORIES.slice(0, 8).map((c) => ({ category: c, count: 0 }))
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Explore
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-text-primary md:text-4xl">
            Browse by Category
          </h2>
          <p className="mt-3 leading-relaxed tracking-[0.01em] text-text-secondary">
            Jump straight into the categories buyers are sourcing right now.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories === null
            ? Array.from({ length: 8 }).map((_, i) => <TileSkeleton key={i} />)
            : categories.map((c, i) => (
                <Reveal key={c.category} delay={i * 50}>
                  <CategoryTile category={c.category} count={c.count} />
                </Reveal>
              ))}
        </div>

        {error && (
          <p className="mt-4 text-xs text-text-secondary">
            Showing default categories — live counts are temporarily unavailable.
          </p>
        )}
      </div>
    </section>
  );
}

function CategoryTile({ category, count }) {
  const Icon = iconForCategory(category);
  return (
    <Link
      to={`/search?category=${encodeURIComponent(category)}`}
      className="card-elevated card-hover focus-ring group flex h-full flex-col gap-3 p-5 hover:border-accent"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fill-subtle text-primary transition-colors duration-150 group-hover:bg-accent/10 group-hover:text-accent">
        <Icon size={22} />
      </span>
      <span className="mt-1 font-medium leading-snug text-text-primary group-hover:text-accent">
        {category}
      </span>
      <span className="mt-auto text-xs text-text-secondary">
        {count > 0 ? (
          <>
            <span className="num font-medium text-text-primary">{count}</span>{" "}
            {count === 1 ? "listing" : "listings"}
          </>
        ) : (
          "Browse"
        )}
      </span>
    </Link>
  );
}

function TileSkeleton() {
  return (
    <div className="card-elevated flex h-full flex-col gap-3 p-5">
      <div className="skeleton h-11 w-11 rounded-xl" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton mt-auto h-3 w-1/2 rounded" />
    </div>
  );
}
