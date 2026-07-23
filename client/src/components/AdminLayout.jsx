import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import BrandLogo from "./BrandLogo";
import { toast } from "../store/toastStore";

const NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/verifications", label: "Verifications" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/products", label: "Products" },
];

/**
 * Admin shell — a primary-navy sidebar clearly distinct from the public
 * navbar, signalling you're inside an internal tool. Renders nested admin
 * routes via <Outlet />.
 */
export default function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.info("You have been logged out.");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background-alt">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col bg-primary text-white">
        <div className="border-b border-white/10 px-6 py-5">
          <BrandLogo to="/admin" label="Vicinity Admin" />
          <p className="mt-1 text-xs uppercase tracking-wide text-white/50">
            Internal tool
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-white/60">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-md border border-white/25 px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
