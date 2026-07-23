import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

export const createOrder = async (payload) => {
  try {
    const { data } = await api.post("/orders", payload);
    return data.data.order;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const getMyOrders = async () => {
  try {
    const { data } = await api.get("/orders/mine");
    return data.data.orders;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const getReceivedOrders = async () => {
  try {
    const { data } = await api.get("/orders/received");
    return data.data.orders;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const getOrder = async (id) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data.data.order;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data.data.order;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const cancelOrder = async (id) => {
  try {
    const { data } = await api.patch(`/orders/${id}/cancel`);
    return data.data.order;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Seller settlement ledger (orders + pending/paid totals). */
export const getSettlementSummary = async () => {
  try {
    const { data } = await api.get("/orders/settlement/summary");
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Seller confirms COD payment received (delivered orders only). */
export const markPaymentReceived = async (id) => {
  try {
    const { data } = await api.patch(`/orders/${id}/payment-received`);
    return data.data.order;
  } catch (error) {
    throw new Error(extractError(error));
  }
};
