import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// Configure axios instance with longer timeout
const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Enhanced chatLawyer with timeout handling
export const chatLawyer = async (query, context = "") => {
  try {
    const response = await api.post('/chat-lawyer', {
      query,
      context
    }, {
      transformRequest: [(data) => {
        return `query=${encodeURIComponent(data.query)}&context=${encodeURIComponent(data.context)}`;
      }],
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Chat API Error:', error);
    return { 
      error: error.code === 'ECONNABORTED' 
        ? "The request took too long. Please try a simpler question."
        : error.response?.data?.error || error.message || 'Network error'
    };
  }
};

// Add streaming support
export const chatLawyerStream = async (query, context, onDataReceived) => {
  try {
    const response = await fetch(`${API_BASE}/chat-lawyer-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `query=${encodeURIComponent(query)}&context=${encodeURIComponent(context)}`
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partial = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value, { stream: true });
      partial += text;
      const lines = partial.split('\n');
      
      lines.slice(0, -1).forEach(line => onDataReceived(line));
      partial = lines[lines.length - 1];
    }
    if (partial) onDataReceived(partial);
  } catch (error) {
    console.error('Stream Error:', error);
    onDataReceived(`Error: ${error.message}`);
  }
};