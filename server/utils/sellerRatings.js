const mongoose = require("mongoose");
const Review = require("../models/Review");

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Aggregate average ratings for a seller (by User id).
 * Returns null when the seller has no reviews yet.
 */
const getSellerRatingSummary = async (sellerRef) => {
  const sellerId = sellerRef._id || sellerRef;
  const [result] = await Review.aggregate([
    { $match: { sellerRef: new mongoose.Types.ObjectId(sellerId) } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        productQuality: { $avg: "$ratings.productQuality" },
        onTimeDelivery: { $avg: "$ratings.onTimeDelivery" },
        communication: { $avg: "$ratings.communication" },
      },
    },
  ]);

  if (!result) return null;

  const averages = {
    productQuality: round1(result.productQuality),
    onTimeDelivery: round1(result.onTimeDelivery),
    communication: round1(result.communication),
  };
  const overall = round1(
    (averages.productQuality + averages.onTimeDelivery + averages.communication) /
      3
  );

  return { count: result.count, averages, overall };
};

module.exports = { getSellerRatingSummary };
