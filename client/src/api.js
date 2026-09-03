import axios from "axios";

const API_BASE = "http://localhost:5001/api";

export const api = {
  getDemoUser: async (userId) => {
    const res = await axios.get(`${API_BASE}/demo/${userId}`);
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
  }
};
