const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);


const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false, // Set to false when using origin: '*'
  },
});

// ---------------------
// Data Storage
// ---------------------
const users = {}; // for 1-to-1 or normal chat

// ---------------------
// SOCKET IO HANDLING
// ---------------------
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // --- NORMAL CHAT EVENTS
  socket.on('join', ({ chatId, userId }) => {
    console.log('User joined room:', chatId, 'User:', userId);
    if (!users[chatId]) users[chatId] = [];
    users[chatId].push({ id: socket.id, userId });

    const otherUsers = users[chatId].filter(user => user.id !== socket.id);
    socket.emit('other-users', otherUsers.map(user => user.userId));

    socket.broadcast.emit('user-joined', { userId, signal: null });
  });

  socket.on('start-video', ({ userId, chatId }) => {
    socket.broadcast.emit('user-started-video', { userId });
  });

  socket.on('stop-video', ({ userId, chatId }) => {
    socket.broadcast.emit('user-stopped-video', { userId });
  });

  socket.on('leave', (userId) => {
    console.log('User left:', userId);
    for (let chatId in users) {
      users[chatId] = users[chatId].filter(user => user.userId !== userId);
      socket.broadcast.emit('user-left', userId);
    }
  });

 
  // --- DISCONNECT HANDLING
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    for (let chatId in users) {
      users[chatId] = users[chatId].filter(user => user.id !== socket.id);
      socket.broadcast.emit('user-left', socket.id);
    }

  });
});

// ---------------------
// SERVER LISTEN
// ---------------------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
