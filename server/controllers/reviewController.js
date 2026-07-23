const Order = require("../models/Order");
const Review = require("../models/Review");

const RATING_KEYS = ["productQuality", "onTimeDelivery", "communication"];

const parseRatings = (body) => {
  const ratings = body.ratings || body;
  const parsed = {};
  for (const key of RATING_KEYS) {
    const val = Number(ratings[key]);
    if (!val || val < 1 || val > 5 || !Number.isInteger(val)) {
      return { error: `${key} must be an integer from 1 to 5` };
    }
    parsed[key] = val;
  }
  return { ratings: parsed };
};

/**
 * POST /api/reviews  (buyer)
 * Leave a review on a delivered order (one per order).
 */
const createReview = async (req, res) => {
  try {
    const { orderRef, comment } = req.body;
    if (!orderRef) {
      return res
        .status(400)
        .json({ success: false, message: "orderRef is required" });
    }

    const { ratings, error } = parseRatings(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const order = await Order.findById(orderRef);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    if (order.buyerRef.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own orders",
      });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Reviews are only allowed on delivered orders",
      });
    }

    const existing = await Review.findOne({ orderRef: order._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this order",
      });
    }

    const review = await Review.create({
      orderRef: order._id,
      buyerRef: order.buyerRef,
      sellerRef: order.sellerRef,
      ratings,
      comment: comment?.trim() || "",
    });

    await review.populate("buyerRef", "name");

    return res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this order",
      });
    }
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit review" });
  }
};

/**
 * GET /api/reviews/order/:orderId  (order participant)
 * Returns the review for an order, or null if none yet.
 */
const getReviewForOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    const uid = req.user._id.toString();
    const isParticipant =
      order.buyerRef.toString() === uid ||
      order.sellerRef.toString() === uid;
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const review = await Review.findOne({ orderRef: order._id })
      .populate("buyerRef", "name")
      .lean();

    return res.status(200).json({ success: true, data: { review } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load review" });
  }
};

module.exports = { createReview, getReviewForOrder };
