import axios from "axios";

/**
 * Shared Axios instance for the Vicinity Trade API.
 * The auth token (set in later phases) will be attached via an interceptor.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Attach JWT from storage on every request (populated after login in Phase 1).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
