import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

// ---- RFQs -------------------------------------------------------------

export const createRFQ = async (payload) => {
  try {
    const { data } = await api.post("/rfqs", payload);
    return data.data.rfq;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Public feed / seller browse. Filters: { category, status }. */
export const listRFQs = async (filters = {}) => {
  try {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v != null) params[k] = v;
    });
    const { data } = await api.get("/rfqs", { params });
    return data.data.rfqs;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Buyer's own RFQs, each with quotes attached. */
export const getMyRFQs = async () => {
  try {
    const { data } = await api.get("/rfqs/mine");
    return data.data.rfqs;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** RFQ detail — returns { rfq, quotes, myQuote }. */
export const getRFQ = async (id) => {
  try {
    const { data } = await api.get(`/rfqs/${id}`);
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const closeRFQ = async (id) => {
  try {
    const { data } = await api.patch(`/rfqs/${id}/close`);
    return data.data.rfq;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

// ---- Quotes -----------------------------------------------------------

export const submitQuote = async (rfqId, payload) => {
  try {
    const { data } = await api.post(`/rfqs/${rfqId}/quotes`, payload);
    return data.data.quote;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const getMyQuotes = async () => {
  try {
    const { data } = await api.get("/quotes/mine");
    return data.data.quotes;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Buyer accepts/rejects a quote. status: "accepted" | "rejected". */
export const setQuoteStatus = async (quoteId, status) => {
  try {
    const { data } = await api.patch(`/quotes/${quoteId}/status`, { status });
    return data.data.quote;
  } catch (error) {
    throw new Error(extractError(error));
  }
};
