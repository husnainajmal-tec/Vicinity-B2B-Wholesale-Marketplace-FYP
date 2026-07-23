const mongoose = require("mongoose");

const ORDER_STATUSES = [
  "pending_payment",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/**
 * Order — a confirmed purchase between a buyer and a seller, created from
 * an accepted chat offer or directly from a product page.
 *
 * `statusHistory` records every transition for the visual timeline.
 * Payment is COD only (no gateway). Sellers confirm collection via
 * `paymentStatus: pending → paid` after delivery (Phase 12).
 */
const orderSchema = new mongoose.Schema(
  {
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
    productRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    rfqRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    agreedPricePerUnit: {
      type: Number,
      required: [true, "Agreed price per unit is required"],
      min: [0.01, "Price per unit must be greater than 0"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },
    status: {
      type: String,
      enum: { values: ORDER_STATUSES, message: "Invalid order status" },
      default: "pending_payment",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: { values: ["cod"], message: "Only COD is supported" },
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "refunded"],
        message: "Invalid payment status",
      },
      default: "pending",
    },
    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true,
    },
    statusHistory: {
      type: [
        {
          status: { type: String, enum: ORDER_STATUSES },
          timestamp: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
