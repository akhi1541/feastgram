const userModel = require("../models/usersModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
exports.getAllFriends = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id)
      .populate("friends", ['name','email'])
      .exec();
    res.json(user);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.addOrRemoveFriend = async (req, res, next) => {
  const { userId, friendId } = req.body;

  // Ensure userId and friendId are not the same
  if (userId === friendId) {
    return res.status(400).json({
      status: "failed",
      message: "User cannot add/remove themselves",
    });
  }

  try {
    const user = await userModel.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    let updatedMessage = "";

    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
      updatedMessage = "followed";
    } else {
      // Remove the friendId from the array
      user.friends = user.friends.filter((friend) => friend !== friendId);
      updatedMessage = "unfollowed";
    }

    // Save the user with the updated friends array
    await user.save();

    res.status(200).json({
      data: user,
      friendsCount: user.friends.length,
      status: "success",
      message: updatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

