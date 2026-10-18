const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  username: { type: String, required: true },
  score: { type: Number },
  hskLevel: { type: String },
  date: { type: Number, required: true },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
});

scoreSchema.index({ userID: 1, score: -1 });
scoreSchema.index({ hskLevel: 1, score: -1 });
const Score = mongoose.model("Scores", scoreSchema);

module.exports = { Score };
