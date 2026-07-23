import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRFQ } from "../services/rfqService";
import { PRODUCT_CATEGORIES } from "../constants/categories";
import { toast } from "../store/toastStore";

/**
 * Buyer "Post RFQ" form. On success the RFQ appears in the public
 * Buying Leads feed and the buyer's My RFQs page.
 */
export default function PostRFQ() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: PRODUCT_CATEGORIES[0],
    quantityNeeded: "",
    targetPrice: "",
    deadline: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Title is required.");
    if (!form.quantityNeeded || Number(form.quantityNeeded) < 1)
      return setError("Quantity needed must be at least 1.");
    if (!form.deadline) return setError("Please choose a deadline.");
    if (new Date(form.deadline) < new Date().setHours(0, 0, 0, 0))
      return setError("Deadline must be in the future.");

    setSaving(true);
    try {
      await createRFQ({
        title: form.title,
        description: form.description,
        category: form.category,
        quantityNeeded: Number(form.quantityNeeded),
        targetPrice: form.targetPrice === "" ? null : Number(form.targetPrice),
        deadline: form.deadline,
      });
      toast.success("RFQ posted to Buying Leads.");
      navigate("/rfqs/mine");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        Post an RFQ
      </h1>
      <p className="mt-1 text-text-secondary">
        Describe what you need — sellers will respond with quotes.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-border bg-background p-6"
      >
        <Field
          label="Title"
          value={form.title}
          onChange={update("title")}
          placeholder="500 units cotton twill fabric, 240 GSM"
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
            placeholder="Specs, quality requirements, destination, packaging…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <Field
            label="Quantity needed (units)"
            type="number"
            min="1"
            value={form.quantityNeeded}
            onChange={update("quantityNeeded")}
            placeholder="500"
            className="num"
            required
          />

          <Field
            label="Target price / unit (optional)"
            type="number"
            min="0"
            step="0.01"
            value={form.targetPrice}
            onChange={update("targetPrice")}
            placeholder="320"
            className="num"
          />

          <Field
            label="Deadline"
            type="date"
            value={form.deadline}
            onChange={update("deadline")}
            required
          />
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Posting…" : "Post RFQ"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/rfqs/mine")}
            className="rounded-md border border-border bg-background-alt px-5 py-2.5 font-semibold text-text-primary transition hover:bg-fill-subtle"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, type = "text", className = "", ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
      </span>
      <input
        type={type}
        {...props}
        className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
      />
    </label>
  );
}
