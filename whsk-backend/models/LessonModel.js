const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: String,
  iconName: String,
  hskLevel: String,  // Add HSK level here
  grammarsUrl: [String],
  
});

lessonSchema.index({ hskLevel: 1 });
const Lesson = mongoose.model("Lesson", lessonSchema);

module.exports = { Lesson };
