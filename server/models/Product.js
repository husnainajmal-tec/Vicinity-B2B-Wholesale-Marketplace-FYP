const mongoose = require("mongoose");

/**
 * Product categories (shared enum). Keep in sync with the client's
 * category dropdown (client/src/constants/categories.js).
 */
const PRODUCT_CATEGORIES = [
  "Textiles & Apparel",
  "Electronics",
  "Food & Beverage",
  "Industrial & Machinery",
  "Packaging",
  "Construction Materials",
  "Health & Beauty",
  "Agriculture",
  "Home & Furniture",
  "Other",
];

/**
 * A single volume-pricing tier: buy between minQty and maxQty units at
 * pricePerUnit. The highest tier may leave maxQty null ("and above").
 */
const pricingTierSchema = new mongoose.Schema(
  {
    minQty: {
      type: Number,
      required: [true, "Tier minimum quantity is required"],
      min: [1, "Tier minimum quantity must be at least 1"],
    },
    maxQty: {
      type: Number,
      default: null, // null = open-ended (highest tier)
      min: [1, "Tier maximum quantity must be at least 1"],
    },
    pricePerUnit: {
      type: Number,
      required: [true, "Tier price per unit is required"],
      min: [0.01, "Price per unit must be greater than 0"],
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    sellerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "sellerRef is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [4000, "Description cannot exceed 4000 characters"],
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: "Invalid product category",
      },
    },
    images: {
      type: [String],
      default: [],
    },
    moq: {
      type: Number,
      required: [true, "MOQ (minimum order quantity) is required"],
      min: [1, "MOQ must be at least 1"],
    },
    pricingTiers: {
      type: [pricingTierSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 4,
        message: "A product must have between 2 and 4 pricing tiers",
      },
    },
    stockStatus: {
      type: String,
      enum: {
        values: ["in_stock", "low_stock", "out_of_stock"],
        message: "Invalid stock status",
      },
      default: "in_stock",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Full-text index for keyword search (title weighted higher than description).
productSchema.index(
  { title: "text", description: "text" },
  { weights: { title: 5, description: 1 }, name: "product_text_index" }
);

module.exports = mongoose.model("Product", productSchema);
module.exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
