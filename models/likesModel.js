const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const likeSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
    }
});

const Like = mongoose.model('Likes', likeSchema);

module.exports = Like;
