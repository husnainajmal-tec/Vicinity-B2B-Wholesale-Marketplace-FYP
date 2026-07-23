const mongoose = require("mongoose");

/**
 * Message — belongs to a Conversation.
 * type "text": a normal chat message.
 * type "offer": a structured custom offer rendered as an offer card, which
 * a buyer can accept to pre-fill the order flow (Phase 7).
 */
const messageSchema = new mongoose.Schema(
  {
    conversationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "conversationRef is required"],
      index: true,
    },
    senderRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "senderRef is required"],
    },
    text: {
      type: String,
      trim: true,
      maxlength: [4000, "Message cannot exceed 4000 characters"],
      default: "",
    },
    type: {
      type: String,
      enum: {
        values: ["text", "offer"],
        message: "type must be text or offer",
      },
      default: "text",
    },
    offerDetails: {
      pricePerUnit: { type: Number, min: 0 },
      quantity: { type: Number, min: 1 },
      notes: { type: String, trim: true, default: "" },
    },
    readBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
