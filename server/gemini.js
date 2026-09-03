import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

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
  try {
    const prompt = `${SYSTEM_PROMPT}\n\nFinancial Metrics:\n${JSON.stringify(financialMetrics, null, 2)}`;
    
    // In a real application, you might use responseSchema if using gemini-1.5-pro
    // We'll parse the JSON from the text for robustness across models
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown block if present
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    // Fallback recommendation engine
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
}

export async function chatWithAssistant(financialMetrics, messageHistory) {
  try {
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

    const chat = model.startChat({
      history: formattedHistory
    });

    const lastMessage = messageHistory[messageHistory.length - 1].parts[0].text;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Chat Error:", error);
    return "I'm having trouble connecting to my AI brain right now. Please check your API key or try again later.";
  }
}
