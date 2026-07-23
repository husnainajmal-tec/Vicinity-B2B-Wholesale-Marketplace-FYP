const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Product = require("../models/Product");
const RFQ = require("../models/RFQ");
const { getIO } = require("../config/socket");
const createNotification = require("../utils/createNotification");

/**
 * Resolve a short context summary (title) for a conversation header.
 */
const getContextSummary = async (contextType, contextRef) => {
  if (contextType === "product") {
    const p = await Product.findById(contextRef).select("title");
    return { type: "product", ref: contextRef, title: p?.title || "Product" };
  }
  if (contextType === "rfq") {
    const r = await RFQ.findById(contextRef).select("title");
    return { type: "rfq", ref: contextRef, title: r?.title || "RFQ" };
  }
  return { type: contextType, ref: contextRef, title: "" };
};

/**
 * POST /api/conversations
 * Get an existing conversation or create one.
 * Body: { contextType, contextRef, participantId? }
 *  - For "product" the other participant is derived from the seller.
 *  - For "rfq" a participantId is required (the other party).
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const { contextType, contextRef } = req.body;
    let { participantId } = req.body;

    if (!contextType || !contextRef) {
      return res.status(400).json({
        success: false,
        message: "contextType and contextRef are required",
      });
    }

    // Derive the other participant when possible.
    if (contextType === "product") {
      const product = await Product.findById(contextRef).select("sellerRef");
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      participantId = product.sellerRef.toString();
    }

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "participantId is required for this conversation",
      });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a conversation with yourself",
      });
    }

    // Find existing (same pair + same context).
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
      contextType,
      contextRef,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, participantId],
        contextType,
        contextRef,
        lastMessageAt: new Date(),
      });
    }

    await conversation.populate("participants", "name role");
    const context = await getContextSummary(contextType, contextRef);

    return res
      .status(200)
      .json({ success: true, data: { conversation, context } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to open conversation" });
  }
};

/**
 * GET /api/conversations
 * List the current user's conversations with last message + unread count.
 */
const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name role")
      .sort({ lastMessageAt: -1 })
      .lean();

    const enriched = await Promise.all(
      conversations.map(async (c) => {
        const lastMessage = await Message.findOne({ conversationRef: c._id })
          .sort({ createdAt: -1 })
          .lean();
        const unreadCount = await Message.countDocuments({
          conversationRef: c._id,
          senderRef: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
        });
        const other = c.participants.find(
          (p) => p._id.toString() !== req.user._id.toString()
        );
        const context = await getContextSummary(c.contextType, c.contextRef);
        return { ...c, lastMessage, unreadCount, other, context };
      })
    );

    return res
      .status(200)
      .json({ success: true, data: { conversations: enriched } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load conversations" });
  }
};

/**
 * Ensure the current user is a participant of the conversation.
 */
const loadParticipantConversation = async (req, res) => {
  const conversation = await Conversation.findById(req.params.id).populate(
    "participants",
    "name role"
  );
  if (!conversation) {
    res.status(404).json({ success: false, message: "Conversation not found" });
    return null;
  }
  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    res.status(403).json({ success: false, message: "Access denied" });
    return null;
  }
  return conversation;
};

/**
 * GET /api/conversations/:id/messages
 * Return messages (oldest first) and mark unread ones as read.
 */
const getMessages = async (req, res) => {
  try {
    const conversation = await loadParticipantConversation(req, res);
    if (!conversation) return;

    const messages = await Message.find({ conversationRef: conversation._id })
      .populate("senderRef", "name role")
      .sort({ createdAt: 1 })
      .lean();

    // Mark everything from the other party as read.
    await Message.updateMany(
      {
        conversationRef: conversation._id,
        senderRef: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    const context = await getContextSummary(
      conversation.contextType,
      conversation.contextRef
    );

    return res
      .status(200)
      .json({ success: true, data: { conversation, messages, context } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load messages" });
  }
};

/**
 * POST /api/conversations/:id/messages
 * Send a message (text or offer). Broadcasts via Socket.io.
 * Body: { text, type, offerDetails }
 */
const sendMessage = async (req, res) => {
  try {
    const conversation = await loadParticipantConversation(req, res);
    if (!conversation) return;

    const { text, type = "text", offerDetails } = req.body;

    if (type === "text" && (!text || !text.trim())) {
      return res
        .status(400)
        .json({ success: false, message: "Message text is required" });
    }
    if (type === "offer") {
      if (!offerDetails?.pricePerUnit || !offerDetails?.quantity) {
        return res.status(400).json({
          success: false,
          message: "Offer requires price per unit and quantity",
        });
      }
    }

    let message = await Message.create({
      conversationRef: conversation._id,
      senderRef: req.user._id,
      text: text || "",
      type,
      offerDetails: type === "offer" ? offerDetails : undefined,
      readBy: [req.user._id], // sender has read their own message
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    message = await message.populate("senderRef", "name role");

    // --- Real-time broadcast ---
    try {
      const io = getIO();
      if (io) {
        io.to(`conversation:${conversation._id}`).emit("newMessage", message);
        // Notify each participant's personal room (inbox refresh / unread).
        conversation.participants.forEach((p) => {
          io.to(`user:${p._id || p}`).emit("conversationUpdated", {
            conversationId: conversation._id,
          });
        });
      }
    } catch (_) {
      // socket failures shouldn't break the REST response
    }

    // Notify the other participant(s).
    try {
      const preview =
        type === "offer"
          ? "sent you an offer"
          : text.trim().length > 60
            ? `${text.trim().slice(0, 60)}…`
            : text.trim();
      for (const p of conversation.participants) {
        const pid = (p._id || p).toString();
        if (pid === req.user._id.toString()) continue;
        await createNotification({
          userRef: pid,
          type: "new_message",
          message: `${req.user.name}: ${preview}`,
          linkTo: `/chat/${conversation._id}`,
        });
      }
    } catch (_) {
      /* non-blocking */
    }

    return res.status(201).json({ success: true, data: { message } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to send message" });
  }
};

module.exports = {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
};
