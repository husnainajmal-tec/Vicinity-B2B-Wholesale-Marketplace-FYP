import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

/** Seller's own products (active + inactive). */
export const getMyProducts = async () => {
  try {
    const { data } = await api.get("/products/mine");
    return data.data.products;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Public product listing with optional { seller, category, q } filters. */
export const listProducts = async (params = {}) => {
  try {
    const { data } = await api.get("/products", { params });
    return data.data.products;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/**
 * Advanced search. Accepts { keyword, category, region, minPrice, maxPrice,
 * minMoq, maxMoq }. Empty/blank values are dropped before the request.
 */
export const searchProducts = async (filters = {}) => {
  try {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) params[k] = v;
    });
    const { data } = await api.get("/products/search", { params });
    return data.data; // { products, count }
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Active categories with listing counts: [{ category, count }]. */
export const getCategoryCounts = async () => {
  try {
    const { data } = await api.get("/products/categories");
    return data.data.categories;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Facet metadata for the search UI: { regions, priceRange, moqRange }. */
export const getSearchMeta = async () => {
  try {
    const { data } = await api.get("/products/meta");
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Public product detail — returns { product, company }. */
export const getProduct = async (id) => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const createProduct = async (payload) => {
  try {
    const { data } = await api.post("/products", payload);
    return data.data.product;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const updateProduct = async (id, payload) => {
  try {
    const { data } = await api.put(`/products/${id}`, payload);
    return data.data.product;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const deleteProduct = async (id) => {
  try {
    await api.delete(`/products/${id}`);
    return id;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const toggleProductActive = async (id) => {
  try {
    const { data } = await api.patch(`/products/${id}/toggle`);
    return data.data.product;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Upload one or more product images (multipart). */
export const uploadProductImages = async (id, files) => {
  try {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("images", f));
    const { data } = await api.post(`/products/${id}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data.product;
  } catch (error) {
    throw new Error(extractError(error));
  }
};
