import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicCompany } from "../services/companyService";
import VerifiedBadge from "../components/VerifiedBadge";
import ProductCard from "../components/ProductCard";
import SellerRatings from "../components/SellerRatings";
import FavoriteButton from "../components/FavoriteButton";

/**
 * Public company profile — /company/:id
 * Shows logo, name, description, location, the verified badge (only when
 * isVerified === true), and a grid of the company's active listings.
 */
export default function CompanyProfilePublic() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicCompany(id);
        setState({ loading: false, data, error: "" });
      } catch (err) {
        setState({ loading: false, data: null, error: err.message });
      }
    })();
  }, [id]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-text-secondary">
        Loading company…
      </div>
    );
  }

  if (state.error || !state.data?.profile) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Company not found
        </h1>
        <p className="mt-2 text-text-secondary">
          {state.error || "This company profile does not exist."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover"
        >
          Back home
        </Link>
      </div>
    );
  }

  const { profile, products, ratings } = state.data;
  const locationStr = [profile.location?.city, profile.location?.region]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="rounded-xl border border-border bg-background-alt p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={`${profile.companyName} logo`}
                className="h-24 w-24 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-border bg-background text-2xl font-semibold text-text-secondary">
                {profile.companyName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold text-text-primary">
                {profile.companyName}
              </h1>
              <VerifiedBadge verified={profile.isVerified} />
              <FavoriteButton itemType="company" itemRef={profile._id} size="lg" />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
              <span className="rounded-full bg-fill-subtle px-2.5 py-0.5 font-medium text-text-primary">
                {profile.businessType}
              </span>
              {locationStr && <span>{locationStr}</span>}
            </div>

            {profile.description && (
              <p className="mt-4 max-w-2xl text-text-primary">
                {profile.description}
              </p>
            )}

            {profile.certifications?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.certifications.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-text-secondary"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SellerRatings ratings={ratings} />

      {/* Product listings */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Product listings
        </h2>

        {products && products.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} showFavorite />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-background-alt p-10 text-center text-text-secondary">
            No active listings yet.
          </div>
        )}
      </section>
    </div>
  );
}

