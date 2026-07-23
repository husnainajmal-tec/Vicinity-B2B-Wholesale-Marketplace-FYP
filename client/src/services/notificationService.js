import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

/** Fetch recent notifications and unread count. */
export const getNotifications = async () => {
  try {
    const { data } = await api.get("/notifications");
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Mark a single notification as read. */
export const markNotificationRead = async (id) => {
  try {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data.notification;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Mark all notifications as read. */
export const markAllNotificationsRead = async () => {
  try {
    await api.patch("/notifications/read-all");
  } catch (error) {
    throw new Error(extractError(error));
  }
};
