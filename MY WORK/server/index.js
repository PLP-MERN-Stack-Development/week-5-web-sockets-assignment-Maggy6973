import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173', 
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Socket.IO connection handler
let users = {};
let userSockets = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('login', (username) => {
    users[socket.id] = username;
    userSockets[username] = socket.id;
    io.emit('online', Object.values(users));
    socket.broadcast.emit('notification', `${username} joined`);
  });

  socket.on('message', (data) => {
    io.emit('message', { ...data, time: new Date().toLocaleTimeString() });
  });

  socket.on('private_message', ({ to, from, text }) => {
    const toSocket = userSockets[to];
    if (toSocket) {
      io.to(toSocket).emit('private_message', { from, to, text, time: new Date().toLocaleTimeString() });
    }
  });

  socket.on('typing', (user) => socket.broadcast.emit('typing', user));
  socket.on('stopTyping', () => socket.broadcast.emit('stopTyping'));

  socket.on('disconnect', () => {
    const user = users[socket.id];
    delete userSockets[user];
    delete users[socket.id];
    io.emit('online', Object.values(users));
    if (user) io.emit('notification', `${user} left`);
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
