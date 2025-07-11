import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

export const analyzeDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(`${API_BASE}/analyze-document`, formData);
  return response.data;
};

export const chatLawyer = async (query, context = "") => {
  const formData = new FormData();
  formData.append("query", query);
  formData.append("context", context);
  const response = await axios.post(`${API_BASE}/chat-lawyer`, formData);
  return response.data;
};
