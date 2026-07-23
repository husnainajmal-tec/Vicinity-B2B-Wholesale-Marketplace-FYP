import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

/** Submit a review for a delivered order. */
export const createReview = async ({ orderRef, ratings, comment }) => {
  try {
    const { data } = await api.post("/reviews", { orderRef, ratings, comment });
    return data.data.review;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Get the review for an order (null if none). */
export const getReviewForOrder = async (orderId) => {
  try {
    const { data } = await api.get(`/reviews/order/${orderId}`);
    return data.data.review;
  } catch (error) {
    throw new Error(extractError(error));
  }
};
