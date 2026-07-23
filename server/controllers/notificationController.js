const Notification = require("../models/Notification");

const RECENT_LIMIT = 20;

/**
 * GET /api/notifications
 * Recent notifications for the current user + unread count.
 */
const getMyNotifications = async (req, res) => {
  try {
    const filter = { userRef: req.user._id };
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(RECENT_LIMIT)
        .lean(),
      Notification.countDocuments({ ...filter, isRead: false }),
    ]);

    return res
      .status(200)
      .json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load notifications" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read (owner only).
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    if (notification.userRef.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    return res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update notification" });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all of the current user's notifications as read.
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userRef: req.user._id, isRead: false },
      { isRead: true }
    );
    return res.status(200).json({ success: true, data: { ok: true } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to mark notifications as read" });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
