import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

/** Id sets for heart-toggle state. */
export const getFavoriteIds = async () => {
  try {
    const { data } = await api.get("/favorites/ids");
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Full watchlist for My Favorites page. */
export const getFavorites = async () => {
  try {
    const { data } = await api.get("/favorites");
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Toggle a product or company favorite. Returns { favorited }. */
export const toggleFavorite = async ({ itemType, itemRef }) => {
  try {
    const { data } = await api.post("/favorites/toggle", { itemType, itemRef });
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};
