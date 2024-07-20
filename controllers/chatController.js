const ChatModel = require("../models/chatModel")
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");

exports.getMessages = catchAsync(async (req, res,next) => {
    const receiverId = req.params.receiverId;
    const senderId = req.params.senderId;
  
    const messages = await ChatModel.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    })

    const formattedMessages = messages.map(msg => ({
        senderId: {
          id: msg.senderId._id,
          name: msg.senderId.name,
        },
        receiverId: {
          id: msg.receiverId._id,
          name: msg.receiverId.name,
        },
        message: msg.message,
        timeStamp: msg.timeStamp,
        _id: msg._id
      }));
    
      res.json(formattedMessages);  
  
  });


  exports.getCommunicatedUsers = catchAsync(async (req, res) => {
    const senderId = req.params.senderId;
  
    // Aggregation pipeline
    const communicatedUsers = await ChatModel.aggregate([
      {
        $match: {
          senderId: new mongoose.Types.ObjectId(senderId)
        }
      },
      {
        $group: {
          _id: null,
          users: {
            $addToSet: {
              receiverId: "$receiverId"
            }
          }
        }
      },
      {
        $unwind: "$users"
      },
      {
        $lookup: {
          from: "users", // Name of your users collection
          localField: "users.receiverId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: 0,
          receiverId: "$users.receiverId",
          name: "$userDetails.name",
          profilePicture: "$userDetails.profilePicture"
        }
      }
    ]);
  
    // Sending response
    res.json(communicatedUsers);
  });