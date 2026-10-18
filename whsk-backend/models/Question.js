const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  category: String,
  type: String,
  difficulty: String,
  question: String,
  correct_answer: String,
  incorrect_answers: Array,
  audioUrl: String,
  level: String,
  hskLevel: String,
  audioDescription: String,
  popupDescription: { pinyin: String, translation: String },
});

questionSchema.index({ hskLevel: 1, category: 1, level: 1 });
const Question = mongoose.model("Questions", questionSchema);

module.exports = { Question };
