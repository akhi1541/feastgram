const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const chatSchema = new Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timeStamp: {
    type: Date,
    required: true,
    default: Date.now(),
  },
});

const Chat = mongoose.model("chats", chatSchema);

module.exports = Chat ;
