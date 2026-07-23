/**
 * Catch-all for unmatched routes. Forwards a 404 to the error handler.
 */
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
