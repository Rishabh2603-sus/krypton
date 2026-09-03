import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
