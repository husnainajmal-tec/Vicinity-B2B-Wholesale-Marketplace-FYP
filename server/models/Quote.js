const mongoose = require("mongoose");

/**
 * Quote — a seller's offer in response to an RFQ.
 * A seller has at most one quote per RFQ (enforced by a compound unique
 * index); re-submitting updates the existing quote.
 *
 * `status` (added beyond the base spec so sellers can track outcomes and
 * buyers can accept/reject): submitted -> accepted | rejected.
 */
const quoteSchema = new mongoose.Schema(
  {
    rfqRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: [true, "rfqRef is required"],
      index: true,
    },
    sellerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "sellerRef is required"],
      index: true,
    },
    pricePerUnit: {
      type: Number,
      required: [true, "Price per unit is required"],
      min: [0.01, "Price per unit must be greater than 0"],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
      default: "",
    },
    deliveryEstimate: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["submitted", "accepted", "rejected"],
        message: "Invalid quote status",
      },
      default: "submitted",
      index: true,
    },
  },
  { timestamps: true }
);

// One quote per seller per RFQ.
quoteSchema.index({ rfqRef: 1, sellerRef: 1 }, { unique: true });

module.exports = mongoose.model("Quote", quoteSchema);
