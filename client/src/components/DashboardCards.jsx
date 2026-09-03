import React from 'react';

export function DashboardCards({ analysis, user }) {
  if (!analysis) return null;

  const { resilience, safeToSpend, forecast } = analysis;

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="top-cards">
      {/* Resilience Score */}
      <div className="glass-panel">
        <div className="flex-between">
          <div className="metric-label">Financial Resilience</div>
          <div className={`status-badge status-${resilience.band.toLowerCase()}`}>
            {resilience.band}
          </div>
        </div>
        <div className="metric-value text-gradient">{resilience.score} / 100</div>
        <div className="metric-footer">
          Income Stability: {resilience.breakdown.incomeStability} | Savings Buffer: {resilience.breakdown.savingsBuffer}
        </div>
      </div>

      {/* Safe to Spend */}
      <div className="glass-panel">
        <div className="metric-label">Safe to Spend</div>
        <div className="metric-value">{formatCurrency(safeToSpend.amount)}</div>
        <div className="metric-footer">
          Reserved {formatCurrency(safeToSpend.emergencyReserve)} for emergency
        </div>
      </div>

      {/* Expected Income */}
      <div className="glass-panel">
        <div className="metric-label">Expected Income</div>
        <div className="metric-value">{formatCurrency(forecast.expected)}</div>
        <div className="metric-footer">
          Range: {formatCurrency(forecast.low)} - {formatCurrency(forecast.high)}
        </div>
      </div>

      {/* Emergency Coverage */}
      <div className="glass-panel">
        <div className="metric-label">Emergency Coverage</div>
        <div className="metric-value">
          {user ? (user.currentSavings / user.essentialExpenses).toFixed(1) : 0} <span style={{fontSize: '1.2rem', color: 'var(--text-secondary)'}}>months</span>
        </div>
        <div className="metric-footer">
          Based on {formatCurrency(user?.essentialExpenses || 0)} essential expenses
        </div>
      </div>
    </div>
  );
}
