const RFQ = require("../models/RFQ");
const Quote = require("../models/Quote");
const createNotification = require("../utils/createNotification");

/**
 * POST /api/rfqs/:id/quotes  (seller)
 * Submit (or update) this seller's quote on an open RFQ.
 */
const submitQuote = async (req, res) => {
  try {
    const { pricePerUnit, message, deliveryEstimate } = req.body;

    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" });
    }
    if (rfq.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This RFQ is closed and no longer accepting quotes",
      });
    }
    if (!pricePerUnit || Number(pricePerUnit) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid price per unit is required",
      });
    }

    // One quote per seller per RFQ — update if it already exists.
    const existing = await Quote.findOne({
      rfqRef: rfq._id,
      sellerRef: req.user._id,
    });

    let quote;
    const isUpdate = Boolean(existing);
    if (existing) {
      existing.pricePerUnit = Number(pricePerUnit);
      existing.message = message ?? existing.message;
      existing.deliveryEstimate = deliveryEstimate ?? existing.deliveryEstimate;
      existing.status = "submitted"; // reset on re-submit
      quote = await existing.save();
    } else {
      quote = await Quote.create({
        rfqRef: rfq._id,
        sellerRef: req.user._id,
        pricePerUnit: Number(pricePerUnit),
        message: message || "",
        deliveryEstimate: deliveryEstimate || "",
      });
    }

    // Notify the RFQ buyer (skip self — seller submitted the quote).
    try {
      const verb = isUpdate ? "updated their quote on" : "submitted a quote on";
      await createNotification({
        userRef: rfq.buyerRef,
        type: "new_quote",
        message: `${req.user.name} ${verb} "${rfq.title}"`,
        linkTo: `/rfqs/${rfq._id}`,
      });
    } catch (_) {
      /* non-blocking */
    }

    return res.status(201).json({ success: true, data: { quote } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ success: false, message: msg });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit quote" });
  }
};

/**
 * GET /api/quotes/mine  (seller)
 * All quotes submitted by this seller, with a light RFQ summary + status.
 */
const getMyQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ sellerRef: req.user._id })
      .populate({
        path: "rfqRef",
        select: "title category status quantityNeeded deadline",
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: { quotes } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load your quotes" });
  }
};

/**
 * PATCH /api/quotes/:id/status  (buyer who owns the RFQ)
 * Accept or reject a quote. Body: { status: "accepted" | "rejected" }.
 */
const setQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'accepted' or 'rejected'",
      });
    }

    const quote = await Quote.findById(req.params.id).populate("rfqRef");
    if (!quote) {
      return res
        .status(404)
        .json({ success: false, message: "Quote not found" });
    }
    if (!quote.rfqRef || quote.rfqRef.buyerRef.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only manage quotes on your own RFQs",
      });
    }

    quote.status = status;
    await quote.save();

    return res.status(200).json({ success: true, data: { quote } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update quote" });
  }
};

module.exports = { submitQuote, getMyQuotes, setQuoteStatus };
