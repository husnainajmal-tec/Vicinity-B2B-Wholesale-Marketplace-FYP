const express = require("express");
const { createReview, getReviewForOrder } = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", authorize("buyer"), createReview);
router.get("/order/:orderId", getReviewForOrder);

module.exports = router;
