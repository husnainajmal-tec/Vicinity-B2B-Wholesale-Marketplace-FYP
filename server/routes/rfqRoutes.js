const express = require("express");
const {
  createRFQ,
  listRFQs,
  getMyRFQs,
  getRFQById,
  closeRFQ,
} = require("../controllers/rfqController");
const { submitQuote } = require("../controllers/quoteController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// --- Buyer-owned / specific paths (before "/:id") ----------------------
router.post("/", protect, authorize("buyer"), createRFQ);
router.get("/mine", protect, authorize("buyer"), getMyRFQs);

// --- Public feed + detail ----------------------------------------------
router.get("/", listRFQs);
router.get("/:id", optionalAuth, getRFQById);

// --- Actions -----------------------------------------------------------
router.patch("/:id/close", protect, authorize("buyer"), closeRFQ);
router.post("/:id/quotes", protect, authorize("seller"), submitQuote);

module.exports = router;
