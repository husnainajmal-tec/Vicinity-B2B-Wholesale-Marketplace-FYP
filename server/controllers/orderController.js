const Order = require("../models/Order");
const Product = require("../models/Product");
const RFQ = require("../models/RFQ");
const createNotification = require("../utils/createNotification");

const ORDER_STATUS_LABELS = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

/**
 * Resolve the applicable tier price for a quantity, or null if below MOQ /
 * outside all tiers.
 */
const resolveTierPrice = (product, qty) => {
  if (qty < product.moq) return null;
  const tier = product.pricingTiers.find((t) => {
    const min = t.minQty;
    const max = t.maxQty == null ? Infinity : t.maxQty;
    return qty >= min && qty <= max;
  });
  return tier ? tier.pricePerUnit : null;
};

/**
 * POST /api/orders  (buyer)
 * Create an order from a product page or an accepted offer.
 * Body: { productRef?, rfqRef?, sellerRef?, quantity, agreedPricePerUnit?,
 *         shippingAddress, paymentMethod? }
 */
const createOrder = async (req, res) => {
  try {
    const {
      productRef,
      rfqRef,
      quantity,
      agreedPricePerUnit,
      shippingAddress,
    } = req.body;
    let { sellerRef } = req.body;

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      return res
        .status(400)
        .json({ success: false, message: "A valid quantity is required" });
    }
    if (!shippingAddress || !shippingAddress.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Shipping address is required" });
    }
    if (!productRef && !rfqRef) {
      return res.status(400).json({
        success: false,
        message: "An order must reference a product or an RFQ",
      });
    }

    let price = agreedPricePerUnit != null ? Number(agreedPricePerUnit) : null;
    let product = null;

    if (productRef) {
      product = await Product.findById(productRef);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      // Respect MOQ.
      if (qty < product.moq) {
        return res.status(400).json({
          success: false,
          message: `Quantity is below the MOQ of ${product.moq}`,
        });
      }
      sellerRef = product.sellerRef.toString();
      // If no negotiated price supplied, use the applicable tier price.
      if (price == null) {
        price = resolveTierPrice(product, qty);
        if (price == null) {
          return res.status(400).json({
            success: false,
            message: "No pricing tier applies to this quantity",
          });
        }
      }
    }

    if (rfqRef) {
      const rfq = await RFQ.findById(rfqRef);
      if (!rfq) {
        return res
          .status(404)
          .json({ success: false, message: "RFQ not found" });
      }
      if (rfq.buyerRef.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only order from your own RFQ",
        });
      }
    }

    if (!sellerRef) {
      return res
        .status(400)
        .json({ success: false, message: "Seller could not be determined" });
    }
    if (sellerRef === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot order from yourself" });
    }
    if (price == null || price <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "A valid agreed price is required" });
    }

    const order = await Order.create({
      buyerRef: req.user._id,
      sellerRef,
      productRef: productRef || null,
      rfqRef: rfqRef || null,
      quantity: qty,
      agreedPricePerUnit: price,
      totalAmount: Number((price * qty).toFixed(2)),
      shippingAddress: shippingAddress.trim(),
      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "pending_payment",
      statusHistory: [{ status: "pending_payment", timestamp: new Date() }],
    });

    // Auto-close the RFQ once an order is placed from it (Phase 5 rule).
    if (rfqRef) {
      await RFQ.findByIdAndUpdate(rfqRef, { status: "closed" });
    }

    return res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create order" });
  }
};

/** Populate helper for order lists/detail. */
const ORDER_POPULATE = [
  { path: "buyerRef", select: "name email phone" },
  { path: "sellerRef", select: "name email phone" },
  { path: "productRef", select: "title images" },
  { path: "rfqRef", select: "title" },
];

/**
 * GET /api/orders/mine  (buyer)
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerRef: req.user._id })
      .populate(ORDER_POPULATE)
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: { orders } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load your orders" });
  }
};

/**
 * GET /api/orders/received  (seller)
 */
const getReceivedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ sellerRef: req.user._id })
      .populate(ORDER_POPULATE)
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: { orders } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load received orders" });
  }
};

/**
 * GET /api/orders/:id  (participant)
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    const uid = req.user._id.toString();
    const isParticipant =
      order.buyerRef._id.toString() === uid ||
      order.sellerRef._id.toString() === uid;
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load order" });
  }
};

// Allowed forward transitions for the seller.
const FORWARD = {
  pending_payment: ["processing", "shipped"],
  processing: ["shipped"],
  shipped: ["delivered"],
};

/**
 * GET /api/orders/settlement/summary  (seller)
 * Settlement ledger: orders + pending vs paid totals (mock COD — no gateway).
 */
const getSettlementSummary = async (req, res) => {
  try {
    const orders = await Order.find({
      sellerRef: req.user._id,
      status: { $ne: "cancelled" },
    })
      .populate(ORDER_POPULATE)
      .sort({ createdAt: -1 })
      .lean();

    let pendingTotal = 0;
    let paidTotal = 0;
    for (const o of orders) {
      if (o.paymentStatus === "paid") paidTotal += o.totalAmount;
      else if (o.paymentStatus === "pending") pendingTotal += o.totalAmount;
    }

    return res.status(200).json({
      success: true,
      data: {
        orders,
        summary: {
          pendingTotal: Number(pendingTotal.toFixed(2)),
          paidTotal: Number(paidTotal.toFixed(2)),
        },
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load settlement summary" });
  }
};

/**
 * PATCH /api/orders/:id/status  (seller)
 * Move the order forward: processing -> shipped -> delivered.
 * COD payment stays pending until seller confirms via markPaymentReceived.
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    if (order.sellerRef.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can update this order's status",
      });
    }
    if (order.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Cancelled orders cannot change" });
    }

    const allowed = FORWARD[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move from ${order.status} to ${status}`,
      });
    }

    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date() });
    await order.save();

    try {
      const label = ORDER_STATUS_LABELS[status] || status;
      await createNotification({
        userRef: order.buyerRef,
        type: "order_status_change",
        message: `Your order is now ${label}`,
        linkTo: `/orders/${order._id}`,
      });
    } catch (_) {
      /* non-blocking */
    }

    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update order status" });
  }
};

/**
 * PATCH /api/orders/:id/payment-received  (seller)
 * Confirm COD collected — moves paymentStatus pending -> paid.
 */
const markPaymentReceived = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    if (order.sellerRef.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can confirm payment",
      });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Payment can only be confirmed after delivery",
      });
    }
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment is already marked as received",
      });
    }
    if (order.paymentStatus === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Refunded orders cannot be marked as paid",
      });
    }

    order.paymentStatus = "paid";
    await order.save();
    await order.populate(ORDER_POPULATE);

    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update payment status" });
  }
};

/**
 * PATCH /api/orders/:id/cancel  (buyer)
 * Cancel while still pending_payment.
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    if (order.buyerRef.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the buyer can cancel this order",
      });
    }
    if (order.status !== "pending_payment") {
      return res.status(400).json({
        success: false,
        message: "Orders can only be cancelled while pending payment",
      });
    }

    order.status = "cancelled";
    order.statusHistory.push({ status: "cancelled", timestamp: new Date() });
    await order.save();

    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel order" });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getReceivedOrders,
  getSettlementSummary,
  getOrderById,
  updateOrderStatus,
  markPaymentReceived,
  cancelOrder,
};
