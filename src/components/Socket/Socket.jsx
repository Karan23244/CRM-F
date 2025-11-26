
// src/Socket/Socket.js
import { io } from "socket.io-client";

//  ^|^e Initialize Socket.IO connection
export const socket = io("https://gapi.clickorbits.in/",
  {
    transports: ["websocket"], // force websocket for better stability
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    autoConnect: true,
  }
);

//  ^|^e Function to join a specific room
export const joinRoom = (roomId) => {
  if (!roomId) return console.warn("  ^z   ^o No roomId provided to joinRoom()");
  if (socket.connected) {
    socket.emit("joinRoom", roomId);
  } else {
    socket.once("connect", () => {
      socket.emit("joinRoom", roomId);
    });
  }
};

//  ^|^e Function to automatically join a self-room using socket.id
export const joinSelfRoom = () => {
  if (socket.connected) {
    joinRoom(socket.id);
  } else {
    socket.once("connect", () => joinRoom(socket.id));
  }
};

//  ^|^e Socket connection event handlers
socket.on("connect", () =>
  console.log(" ^=^=  Socket connected:", socket.id)
);

socket.on("connect_error", (err) =>
  console.error(" ^z   ^o Socket connect error:", err.message)
);

socket.on("disconnect", (reason) =>
  console.warn(" ^=^t  Socket disconnected:", reason)
);