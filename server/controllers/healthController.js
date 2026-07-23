const mongoose = require("mongoose");

/**
 * GET /api/health
 * Simple liveness/readiness probe. Reports API status and DB connection.
 */
const getHealth = (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];

  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "vicinity-trade-api",
      timestamp: new Date().toISOString(),
      db: dbStates[mongoose.connection.readyState] || "unknown",
    },
  });
};

module.exports = { getHealth };
