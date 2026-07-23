import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginRequest,
  registerRequest,
  getMeRequest,
} from "../services/authService";

const TOKEN_KEY = "vt_token"; // read by the axios interceptor in services/api.js

/**
 * Auth store (persisted to localStorage).
 * Holds the current user + token and exposes login/register/logout actions.
 * The raw token is also mirrored to `vt_token` so the axios interceptor
 * can attach it to every request.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      isAuthenticated: () => !!get().token,

      /** Log in and persist the session. */
      login: async (credentials) => {
        set({ loading: true });
        try {
          const { user, token } = await loginRequest(credentials);
          localStorage.setItem(TOKEN_KEY, token);
          set({ user, token, loading: false });
          return user;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      /** Register (buyer/seller) and persist the session. */
      register: async (payload) => {
        set({ loading: true });
        try {
          const { user, token } = await registerRequest(payload);
          localStorage.setItem(TOKEN_KEY, token);
          set({ user, token, loading: false });
          return user;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      /** Refresh the current user from the API (e.g. on app load). */
      loadUser: async () => {
        if (!get().token) return null;
        try {
          const user = await getMeRequest();
          set({ user });
          return user;
        } catch {
          // token invalid/expired — clear session
          get().logout();
          return null;
        }
      },

      /** Clear the session everywhere. */
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null });
      },
    }),
    {
      name: "vt-auth", // localStorage key for the persisted store
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
