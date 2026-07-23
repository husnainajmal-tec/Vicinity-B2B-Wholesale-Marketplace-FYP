const Product = require("../models/Product");
const CompanyProfile = require("../models/CompanyProfile");
const validateTiers = require("../utils/validateTiers");
const { fileUrl } = require("../middleware/upload");

/**
 * Parse and coerce product fields from the request body.
 * pricingTiers may arrive as an array (JSON) or a JSON string (multipart).
 */
const parseProductBody = (body) => {
  const data = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.category !== undefined) data.category = body.category;
  if (body.stockStatus !== undefined) data.stockStatus = body.stockStatus;
  if (body.moq !== undefined) data.moq = Number(body.moq);

  if (body.pricingTiers !== undefined) {
    data.pricingTiers =
      typeof body.pricingTiers === "string"
        ? JSON.parse(body.pricingTiers)
        : body.pricingTiers;
  }
  return data;
};

/**
 * GET /api/products/mine  (seller)
 * List the authenticated seller's products (active + inactive).
 */
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerRef: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, data: { products } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load your products" });
  }
};

/**
 * GET /api/products  (public)
 * Basic listing with optional ?seller, ?category, ?q filters.
 * (Full search/discovery arrives in Phase 4.)
 */
const listProducts = async (req, res) => {
  try {
    const { seller, category, q } = req.query;
    const filter = { isActive: true };
    if (seller) filter.sellerRef = seller;
    if (category) filter.category = category;
    if (q) filter.title = { $regex: q, $options: "i" };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: { products } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load products" });
  }
};

/**
 * GET /api/products/search  (public)
 * Advanced discovery. Supported query params:
 *   keyword                  full-text search on title/description
 *   category                 exact category
 *   region                   CompanyProfile.location.region of the seller
 *   minPrice / maxPrice      bounds on the product's lowest tier price
 *   minMoq / maxMoq          bounds on MOQ
 *
 * Uses an aggregation pipeline so we can filter by the joined company's
 * region and by a computed lowest tier price.
 */
const searchProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      region,
      minPrice,
      maxPrice,
      minMoq,
      maxMoq,
    } = req.query;

    const pipeline = [];

    // $text must be the first stage when used.
    const hasKeyword = keyword && keyword.trim().length > 0;
    if (hasKeyword) {
      pipeline.push({ $match: { $text: { $search: keyword.trim() } } });
    }

    // Base match on the product itself.
    const baseMatch = { isActive: true };
    if (category) {
      // Accept a single category or a comma-separated list (checkbox filter).
      const cats = String(category)
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cats.length === 1) baseMatch.category = cats[0];
      else if (cats.length > 1) baseMatch.category = { $in: cats };
    }

    const moqRange = {};
    if (minMoq !== undefined && minMoq !== "") moqRange.$gte = Number(minMoq);
    if (maxMoq !== undefined && maxMoq !== "") moqRange.$lte = Number(maxMoq);
    if (Object.keys(moqRange).length) baseMatch.moq = moqRange;

    pipeline.push({ $match: baseMatch });

    // Lowest tier price for price-range filtering + display.
    pipeline.push({
      $addFields: { minPrice: { $min: "$pricingTiers.pricePerUnit" } },
    });

    const priceRange = {};
    if (minPrice !== undefined && minPrice !== "")
      priceRange.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== "")
      priceRange.$lte = Number(maxPrice);
    if (Object.keys(priceRange).length)
      pipeline.push({ $match: { minPrice: priceRange } });

    // Join the seller's company (for region + card display).
    pipeline.push({
      $lookup: {
        from: "companyprofiles",
        localField: "sellerRef",
        foreignField: "userRef",
        as: "company",
      },
    });
    pipeline.push({
      $unwind: { path: "$company", preserveNullAndEmptyArrays: true },
    });

    if (region) pipeline.push({ $match: { "company.location.region": region } });

    // Sort: by text relevance when searching, else newest first.
    if (hasKeyword) {
      pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
      pipeline.push({ $sort: { score: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Trim the company sub-doc to what the client needs.
    pipeline.push({
      $project: {
        title: 1,
        description: 1,
        category: 1,
        images: 1,
        moq: 1,
        pricingTiers: 1,
        stockStatus: 1,
        isActive: 1,
        createdAt: 1,
        minPrice: 1,
        company: {
          _id: "$company._id",
          companyName: "$company.companyName",
          isVerified: "$company.isVerified",
          location: "$company.location",
        },
      },
    });

    const products = await Product.aggregate(pipeline);
    return res
      .status(200)
      .json({ success: true, data: { products, count: products.length } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Search failed" });
  }
};

/**
 * GET /api/products/meta  (public)
 * Facet data for the search UI: available regions, and price/MOQ bounds.
 */
const getSearchMeta = async (req, res) => {
  try {
    const CompanyProfile = require("../models/CompanyProfile");

    const regions = (
      await CompanyProfile.distinct("location.region")
    ).filter((r) => r && r.trim().length > 0);

    const [bounds] = await Product.aggregate([
      { $match: { isActive: true } },
      { $addFields: { minPrice: { $min: "$pricingTiers.pricePerUnit" } } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$minPrice" },
          maxPrice: { $max: "$minPrice" },
          minMoq: { $min: "$moq" },
          maxMoq: { $max: "$moq" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        regions: regions.sort(),
        priceRange: {
          min: bounds?.minPrice ?? 0,
          max: bounds?.maxPrice ?? 0,
        },
        moqRange: {
          min: bounds?.minMoq ?? 0,
          max: bounds?.maxMoq ?? 0,
        },
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load search metadata" });
  }
};

/**
 * GET /api/products/categories  (public)
 * Distinct categories among active listings, each with its active count.
 * Sorted by count desc (most active first), then name. Powers the
 * homepage "Browse by Category" grid.
 */
const getCategories = async (req, res) => {
  try {
    const rows = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);

    const categories = rows
      .filter((r) => r._id) // guard against null categories
      .map((r) => ({ category: r._id, count: r.count }));

    return res.status(200).json({ success: true, data: { categories } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load categories" });
  }
};

/**
 * GET /api/products/:id  (public)
 * Product detail + a light seller/company summary for the detail page.
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "sellerRef",
      "name role"
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Attach a small company summary (for "Message Seller" + verified badge).
    const company = await CompanyProfile.findOne({
      userRef: product.sellerRef?._id,
    }).select("companyName isVerified logoUrl location");

    return res
      .status(200)
      .json({ success: true, data: { product, company } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load product" });
  }
};

/**
 * POST /api/products  (seller)
 * Create a product. Validates tiers vs MOQ and non-overlap.
 */
const createProduct = async (req, res) => {
  try {
    const data = parseProductBody(req.body);

    if (!data.title || !data.category || data.moq === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and MOQ are required",
      });
    }

    const check = validateTiers(data.pricingTiers, data.moq);
    if (!check.valid) {
      return res.status(400).json({ success: false, message: check.message });
    }

    const product = await Product.create({
      ...data,
      pricingTiers: check.tiers, // normalized + sorted
      sellerRef: req.user._id,
    });

    return res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create product" });
  }
};

/**
 * Fetch a product and ensure it belongs to the requesting seller.
 * Returns { product } or sends the appropriate error response.
 */
const findOwnedProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404).json({ success: false, message: "Product not found" });
    return null;
  }
  if (product.sellerRef.toString() !== req.user._id.toString()) {
    res.status(403).json({
      success: false,
      message: "You can only modify your own products",
    });
    return null;
  }
  return product;
};

/**
 * PUT /api/products/:id  (seller, owner)
 */
const updateProduct = async (req, res) => {
  try {
    const product = await findOwnedProduct(req, res);
    if (!product) return;

    const data = parseProductBody(req.body);

    // Re-validate tiers if tiers or MOQ changed.
    const nextMoq = data.moq !== undefined ? data.moq : product.moq;
    const nextTiers =
      data.pricingTiers !== undefined ? data.pricingTiers : product.pricingTiers;
    const check = validateTiers(nextTiers, nextMoq);
    if (!check.valid) {
      return res.status(400).json({ success: false, message: check.message });
    }

    Object.assign(product, data, { pricingTiers: check.tiers });
    await product.save();

    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update product" });
  }
};

/**
 * DELETE /api/products/:id  (seller, owner)
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await findOwnedProduct(req, res);
    if (!product) return;
    await product.deleteOne();
    return res
      .status(200)
      .json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete product" });
  }
};

/**
 * PATCH /api/products/:id/toggle  (seller, owner)
 * Flip isActive on/off.
 */
const toggleActive = async (req, res) => {
  try {
    const product = await findOwnedProduct(req, res);
    if (!product) return;
    product.isActive = !product.isActive;
    await product.save();
    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to toggle product" });
  }
};

/**
 * POST /api/products/:id/images  (seller, owner, multipart: "images")
 * Append uploaded image URLs to the product.
 */
const uploadImages = async (req, res) => {
  try {
    const product = await findOwnedProduct(req, res);
    if (!product) return;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images provided" });
    }

    const urls = req.files.map((f) => fileUrl(req, f));
    product.images.push(...urls);
    await product.save();

    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload images" });
  }
};

module.exports = {
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
};
