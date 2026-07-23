const express = require("express");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("./authRoutes");
const companyRoutes = require("./companyRoutes");
const productRoutes = require("./productRoutes");
const rfqRoutes = require("./rfqRoutes");
const quoteRoutes = require("./quoteRoutes");
const conversationRoutes = require("./conversationRoutes");
const orderRoutes = require("./orderRoutes");
const notificationRoutes = require("./notificationRoutes");
const reviewRoutes = require("./reviewRoutes");
const adminRoutes = require("./adminRoutes");
const favoriteRoutes = require("./favoriteRoutes");

const router = express.Router();

/**
 * Root API router. Feature routers are mounted here as modules are built:
 *   router.use("/products", productRoutes);
 *   ...etc
 */
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/company", companyRoutes);
router.use("/products", productRoutes);
router.use("/rfqs", rfqRoutes);
router.use("/quotes", quoteRoutes);
router.use("/conversations", conversationRoutes);
router.use("/orders", orderRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);
router.use("/favorites", favoriteRoutes);

module.exports = router;
