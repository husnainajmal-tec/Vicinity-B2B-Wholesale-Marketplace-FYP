const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

/**
 * Build and configure the Express application.
 * Kept separate from the HTTP/Socket server (server.js) so it can be
 * imported for testing without opening a port.
 */
const app = express();

// --- Core middleware ---------------------------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// --- Static: locally uploaded files (dev image storage) ----------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- API routes --------------------------------------------------------
app.use("/api", routes);

// --- 404 + centralized error handling ----------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
