const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recipeSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  ingredients: {
    type: [String],
  },
  instructions: {
    type: String,
  },
  image: {
    type: String,
  },
  chefId: {
    type: Schema.Types.ObjectId,
    ref: "Users", 
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  dietType: {
    type: String,
    enum: ["VEG", "NONVEG", "EGGY"]
  },
});

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = Recipe;
