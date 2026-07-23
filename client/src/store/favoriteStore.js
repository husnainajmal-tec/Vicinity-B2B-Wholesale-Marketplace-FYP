import { create } from "zustand";
import { getFavoriteIds, toggleFavorite } from "../services/favoriteService";

/**
 * Buyer favorites — id sets for fast heart-toggle lookups.
 */
export const useFavoriteStore = create((set, get) => ({
  productIds: new Set(),
  companyIds: new Set(),
  loaded: false,

  loadIds: async () => {
    try {
      const { productIds, companyIds } = await getFavoriteIds();
      set({
        productIds: new Set(productIds),
        companyIds: new Set(companyIds),
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  isFavorited: (itemType, itemRef) => {
    const id = String(itemRef);
    const s = get();
    return itemType === "product"
      ? s.productIds.has(id)
      : s.companyIds.has(id);
  },

  toggle: async (itemType, itemRef) => {
    const id = String(itemRef);
    const was = get().isFavorited(itemType, itemRef);

    // Optimistic update
    set((s) => {
      const productIds = new Set(s.productIds);
      const companyIds = new Set(s.companyIds);
      if (itemType === "product") {
        was ? productIds.delete(id) : productIds.add(id);
      } else {
        was ? companyIds.delete(id) : companyIds.add(id);
      }
      return { productIds, companyIds };
    });

    try {
      const { favorited } = await toggleFavorite({ itemType, itemRef });
      set((s) => {
        const productIds = new Set(s.productIds);
        const companyIds = new Set(s.companyIds);
        const target = itemType === "product" ? productIds : companyIds;
        if (favorited) target.add(id);
        else target.delete(id);
        return { productIds, companyIds };
      });
      return favorited;
    } catch (err) {
      // Revert on failure
      set((s) => {
        const productIds = new Set(s.productIds);
        const companyIds = new Set(s.companyIds);
        if (itemType === "product") {
          was ? productIds.add(id) : productIds.delete(id);
        } else {
          was ? companyIds.add(id) : companyIds.delete(id);
        }
        return { productIds, companyIds };
      });
      throw err;
    }
  },

  reset: () =>
    set({ productIds: new Set(), companyIds: new Set(), loaded: false }),
}));
