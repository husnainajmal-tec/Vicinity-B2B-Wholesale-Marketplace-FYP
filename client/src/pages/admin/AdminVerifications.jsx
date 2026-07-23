import { useEffect, useState } from "react";
import { getVerifications, reviewVerification } from "../../services/adminService";
import { toast } from "../../store/toastStore";

/**
 * Pending Verifications — approve (success) / reject (danger) company profiles,
 * with links to view uploaded verification documents.
 */
export default function AdminVerifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setItems(await getVerifications());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleReview = async (id, action) => {
    setBusyId(id);
    try {
      await reviewVerification(id, action);
      setItems((list) => list.filter((p) => p._id !== id));
      toast.success(action === "approve" ? "Company approved." : "Company rejected.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Pending verifications
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review company profiles and their uploaded documents.
        </p>
      </header>

      {loading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : error ? (
        <p className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-text-secondary">
          No profiles awaiting verification.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div
              key={p._id}
              className="rounded-xl border border-border bg-background p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-text-primary">
                    {p.companyName}
                  </h2>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {p.businessType}
                    {p.location?.city || p.location?.region
                      ? ` · ${[p.location?.city, p.location?.region].filter(Boolean).join(", ")}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Owner:{" "}
                    <span className="text-text-primary">{p.userRef?.name}</span>{" "}
                    <span className="num">({p.userRef?.email})</span>
                  </p>
                  {p.description && (
                    <p className="mt-2 max-w-2xl text-sm text-text-primary">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                      Documents
                    </p>
                    {p.verificationDocs?.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {p.verificationDocs.map((url, i) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-border bg-background-alt px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-fill-subtle"
                          >
                            Document {i + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-text-secondary">
                        No documents uploaded.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleReview(p._id, "approve")}
                    disabled={busyId === p._id}
                    className="rounded-md bg-success px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(p._id, "reject")}
                    disabled={busyId === p._id}
                    className="rounded-md border border-danger px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
