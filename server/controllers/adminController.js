const User = require("../models/User");
const CompanyProfile = require("../models/CompanyProfile");
const Product = require("../models/Product");
const Order = require("../models/Order");

/**
 * GET /api/admin/stats
 * Simple platform totals for the admin overview (no complex analytics).
 */
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalSellers, totalBuyers, totalOrders, gmvAgg] =
      await Promise.all([
        User.countDocuments({ role: { $ne: "admin" } }),
        User.countDocuments({ role: "seller" }),
        User.countDocuments({ role: "buyer" }),
        Order.countDocuments({}),
        Order.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

    const totalGMV = gmvAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalSellers,
          totalBuyers,
          totalOrders,
          totalGMV,
        },
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load platform stats" });
  }
};

/**
 * GET /api/admin/verifications
 * Company profiles awaiting review (not yet approved/rejected).
 */
const getPendingVerifications = async (req, res) => {
  try {
    const profiles = await CompanyProfile.find({
      isVerified: false,
      verificationStatus: { $ne: "rejected" },
    })
      .populate("userRef", "name email role")
      .sort({ createdAt: 1 })
      .lean();

    return res
      .status(200)
      .json({ success: true, data: { verifications: profiles } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load verifications" });
  }
};

/**
 * PATCH /api/admin/verifications/:id
 * Approve or reject a company verification. Body: { action: "approve"|"reject" }.
 */
const reviewVerification = async (req, res) => {
  try {
    const { action } = req.body;
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be 'approve' or 'reject'",
      });
    }

    const profile = await CompanyProfile.findById(req.params.id);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Company profile not found" });
    }

    if (action === "approve") {
      profile.isVerified = true;
      profile.verificationStatus = "approved";
    } else {
      profile.isVerified = false;
      profile.verificationStatus = "rejected";
    }
    await profile.save();

    return res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update verification" });
  }
};

/**
 * GET /api/admin/users
 * Users table with optional ?q (name/email) and ?role filters.
 */
const listUsers = async (req, res) => {
  try {
    const { q, role } = req.query;
    const filter = {};
    if (role && ["buyer", "seller", "admin"].includes(role)) {
      filter.role = role;
    }
    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load users" });
  }
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Suspend or reactivate a user. Body: { suspended: boolean }.
 * Admins cannot be suspended (and you cannot suspend yourself).
 */
const setUserSuspended = async (req, res) => {
  try {
    const { suspended } = req.body;
    if (typeof suspended !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "suspended must be a boolean" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Admin accounts cannot be suspended" });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot suspend yourself" });
    }

    user.isSuspended = suspended;
    await user.save();

    return res
      .status(200)
      .json({ success: true, data: { user: user.toSafeObject() } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update user" });
  }
};

/**
 * GET /api/admin/products
 * Products table with optional ?q (title), ?category, ?active filters.
 */
const listProducts = async (req, res) => {
  try {
    const { q, category, active } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;
    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.title = rx;
    }

    const products = await Product.find(filter)
      .populate("sellerRef", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: { products } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load products" });
  }
};

/**
 * PATCH /api/admin/products/:id/active
 * Moderate a listing by toggling visibility. Body: { active: boolean }.
 */
const setProductActive = async (req, res) => {
  try {
    const { active } = req.body;
    if (typeof active !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "active must be a boolean" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: active } },
      { new: true }
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update product" });
  }
};

/**
 * DELETE /api/admin/products/:id
 * Permanently remove a listing (moderation).
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, data: { ok: true } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to remove product" });
  }
};

module.exports = {
  getStats,
  getPendingVerifications,
  reviewVerification,
  listUsers,
  setUserSuspended,
  listProducts,
  setProductActive,
  deleteProduct,
};
