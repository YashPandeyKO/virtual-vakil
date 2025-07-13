import React, { useState } from "react";
import { analyzeDocument } from "../api";
import "./Analyze.css";

const Analyze = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSummary(""); // Clear previous summary when new file is selected
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeDocument(file);
      setSummary(result.summary || result.error || "No summary generated");
    } catch (err) {
      console.error("Analysis error:", err);
      setSummary("Failed to analyze document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text, lang = "hi-IN") => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };

  return (
    <div className="analyze-container">
      <h1>📄 Analyze Legal Document</h1>

      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="file-input"
        disabled={isLoading}
      />

      {file && (
        <div className="preview-section">
          <p><strong>Selected File:</strong> {file.name}</p>
          <button 
            onClick={handleAnalyze}
            disabled={isLoading}
            className="analyze-button"
          >
            {isLoading ? "Analyzing..." : "Analyze Document"}
          </button>
        </div>
      )}

      {summary && (
        <div className="summary-section">
          <h2>Analysis Results</h2>
          <div className="summary-content">
            {summary.split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="audio-controls">
            <button onClick={() => speakText(summary, "hi-IN")}>
              🔊 सुनो हिंदी
            </button>
            <button onClick={() => speakText(summary, "en-US")}>
              🔊 Listen English
            </button>
            <button onClick={stopSpeaking}>⛔ Stop</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyze;