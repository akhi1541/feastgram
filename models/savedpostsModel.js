const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const savedPostsSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recipe",
    required: true,
  },
});

const SavedPosts = mongoose.model("SavedPosts", savedPostsSchema);

module.exports = SavedPosts;
