/**
 * Centralized error handler.
 * Always returns a consistent JSON shape: { success: false, message }.
 * Stack traces are only included outside of production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // If a route set a non-2xx status before throwing, respect it; else 500.
  const statusCode =
    res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
