// src/Socket/Socket.js
import { io } from "socket.io-client";

// Connect to your Socket.IO server
export const socket = io(
  import.meta.env.VITE_API_URL || "https://gapi.clickorbits.in/",
  { autoConnect: true }
);

// 🔹 Join a specific room (use socketId or any unique ID)
export const joinRoom = (roomId) => {
  if (socket.connected) {
    socket.emit("joinRoom", roomId);
    console.log("🟢 Joined room:", roomId);
  } else {
    socket.on("connect", () => {
      socket.emit("joinRoom", roomId);
      console.log("🟢 Joined room after connect:", roomId);
    });
  }
};

// 🔹 Automatically join a room with socket.id if needed
export const joinSelfRoom = () => {
  if (socket.connected) {
    joinRoom(socket.id);
  } else {
    socket.on("connect", () => joinRoom(socket.id));
  }
};

// 🔹 Listen to connection events
socket.on("connect", () => {
  console.log("🟢 Connected to WebSocket server:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Disconnected. Reason:", reason);
});
