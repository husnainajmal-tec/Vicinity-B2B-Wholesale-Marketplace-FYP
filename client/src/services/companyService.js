import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

/** Get the current user's company profile (null if not created yet). */
export const getMyCompany = async () => {
  try {
    const { data } = await api.get("/company/me");
    return data.data.profile;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Create the current user's company profile. */
export const createCompany = async (payload) => {
  try {
    const { data } = await api.post("/company", payload);
    return data.data.profile;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Update the current user's company profile. */
export const updateCompany = async (payload) => {
  try {
    const { data } = await api.put("/company", payload);
    return data.data.profile;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** A small set of verified companies for the homepage trust section. */
export const getVerifiedCompanies = async (limit = 4) => {
  try {
    const { data } = await api.get("/company/verified", { params: { limit } });
    return data.data.companies;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Public company profile by id (includes owner + product listings). */
export const getPublicCompany = async (id) => {
  try {
    const { data } = await api.get(`/company/${id}`);
    return data.data; // { profile, products, ratings }
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Upload/replace the company logo (multipart). */
export const uploadLogo = async (file) => {
  try {
    const form = new FormData();
    form.append("logo", file);
    const { data } = await api.post("/company/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data.profile;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Upload one or more verification documents (multipart). */
export const uploadDocs = async (files) => {
  try {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("docs", f));
    const { data } = await api.post("/company/docs", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data.profile;
  } catch (error) {
    throw new Error(extractError(error));
  }
};
