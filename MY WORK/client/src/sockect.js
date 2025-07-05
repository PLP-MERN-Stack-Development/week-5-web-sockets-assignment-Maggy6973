// src/socket.js

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Create and export the socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: true, // Optional: set to false if you want to connect manually
  transports: ['websocket'], // Optional: ensures WebSocket is used
});
