const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User model.
 * Roles:
 *  - buyer  : retailer / SME sourcing products
 *  - seller : manufacturer / wholesaler
 *  - admin  : platform administrator (created via seed script only)
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: {
        values: ["buyer", "seller", "admin"],
        message: "Role must be buyer, seller, or admin",
      },
      required: [true, "Role is required"],
      default: "buyer",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    isSuspended: {
      type: Boolean,
      default: false, // admins can suspend accounts (Phase 10)
    },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

/**
 * Hash the password before saving, only when it has been modified.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare a plaintext password against the stored hash.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * Return a safe representation without the password.
 */
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    isSuspended: this.isSuspended,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
