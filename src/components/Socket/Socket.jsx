// src/Socket/Socket.js
import { io } from "socket.io-client";

export const socket = io(
  import.meta.env.VITE_API_URL || "http://localhost:2001/",
  { autoConnect: true }
);

socket.on("connect", () => {
  console.log("🟢 Connected to WebSocket server:", socket.id);
});
socket.on("disconnect", (reason) => {
  console.log("🔴 Disconnected. Reason:", reason);
});
