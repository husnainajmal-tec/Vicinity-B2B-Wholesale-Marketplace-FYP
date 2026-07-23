const express = require("express");
const {
  createOrder,
  getMyOrders,
  getReceivedOrders,
  getSettlementSummary,
  getOrderById,
  updateOrderStatus,
  markPaymentReceived,
  cancelOrder,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // all order routes require auth

router.post("/", authorize("buyer"), createOrder);
router.get("/mine", authorize("buyer"), getMyOrders);
router.get("/received", authorize("seller"), getReceivedOrders);
router.get("/settlement/summary", authorize("seller"), getSettlementSummary);
router.get("/:id", getOrderById);
router.patch("/:id/status", authorize("seller"), updateOrderStatus);
router.patch("/:id/payment-received", authorize("seller"), markPaymentReceived);
router.patch("/:id/cancel", authorize("buyer"), cancelOrder);

module.exports = router;
