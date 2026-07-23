import api from "./api";

/**
 * Auth API calls. Each returns the `data` object from the standard
 * { success, data } envelope, or throws with a friendly message.
 */
const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

export const registerRequest = async (payload) => {
  try {
    const { data } = await api.post("/auth/register", payload);
    return data.data; // { user, token }
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const loginRequest = async (payload) => {
  try {
    const { data } = await api.post("/auth/login", payload);
    return data.data; // { user, token }
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const getMeRequest = async () => {
  try {
    const { data } = await api.get("/auth/me");
    return data.data.user;
  } catch (error) {
    throw new Error(extractError(error));
  }
};
