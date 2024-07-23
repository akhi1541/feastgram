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
    const userId = new mongoose.Types.ObjectId(req.params.senderId);
  
    // Aggregation pipeline
    const communicatedUsers = await ChatModel.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: {
          timeStamp: -1
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userId] },
              "$receiverId",
              "$senderId"
            ]
          },
          latestMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "Users", 
          localField: "_id",
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
          userId: "$_id",
          name: "$userDetails.name",
          profilePicture: "$userDetails.profilePicture",
          latestMessage: "$latestMessage.message",
          latestMessageTimestamp: "$latestMessage.timeStamp"
        }
      },
      {
        $sort: { latestMessageTimestamp: -1 } 
      }
    ]);
  
    // Sending response
    res.json(communicatedUsers);
  });
  