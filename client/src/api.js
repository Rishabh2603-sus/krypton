import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api`;

export const api = {
  getDemoUser: async (userId) => {
    const res = await axios.get(`${API_BASE}/demo/${userId}`);
    return res.data;
  },

  addTransaction: async (userId, data) => {
    const res = await axios.post(`${API_BASE}/user/${userId}/transaction`, data);
    return res.data;
  },

  analyzeFinancials: async (data) => {
    const res = await axios.post(`${API_BASE}/analyze`, data);
    return res.data;
  },

  simulateShock: async (data, percentage) => {
    const res = await axios.post(`${API_BASE}/simulate`, { data, percentage });
    return res.data;
  },

  getAIAdvice: async (financialMetrics) => {
    const res = await axios.post(`${API_BASE}/ai/advice`, { financialMetrics });
    return res.data;
  },

  chatWithAI: async (financialMetrics, messageHistory, userId) => {
    const res = await axios.post(`${API_BASE}/ai/chat`, { financialMetrics, messageHistory, userId });
    return res.data;
  }
};
