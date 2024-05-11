const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const AWS = require('../utils/s3Load')
// router.route('posts').get()
router.route("/post").post(postsController.createPost);
router
  .route("/post/:id")
  .delete(postsController.deletePost)
  .get(postsController.getPost)
  .patch(postsController.updatePost);
router.route("/userPosts/:id").get(postsController.getUserPosts);
router.route("/allposts").get(postsController.getPosts)


router.route("/post/like").post(postsController.createLike)
router.route("/postlikes").get(postsController.getPostLikes) // seperate api to get like count


router.route("/post/comment").post(postsController.createComment)

module.exports = router;
