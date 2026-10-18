const mongoose = require("mongoose");

const exampleSentenceSchema = new mongoose.Schema({
  chinese: String,
  pinyin: String,
  english: String
}, { _id: false });

const hskWordSchema = new mongoose.Schema({
  hanzi: { type: String, required: true },
  pinyin: { type: String },
  english: { type: String },
  part_of_speech: String,
  example_sentence: exampleSentenceSchema,
  level: { type: Number, required: true },
  version: { type: String, required: true },
  color: String
});

// Create compound index for efficient queries
hskWordSchema.index({ version: 1, level: 1 });
hskWordSchema.index({ hanzi: 1 });

const HskWord = mongoose.model("HskWord", hskWordSchema);

module.exports = { HskWord }; 