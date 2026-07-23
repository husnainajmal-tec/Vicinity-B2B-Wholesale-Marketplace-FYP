const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "new_quote",
  "new_message",
  "order_status_change",
  "rfq_response",
];

/**
 * In-app notification delivered to a single user.
 * Emitted in real time via Socket.io `newNotification` on `user:<userId>`.
 */
const notificationSchema = new mongoose.Schema(
  {
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userRef is required"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: `type must be one of: ${NOTIFICATION_TYPES.join(", ")}`,
      },
      required: [true, "type is required"],
    },
    message: {
      type: String,
      required: [true, "message is required"],
      trim: true,
      maxlength: [500, "message cannot exceed 500 characters"],
    },
    linkTo: {
      type: String,
      required: [true, "linkTo is required"],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userRef: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
