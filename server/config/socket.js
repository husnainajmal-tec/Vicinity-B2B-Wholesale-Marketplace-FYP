const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io = null;

// Simple in-memory presence: userId -> number of active sockets.
const online = new Map();

const addOnline = (userId) => {
  const id = userId.toString();
  online.set(id, (online.get(id) || 0) + 1);
  return online.get(id) === 1; // became online
};
const removeOnline = (userId) => {
  const id = userId.toString();
  const n = (online.get(id) || 1) - 1;
  if (n <= 0) {
    online.delete(id);
    return true; // went offline
  }
  online.set(id, n);
  return false;
};

/**
 * Initialize Socket.io on top of the HTTP server.
 * Auth: the client passes a JWT via socket.handshake.auth.token.
 *
 * Rooms:
 *   user:<userId>            personal room (inbox refresh / presence)
 *   conversation:<convId>    per-thread room for live messages
 *
 * Events (client -> server):
 *   conversation:join <id>
 *   conversation:leave <id>
 * Events (server -> client):
 *   newMessage <message>
 *   conversationUpdated { conversationId }
 *   newNotification <notification>
 *   presence:online { userId } / presence:offline { userId }
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // --- Auth handshake ---
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name role");
      if (!user) return next(new Error("User not found"));
      socket.user = { _id: user._id.toString(), name: user.name, role: user.role };
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id;
    socket.join(`user:${userId}`);

    // Presence: announce if this user just came online.
    if (addOnline(userId)) {
      socket.broadcast.emit("presence:online", { userId });
    }
    // Send the current online snapshot to the newly connected client.
    socket.emit("presence:snapshot", { online: Array.from(online.keys()) });

    socket.on("conversation:join", (conversationId) => {
      if (conversationId) socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId) => {
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    });

    socket.on("disconnect", () => {
      if (removeOnline(userId)) {
        socket.broadcast.emit("presence:offline", { userId });
      }
    });
  });

  return io;
};

/** Access the initialized io instance from controllers. */
const getIO = () => io;

module.exports = initSocket;
module.exports.getIO = getIO;
