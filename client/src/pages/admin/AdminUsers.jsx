import { useEffect, useState } from "react";
import { getUsers, setUserSuspended } from "../../services/adminService";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import StatusPill from "../../components/StatusPill";
import useDebounce from "../../hooks/useDebounce";

const ROLE_TABS = [
  { value: "", label: "All" },
  { value: "buyer", label: "Buyers" },
  { value: "seller", label: "Sellers" },
  { value: "admin", label: "Admins" },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

/**
 * Users table — search + role filter, suspend/activate toggle.
 */
export default function AdminUsers() {
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const debouncedQ = useDebounce(q, 350);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const list = await getUsers({ q: debouncedQ, role });
        if (active) setUsers(list);
      } catch (err) {
        if (active) toast.error(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [debouncedQ, role]);

  const toggleSuspend = async (user) => {
    setBusyId(user._id);
    try {
      const updated = await setUserSuspended(user._id, !user.isSuspended);
      setUsers((list) =>
        list.map((u) => (u._id === user._id ? { ...u, ...updated } : u))
      );
      toast.success(updated.isSuspended ? "User suspended." : "User reactivated.");
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
          Users
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Search accounts and manage access.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
        <div className="flex gap-1 rounded-md border border-border bg-background p-1">
          {ROLE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setRole(t.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                role === t.value
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-fill-subtle"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="bg-fill-subtle text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u._id === me?._id;
                const isAdmin = u.role === "admin";
                return (
                  <tr key={u._id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {u.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-text-secondary">(you)</span>
                      )}
                    </td>
                    <td className="num px-4 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3 capitalize text-text-primary">{u.role}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        tone={u.isSuspended ? "danger" : "success"}
                        label={u.isSuspended ? "Suspended" : "Active"}
                      />
                    </td>
                    <td className="num px-4 py-3 text-text-secondary">
                      {fmtDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin || isSelf ? (
                        <span className="text-xs text-text-secondary">—</span>
                      ) : (
                        <button
                          onClick={() => toggleSuspend(u)}
                          disabled={busyId === u._id}
                          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60 ${
                            u.isSuspended
                              ? "bg-success text-white hover:opacity-90"
                              : "border border-danger text-danger hover:bg-danger/10"
                          }`}
                        >
                          {u.isSuspended ? "Activate" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
