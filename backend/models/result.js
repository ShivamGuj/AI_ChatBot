const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  imagePath: String,
  text: String,
  result: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Result", resultSchema);
