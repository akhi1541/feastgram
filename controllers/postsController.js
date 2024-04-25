const PostModel = require("../models/postsModel");

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
  //s3 storw
  const imageUrl =
    "https://www.google.com/imgres?q=chicken%20tikka&imgurl=https%3A%2F%2Fgobserver.net%2Fwp-content%2Fuploads%2F2020%2F04%2FIMG_7197-1-e1586016499342.jpg&imgrefurl=https%3A%2F%2Fgobserver.net%2F2096%2Fstudent-experiences%2Fmy-first-chicken-tikka-masala-ever%2F&docid=6a5LG7QuRxdQjM&tbnid=HD1x7riz7f85nM&vet=12ahUKEwjx3sLpuNuFAxWZePUHHQ_kA2oQM3oECFIQAA..i&w=2000&h=1500&hcb=2&ved=2ahUKEwjx3sLpuNuFAxWZePUHHQ_kA2oQM3oECFIQAA";
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
