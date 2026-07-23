import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyProducts,
  deleteProduct,
  toggleProductActive,
} from "../services/productService";
import { formatPrice, formatQty } from "../utils/pricing";
import { toast } from "../store/toastStore";
import StatusPill from "../components/StatusPill";

/**
 * Seller "My Products" list with edit / delete / toggle-active actions.
 * Shows the starting (lowest) tier price and MOQ per product.
 */
export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getMyProducts();
      setProducts(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (id) => {
    setBusyId(id);
    try {
      const updated = await toggleProductActive(id);
      setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
      toast.success(updated.isActive ? "Product activated." : "Product deactivated.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            My Products
          </h1>
          <p className="mt-1 text-text-secondary">
            Manage your listings, pricing, and availability.
          </p>
        </div>
        <Link
          to="/products/new"
          className="rounded-md bg-accent px-4 py-2.5 font-semibold text-white transition hover:opacity-90"
        >
          Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background-alt p-12 text-center">
          <p className="text-text-secondary">
            You haven't listed any products yet.
          </p>
          <Link
            to="/products/new"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-fill-subtle text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">MOQ</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const lowest = [...(p.pricingTiers || [])].sort(
                  (a, b) => a.pricePerUnit - b.pricePerUnit
                )[0];
                return (
                  <tr key={p._id} className="bg-background">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-10 w-10 rounded border border-border object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded border border-border bg-fill-subtle" />
                        )}
                        <Link
                          to={`/product/${p._id}`}
                          className="font-medium text-text-primary hover:text-accent"
                        >
                          {p.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {p.category}
                    </td>
                    <td className="num px-4 py-3 text-text-primary">
                      {formatQty(p.moq)}
                    </td>
                    <td className="num px-4 py-3 text-text-primary">
                      {lowest ? formatPrice(lowest.pricePerUnit) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.stockStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.isActive ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/products/${p._id}/edit`}
                          className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-fill-subtle"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggle(p._id)}
                          disabled={busyId === p._id}
                          className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-fill-subtle disabled:opacity-50"
                        >
                          {p.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.title)}
                          disabled={busyId === p._id}
                          className="rounded-md border border-danger/30 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
