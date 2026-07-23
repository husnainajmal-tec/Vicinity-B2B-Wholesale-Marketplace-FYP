import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { toast } from "../store/toastStore";
import BrandLogo from "../components/BrandLogo";

/**
 * Register page with a Buyer / Seller role toggle.
 * On success: success toast + redirect to dashboard.
 */
export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "buyer",
  });
  const [error, setError] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const user = await register(form);
      toast.success(`Welcome to Vicinity Trade, ${user.name}!`);
      // Sellers are sent straight into company onboarding; buyers go to dashboard.
      if (user.role === "seller") {
        navigate("/company/edit?onboarding=1", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Vicinity Trade to source or supply in bulk."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role toggle */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            I'm a…
          </span>
          <div className="grid grid-cols-2 gap-2">
            <RoleOption
              active={form.role === "buyer"}
              onClick={() => setForm((f) => ({ ...f, role: "buyer" }))}
              title="I'm a Buyer"
              desc="Source & purchase"
            />
            <RoleOption
              active={form.role === "seller"}
              onClick={() => setForm((f) => ({ ...f, role: "seller" }))}
              title="I'm a Seller"
              desc="List & supply"
            />
          </div>
        </div>

        <Field
          label="Full name"
          value={form.name}
          onChange={update("name")}
          placeholder="Ayesha Khan"
          required
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={update("email")}
          placeholder="you@company.com"
          required
        />
        <Field
          label="Phone (optional)"
          value={form.phone}
          onChange={update("phone")}
          placeholder="+92 300 1234567"
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          placeholder="At least 6 characters"
          required
        />

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

function RoleOption({ active, onClick, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition ${
        active
          ? "border-accent bg-accent/10"
          : "border-border bg-background hover:bg-fill-subtle"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          active ? "text-accent" : "text-text-primary"
        }`}
      >
        {title}
      </p>
      <p className="text-xs text-text-secondary">{desc}</p>
    </button>
  );
}

/* Shared building blocks reused by the Login page. */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLogo to="/" invertLabel={false} size="lg" />
        </div>
        <div className="rounded-xl border border-border bg-background p-8">
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && (
          <p className="mt-4 text-center text-sm text-text-secondary">{footer}</p>
        )}
      </div>
    </div>
  );
}

export function Field({ label, type = "text", ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
      </span>
      <input
        type={type}
        {...props}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
