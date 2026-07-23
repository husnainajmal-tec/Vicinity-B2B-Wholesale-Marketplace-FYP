import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchProducts, getSearchMeta } from "../services/productService";
import { PRODUCT_CATEGORIES } from "../constants/categories";
import { formatPrice, formatQty } from "../utils/pricing";
import useDebounce from "../hooks/useDebounce";
import ProductCard from "../components/ProductCard";
import RangeSlider from "../components/RangeSlider";

/**
 * Search & Discovery results page.
 * - Debounced keyword (synced with the URL ?q=).
 * - Sidebar filters: category checkboxes, region dropdown, price + MOQ sliders.
 * - Active filter chips (fill-subtle) with "Clear all".
 * - Friendly empty state that suggests clearing filters.
 */
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Filter state (seeded from the URL) ---
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const debouncedKeyword = useDebounce(keyword, 350);

  const [categories, setCategories] = useState(
    (searchParams.get("category") || "").split(",").filter(Boolean)
  );
  const [region, setRegion] = useState(searchParams.get("region") || "");

  const [meta, setMeta] = useState(null);
  const [price, setPrice] = useState(null); // {min,max} once meta loads
  const [moq, setMoq] = useState(null);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Load facet metadata once ---
  useEffect(() => {
    (async () => {
      try {
        const m = await getSearchMeta();
        setMeta(m);
        setPrice({ min: m.priceRange.min, max: m.priceRange.max });
        setMoq({ min: m.moqRange.min, max: m.moqRange.max });
      } catch {
        setMeta({
          regions: [],
          priceRange: { min: 0, max: 0 },
          moqRange: { min: 0, max: 0 },
        });
        setPrice({ min: 0, max: 0 });
        setMoq({ min: 0, max: 0 });
      }
    })();
  }, []);

  // Are the sliders narrowed from their full range?
  const priceFiltered =
    meta &&
    price &&
    (price.min > meta.priceRange.min || price.max < meta.priceRange.max);
  const moqFiltered =
    meta &&
    moq &&
    (moq.min > meta.moqRange.min || moq.max < meta.moqRange.max);

  // --- Keep the URL in sync with the primary filters ---
  useEffect(() => {
    const next = {};
    if (debouncedKeyword) next.q = debouncedKeyword;
    if (categories.length) next.category = categories.join(",");
    if (region) next.region = region;
    setSearchParams(next, { replace: true });
  }, [debouncedKeyword, categories, region, setSearchParams]);

  // --- Run the search whenever any filter changes ---
  useEffect(() => {
    if (!meta) return; // wait for slider bounds
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { products } = await searchProducts({
          keyword: debouncedKeyword,
          category: categories.join(","),
          region,
          minPrice: priceFiltered ? price.min : "",
          maxPrice: priceFiltered ? price.max : "",
          minMoq: moqFiltered ? moq.min : "",
          maxMoq: moqFiltered ? moq.max : "",
        });
        if (!cancelled) setResults(products);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, categories, region, price, moq, meta]);

  const toggleCategory = (cat) =>
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const clearAll = () => {
    setKeyword("");
    setCategories([]);
    setRegion("");
    if (meta) {
      setPrice({ min: meta.priceRange.min, max: meta.priceRange.max });
      setMoq({ min: meta.moqRange.min, max: meta.moqRange.max });
    }
  };

  // --- Active filter chips ---
  const chips = useMemo(() => {
    const list = [];
    if (debouncedKeyword)
      list.push({ key: "q", label: `"${debouncedKeyword}"`, onRemove: () => setKeyword("") });
    categories.forEach((c) =>
      list.push({ key: `c-${c}`, label: c, onRemove: () => toggleCategory(c) })
    );
    if (region)
      list.push({ key: "region", label: region, onRemove: () => setRegion("") });
    if (priceFiltered)
      list.push({
        key: "price",
        label: `${formatPrice(price.min)} – ${formatPrice(price.max)}`,
        onRemove: () =>
          setPrice({ min: meta.priceRange.min, max: meta.priceRange.max }),
      });
    if (moqFiltered)
      list.push({
        key: "moq",
        label: `MOQ ${formatQty(moq.min)} – ${formatQty(moq.max)}`,
        onRemove: () =>
          setMoq({ min: meta.moqRange.min, max: meta.moqRange.max }),
      });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, categories, region, price, moq, priceFiltered, moqFiltered, meta]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        Search products
      </h1>

      {/* Keyword */}
      <div className="mt-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by keyword (e.g. cotton fabric, LED panel)…"
          className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Active chips */}
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-fill-subtle px-3 py-1 text-sm text-text-primary"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="text-text-secondary transition hover:text-danger"
                aria-label="Remove filter"
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-sm font-semibold text-accent hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Categories */}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-text-primary">
              Category
            </h2>
            <div className="space-y-1.5">
              {PRODUCT_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-2 text-sm text-text-primary"
                >
                  <input
                    type="checkbox"
                    checked={categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-text-primary">
              Region
            </h2>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All regions</option>
              {meta?.regions?.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          {meta && price && meta.priceRange.max > meta.priceRange.min && (
            <RangeSlider
              label="Price / unit"
              min={meta.priceRange.min}
              max={meta.priceRange.max}
              valueMin={price.min}
              valueMax={price.max}
              onChange={setPrice}
              format={(v) => formatPrice(v)}
            />
          )}

          {/* MOQ */}
          {meta && moq && meta.moqRange.max > meta.moqRange.min && (
            <RangeSlider
              label="MOQ"
              min={meta.moqRange.min}
              max={meta.moqRange.max}
              valueMin={moq.min}
              valueMax={moq.max}
              onChange={setMoq}
              format={(v) => formatQty(v)}
            />
          )}
        </aside>

        {/* Results */}
        <div>
          {loading ? (
            <p className="text-text-secondary">Searching…</p>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : results.length === 0 ? (
            <EmptyState onClear={clearAll} hasFilters={chips.length > 0} />
          ) : (
            <>
              <p className="mb-4 text-sm text-text-secondary">
                <span className="num">{results.length}</span>{" "}
                {results.length === 1 ? "product" : "products"} found
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => (
                  <ProductCard key={p._id} product={p} showFavorite />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClear, hasFilters }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background-alt p-12 text-center">
      <p className="font-display text-lg font-semibold text-text-primary">
        No products match your filters
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        {hasFilters
          ? "Try widening your search or removing a filter."
          : "There are no active listings yet — check back soon."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
