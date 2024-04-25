const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");

// router.route('posts').get()
router.route("/post").post(postsController.createPost);
router
  .route("/post/:id")
  .delete(postsController.deletePost)
  .get(postsController.getPost)
  .patch(postsController.updatePost);
router.route("/userPosts/:id").get(postsController.getUserPosts);

module.exports = router;
