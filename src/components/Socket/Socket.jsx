// // src/Socket/Socket.js
// import { io } from "socket.io-client";

// //  ^|^e Initialize Socket.IO connection
// export const socket = io(import.meta.env.VITE_API_URL2,
//   {
//     transports: ["websocket"], // force websocket for better stability
//     reconnection: true,
//     reconnectionAttempts: 5,
//     reconnectionDelay: 2000,
//     autoConnect: true,
//   }
// );

// //  ^|^e Function to join a specific room
// export const joinRoom = (roomId) => {
//   if (!roomId) return console.warn("  ^z   ^o No roomId provided to joinRoom()");
//   if (socket.connected) {
//     socket.emit("joinRoom", roomId);
//   } else {
//     socket.once("connect", () => {
//       socket.emit("joinRoom", roomId);
//     });
//   }
// };

// //  ^|^e Function to automatically join a self-room using socket.id
// export const joinSelfRoom = () => {
//   if (socket.connected) {
//     joinRoom(socket.id);
//   } else {
//     socket.once("connect", () => joinRoom(socket.id));
//   }
// };

// //  ^|^e Socket connection event handlers
// socket.on("connect", () =>
//   console.log(" ^=^=  Socket connected:", socket.id)
// );

// socket.on("connect_error", (err) =>
//   console.error(" ^z   ^o Socket connect error:", err.message)
// );

// socket.on("disconnect", (reason) =>
//   console.warn(" ^=^t  Socket disconnected:", reason)
// );

// Socket.jsx
import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL2, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
});

// ---------------------------
// Join Room
// ---------------------------
export const joinRoom = (roomId) => {
  if (!roomId) return console.warn("⚠️ Missing roomId");

  if (socket.connected) {
    console.log("➡️ Joining room:", roomId);
    socket.emit("joinRoom", roomId);
  } else {
    socket.once("connect", () => {
      console.log("➡️ Joining room after reconnect:", roomId);
      socket.emit("joinRoom", roomId);
    });
  }
};

// ---------------------------
// Join Room by User ID
// ---------------------------
let lastUserId = null;

export const joinUserRoom = (userId) => {
  if (!userId) return console.warn("⚠️ Missing userId");

  lastUserId = userId; // SAVE FOR RECONNECTS
  joinRoom(userId);
};

// ---------------------------
// Socket Events
// ---------------------------
socket.on("connect", () => {
  console.log("⚡ Connected:", socket.id);

  // 🔥 Auto-rejoin the user room after new connection
  if (lastUserId) {
    console.log("🔁 Rejoining user room:", lastUserId);
    joinRoom(lastUserId);
  }
});

socket.on("reconnect", (attempt) => {
  console.log("🔄 Reconnected after attempts:", attempt);

  if (lastUserId) {
    console.log("🔁 Rejoining user room after reconnect:", lastUserId);
    joinRoom(lastUserId);
  }
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});
