const express = require("express");
const {
  getMyProducts,
  listProducts,
  searchProducts,
  getSearchMeta,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleActive,
  uploadImages,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

// --- Seller-owned routes (specific paths before "/:id") ----------------
router.get("/mine", protect, authorize("seller"), getMyProducts);
router.post("/", protect, authorize("seller"), createProduct);
router.post(
  "/:id/images",
  protect,
  authorize("seller"),
  upload.array("images", 6),
  uploadImages
);
router.put("/:id", protect, authorize("seller"), updateProduct);
router.patch("/:id/toggle", protect, authorize("seller"), toggleActive);
router.delete("/:id", protect, authorize("seller"), deleteProduct);

// --- Public routes -----------------------------------------------------
// Static paths must come before the dynamic "/:id".
router.get("/search", searchProducts);
router.get("/meta", getSearchMeta);
router.get("/categories", getCategories);
router.get("/", listProducts);
router.get("/:id", getProductById);

module.exports = router;
