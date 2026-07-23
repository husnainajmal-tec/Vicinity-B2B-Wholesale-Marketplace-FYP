import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import NotificationBell from "./NotificationBell";
import BrandLogo from "./BrandLogo";
import { toast } from "../store/toastStore";

/**
 * Top navbar (primary navy).
 * Layout: brand + nav | growing search | actions + user flush right.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const unreadTotal = useChatStore((s) => s.unreadTotal);

  const [search, setSearch] = useState("");

  const handleLogout = () => {
    logout();
    toast.info("You have been logged out.");
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const linksByRole = {
    buyer: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/search", label: "Marketplace" },
      { to: "/favorites", label: "My Favorites" },
      { to: "/rfqs/mine", label: "My RFQs" },
      { to: "/orders/mine", label: "My Orders" },
    ],
    seller: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/products", label: "My Products" },
      { to: "/rfqs", label: "Browse RFQs" },
      { to: "/quotes/mine", label: "Quotes" },
      { to: "/orders/received", label: "Orders" },
      { to: "/orders/settlement", label: "Settlement" },
    ],
    admin: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/admin", label: "Admin" },
    ],
  };
  const links = user ? linksByRole[user.role] || [] : [];
  const guestLinks = [
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
  ];

  const linkClass = ({ isActive }) =>
    `whitespace-nowrap border-b-2 pb-0.5 transition ${
      isActive
        ? "border-accent text-white"
        : "border-transparent text-white/80 hover:text-white"
    }`;

  return (
    <header className="bg-primary text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3.5">
        {/* Left: brand + role nav */}
        <div className="flex min-w-0 shrink-0 items-center gap-6">
          <BrandLogo to="/" />

          {token && (
            <nav className="hidden items-center gap-5 text-sm xl:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkClass}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        {/* Guest links + search (About / Contact sit before search) */}
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-4">
          {!token && (
            <nav className="hidden shrink-0 items-center gap-4 text-sm sm:flex">
              {guestLinks.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkClass}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          )}

          <form
            onSubmit={handleSearch}
            className="hidden min-w-0 max-w-md flex-1 md:flex"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-l-md border-y border-l border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50 focus:border-accent"
            />
            <button
              type="submit"
              className="shrink-0 rounded-r-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Search
            </button>
          </form>
        </div>

        {/* Far right: auth actions */}
        <div className="flex shrink-0 items-center gap-3">
          {!token ? (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-white/90 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <NotificationBell />
              <Link
                to="/chat"
                className="relative rounded-md px-2 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Messages
                {unreadTotal > 0 && (
                  <span className="num absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-accent px-1 py-0.5 text-[10px] font-semibold text-white">
                    {unreadTotal}
                  </span>
                )}
              </Link>
              <div className="hidden border-l border-white/20 pl-3 text-right sm:block">
                <p className="text-sm font-medium leading-tight">{user?.name}</p>
                <p className="text-xs capitalize text-white/60">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md border border-white/25 px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
