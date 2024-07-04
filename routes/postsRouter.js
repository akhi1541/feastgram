const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const authController = require("../controllers/authContorller");
const uploadToS3Middleware = require("../utils/s3Load");

// router.post("/upload", uploadToS3Middleware, (req, res,next) => {
//   // The file has been uploaded to S3, and req.body.image contains the S3 URL
//   console.log(req.body);
//   res.json({ imageUrl: req.body.image });
//   next()
// });
router.post(
  "/post",
  authController.protect,
  uploadToS3Middleware,
  postsController.createPost
);

router
  .route("/post/:id")
  .delete(authController.protect, postsController.deletePost)
  .get(authController.protect, postsController.getPost)
  .patch(authController.protect, postsController.updatePost);
router
  .route("/userPosts/:id")
  .get(authController.protect, postsController.getUserPosts);

router.route("/allposts").get(authController.protect, postsController.getPosts);

router
  .route("/post/like")
  .post(authController.protect, postsController.createLike);
router
  .route("/postlikes/:id")
  .get(authController.protect, postsController.getPostLikes); // seperate api to get like count

router
  .route("/post/comment")
  .post(authController.protect, postsController.createComment);
router
  .route("/post/getComments/:recipeID")
  .get(authController.protect, postsController.getComments);

router
  .route("/savedPost")
  .post(authController.protect, postsController.savePost);
router
  .route("/savedPosts/:id")
  .get(authController.protect, postsController.getSavedPosts);
router
  .route("/savedPosts/userSavedPosts/:userId")
  .get(authController.protect,postsController.getUserSavedPosts);

module.exports = router;
