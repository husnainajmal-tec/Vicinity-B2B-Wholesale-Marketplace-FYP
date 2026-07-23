import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../Reveal";
import VerifiedBadge from "../VerifiedBadge";
import { FileCheck, ShieldCheck, BadgeCheck, Building2 } from "../Icons";
import { getVerifiedCompanies } from "../../services/companyService";

const PILLARS = [
  {
    icon: FileCheck,
    title: "Business registration checked",
    desc: "Sellers submit registration and verification documents.",
  },
  {
    icon: ShieldCheck,
    title: "Admin-approved",
    desc: "Our team reviews each application before approval.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge displayed",
    desc: "Approved suppliers carry a badge across the marketplace.",
  },
];

/**
 * Explains the (real) verification system and showcases actual verified
 * companies. Degrades gracefully: skeletons while loading, a friendly empty
 * state when there are no verified companies yet.
 */
export default function VerifiedSellers() {
  const [companies, setCompanies] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getVerifiedCompanies(4);
        if (!cancelled) setCompanies(rows || []);
      } catch {
        if (!cancelled) setCompanies([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-background-alt py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
            Trust &amp; Safety
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-text-primary md:text-4xl">
            What “Verified” Means
          </h2>
          <p className="mt-3 leading-relaxed tracking-[0.01em] text-text-secondary">
            Verification is a manual, admin-reviewed process — so a verified
            badge is a signal buyers can rely on.
          </p>
        </Reveal>

        {/* 3-pillar explainer */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.title} delay={i * 90}>
                <div className="card-elevated h-full p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 font-semibold text-text-primary">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {pillar.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Featured verified companies */}
        <Reveal className="mb-6 mt-14">
          <h3 className="font-display text-xl font-semibold text-text-primary">
            Featured Verified Suppliers
          </h3>
        </Reveal>

        {companies === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CompanySkeleton key={i} />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {companies.map((c, i) => (
              <Reveal key={c._id} delay={i * 70}>
                <CompanyCard company={c} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function initialsOf(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function CompanyCard({ company }) {
  const { _id, companyName, businessType, logoUrl, location } = company;
  const place = [location?.city, location?.region].filter(Boolean).join(", ");

  return (
    <Link
      to={`/company/${_id}`}
      className="card-elevated card-hover focus-ring group flex h-full flex-col p-5 hover:border-accent"
    >
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName}
            className="h-12 w-12 rounded-xl border border-border object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-semibold text-primary">
            {initialsOf(companyName) || <Building2 size={20} />}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary group-hover:text-accent">
            {companyName}
          </p>
          {businessType && (
            <p className="text-xs font-medium text-text-secondary">
              {businessType}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <VerifiedBadge verified size="sm" />
        {place && (
          <span className="truncate text-xs text-text-secondary">{place}</span>
        )}
      </div>
    </Link>
  );
}

function CompanySkeleton() {
  return (
    <div className="card-elevated flex h-full flex-col p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="skeleton mt-4 h-5 w-20 rounded-full" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-fill-subtle text-text-secondary">
        <ShieldCheck size={24} />
      </span>
      <p className="mt-3 font-display text-lg font-semibold text-text-primary">
        No verified suppliers yet
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        Verified companies will appear here once an admin approves them.
      </p>
    </div>
  );
}
