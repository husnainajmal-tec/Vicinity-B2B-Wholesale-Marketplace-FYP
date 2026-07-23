import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

/**
 * Site-wide footer (primary navy).
 */
export default function Footer() {
  const columns = [
    {
      title: "For Buyers",
      links: [
        { label: "Browse Products", to: "/marketplace" },
        { label: "Post an RFQ", to: "/rfqs/new" },
        { label: "How It Works", to: "/#how-it-works", hash: true },
      ],
    },
    {
      title: "For Sellers",
      links: [
        { label: "Start Selling", to: "/register" },
        { label: "Manage Listings", to: "/products" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", to: "/about" },
        { label: "Contact", to: "/contact" },
      ],
    },
  ];

  return (
    <footer className="bg-primary text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <BrandLogo to="/" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              A B2B wholesale marketplace — source in bulk, negotiate in real
              time, from RFQ to delivery.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.hash ? (
                      <a
                        href={link.to}
                        className="text-white/60 transition-colors duration-150 hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-white/60 transition-colors duration-150 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row">
          <p>
            <span className="num">&copy; 2026</span> Vicinity Trade. All rights
            reserved.
          </p>
          <p className="text-white/40">
            Final Year Project — for academic demonstration.
          </p>
        </div>
      </div>
    </footer>
  );
}
