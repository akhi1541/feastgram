const PostModel = require("../models/postsModel");
const LikesModel = require("../models/likesModel");
const CommentsModel = require("../models/commentsModel");
const Aws = require('../utils/s3Load')

// exports.getAllposts =  async(req,res,next)=>{

// }
exports.getPost = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      message: "userID is not found",
    });
  }
  const userPost = await PostModel.find({ _id: id });
  res.status(200).json({
    data: userPost,
    status: "success",
  });
};
exports.createPost = async (req, res, next) => {
  const { image } = req.body;

  const imageUrl = await Aws.uploadFileToS3(image, process.env.BUCKET_NAME);
    
  req.body.image = imageUrl;
  const createdPost = await PostModel.create(req.body);
  res.status(201).json({
    data: createdPost,
    message: "post created",
    status: "success",
  });
};

exports.updatePost = async (req, res, next) => {
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
};

exports.deletePost = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      message: "userID is not found",
    });
  }
  const userPost = await PostModel.findByIdAndDelete({ _id: id });
  res.status(200).json({
    data: userPost,
    status: "success",
  });
};

exports.getUserPosts = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({
      message: "userID is not found",
    });
  }
  const userPosts = await PostModel.find({ chefId: id });
  res.status(200).json({
    data: userPosts,
    status: "success",
  });
};

// Aggregate helps us  to perform a series of operations on a collection's data to transform, group and filter
// lookup connects collections from is the foreignDB and local field is postDB and as create a new field with the values
exports.getPosts = async (req, res, next) => {
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
              _id: 0,
              name: 1,
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
    // {
    //   $unwind: "$comments"
    // },
    {
      $unwind: {
        path: "$comments",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "comments.userId",
        foreignField: "_id",
        as: "commentedBy",
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
      $unwind: {
        path: "$commentedBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        title: { $first: "$title" },
        name: { $first: "$postedBy.name" },
        description: { $first: "$description" },
        ingredients: { $first: "$ingredients" },
        instructions: { $first: "$instructions" },
        image: { $first: "$image" },
        chefId: { $first: "$chefId" },
        dietType: { $first: "$dietType" },
        createdAt: { $first: "$createdAt" },
        likesCount: { $first: "$likesCount" },
        likedByNames: { $first: "$likedBy.name" },
        comments: {
          $push: {
            commentId: "$comments._id",
            userId: "$comments.userId",
            recipeId: "$comments.recipeId",
            comment: "$comments.comment",
            commentedBy: "$commentedBy.name",
          },
        },
      },
    },
  ]);
  res.status(200).json({
    count: posts.length,
    data: posts,
    status: "success",
  });
};

//

exports.createLike = async (req, res, next) => {
  const { userId, recipeId } = req.body;
  if (!userId || !recipeId) {
    return res.status(400).json({
      message: "userID or recipeID not found",
    });
  }
  const likedPost = await LikesModel.findOne({ userId, recipeId });

  if (likedPost) {
    await LikesModel.findOneAndDelete({ userId, recipeId });
    res.json({ message: "Post unliked" });
  } else {
    await LikesModel.create(req.body);
    res.json({ message: "Post liked" });
  }
};

exports.getPostLikes = async (req, res, next) => {
  const recipeId = req.body.recipeId;
  if (!recipeId) {
    return res.status(400).json({
      message: "recipeID not found",
    });
  }
  const likesWithUserNames = await LikesModel.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userLiked",
      },
    },
    {
      $project: {
        userLikedBy: "$userLiked.name",
      },
    },
  ]);
  const likesCount = likesWithUserNames.length;
  res.status(200).json({
    data: likesWithUserNames,
    likesCount,
  });
};

exports.createComment = async (req, res, next) => {
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
};
