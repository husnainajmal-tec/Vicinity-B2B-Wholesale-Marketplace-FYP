const User = require("../models/User");
const generateToken = require("../utils/generateToken");

/**
 * POST /api/auth/register
 * Public signup. Only "buyer" or "seller" roles are accepted here —
 * admin accounts are created via the seed script.
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // --- Basic validation ---
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
    }

    if (!["buyer", "seller"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'buyer' or 'seller'",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // --- Uniqueness check ---
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // --- Create (password hashed by pre-save hook) ---
    const user = await User.create({ name, email, password, role, phone });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      data: { user: user.toSafeObject(), token },
    });
  } catch (error) {
    // Handle Mongoose validation errors gracefully
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

/**
 * POST /api/auth/login
 * Verify credentials and return a JWT.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // password has select:false, so explicitly include it
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended. Contact the platform admin.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      data: { user: user.toSafeObject(), token },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user (requires `protect`).
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { user: req.user.toSafeObject() },
  });
};

module.exports = { register, login, getMe };
