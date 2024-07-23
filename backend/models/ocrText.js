// models/ocrText.js
const mongoose = require("mongoose");

const ocrTextSchema = new mongoose.Schema({
  text: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OcrText", ocrTextSchema);
