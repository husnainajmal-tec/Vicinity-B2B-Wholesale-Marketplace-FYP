import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createProduct,
  updateProduct,
  getProduct,
  uploadProductImages,
} from "../services/productService";
import { validateTiersClient } from "../utils/pricing";
import { PRODUCT_CATEGORIES, STOCK_STATUS_OPTIONS } from "../constants/categories";
import { toast } from "../store/toastStore";

const emptyTier = { minQty: "", maxQty: "", pricePerUnit: "" };

const EMPTY = {
  title: "",
  description: "",
  category: PRODUCT_CATEGORIES[0],
  moq: "",
  stockStatus: "in_stock",
  pricingTiers: [
    { ...emptyTier },
    { ...emptyTier },
  ],
};

/**
 * Add / Edit product form.
 * - Repeatable tiered-pricing rows (2–4), live-validated against MOQ + overlap.
 * - Images uploaded after the product record exists (create then attach).
 */
export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [existingImages, setExistingImages] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { product } = await getProduct(id);
        setForm({
          title: product.title || "",
          description: product.description || "",
          category: product.category || PRODUCT_CATEGORIES[0],
          moq: product.moq ?? "",
          stockStatus: product.stockStatus || "in_stock",
          pricingTiers: (product.pricingTiers || []).map((t) => ({
            minQty: t.minQty ?? "",
            maxQty: t.maxQty ?? "",
            pricePerUnit: t.pricePerUnit ?? "",
          })),
        });
        setExistingImages(product.images || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateTier = (index, field) => (e) =>
    setForm((f) => {
      const tiers = f.pricingTiers.map((t, i) =>
        i === index ? { ...t, [field]: e.target.value } : t
      );
      return { ...f, pricingTiers: tiers };
    });

  const addTier = () =>
    setForm((f) =>
      f.pricingTiers.length >= 4
        ? f
        : { ...f, pricingTiers: [...f.pricingTiers, { ...emptyTier }] }
    );

  const removeTier = (index) =>
    setForm((f) =>
      f.pricingTiers.length <= 2
        ? f
        : { ...f, pricingTiers: f.pricingTiers.filter((_, i) => i !== index) }
    );

  const tierError = useMemo(
    () => validateTiersClient(form.pricingTiers, form.moq),
    [form.pricingTiers, form.moq]
  );

  const handlePickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const removePending = (idx) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Title is required.");
    if (!form.moq || Number(form.moq) < 1)
      return setError("MOQ must be at least 1.");
    if (tierError) return setError(tierError);

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        moq: Number(form.moq),
        stockStatus: form.stockStatus,
        pricingTiers: form.pricingTiers.map((t) => ({
          minQty: Number(t.minQty),
          maxQty: t.maxQty === "" ? null : Number(t.maxQty),
          pricePerUnit: Number(t.pricePerUnit),
        })),
      };

      const product = isEdit
        ? await updateProduct(id, payload)
        : await createProduct(payload);

      if (pendingFiles.length > 0) {
        await uploadProductImages(product._id, pendingFiles);
      }

      toast.success(isEdit ? "Product updated." : "Product created.");
      navigate("/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-text-secondary">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        {isEdit ? "Edit product" : "Add product"}
      </h1>
      <p className="mt-1 text-text-secondary">
        List a product with volume-based tiered pricing.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-xl border border-border bg-background p-6"
      >
        <Field
          label="Title"
          value={form.title}
          onChange={update("title")}
          placeholder="Cotton twill fabric, 240 GSM"
          required
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            Description
          </span>
          <textarea
            value={form.description}
            onChange={update("description")}
            rows={4}
            placeholder="Material, specs, lead time, packaging…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              Category
            </span>
            <select
              value={form.category}
              onChange={update("category")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              MOQ (units)
            </span>
            <input
              type="number"
              min="1"
              value={form.moq}
              onChange={update("moq")}
              placeholder="100"
              className="num w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              Stock status
            </span>
            <select
              value={form.stockStatus}
              onChange={update("stockStatus")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {STOCK_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Tiered pricing */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              Tiered pricing (2–4 tiers)
            </span>
            <button
              type="button"
              onClick={addTier}
              disabled={form.pricingTiers.length >= 4}
              className="text-sm font-semibold text-accent hover:underline disabled:opacity-40"
            >
              + Add tier
            </button>
          </div>

          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-1 text-xs font-medium text-text-secondary">
              <span className="col-span-4">Min qty</span>
              <span className="col-span-4">Max qty (blank = &amp; above)</span>
              <span className="col-span-3">Price / unit</span>
              <span className="col-span-1" />
            </div>

            {form.pricingTiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={tier.minQty}
                  onChange={updateTier(i, "minQty")}
                  placeholder="100"
                  className="num col-span-4 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="number"
                  min="1"
                  value={tier.maxQty}
                  onChange={updateTier(i, "maxQty")}
                  placeholder="499"
                  className="num col-span-4 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tier.pricePerUnit}
                  onChange={updateTier(i, "pricePerUnit")}
                  placeholder="340"
                  className="num col-span-3 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  disabled={form.pricingTiers.length <= 2}
                  className="col-span-1 text-lg text-text-secondary transition hover:text-danger disabled:opacity-30"
                  aria-label="Remove tier"
                  title="Remove tier"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {tierError && (
            <p className="mt-2 text-sm font-medium text-danger">{tierError}</p>
          )}
        </div>

        {/* Images */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            Images
          </span>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((url) => (
              <img
                key={url}
                src={url}
                alt="Product"
                className="h-20 w-20 rounded-md border border-border object-cover"
              />
            ))}
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Selected"
                  className="h-20 w-20 rounded-md border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePending(idx)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border text-2xl text-text-secondary transition hover:bg-fill-subtle"
            >
              +
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePickFiles}
          />
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || Boolean(tierError)}
            className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : isEdit
              ? "Save changes"
              : "Create product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="rounded-md border border-border bg-background-alt px-5 py-2.5 font-semibold text-text-primary transition hover:bg-fill-subtle"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, type = "text", ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
      </span>
      <input
        type={type}
        {...props}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
