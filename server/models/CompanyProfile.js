const mongoose = require("mongoose");

/**
 * CompanyProfile — a company/organization owned by a single User.
 * Sellers must complete this (and be verified by an admin) before their
 * listings are trusted. Buyers may also maintain a profile.
 *
 * Verification is manual: `isVerified` is only flipped to true by an admin
 * via the Admin Dashboard (Phase 10). There is no OCR/auto pipeline.
 */
const companyProfileSchema = new mongoose.Schema(
  {
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userRef is required"],
      unique: true, // one profile per user
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      minlength: [2, "Company name must be at least 2 characters"],
    },
    businessType: {
      type: String,
      enum: {
        values: ["Manufacturer", "Trader", "Distributor"],
        message: "Business type must be Manufacturer, Trader, or Distributor",
      },
      required: [true, "Business type is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    location: {
      city: { type: String, trim: true, default: "" },
      region: { type: String, trim: true, default: "" },
    },
    certifications: {
      type: [String], // labels or file URLs (e.g. "ISO 9001")
      default: [],
    },
    logoUrl: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Invalid verification status",
      },
      default: "pending", // admin review outcome (Phase 10)
    },
    verificationDocs: {
      type: [String], // uploaded document file URLs
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
