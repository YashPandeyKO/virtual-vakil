import { useState } from 'react';
import { chatLawyer } from '../api';
import chatImage from '../assets/law-chat.png';

export default function Chat() {
  const [msg, setMsg] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState(''); // For maintaining conversation context

  const handleAsk = async () => {
    if (!msg.trim()) {
      alert("Please enter your question");
      return;
    }

    setIsLoading(true);
    try {
      const result = await chatLawyer(msg, context);
      setResponse(result.response || result.error);
      setContext(prev => `${prev}\nUser: ${msg}\nLawyer: ${result.response}`); // Update context
    } catch (err) {
      console.error("API Error:", err);
      setResponse("Failed to get response from the legal assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#eef5ff',
        minHeight: '100vh',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: '#ffffff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src={chatImage}
            alt="Chatbot"
            style={{ width: '200px', marginBottom: '1rem' }}
          />
          <h2 style={{ marginBottom: '1rem' }}>👨‍⚖️ Talk to Your Legal Advisor</h2>
        </div>

        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="e.g. Can landlord evict me without notice?"
          style={{
            width: '100%',
            padding: '0.8rem',
            margin: '1rem 0',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
        />
        <button
          onClick={handleAsk}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.6rem',
            backgroundColor: isLoading ? '#cccccc' : '#4b6fff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Processing...' : 'Ask'}
        </button>

        {response && (
          <div style={{ 
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h4>📩 <strong>Response:</strong></h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{response}</p>
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <h4>💬 <strong>Try asking:</strong></h4>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {[
              "What is the procedure for filing an FIR?",
              "Can police arrest without a warrant?",
              "How to apply for anticipatory bail?"
            ].map((question) => (
              <li 
                key={question}
                style={{ 
                  padding: '0.5rem 0', 
                  cursor: 'pointer',
                  color: '#4b6fff',
                  textDecoration: 'underline'
                }}
                onClick={() => {
                  setMsg(question);
                  // Auto-focus on input after selecting a question
                  document.querySelector('input[type="text"]')?.focus();
                }}
              >
                {question}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}