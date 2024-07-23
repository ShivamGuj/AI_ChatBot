import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrText, setOcrText] = useState("");

  const fetchOcrText = async () => {
    try {
      const response = await axios.get("http://localhost:5000/get-ocr-text");
      setOcrText(response.data.ocrText || "");
    } catch (error) {
      console.error("Error fetching OCR text:", error);
    }
  };

  useEffect(() => {
    fetchOcrText();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText && !selectedFile) {
      alert("Please enter a message or upload an image");
      return;
    }

    const formData = new FormData();
    if (inputText) formData.append("text", inputText);
    if (selectedFile) formData.append("image", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const resultText = response.data.result;
      const extractedOcrText =
        resultText.split("OCR Result: ")[1]?.split("\n")[0] || "";

      if (selectedFile) {
        setOcrText(extractedOcrText);
      }

      setMessages([
        ...messages,
        { user: "Me", text: inputText, image: selectedFile },
        { user: "Bot", text: resultText },
      ]);
      setInputText("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading the file", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
        <div className="chat-window overflow-y-scroll h-96 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message mb-2 p-2 rounded ${
                message.user === "Me"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-300 text-black self-start"
              }`}
            >
              {message.image && (
                <img
                  src={URL.createObjectURL(message.image)}
                  alt="uploaded"
                  className="max-w-xs mb-2"
                />
              )}
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message"
            className="flex-1 p-2 border border-gray-300 rounded-l-md"
          />
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="p-2 border border-gray-300"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r-md"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
