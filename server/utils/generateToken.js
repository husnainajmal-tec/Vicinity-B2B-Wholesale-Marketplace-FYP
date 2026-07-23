const jwt = require("jsonwebtoken");

/**
 * Sign a JWT containing the user's id and role.
 * @param {object} user - Mongoose user document
 * @returns {string} signed JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

module.exports = generateToken;
