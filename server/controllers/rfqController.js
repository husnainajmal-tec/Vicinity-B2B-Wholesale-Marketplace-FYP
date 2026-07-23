const RFQ = require("../models/RFQ");
const Quote = require("../models/Quote");

/**
 * POST /api/rfqs  (buyer)
 * Create a new RFQ (buying lead).
 */
const createRFQ = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      quantityNeeded,
      targetPrice,
      deadline,
    } = req.body;

    if (!title || !category || !quantityNeeded || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Title, category, quantity, and deadline are required",
      });
    }

    if (new Date(deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Deadline must be a future date",
      });
    }

    const rfq = await RFQ.create({
      buyerRef: req.user._id,
      title,
      description,
      category,
      quantityNeeded: Number(quantityNeeded),
      targetPrice:
        targetPrice === "" || targetPrice == null ? null : Number(targetPrice),
      deadline,
    });

    return res.status(201).json({ success: true, data: { rfq } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create RFQ" });
  }
};

/**
 * GET /api/rfqs  (public feed — "Buying Leads" / seller "Browse RFQs")
 * Optional filters: ?category, ?status (defaults to open).
 */
const listRFQs = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    filter.status = status || "open";
    if (category) filter.category = category;

    const rfqs = await RFQ.find(filter)
      .populate("buyerRef", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Attach quote counts so the feed can show activity.
    const withCounts = await Promise.all(
      rfqs.map(async (rfq) => ({
        ...rfq,
        quoteCount: await Quote.countDocuments({ rfqRef: rfq._id }),
      }))
    );

    return res
      .status(200)
      .json({ success: true, data: { rfqs: withCounts } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load RFQs" });
  }
};

/**
 * GET /api/rfqs/mine  (buyer)
 * The buyer's own RFQs, each with the quotes received.
 */
const getMyRFQs = async (req, res) => {
  try {
    const rfqs = await RFQ.find({ buyerRef: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const withQuotes = await Promise.all(
      rfqs.map(async (rfq) => {
        const quotes = await Quote.find({ rfqRef: rfq._id })
          .populate("sellerRef", "name")
          .sort({ pricePerUnit: 1 })
          .lean();
        return { ...rfq, quotes };
      })
    );

    return res.status(200).json({ success: true, data: { rfqs: withQuotes } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load your RFQs" });
  }
};

/**
 * GET /api/rfqs/:id  (public detail)
 * RFQ details + quotes. Quotes are always included; the client decides
 * what to show (buyer owner sees the comparison table).
 */
const getRFQById = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate("buyerRef", "name")
      .lean();

    if (!rfq) {
      return res
        .status(404)
        .json({ success: false, message: "RFQ not found" });
    }

    const quotes = await Quote.find({ rfqRef: rfq._id })
      .populate("sellerRef", "name")
      .sort({ pricePerUnit: 1 })
      .lean();

    // Has the current seller (if any) already quoted?
    let myQuote = null;
    if (req.user && req.user.role === "seller") {
      myQuote =
        quotes.find(
          (q) => q.sellerRef?._id?.toString() === req.user._id.toString()
        ) || null;
    }

    return res
      .status(200)
      .json({ success: true, data: { rfq, quotes, myQuote } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load RFQ" });
  }
};

/**
 * PATCH /api/rfqs/:id/close  (buyer owner)
 * Manually close an RFQ.
 */
const closeRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res
        .status(404)
        .json({ success: false, message: "RFQ not found" });
    }
    if (rfq.buyerRef.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "You can only close your own RFQs" });
    }

    rfq.status = "closed";
    await rfq.save();
    return res.status(200).json({ success: true, data: { rfq } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to close RFQ" });
  }
};

module.exports = {
  createRFQ,
  listRFQs,
  getMyRFQs,
  getRFQById,
  closeRFQ,
};
