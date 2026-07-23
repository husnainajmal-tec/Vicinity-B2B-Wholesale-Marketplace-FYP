const mongoose = require("mongoose");

const FAVORITE_ITEM_TYPES = ["product", "company"];

/**
 * Buyer watchlist entry — one row per saved product or supplier.
 */
const favoriteSchema = new mongoose.Schema(
  {
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userRef is required"],
      index: true,
    },
    itemType: {
      type: String,
      enum: {
        values: FAVORITE_ITEM_TYPES,
        message: "itemType must be product or company",
      },
      required: [true, "itemType is required"],
    },
    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "itemRef is required"],
    },
  },
  { timestamps: true }
);

favoriteSchema.index({ userRef: 1, itemType: 1, itemRef: 1 }, { unique: true });
favoriteSchema.index({ userRef: 1, createdAt: -1 });

module.exports = mongoose.model("Favorite", favoriteSchema);
module.exports.FAVORITE_ITEM_TYPES = FAVORITE_ITEM_TYPES;
