import {
  analyzeIncome,
  forecastIncome,
  calculateResilience,
  calculateSafeToSpend,
  simulateIncomeShock
} from "../engine.js";

export const analyzeFinances = (req, res) => {
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
};

export const simulateFinances = (req, res) => {
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
};
