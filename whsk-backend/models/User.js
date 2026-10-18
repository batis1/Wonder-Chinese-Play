const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: false },
  hskLevel: { type: String, required: true },
  status: { type: String, default: "active" },
  role: { type: String, default: "normalUser" },
  googleId: { type: String },
});

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
const User = mongoose.model("Users", UserSchema);

module.exports = { User };
