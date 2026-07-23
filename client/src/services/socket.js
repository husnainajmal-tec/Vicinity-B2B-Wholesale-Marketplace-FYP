import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

/**
 * Connect (once) with the current JWT. Safe to call repeatedly — it reuses
 * the existing connection. Returns the socket instance.
 */
export function connectSocket() {
  const token = localStorage.getItem("vt_token");
  if (!token) return null;

  if (socket && socket.connected) return socket;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  } else {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
