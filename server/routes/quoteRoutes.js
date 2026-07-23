const express = require("express");
const {
  getMyQuotes,
  setQuoteStatus,
} = require("../controllers/quoteController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, authorize("seller"), getMyQuotes);
router.patch("/:id/status", protect, authorize("buyer"), setQuoteStatus);

module.exports = router;
