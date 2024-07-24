const userModel = require("../models/usersModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
exports.getAllFriends = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id)
      .populate({
        path: 'friends',
        select: 'name profilePicture', 
        options: { 
          fields: { _id: 1, name: 1, profilePicture:1 } 
        }
      })
      .exec();
      
    // Extracting friend data to include only 'name' and 'id'
    const friends = user.friends.map(friend => ({
      id: friend._id,
      name: friend.name,
      profilePic: friend.profilePicture
    }));
    
    res.json(friends);
  } catch (error) {
    res.status(500).send(error);
  }
};


exports.addOrRemoveFriend = async (req, res, next) => {
  console.log(req.body);
  const { userId, friendId } = req.body;

  // Ensure userId and friendId are not the same
  if (userId === friendId) {
    return res.status(400).json({
      status: "failed",
      message: "User cannot add/remove themselves",
    });
  }

  
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({
      status: "failed",
      message: "Invalid user ID or friend ID",
    });
  }

  try {
    const friend = await userModel.findById(friendId);

    if (!friend) {
      return res.status(404).json({
        status: "failed",
        message: "Friend not found",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId); // Correctly instantiate ObjectId
    let updatedMessage = "";

    console.log("Current friends list:", friend.friends);

    if (!friend.friends.some((id) => id.equals(userObjectId))) {
      friend.friends.push(userObjectId);
      updatedMessage = "followed";
    } else {
      // Remove the userId from the array
      friend.friends = friend.friends.filter((id) => !id.equals(userObjectId));
      updatedMessage = "unfollowed";
    }

    // Save the friend with the updated friends array
    await friend.save();

    console.log("Updated friends list:", friend.friends);

    res.status(200).json({
      data: friend,
      friendsCount: friend.friends.length,
      status: "success",
      message: updatedMessage,
    });
  } catch (error) {
    next(error);
  }
};