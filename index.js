const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const leaveRoom = require('./utils/leave-room');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
});

const CHAT_BOT = 'ChatBot';
let chatRoom = '';
let allUsers = [];

io.on('connection', (socket) => {
  console.log(`User connected ${socket.id}`);

  socket.on('join_room', (data) => {
    const { username, room } = data;
    socket.join(room);

    let __createdtime__ = Date.now();
    socket.to(room).emit('receive_message', {
      message: `Welcome ${username} has joined the chat room`,
      username: CHAT_BOT,
      __createdtime__,
    });

    chatRoom = room;
    allUsers.push({ id: socket.id, username, room });
    chatRoomUsers = allUsers.filter((user) => user.room === room);

    const updatedChatRoomUsers = leaveRoom(socket.id, chatRoomUsers);

    io.to(room).emit('chatroom_users', updatedChatRoomUsers);

    socket.emit('chatroom_users', updatedChatRoomUsers);
  });

  socket.on('send_message', (data) => {
    const { username, room, message, __createdtime__ } = data;
    const newMessage = {
      message,
      username,
      __createdtime__,
    };

    io.to(room).emit('receive_message', newMessage);
  });

  socket.on('receive_message', (data) => {
    const { room, message, username, __createdtime__ } = data;
    console.log(`Received message in room ${room} from ${socket.id}:`, data);
  });
});

server.listen(4000, () => console.log('Server is running on port 4000'));
