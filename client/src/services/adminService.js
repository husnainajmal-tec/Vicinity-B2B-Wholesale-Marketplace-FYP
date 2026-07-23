import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

/** Platform overview totals. */
export const getStats = async () => {
  try {
    const { data } = await api.get("/admin/stats");
    return data.data.stats;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Company profiles awaiting verification. */
export const getVerifications = async () => {
  try {
    const { data } = await api.get("/admin/verifications");
    return data.data.verifications;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Approve or reject a verification. action: "approve" | "reject". */
export const reviewVerification = async (id, action) => {
  try {
    const { data } = await api.patch(`/admin/verifications/${id}`, { action });
    return data.data.profile;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Users table (optional { q, role }). */
export const getUsers = async (params = {}) => {
  try {
    const { data } = await api.get("/admin/users", { params });
    return data.data.users;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Suspend or reactivate a user. */
export const setUserSuspended = async (id, suspended) => {
  try {
    const { data } = await api.patch(`/admin/users/${id}/suspend`, {
      suspended,
    });
    return data.data.user;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Products table (optional { q, category, active }). */
export const getProducts = async (params = {}) => {
  try {
    const { data } = await api.get("/admin/products", { params });
    return data.data.products;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Show or hide a listing. */
export const setProductActive = async (id, active) => {
  try {
    const { data } = await api.patch(`/admin/products/${id}/active`, { active });
    return data.data.product;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Permanently remove a listing. */
export const deleteProduct = async (id) => {
  try {
    await api.delete(`/admin/products/${id}`);
  } catch (error) {
    throw new Error(extractError(error));
  }
};
