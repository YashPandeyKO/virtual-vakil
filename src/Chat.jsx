import  { useState } from 'react';
import { chatLawyer } from '../api';

function Chat() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");

  const handleChat = async () => {
    if (!query.trim()) {
      alert("Please enter a question.");
      return;
    }

    try {
      const result = await chatLawyer(query);
      setResponse(result.response || result.error);
    } catch (err) {
      console.error(err);
      setResponse("Something went wrong while getting a response.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>💬 Chat with Virtual Vakeel</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask your legal question here"
        style={{ width: '300px', padding: '8px' }}
      />
      <br /><br />
      <button onClick={handleChat}>Ask</button>
      <br /><br />
      <pre style={{ backgroundColor: '#f4f4f4', padding: '10px' }}>{response}</pre>
    </div>
  );
}

export default Chat;
