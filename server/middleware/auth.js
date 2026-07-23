const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — verify the JWT from the Authorization header and attach the
 * authenticated user (minus password) to req.user.
 * Responds 401 if the token is missing or invalid.
 */
const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user no longer exists",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid or expired",
    });
  }
};

/**
 * optionalAuth — attach req.user if a valid token is present, but never
 * block the request. Useful for public routes that personalize output
 * for logged-in users (e.g. "have I already quoted this RFQ?").
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (_) {
    // ignore invalid tokens on optional routes
  }
  next();
};

/**
 * authorize(...roles) — restrict a route to specific roles.
 * Must run after `protect`.
 * @param {...string} roles - allowed roles (e.g. "admin", "seller")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: requires role ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };
