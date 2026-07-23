const express = require("express");
const {
  getMyProfile,
  createProfile,
  updateProfile,
  getVerifiedCompanies,
  getPublicProfile,
  uploadLogo,
  uploadDocs,
} = require("../controllers/companyController");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

// --- Authenticated owner routes ---------------------------------------
router.get("/me", protect, getMyProfile);
router.post("/", protect, createProfile);
router.put("/", protect, updateProfile);
router.post("/logo", protect, upload.single("logo"), uploadLogo);
router.post("/docs", protect, upload.array("docs", 5), uploadDocs);

// --- Public routes (specific paths before the dynamic "/:id") ---------
router.get("/verified", getVerifiedCompanies);
router.get("/:id", getPublicProfile);

module.exports = router;
