const mongoose = require("mongoose");

/**
 * Conversation — a 1:1 thread between two users, anchored to a context
 * (a product or an RFQ). There is at most one conversation per
 * (participants pair + context).
 */
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: "A conversation must have exactly 2 participants",
      },
      index: true,
    },
    contextType: {
      type: String,
      enum: {
        values: ["product", "rfq"],
        message: "contextType must be product or rfq",
      },
      required: [true, "contextType is required"],
    },
    contextRef: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "contextRef is required"],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
