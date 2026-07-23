const mongoose = require("mongoose");
const { PRODUCT_CATEGORIES } = require("./Product");

/**
 * RFQ (Request for Quotation) — a buyer's public buying lead.
 * Sellers respond with Quotes. An RFQ is `open` until the buyer closes it
 * (manually) or an order is placed from one of its quotes (Phase 7).
 */
const rfqSchema = new mongoose.Schema(
  {
    buyerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "buyerRef is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [4000, "Description cannot exceed 4000 characters"],
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: "Invalid category",
      },
    },
    quantityNeeded: {
      type: Number,
      required: [true, "Quantity needed is required"],
      min: [1, "Quantity must be at least 1"],
    },
    targetPrice: {
      type: Number,
      min: [0, "Target price cannot be negative"],
      default: null, // optional
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["open", "closed"],
        message: "Status must be open or closed",
      },
      default: "open",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RFQ", rfqSchema);
