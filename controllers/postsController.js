const PostModel = require("../models/postsModel");
const LikesModel = require("../models/likesModel");
const CommentsModel = require("../models/commentsModel");
const SavedPostModel = require("../models/savedpostsModel");
const UserModel = require("../models/usersModel")
const Aws = require("../utils/s3Load");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");

exports.getPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;

  if (!postId) {
    return res.status(400).json({
      message: "Post ID is not found",
    });
  }
  const post = await PostModel.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(postId) },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "recipeId",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $lookup: {
        from: "users",
        let: { userIds: "$likes.userId" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$userIds"] },
            },
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: "likedBy",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "recipeId",
        as: "comments",
      },
    },
    {
      $addFields: {
        commentsCount: { $size: "$comments" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "chefId",
        foreignField: "_id",
        as: "postedBy",
      },
    },
    {
      $unwind: "$postedBy",
    },
    {
      $lookup: {
        from: "savedposts",
        localField: "_id",
        foreignField: "recipeId",
        as: "savedBy",
      },
    },
    {
      $lookup: {
        from: "users",
        let: { savedUserIds: "$savedBy.userId" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$savedUserIds"] },
            },
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: "savedByUsers",
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        name: "$postedBy.name",
        description: 1,
        ingredients: 1,
        instructions: 1,
        image: 1,
        chefId: 1,
        dietType: 1,
        createdAt: 1,
        likesCount: 1,
        likedBy: 1,
        commentsCount: 1,
        savedByUsers: 1,
      },
    },
  ]);

  console.log(post[0]?.savedByUsers);

  if (!post || post.length === 0) {
    return res.status(404).json({
      message: "Post not found",
    });
  }

  res.status(200).json({
    data: post[0],
    status: "success",
  });

  
  
});

exports.createPost = catchAsync(async (req, res) => {

    console.log(req.body);
    const { title, image, chefId } = req.body;
    const recipeData = JSON.parse(title);
    console.log(recipeData);
    console.log(image);
    const createdPost = await PostModel.create({
      ...recipeData,
      image,
      chefId,
    });
    res.status(201).json({
      data: createdPost,
      message: "Post created",
      status: "success",
    });

    

});

exports.updatePost = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      message: "userID is not found",
    });
  }
  const userPost = await PostModel.findOneAndUpdate({ _id: id }, req.body);
  res.status(200).json({
    data: userPost,
    status: "success",
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  console.log(id)
  if (!id) {
    return res.status(400).json({
      message: "userID is not found",
    });
  }
  
  const userPost = await PostModel.findByIdAndDelete({ _id: id });
  console.log(userPost)
  res.status(200).json({
    data: userPost,
    status: "success",
  });
});

exports.getUserPosts = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  if (!id) {
    return res.status(400).json({
      message: "userID is not found",
    });
  }
  const userPosts = await PostModel.find({ chefId: id }).select("_id image");
  res.status(200).json({
    data: userPosts,
    status: "success",
  });
});

// Aggregate helps us  to perform a series of operations on a collection's data to transform, group and filter
// lookup connects collections from is the foreignDB and local field is postDB and as create a new field with the values

exports.getPosts = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const posts = await PostModel.aggregate([
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "recipeId",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $lookup: {
        from: "users",
        let: { userIds: "$likes.userId" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$userIds"] },
            },
          },
          {
            $project: {
              _id: 1,
              name: 0,
            },
          },
        ],
        as: "likedBy",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "recipeId",
        as: "comments",
      },
    },
    {
      $addFields: {
        commentsCount: { $size: "$comments" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "chefId",
        foreignField: "_id",
        as: "postedBy",
      },
    },
    {
      $unwind: "$postedBy",
    },
    {
      $group: {
        _id: "$_id",
        title: { $first: "$title" },
        name: { $first: "$postedBy.name" },
        profilePicture: { $first: "$postedBy.profilePicture" },
        description: { $first: "$description" },
        ingredients: { $first: "$ingredients" },
        instructions: { $first: "$instructions" },
        image: { $first: "$image" },
        chefId: { $first: "$chefId" },
        dietType: { $first: "$dietType" },
        createdAt: { $first: "$createdAt" },
        likesCount: { $first: "$likesCount" },
        likedByIds: { $first: "$likedBy._id" },
        commentsCount: { $first: "$commentsCount" },
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  const totalPosts = await PostModel.countDocuments();

  res.status(200).json({
    count: posts.length,
    total: totalPosts,
    page,
    pages: Math.ceil(totalPosts / limit),
    data: posts,
    status: "success",
  });
});

//

exports.createLike = catchAsync(async (req, res, next) => {
  const { userId, recipeId } = req.body;
  if (!userId || !recipeId) {
    return res.status(400).json({
      message: "userID or recipeID not found",
    });
  }
  const likedPost = await LikesModel.findOne({ userId, recipeId });

  if (likedPost) {
    await LikesModel.findOneAndDelete({ userId, recipeId });
    res.json({ message: "Post unliked", status: false });
  } else {
    await LikesModel.create(req.body);
    res.json({ message: "Post liked", status: true });
  }
});

exports.getPostLikes = catchAsync(async (req, res, next) => {
  const recipeId = req.params.id;
  if (!recipeId) {
    return res.status(400).json({
      message: "recipeID not found",
    });
  }
  const likesWithUserNames = await LikesModel.aggregate([
    {
      $match: { recipeId: new mongoose.Types.ObjectId(recipeId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userLiked",
      },
    },
    {
      $unwind: "$userLiked",
    },
    {
      $project: {
        _id: 1, // Include the original _id from LikesModel
        userLikedBy: {
          _id: "$userLiked._id",
          name: "$userLiked.name",
          profilePicture: "$userLiked.profilePicture",
        },
      },
    },
  ]);

  const likesCount = likesWithUserNames.length;
  console.log(likesWithUserNames);

  res.status(200).json({
    data: likesWithUserNames,
    likesCount,
  });
});

exports.createComment = catchAsync(async (req, res, next) => {
  const { userId, recipeId, comment } = req.body;
  if (!userId || !recipeId || !comment) {
    return res.status(400).json({
      message: "userID or recipeID not found",
    });
  }
  const Usercomment = await CommentsModel.create(req.body);
  res.status(201).json({
    message: "comment posted",
    data: Usercomment,
  });
});
exports.getComments = catchAsync(async (req, res) => {
  const recipeId = req.params.recipeID;
    const comments = await CommentsModel.aggregate([
      {
        $match: { recipeId: new mongoose.Types.ObjectId(recipeId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: "$userData",
      },
      {
        $project: {
          _id: 1, // Include the comment's ID
          comment: 1, // Include the comment's text
          user: "$userData.name", // Include the user data
          profilePicture: "$userData.profilePicture", // Include the user data
          createdAt: 1,
        },
      },
    ]);
    res.status(200).json({
      data: comments,
      status: "success",
    });

    
});

exports.savePost = catchAsync(async (req, res) => {
  const { userId, recipeId } = req.body;
  let message = "";
  if (!userId || !recipeId)
    return res.status(400).json({ message: "not found userID or RecipeID" });
  let savedPost = await SavedPostModel.findOne({ userId, recipeId });
  if (savedPost) {
    await SavedPostModel.findOneAndDelete({ userId, recipeId });
    message = "Un saved Post";
    statusBool = false;
  } else {
    await SavedPostModel.create(req.body);
    message = "Saved Post";
    statusBool = true;
  }
  res.status(201).json({
    statusBool,
    message,
  });
});

exports.getSavedPosts = catchAsync(async (req, res) => {
  const id = req.params.id;
  if (!id) {
    console.log("entered into if");
    return res.status(400).json({
      message: "userID is not found",
    });
  }

  let savedPosts = await SavedPostModel.aggregate([
    {
      $lookup: {
        from: "recipes",
        localField: "recipeId",
        foreignField: "_id",
        as: "recipeDetails",
      },
    },
    {
      $unwind: "$recipeDetails",
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        "recipeDetails._id": 1,
        "recipeDetails.title": 1,
        "recipeDetails.description": 1,
        "recipeDetails.ingredients": 1,
        "recipeDetails.instructions": 1,
        "recipeDetails.image": 1,
        "recipeDetails.chefId": 1,
        "recipeDetails.createdAt": 1,
        "recipeDetails.dietType": 1,
      },
    },
  ]);
  res.json({
    status: "success",
    data: savedPosts,
    message: "Saved posts retrieved successfully",
  });
});

exports.getUserSavedPosts = catchAsync(async (req, res) => {
  const userId = req.params.userId;


    const savedPosts = await SavedPostModel.find({ userId }).populate({
      path: "recipeId",
      select: { _id: 1, image: 1 }, // Select only _id and image from recipeId
    });
    console.log(savedPosts);

    res.status(200).json({
      data: savedPosts,
      status: "success",
    });

    

});


exports.getUserDetails = catchAsync(async (req, res) => {
  const name = req.params.name;
  console.log(name)
  const usersData = await UserModel.find(
    { name: { $regex: name, $options: 'i' } },
    '_id name profilePicture' // Project only _id and name fields
  );
  console.log('regw',usersData)
  res.json(usersData);
})