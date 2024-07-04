const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const commentSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
});

const Comment = mongoose.model('Comments', commentSchema);

module.exports = Comment;
