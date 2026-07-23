import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getMyCompany } from "../services/companyService";
import VerifiedBadge from "../components/VerifiedBadge";

/**
 * Placeholder role-aware dashboard. Real per-module widgets arrive in
 * later phases; for now it confirms auth + role are working end to end.
 * Sellers additionally see a company-profile onboarding/verification banner.
 */
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [company, setCompany] = useState(null);
  const [companyLoaded, setCompanyLoaded] = useState(false);

  useEffect(() => {
    if (user?.role !== "seller") return;
    (async () => {
      try {
        const p = await getMyCompany();
        setCompany(p);
      } catch {
        setCompany(null);
      } finally {
        setCompanyLoaded(true);
      }
    })();
  }, [user?.role]);

  const roleCopy = {
    buyer: {
      title: "Buyer dashboard",
      blurb: "Source products, post RFQs, and track your orders.",
      actions: [
        { to: "/search", label: "Browse Marketplace" },
        { to: "/favorites", label: "My Favorites" },
        { to: "/rfqs/new", label: "Post an RFQ" },
        { to: "/rfqs/mine", label: "My RFQs" },
        { to: "/orders/mine", label: "My Orders" },
      ],
    },
    seller: {
      title: "Seller dashboard",
      blurb: "List products, respond to RFQs, and fulfill orders.",
      actions: [
        { to: "/products", label: "My Products" },
        { to: "/company/edit", label: "Company Profile" },
        { to: "/rfqs", label: "Browse RFQs" },
        { to: "/quotes/mine", label: "My Quotes" },
        { to: "/orders/received", label: "Orders Received" },
        { to: "/orders/settlement", label: "Settlement Summary" },
      ],
    },
    admin: {
      title: "Admin dashboard",
      blurb: "Verify suppliers, moderate listings, and view platform stats.",
      actions: [{ to: "/admin", label: "Open Admin Panel" }],
    },
  };

  const copy = roleCopy[user?.role] || roleCopy.buyer;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        {user?.role}
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-text-primary">
        {copy.title}
      </h1>
      <p className="mt-2 text-text-secondary">
        Welcome, {user?.name}. {copy.blurb}
      </p>

      {/* Seller company-profile onboarding / verification banner */}
      {user?.role === "seller" && companyLoaded && (
        <SellerCompanyBanner company={company} />
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {copy.actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="rounded-xl border border-border bg-background-alt p-5 transition hover:border-accent"
          >
            <span className="font-medium text-text-primary">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-border bg-background-alt p-4 text-sm text-text-secondary">
        Signed in as <span className="num">{user?.email}</span> · role{" "}
        <span className="font-medium capitalize text-text-primary">
          {user?.role}
        </span>
      </div>
    </div>
  );
}

/**
 * Guides sellers through completing + verifying their company profile.
 * - No profile: amber prompt to complete it (required before listing products).
 * - Pending verification: neutral note that an admin will review.
 * - Verified: success confirmation with the verified badge.
 */
function SellerCompanyBanner({ company }) {
  if (!company) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/10 p-4">
        <div>
          <p className="font-medium text-text-primary">
            Complete your company profile
          </p>
          <p className="text-sm text-text-secondary">
            You need a company profile before you can list products.
          </p>
        </div>
        <Link
          to="/company/edit?onboarding=1"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Complete profile
        </Link>
      </div>
    );
  }

  if (!company.isVerified) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background-alt p-4">
        <div>
          <p className="font-medium text-text-primary">
            Verification pending
          </p>
          <p className="text-sm text-text-secondary">
            Your profile is awaiting admin review. Add verification documents to
            speed things up.
          </p>
        </div>
        <Link
          to="/company/edit"
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-fill-subtle"
        >
          Manage profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
      <div className="flex items-center gap-3">
        <VerifiedBadge verified />
        <p className="text-sm text-text-primary">
          Your company is verified. Buyers will see the verified badge on your
          profile.
        </p>
      </div>
      <Link
        to={`/company/${company._id}`}
        className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-fill-subtle"
      >
        View public page
      </Link>
    </div>
  );
}
