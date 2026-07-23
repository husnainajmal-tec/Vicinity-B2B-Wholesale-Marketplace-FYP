const express = require("express");
const {
  getStats,
  getPendingVerifications,
  reviewVerification,
  listUsers,
  setUserSuspended,
  listProducts,
  setProductActive,
  deleteProduct,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Every admin route requires a valid admin session.
router.use(protect, authorize("admin"));

router.get("/stats", getStats);

router.get("/verifications", getPendingVerifications);
router.patch("/verifications/:id", reviewVerification);

router.get("/users", listUsers);
router.patch("/users/:id/suspend", setUserSuspended);

router.get("/products", listProducts);
router.patch("/products/:id/active", setProductActive);
router.delete("/products/:id", deleteProduct);

module.exports = router;
