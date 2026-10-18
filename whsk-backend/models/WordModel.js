const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema({
  character: String,
  pinyin: String,
  englishTranslation: String,
  sentence: String,
  lessonId: { type: mongoose.Types.ObjectId, ref: "Lesson", required: true },
});

wordSchema.index({ lessonId: 1 });
wordSchema.index({ character: 1 });
const Word = mongoose.model("Word", wordSchema);

module.exports = { Word };
