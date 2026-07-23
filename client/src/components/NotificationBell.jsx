import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../store/notificationStore";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";

const formatWhen = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/**
 * Navbar bell with unread badge (accent) and dropdown of recent notifications.
 */
export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const markReadLocal = useNotificationStore((s) => s.markReadLocal);
  const markAllReadLocal = useNotificationStore((s) => s.markAllReadLocal);

  useEffect(() => {
    const load = async () => {
      try {
        const { notifications: list, unreadCount: count } =
          await getNotifications();
        setNotifications(list, count);
      } catch {
        /* ignore */
      }
    };
    load();
  }, [setNotifications]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      markAllReadLocal();
    } catch {
      /* ignore */
    }
  };

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n._id);
        markReadLocal(n._id);
      } catch {
        /* still navigate */
      }
    }
    setOpen(false);
    navigate(n.linkTo);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-white/90 transition hover:bg-white/10"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="num absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-accent px-1 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">
              Notifications
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-medium text-accent hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-secondary">
                No notifications yet
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`w-full border-b border-border px-4 py-3 text-left transition hover:bg-background-alt ${
                      n.isRead ? "opacity-80" : "bg-accent/5"
                    }`}
                  >
                    <p
                      className={`text-sm leading-snug ${
                        n.isRead ? "text-text-secondary" : "text-text-primary"
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {formatWhen(n.createdAt)}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
