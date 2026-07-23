const express = require("express");
const {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require("../controllers/conversationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // all chat routes require auth

router.post("/", getOrCreateConversation);
router.get("/", getMyConversations);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);

module.exports = router;
