// index.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const Tesseract = require("tesseract.js");
const mongoose = require("mongoose");
const Result = require("./models/result");
const OcrText = require("./models/ocrText"); // Add this line
const path = require("path");
const fs = require("fs");
const getGeminiResponse = require("./gemini");

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: {
      version: "1",
      strict: true,
      deprecationErrors: true,
    },
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

let storedOcrText = "";

app.post("/analyze", upload.single("image"), async (req, res) => {
  const { text } = req.body;
  const imagePath = req.file ? req.file.path : null;

  let imageText = "";
  if (imagePath) {
    try {
      const {
        data: { text: ocrText },
      } = await Tesseract.recognize(imagePath, "eng");
      imageText = ocrText;
      storedOcrText = ocrText;
    } catch (err) {
      console.error("Failed to process image:", err);
      return res.status(500).json({ error: "Failed to process image" });
    }
  }

  const combinedText = imagePath ? storedOcrText : `${storedOcrText}\n${text}`;
  try {
    const geminiResponse = await getGeminiResponse(combinedText);
    const resultText = `OCR Result: ${imageText}\nInput Text: ${text}\nGemini Response: ${geminiResponse}`;
    const newResult = new Result({ imagePath, text, result: resultText });

    await newResult.save();
    res.json({ result: resultText });
  } catch (err) {
    console.error("Failed to get Gemini response or save result:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

app.post("/save-ocr-text", async (req, res) => {
  const { ocrText } = req.body;
  try {
    await OcrText.deleteMany(); // Clear previous OCR texts
    const newOcrText = new OcrText({ text: ocrText });
    await newOcrText.save();
    res.status(200).json({ message: "OCR text saved successfully" });
  } catch (error) {
    console.error("Failed to save OCR text:", error);
    res.status(500).json({ error: "Failed to save OCR text" });
  }
});

app.get("/get-ocr-text", async (req, res) => {
  try {
    const ocrText = await OcrText.findOne().sort({ createdAt: -1 });
    res.status(200).json({ ocrText: ocrText ? ocrText.text : "" });
  } catch (error) {
    console.error("Failed to retrieve OCR text:", error);
    res.status(500).json({ error: "Failed to retrieve OCR text" });
  }
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
