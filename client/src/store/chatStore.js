import { create } from "zustand";

/**
 * Lightweight chat store for cross-app concerns:
 *  - unreadTotal: drives the navbar unread badge (accent)
 *  - online: set of userIds currently connected (presence)
 */
export const useChatStore = create((set) => ({
  unreadTotal: 0,
  online: new Set(),

  setUnreadTotal: (n) => set({ unreadTotal: n }),

  setOnlineSnapshot: (ids) => set({ online: new Set(ids) }),
  markOnline: (userId) =>
    set((s) => {
      const next = new Set(s.online);
      next.add(String(userId));
      return { online: next };
    }),
  markOffline: (userId) =>
    set((s) => {
      const next = new Set(s.online);
      next.delete(String(userId));
      return { online: next };
    }),
}));
