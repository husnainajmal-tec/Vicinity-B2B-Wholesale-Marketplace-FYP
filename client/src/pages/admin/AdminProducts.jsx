import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProducts,
  setProductActive,
  deleteProduct,
} from "../../services/adminService";
import { toast } from "../../store/toastStore";
import { formatPrice } from "../../utils/pricing";
import { PRODUCT_CATEGORIES } from "../../constants/categories";
import StatusPill from "../../components/StatusPill";
import useDebounce from "../../hooks/useDebounce";

const lowestTierPrice = (product) => {
  if (!product.pricingTiers?.length) return null;
  return Math.min(...product.pricingTiers.map((t) => t.pricePerUnit));
};

/**
 * Products table — moderate (show/hide) or permanently remove listings.
 */
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const debouncedQ = useDebounce(q, 350);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await getProducts({ q: debouncedQ, category, active });
        if (mounted) setProducts(list);
      } catch (err) {
        if (mounted) toast.error(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedQ, category, active]);

  const toggleActive = async (product) => {
    setBusyId(product._id);
    try {
      const updated = await setProductActive(product._id, !product.isActive);
      setProducts((list) =>
        list.map((p) => (p._id === product._id ? { ...p, ...updated } : p))
      );
      toast.success(updated.isActive ? "Listing shown." : "Listing hidden.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`Permanently remove "${product.title}"? This cannot be undone.`)) {
      return;
    }
    setBusyId(product._id);
    try {
      await deleteProduct(product._id);
      setProducts((list) => list.filter((p) => p._id !== product._id));
      toast.success("Listing removed.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Products
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Moderate listings across all sellers.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title…"
          className="w-56 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        >
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="bg-fill-subtle text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">From</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  Loading…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const price = lowestTierPrice(p);
                return (
                  <tr key={p._id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <Link
                        to={`/product/${p._id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {p.sellerRef?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{p.category}</td>
                    <td className="num px-4 py-3 text-text-primary">
                      {price != null ? formatPrice(price) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.isActive ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleActive(p)}
                          disabled={busyId === p._id}
                          className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-text-primary transition hover:bg-fill-subtle disabled:opacity-60"
                        >
                          {p.isActive ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => remove(p)}
                          disabled={busyId === p._id}
                          className="rounded-md border border-danger px-3 py-1.5 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
