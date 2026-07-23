const CompanyProfile = require("../models/CompanyProfile");
const Product = require("../models/Product");
const { fileUrl } = require("../middleware/upload");
const { getSellerRatingSummary } = require("../utils/sellerRatings");

/**
 * Normalize incoming profile fields from the request body.
 * `certifications` may arrive as an array or a comma-separated string.
 * `location` may arrive as nested fields or flat city/region.
 */
const parseBody = (body) => {
  const data = {};
  if (body.companyName !== undefined) data.companyName = body.companyName;
  if (body.businessType !== undefined) data.businessType = body.businessType;
  if (body.description !== undefined) data.description = body.description;

  if (body.location || body.city || body.region) {
    data.location = {
      city: body.location?.city ?? body.city ?? "",
      region: body.location?.region ?? body.region ?? "",
    };
  }

  if (body.certifications !== undefined) {
    data.certifications = Array.isArray(body.certifications)
      ? body.certifications
      : String(body.certifications)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  }

  return data;
};

/**
 * GET /api/company/me
 * Return the authenticated user's company profile (or null if none yet).
 */
const getMyProfile = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ userRef: req.user._id });
    return res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load company profile" });
  }
};

/**
 * POST /api/company
 * Create the authenticated user's company profile (one per user).
 */
const createProfile = async (req, res) => {
  try {
    const existing = await CompanyProfile.findOne({ userRef: req.user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Company profile already exists. Use update instead.",
      });
    }

    const data = parseBody(req.body);
    const profile = await CompanyProfile.create({
      ...data,
      userRef: req.user._id,
    });

    return res.status(201).json({ success: true, data: { profile } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create company profile" });
  }
};

/**
 * PUT /api/company
 * Update the authenticated user's company profile.
 * Note: `isVerified` cannot be set here — only admins verify (Phase 10).
 */
const updateProfile = async (req, res) => {
  try {
    const data = parseBody(req.body);
    const profile = await CompanyProfile.findOneAndUpdate(
      { userRef: req.user._id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found. Create one first.",
      });
    }

    return res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update company profile" });
  }
};

/**
 * GET /api/company/verified  (public)
 * A small set of verified companies for the homepage trust section.
 * Sorted by most recently updated (proxy for "recently verified").
 * Query: ?limit (default 4, capped at 12).
 */
const getVerifiedCompanies = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 4, 1), 12);
    const companies = await CompanyProfile.find({ isVerified: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("companyName businessType logoUrl location isVerified");

    return res.status(200).json({ success: true, data: { companies } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load verified companies" });
  }
};

/**
 * GET /api/company/:id
 * Public company profile by profile id. Includes owner's name/role.
 * The verified badge is derived from `isVerified` on the client.
 */
const getPublicProfile = async (req, res) => {
  try {
    const profile = await CompanyProfile.findById(req.params.id).populate(
      "userRef",
      "name role"
    );

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // Active product listings for this company's owner.
    const products = await Product.find({
      sellerRef: profile.userRef?._id || profile.userRef,
      isActive: true,
    }).sort({ createdAt: -1 });

    const ratings = await getSellerRatingSummary(
      profile.userRef?._id || profile.userRef
    );

    return res
      .status(200)
      .json({ success: true, data: { profile, products, ratings } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load company" });
  }
};

/**
 * POST /api/company/logo   (multipart, field: "logo")
 * Upload/replace the company logo.
 */
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No logo file provided" });
    }

    const url = fileUrl(req, req.file);
    const profile = await CompanyProfile.findOneAndUpdate(
      { userRef: req.user._id },
      { $set: { logoUrl: url } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Create your company profile before uploading a logo",
      });
    }

    return res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload logo" });
  }
};

/**
 * POST /api/company/docs   (multipart, field: "docs", up to 5 files)
 * Append verification documents (reviewed manually by an admin).
 */
const uploadDocs = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No documents provided" });
    }

    const urls = req.files.map((f) => fileUrl(req, f));
    const profile = await CompanyProfile.findOneAndUpdate(
      { userRef: req.user._id },
      { $push: { verificationDocs: { $each: urls } } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Create your company profile before uploading documents",
      });
    }

    return res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload documents" });
  }
};

module.exports = {
  getMyProfile,
  createProfile,
  updateProfile,
  getVerifiedCompanies,
  getPublicProfile,
  uploadLogo,
  uploadDocs,
};
