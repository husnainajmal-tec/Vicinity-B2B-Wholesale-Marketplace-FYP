const express = require("express");
const {
  getFavoriteIds,
  getMyFavorites,
  toggleFavorite,
} = require("../controllers/favoriteController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("buyer"));

router.get("/ids", getFavoriteIds);
router.get("/", getMyFavorites);
router.post("/toggle", toggleFavorite);

module.exports = router;
