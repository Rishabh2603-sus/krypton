import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
const MODEL_CHAIN = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-1.5-flash"
];

const SYSTEM_PROMPT = `
You are Krypton, an AI financial resilience assistant.
Use only the financial metrics provided by the application.
Do not invent financial information.
Do not guarantee financial outcomes.
Do not approve or reject loans.
Do not make unsupported financial claims.
Explain financial conditions in simple language.
The application has already performed all numerical calculations.

Return ONLY a valid JSON object matching this structure:
{
  "summary": "String explaining the general situation",
  "risk": "String explaining the main financial concern",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "bufferAdvice": "String with emergency-buffer advice",
  "simpleExplanation": "String with a simple explanation of what is going on"
}
`;

export async function getFinancialAdvice(financialMetrics) {
  const prompt = `${SYSTEM_PROMPT}\n\nFinancial Metrics:\n${JSON.stringify(financialMetrics, null, 2)}`;
  
  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.warn(`[getFinancialAdvice] Model ${modelName} failed (${error.message}). Trying next model in chain...`);
    }
  }

  // Fallback recommendation engine if all models fail
  return {
    summary: "We analyzed your financial resilience based on your income patterns.",
    risk: "Unable to calculate detailed risk at this moment.",
    recommendations: [
      "Monitor your essential expenses.",
      "Maintain an emergency buffer.",
      "Adjust spending based on income stability."
    ],
    bufferAdvice: "Keep a steady emergency buffer.",
    simpleExplanation: "AI explanations are currently offline, but your core metrics are still valid."
  };
}

export async function chatWithAssistant(financialMetrics, messageHistory) {
  const CHAT_PROMPT = `
You are the Krypton Smart Financial Assistant, an AI-powered personal financial decision assistant.
Analyze the user's financial information (provided below). Based on this information, provide personalized financial guidance through natural-language conversations.
When answering questions like "Can I afford this phone?", "Can I spend ₹5,000 right now?", "Can I apply for a loan?", or "How much should I save this month?", consider their OVERALL financial condition (not just current balance).
Explain the reasoning behind your recommendation.
Highlight possible risks (upcoming bills, low savings, high expenses, unstable income).
Be helpful, empathetic, and financially prudent. Give clear "Yes", "No", or "Yes, but..." style guidance before explaining.

Financial Context of the user:
${JSON.stringify(financialMetrics, null, 2)}
`;

  const formattedHistory = [
    {
      role: "user",
      parts: [{ text: CHAT_PROMPT }]
    },
    {
      role: "model",
      parts: [{ text: "Understood. I am ready to act as the Krypton Smart Financial Assistant and provide personalized, contextual advice." }]
    }
  ];
  
  // Add the ongoing conversation history (except the very last message)
  if (messageHistory && messageHistory.length > 1) {
    for (let i = 0; i < messageHistory.length - 1; i++) {
      formattedHistory.push(messageHistory[i]);
    }
  }

  const lastMessage = messageHistory[messageHistory.length - 1].parts[0].text;

  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const chat = model.startChat({
        history: formattedHistory
      });

      const result = await chat.sendMessage(lastMessage);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.warn(`[chatWithAssistant] Model ${modelName} failed (${error.status || error.message}). Trying next fallback model...`);
    }
  }

  return "I'm having trouble connecting to my AI brain right now. Please check your API key or try again later.";
}
