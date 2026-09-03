import { getFinancialAdvice, chatWithAssistant } from "../gemini.js";

export const getAdvice = async (req, res) => {
  try {
    const { financialMetrics } = req.body;
    
    if (!financialMetrics) {
      return res.status(400).json({
        success: false,
        message: "financialMetrics is required"
      });
    }

    const advice = await getFinancialAdvice(financialMetrics);

    res.json({
      success: true,
      data: advice
    });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate AI advice at this time."
    });
  }
};

export const chatWithAI = async (req, res) => {
  try {
    const { financialMetrics, messageHistory } = req.body;
    
    if (!financialMetrics || !messageHistory) {
      return res.status(400).json({
        success: false,
        message: "financialMetrics and messageHistory are required"
      });
    }

    const responseText = await chatWithAssistant(financialMetrics, messageHistory);

    res.json({
      success: true,
      data: responseText
    });
  } catch (error) {
    console.error("Gemini AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "I'm having trouble connecting to my AI brain right now. Please check your API key or try again later."
    });
  }
};
