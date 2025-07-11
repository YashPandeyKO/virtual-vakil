import  { useState } from 'react';
import { analyzeDocument } from '../api';

function Analyze() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    try {
      const result = await analyzeDocument(file);
      setSummary(result.summary || result.error);
    } catch (err) {
      console.error(err);
      setSummary("Something went wrong while analyzing the document.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📄 Analyze Legal Document</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload}>Analyze</button>
      <br /><br />
      <pre style={{ backgroundColor: '#f4f4f4', padding: '10px' }}>{summary}</pre>
    </div>
  );
}

export default Analyze;
