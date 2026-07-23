require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

/**
 * Seed (or update) the platform admin account.
 * Admins cannot be created through public signup, so run this once:
 *   npm run seed:admin
 *
 * Credentials can be overridden via env vars:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
const seedAdmin = async () => {
  await connectDB();

  const name = process.env.ADMIN_NAME || "Platform Admin";
  const email = (process.env.ADMIN_EMAIL || "admin@vicinity.trade").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin12345";

  try {
    const existing = await User.findOne({ email });

    if (existing) {
      existing.name = name;
      existing.password = password; // re-hashed by pre-save hook
      existing.role = "admin";
      await existing.save();
      console.log(`♻️  Admin updated: ${email}`);
    } else {
      await User.create({ name, email, password, role: "admin" });
      console.log(`✅ Admin created: ${email}`);
    }

    console.log("   Login with the above email and the ADMIN_PASSWORD value.");
  } catch (error) {
    console.error(`❌ Failed to seed admin: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();
