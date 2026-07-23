const Notification = require("../models/Notification");
const { getIO } = require("../config/socket");

/**
 * Persist a notification and emit it to the recipient's personal Socket.io room.
 */
const createNotification = async ({ userRef, type, message, linkTo }) => {
  const notification = await Notification.create({
    userRef,
    type,
    message,
    linkTo,
    isRead: false,
  });

  try {
    const io = getIO();
    if (io) {
      const uid = userRef._id ? userRef._id.toString() : userRef.toString();
      io.to(`user:${uid}`).emit("newNotification", notification);
    }
  } catch (_) {
    // socket failures shouldn't break the caller
  }

  return notification;
};

module.exports = createNotification;
