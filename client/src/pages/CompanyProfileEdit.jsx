import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getMyCompany,
  createCompany,
  updateCompany,
  uploadLogo,
  uploadDocs,
} from "../services/companyService";
import { toast } from "../store/toastStore";
import VerifiedBadge from "../components/VerifiedBadge";

const BUSINESS_TYPES = ["Manufacturer", "Trader", "Distributor"];

const EMPTY = {
  companyName: "",
  businessType: "Manufacturer",
  description: "",
  city: "",
  region: "",
  certifications: "",
};

/**
 * Company profile onboarding / edit form.
 * - New users see a "complete your profile" heading (onboarding).
 * - Logo + verification document uploads are enabled once the profile
 *   exists (they attach to an existing record).
 */
export default function CompanyProfileEdit() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isOnboarding = params.get("onboarding") === "1";

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const logoInput = useRef(null);
  const docsInput = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyCompany();
        if (p) {
          setProfile(p);
          setForm({
            companyName: p.companyName || "",
            businessType: p.businessType || "Manufacturer",
            description: p.description || "",
            city: p.location?.city || "",
            region: p.location?.region || "",
            certifications: (p.certifications || []).join(", "),
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        companyName: form.companyName,
        businessType: form.businessType,
        description: form.description,
        city: form.city,
        region: form.region,
        certifications: form.certifications,
      };
      const saved = profile
        ? await updateCompany(payload)
        : await createCompany(payload);
      setProfile(saved);
      toast.success(
        profile ? "Company profile updated." : "Company profile created."
      );
      if (isOnboarding && !profile) {
        // First-time creation during onboarding — stay to allow uploads,
        // but let the user continue to the dashboard.
        toast.info("Add a logo and verification docs, or continue.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await uploadLogo(file);
      setProfile(updated);
      toast.success("Logo uploaded.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDocs = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const updated = await uploadDocs(files);
      setProfile(updated);
      toast.success("Documents uploaded for review.");
    } catch (err) {
      toast.error(err.message);
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            {isOnboarding && !profile
              ? "Complete your company profile"
              : "Company profile"}
          </h1>
          <p className="mt-1 text-text-secondary">
            {isOnboarding
              ? "Sellers must complete this before listing products."
              : "Manage your company details and verification documents."}
          </p>
        </div>
        {profile && (
          <VerificationStatus isVerified={profile.isVerified} />
        )}
      </div>

      {/* --- Details form --- */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-background p-6"
      >
        <Field
          label="Company name"
          value={form.companyName}
          onChange={update("companyName")}
          placeholder="Acme Textiles Pvt Ltd"
          required
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            Business type
          </span>
          <select
            value={form.businessType}
            onChange={update("businessType")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-primary">
            Description
          </span>
          <textarea
            value={form.description}
            onChange={update("description")}
            rows={4}
            placeholder="What does your company make or supply?"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="City"
            value={form.city}
            onChange={update("city")}
            placeholder="Lahore"
          />
          <Field
            label="Region / Province"
            value={form.region}
            onChange={update("region")}
            placeholder="Punjab"
          />
        </div>

        <Field
          label="Certifications (comma-separated)"
          value={form.certifications}
          onChange={update("certifications")}
          placeholder="ISO 9001, OEKO-TEX"
        />

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : profile ? "Save changes" : "Create profile"}
          </button>
          {profile && (
            <Link
              to={`/company/${profile._id}`}
              className="rounded-md border border-border bg-background-alt px-5 py-2.5 font-semibold text-text-primary transition hover:bg-fill-subtle"
            >
              View public page
            </Link>
          )}
          {isOnboarding && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-md px-5 py-2.5 font-semibold text-text-secondary transition hover:text-text-primary"
            >
              {profile ? "Continue to dashboard" : "Skip for now"}
            </button>
          )}
        </div>
      </form>

      {/* --- Uploads (require an existing profile) --- */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <UploadCard
          title="Company logo"
          desc="PNG, JPG or WEBP, up to 5 MB."
          disabled={!profile}
          onPick={() => logoInput.current?.click()}
          buttonLabel={profile?.logoUrl ? "Replace logo" : "Upload logo"}
        >
          {profile?.logoUrl && (
            <img
              src={profile.logoUrl}
              alt="Company logo"
              className="h-16 w-16 rounded-md border border-border object-cover"
            />
          )}
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogo}
          />
        </UploadCard>

        <UploadCard
          title="Verification documents"
          desc="Business registration, tax docs, etc. Reviewed by an admin."
          disabled={!profile}
          onPick={() => docsInput.current?.click()}
          buttonLabel="Upload documents"
        >
          {profile?.verificationDocs?.length > 0 && (
            <p className="text-sm text-text-secondary">
              <span className="num">{profile.verificationDocs.length}</span>{" "}
              document(s) submitted.
            </p>
          )}
          <input
            ref={docsInput}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={handleDocs}
          />
        </UploadCard>
      </div>

      {!profile && (
        <p className="mt-4 text-sm text-text-secondary">
          Save your profile first to enable logo and document uploads.
        </p>
      )}
    </div>
  );
}

function VerificationStatus({ isVerified }) {
  if (isVerified) return <VerifiedBadge verified />;
  return (
    <span className="inline-flex items-center rounded-full bg-fill-subtle px-2.5 py-1 text-sm font-medium text-text-secondary">
      Pending verification
    </span>
  );
}

function UploadCard({ title, desc, disabled, onPick, buttonLabel, children }) {
  return (
    <div className="rounded-xl border border-border bg-background-alt p-5">
      <h3 className="font-medium text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">{desc}</p>
      <div className="mt-3 flex items-center gap-3">{children}</div>
      <button
        type="button"
        disabled={disabled}
        onClick={onPick}
        className="mt-4 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-fill-subtle disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

/* Local field (mirrors the auth form field styling). */
function Field({ label, type = "text", ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
      </span>
      <input
        type={type}
        {...props}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
