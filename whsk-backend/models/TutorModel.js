const mongoose = require("mongoose");

const TutorSchema = new mongoose.Schema({
  hskLevel: String,
  educationalBackground: String,
  teachingPeriod: String,
  teachingTime: String,
  moreInfo: String,
  zoomRoomID: String,
  status: {
    type: String,
    enum: ["applied", "accepted", "rejected"],
    default: "applied",
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "Users",
    required: true,
    unique: true,
  },
});

const Tutor = mongoose.model("Tutor", TutorSchema);

module.exports = { Tutor };
