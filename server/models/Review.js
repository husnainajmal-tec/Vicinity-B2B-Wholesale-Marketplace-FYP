const mongoose = require("mongoose");

const ratingField = {
  type: Number,
  required: [true, "Rating is required"],
  min: [1, "Rating must be at least 1"],
  max: [5, "Rating cannot exceed 5"],
};

/**
 * Review — tied to a delivered order (one per order).
 * Prevents fake reviews by requiring a completed purchase.
 */
const reviewSchema = new mongoose.Schema(
  {
    orderRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "orderRef is required"],
      unique: true,
      index: true,
    },
    buyerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "buyerRef is required"],
      index: true,
    },
    sellerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "sellerRef is required"],
      index: true,
    },
    ratings: {
      productQuality: ratingField,
      onTimeDelivery: ratingField,
      communication: ratingField,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

reviewSchema.index({ sellerRef: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
