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
// ---------------------------------------
// 🔗 Initialize Socket connection
// ---------------------------------------
export const socket = io(import.meta.env.VITE_API_URL2, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  autoConnect: true,
});

// ---------------------------------------
// 🔥 Join any room manually
// ---------------------------------------
export const joinRoom = (roomId) => {
  if (!roomId) {
    console.warn("⚠️ No roomId provided to joinRoom()");
    return;
  }

  if (socket.connected) {
    socket.emit("joinRoom", roomId);
  } else {
    socket.once("connect", () => {
      socket.emit("joinRoom", roomId);
    });
  }
};

// ---------------------------------------
// 🔥 Join a room using user.id
// (Call this from a component where Redux is available)
// ---------------------------------------
export const joinUserRoom = (userId) => {
  if (!userId) {
    console.warn("⚠️ No userId provided → cannot join room");
    return;
  }
  console.log("Joining room for user ID:", userId);
  joinRoom(userId);
};

socket.on("connect", () => {
  console.log("⚡ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connect error:", err.message);
});
