import { io } from 'socket.io-client';
 
// Connect to the server
const socket = io('https://apii.clickorbits.in', { // Replace with your server's URL if different
  transports: ['websocket'], // Ensures the connection uses WebSockets
  withCredentials: true, // Optional, if you need to include credentials
});
 
// Function to subscribe to events
export const subscribeToNotifications = (callback) => {
  socket.on('welcome', (message) => {
    callback(message);
  });
 //request 
  socket.on('pub_request_added', (data) => {
    callback(data);
  });
 //update link
  socket.on('adv_res_updated', (data) => {
    callback(data);
  });
};
 
// Function to emit events to the server
export const emitEvent = (event, data) => {
  socket.emit(event, data);
};
 
export default socket;