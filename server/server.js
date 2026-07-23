require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initSocket = require("./config/socket");

const PORT = process.env.PORT || 5000;

/**
 * Bootstrap the application:
 *  1. Connect to MongoDB
 *  2. Create the HTTP server from the Express app
 *  3. Attach Socket.io for real-time features
 *  4. Start listening
 */
const start = async () => {
  await connectDB();

  const server = http.createServer(app);

  // Attach Socket.io (chat, notifications, etc.)
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Vicinity Trade API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

start();
