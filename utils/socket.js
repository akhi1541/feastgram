const http = require("http");
const app = require("../app")
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });
const ChatModel = require("../models/chatModel");
const UsersModel = require("../models/usersModel");
const catchAsync = require("./catchAsync");
const AppError = require("./appError");
const userSocketMap = new Map();

function socketInit() {
  io.on("connection", (socket) => {
    //console.log(`Socket connected: ${socket.id}`);

    // Store the user's socket ID
    socket.on("storeUserId", (userId) => {
      userSocketMap.set(userId, socket.id);
      socket.userId = userId; // Optionally store userId on the socket object
      //console.log(`Stored user ID ${userId} with socket ID ${socket.id}`);
    });

    // Handle chat messages
    socket.on("chatMessage", async (msg) => {
      try {
        //console.log("Chat message received:", msg);
        const createdChat = await ChatModel.create(msg);
        //console.log("Saved chat:", createdChat);
        io.emit("chatMessage", createdChat); // Broadcast message to all clients
      } catch (error) {
        console.error("Error saving chat message:", error);
      }
    });

    // Handle private messages
    socket.on("privateMessage", async (msg) => {
      try {
        //console.log("Private message received:", msg);
        const { receiverId, senderId, message, timeStamp } = msg;
        const receiver = await UsersModel.findById(receiverId).select('name profilePicture');
        const sender = await UsersModel.findById(senderId).select('name profilePicture');

        let createdPrivateMessage = await ChatModel.create(msg);
        //console.log("Saved private message:", createdPrivateMessage);
        
        createdPrivateMessage = {
          senderId: {
            id: sender._id,
            name: sender.name,
            profilePicture: sender.profilePicture
          },
          receiverId: {
            id: receiver._id,
            name: receiver.name,
            profilePicture: receiver.profilePicture
          },
          message: createdPrivateMessage.message,
          timeStamp: createdPrivateMessage.timeStamp,
        };

        //console.log(createdPrivateMessage)

        const receiverSocketId = userSocketMap.get(receiverId);
        const senderSocketId = userSocketMap.get(senderId)
        //console.log("fasdhi", userSocketMap);

        
        io.to(receiverSocketId).to(senderSocketId).emit("receivePrivate", createdPrivateMessage);
        

        // io.emit("receivePrivate", createdPrivateMessage); // Optionally send back to sender
      } catch (error) {
        console.error("Error handling private message:", error);
      }
    });

    // Handle disconnect
    // socket.on("disconnect", () => {
    //   //console.log(`Socket disconnected: ${socket.id}`);
    //   userSocketMap.delete(socket.userId); // Remove from map if stored
    // });
  });
}

module.exports = socketInit;
