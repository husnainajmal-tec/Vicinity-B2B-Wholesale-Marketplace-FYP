const Favorite = require("../models/Favorite");
const Product = require("../models/Product");
const CompanyProfile = require("../models/CompanyProfile");

const validateItem = async (itemType, itemRef) => {
  if (itemType === "product") {
    const product = await Product.findById(itemRef);
    if (!product) return { error: "Product not found" };
    return { item: product };
  }
  if (itemType === "company") {
    const company = await CompanyProfile.findById(itemRef);
    if (!company) return { error: "Company not found" };
    return { item: company };
  }
  return { error: "Invalid item type" };
};

/**
 * GET /api/favorites/ids
 * Lightweight id sets for heart-toggle state across the app.
 */
const getFavoriteIds = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userRef: req.user._id })
      .select("itemType itemRef")
      .lean();

    const productIds = favorites
      .filter((f) => f.itemType === "product")
      .map((f) => f.itemRef.toString());
    const companyIds = favorites
      .filter((f) => f.itemType === "company")
      .map((f) => f.itemRef.toString());

    return res
      .status(200)
      .json({ success: true, data: { productIds, companyIds } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load favorites" });
  }
};

/**
 * GET /api/favorites
 * Full watchlist for the My Favorites page.
 */
const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userRef: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const productIds = favorites
      .filter((f) => f.itemType === "product")
      .map((f) => f.itemRef);
    const companyIds = favorites
      .filter((f) => f.itemType === "company")
      .map((f) => f.itemRef);

    const [products, companies] = await Promise.all([
      Product.find({ _id: { $in: productIds } }).lean(),
      CompanyProfile.find({ _id: { $in: companyIds } }).lean(),
    ]);

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const companyMap = new Map(companies.map((c) => [c._id.toString(), c]));

    const savedProducts = favorites
      .filter((f) => f.itemType === "product" && productMap.has(f.itemRef.toString()))
      .map((f) => ({
        savedAt: f.createdAt,
        product: productMap.get(f.itemRef.toString()),
      }));

    const savedCompanies = favorites
      .filter((f) => f.itemType === "company" && companyMap.has(f.itemRef.toString()))
      .map((f) => ({
        savedAt: f.createdAt,
        company: companyMap.get(f.itemRef.toString()),
      }));

    return res.status(200).json({
      success: true,
      data: { products: savedProducts, companies: savedCompanies },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load favorites" });
  }
};

/**
 * POST /api/favorites/toggle
 * Add or remove a favorite. Body: { itemType, itemRef }.
 */
const toggleFavorite = async (req, res) => {
  try {
    const { itemType, itemRef } = req.body;
    if (!itemType || !itemRef) {
      return res.status(400).json({
        success: false,
        message: "itemType and itemRef are required",
      });
    }
    if (!["product", "company"].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: "itemType must be product or company",
      });
    }

    const { error } = await validateItem(itemType, itemRef);
    if (error) {
      return res.status(404).json({ success: false, message: error });
    }

    const existing = await Favorite.findOne({
      userRef: req.user._id,
      itemType,
      itemRef,
    });

    if (existing) {
      await existing.deleteOne();
      return res
        .status(200)
        .json({ success: true, data: { favorited: false } });
    }

    await Favorite.create({
      userRef: req.user._id,
      itemType,
      itemRef,
    });

    return res.status(200).json({ success: true, data: { favorited: true } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update favorite" });
  }
};

module.exports = { getFavoriteIds, getMyFavorites, toggleFavorite };
