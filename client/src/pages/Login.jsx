import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { toast } from "../store/toastStore";
import { AuthShell, Field } from "./Register";

/**
 * Login page. On success, redirect to the originally requested page
 * (if any) or the dashboard.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}!`);
      const dest = location.state?.from?.pathname || "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back to Vicinity Trade."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-accent hover:underline"
          >
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={update("email")}
          placeholder="you@company.com"
          required
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          placeholder="Your password"
          required
        />

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
