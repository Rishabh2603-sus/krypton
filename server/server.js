import express from "express";
import cors from "cors";

import {
  analyzeIncome,
  forecastIncome,
  calculateResilience,
  calculateSafeToSpend,
  simulateIncomeShock
} from "./engine.js";

import demoData from "./demoData.json" with { type: "json" };

import { getFinancialAdvice } from "./gemini.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Krypton API is running"
  });
});

app.get("/api/demo/:userId", (req, res) => {
  const user = demoData[req.params.userId];

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Demo user not found"
    });
  }

  res.json({
    success: true,
    data: user
  });
});

app.post("/api/analyze", (req, res) => {
  try {
    const data = req.body;

    const incomeAnalysis = analyzeIncome(data);
    const forecast = forecastIncome(data);
    const resilience = calculateResilience(data);
    const safeToSpend = calculateSafeToSpend(data);

    res.json({
      success: true,
      data: {
        incomeAnalysis,
        forecast,
        resilience,
        safeToSpend
      }
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Unable to analyze financial data"
    });
  }
});

app.post("/api/simulate", (req, res) => {
  try {
    const { data, percentage } = req.body;

    if (!data || percentage === undefined) {
      return res.status(400).json({
        success: false,
        message: "data and percentage are required"
      });
    }

    const simulation = simulateIncomeShock(data, percentage);

    res.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Unable to run simulation"
    });
  }
});

app.post("/api/ai/advice", async (req, res) => {
  try {
    const { financialMetrics } = req.body;

    if (!financialMetrics) {
      return res.status(400).json({
        success: false,
        message: "financialMetrics are required"
      });
    }

    const advice = await getFinancialAdvice(financialMetrics);

    res.json({
      success: true,
      data: advice
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to generate AI advice"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Krypton API running at http://localhost:${PORT}`);
});
