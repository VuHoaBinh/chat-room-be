require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const leaveRoom = require("./utils/leave-room");
const { Message } = require("./models/models");
const mongoose = require("mongoose");
const authRoutes = require("./router/authRouter");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const CHAT_BOT = "ChatBot";
let chatRoom = "";
let allUsers = [];

io.on("connection", (socket) => {
  console.log(`User connected ${socket.id}`);

  socket.on("join_room", async (data) => {
    console.log("Data received on join_room:", data);
    const { username, room } = data;
    socket.join(room);

    let __createdtime__ = Date.now();
    socket.to(room).emit("receive_message", {
      message: `${username} has joined the chat room`,
      username: CHAT_BOT,
      __createdtime__,
    });

    socket.emit("receive_message", {
      message: `Welcome ${username} to chat room`,
      username: CHAT_BOT,
      __createdtime__,
    });

    chatRoom = room;
    allUsers.push({ id: socket.id, username, room });
    chatRoomUsers = allUsers.filter((user) => user.room === room);
    socket.to(room).emit("chatroom_users", chatRoomUsers);
    socket.emit("chatroom_users", chatRoomUsers);

    const last100Messages = await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(100);
    console.log("last100Messagesne", last100Messages);
    socket.emit("last_100_messages", last100Messages);
  });

  socket.on("send_message", async (data) => {
    console.log("Data received on send_message:", data);
    const { username, message, room, __createdtime__ } = data;
    io.in(room).emit("receive_message", data);

    const result = await Message.create({
      username,
      message,
      room,
    });
    console.log("loi ne: ", result);
  });

  socket.on("leave_room", (data) => {
    const { username, room } = data;
    socket.leave(room);
    const __createdtime__ = Date.now();
    allUsers = leaveRoom(socket.id, allUsers);
    socket.to(room).emit("chatroom_users", allUsers);
    socket.to(room).emit("receive_message", {
      username: CHAT_BOT,
      message: `${username} has left the chat`,
      __createdtime__,
    });
    console.log(`${username} has left the chat`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from the chat");
    const user = allUsers.find((user) => user.id == socket.id);
    if (user?.username) {
      allUsers = leaveRoom(socket.id, allUsers);
      socket.to(chatRoom).emit("chatroom_users", allUsers);
      socket.to(chatRoom).emit("receive_message", {
        message: `${user.username} has disconnected from the chat.`,
      });
    }
  });
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    server.listen(4000, () => console.log("Server is running on port 4000"));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();
