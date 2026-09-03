function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function standardDeviation(values) {
  if (!values.length) return 0;

  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    values.length;

  return Math.sqrt(variance);
}

// 1. Analyze historical income
export function analyzeIncome(data) {
  const incomes = data.income || [];

  const avg = average(incomes);
  const med = median(incomes);
  const std = standardDeviation(incomes);

  const min = incomes.length ? Math.min(...incomes) : 0;
  const max = incomes.length ? Math.max(...incomes) : 0;

  const volatility = avg > 0 ? std / avg : 0;

  return {
    average: Math.round(avg),
    median: Math.round(med),
    minimum: Math.round(min),
    maximum: Math.round(max),
    standardDeviation: Math.round(std),
    volatility: Number(volatility.toFixed(2)),
    periods: incomes.length
  };
}

// 2. Forecast future income using historical median + volatility
export function forecastIncome(data) {
  const incomes = data.income || [];

  if (!incomes.length) {
    return {
      low: 0,
      expected: 0,
      high: 0
    };
  }

  const med = median(incomes);
  const std = standardDeviation(incomes);

  return {
    low: Math.max(0, Math.round(med - std)),
    expected: Math.round(med),
    high: Math.round(med + std)
  };
}

// 3. Calculate financial resilience score
export function calculateResilience(data) {
  const incomes = data.income || [];
  const savings = Number(data.currentSavings || 0);
  const essentialExpenses = Number(data.essentialExpenses || 0);
  const debtPayment = Number(data.monthlyDebtPayment || 0);

  if (!incomes.length || essentialExpenses <= 0) {
    return {
      score: 0,
      band: "Critical",
      breakdown: {}
    };
  }

  const avgIncome = average(incomes);
  const std = standardDeviation(incomes);
  const volatility = avgIncome > 0 ? std / avgIncome : 1;

  // Income stability: lower volatility = higher score
  const incomeStability = Math.max(
    0,
    Math.min(100, 100 - volatility * 100)
  );

  // Savings buffer: target is 6 months of essential expenses
  const savingsMonths = savings / essentialExpenses;
  const savingsBuffer = Math.min(100, (savingsMonths / 6) * 100);

  // Debt capacity: lower debt burden = higher score
  const debtRatio =
    avgIncome > 0 ? (debtPayment / avgIncome) * 100 : 100;

  const debtCapacity = Math.max(
    0,
    Math.min(100, 100 - debtRatio * 2)
  );

  // Expense flexibility
  const expenseRatio =
    avgIncome > 0 ? essentialExpenses / avgIncome : 1;

  const expenseFlexibility = Math.max(
    0,
    Math.min(100, (1 - expenseRatio) * 100)
  );

  // Simple income trend
  let incomeTrend = 50;

  if (incomes.length >= 2) {
    const first = incomes[0];
    const last = incomes[incomes.length - 1];

    if (last > first) incomeTrend = 80;
    else if (last < first) incomeTrend = 30;
  }

  const score = Math.round(
    incomeStability * 0.30 +
    savingsBuffer * 0.25 +
    debtCapacity * 0.20 +
    expenseFlexibility * 0.15 +
    incomeTrend * 0.10
  );

  let band;

  if (score < 40) band = "Critical";
  else if (score < 60) band = "Vulnerable";
  else if (score < 80) band = "Stable";
  else band = "Resilient";

  return {
    score,
    band,
    breakdown: {
      incomeStability: Math.round(incomeStability),
      savingsBuffer: Math.round(savingsBuffer),
      debtCapacity: Math.round(debtCapacity),
      expenseFlexibility: Math.round(expenseFlexibility),
      incomeTrend
    }
  };
}

// 4. Calculate safe-to-spend amount
export function calculateSafeToSpend(data) {
  const balance = Number(data.currentBalance || data.currentSavings || 0);
  const essentialExpenses = Number(data.essentialExpenses || 0);
  const debtPayment = Number(data.monthlyDebtPayment || 0);
  const emergencyReserve = Number(
    data.emergencyReserve || essentialExpenses * 1
  );

  const forecast = forecastIncome(data);

  // Conservative forecast = low forecast
  const safeToSpend =
    balance +
    forecast.low -
    essentialExpenses -
    debtPayment -
    emergencyReserve;

  return {
    amount: Math.max(0, Math.round(safeToSpend)),
    conservativeIncome: forecast.low,
    emergencyReserve: Math.round(emergencyReserve)
  };
}

// 5. Simulate income shock
export function simulateIncomeShock(data, percentage) {
  const forecast = forecastIncome(data);

  const change = Number(percentage);

  const scenarioIncome = Math.round(
    forecast.expected * (1 + change / 100)
  );

  const essentialExpenses = Number(data.essentialExpenses || 0);
  const debtPayment = Number(data.monthlyDebtPayment || 0);

  const monthlyObligations = essentialExpenses + debtPayment;

  const monthlySurplus = scenarioIncome - monthlyObligations;

  const savings = Number(data.currentSavings || 0);

  const savingsCoverage =
    monthlyObligations > 0
      ? savings / monthlyObligations
      : 0;

  let risk;

  if (monthlySurplus >= 0) {
    risk = "Low";
  } else if (monthlySurplus >= -5000) {
    risk = "Moderate";
  } else {
    risk = "High";
  }

  return {
    percentage: change,
    expectedIncome: forecast.expected,
    scenarioIncome,
    monthlyObligations,
    monthlySurplus,
    savingsCoverage: Number(savingsCoverage.toFixed(2)),
    risk
  };
}
