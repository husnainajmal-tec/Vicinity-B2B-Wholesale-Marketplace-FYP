import api from "./api";

const extractError = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

/** Get or create a conversation. Returns { conversation, context }. */
export const openConversation = async ({ contextType, contextRef, participantId }) => {
  try {
    const { data } = await api.post("/conversations", {
      contextType,
      contextRef,
      participantId,
    });
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** List the current user's conversations (with unread counts). */
export const getConversations = async () => {
  try {
    const { data } = await api.get("/conversations");
    return data.data.conversations;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Fetch messages for a conversation. Returns { conversation, messages, context }. */
export const getMessages = async (conversationId) => {
  try {
    const { data } = await api.get(`/conversations/${conversationId}/messages`);
    return data.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

/** Send a text or offer message. */
export const sendMessage = async (conversationId, payload) => {
  try {
    const { data } = await api.post(
      `/conversations/${conversationId}/messages`,
      payload
    );
    return data.data.message;
  } catch (error) {
    throw new Error(extractError(error));
  }
};
