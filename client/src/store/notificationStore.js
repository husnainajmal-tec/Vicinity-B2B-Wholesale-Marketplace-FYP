import { create } from "zustand";

/**
 * Notification store — drives the navbar bell badge and dropdown.
 */
export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount }),

  addNotification: (notification) =>
    set((s) => {
      const exists = s.notifications.some((n) => n._id === notification._id);
      if (exists) return s;
      return {
        notifications: [notification, ...s.notifications].slice(0, 20),
        unreadCount: notification.isRead ? s.unreadCount : s.unreadCount + 1,
      };
    }),

  markReadLocal: (id) =>
    set((s) => {
      const target = s.notifications.find((n) => n._id === id);
      if (!target || target.isRead) return s;
      return {
        notifications: s.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      };
    }),

  markAllReadLocal: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  reset: () => set({ notifications: [], unreadCount: 0 }),
}));
