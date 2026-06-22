import { io } from "socket.io-client";

// Connect to the server
const socket = io(import.meta.env.VITE_API_URL1, {
  // Replace with your server's URL if different
  transports: ["websocket"], // Ensures the connection uses WebSockets
  withCredentials: true, // Optional, if you need to include credentials
});

// Function to subscribe to events — removes old listeners first to prevent accumulation
export const subscribeToNotifications = (callback) => {
  socket.off("welcome");
  socket.off("pub_request_added");
  socket.off("adv_res_updated");
  socket.on("welcome", callback);
  socket.on("pub_request_added", callback);
  socket.on("adv_res_updated", callback);
};

// Function to emit events to the server
export const emitEvent = (event, data) => {
  socket.emit(event, data);
};

export default socket;
