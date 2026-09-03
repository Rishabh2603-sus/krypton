import React, { useState } from 'react';
import { api } from '../api';

export function SimulatorPanel({ user, currentForecast }) {
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePercent, setActivePercent] = useState(null);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleSimulate = async (percentage) => {
    setLoading(true);
    setActivePercent(percentage);
    try {
      const res = await api.simulateShock(user, percentage);
      if (res.success) {
        setSimulationResult(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel simulator-section flex-column">
      <h2 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px'}}>Income Shock Simulator</h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>What if your income changes?</p>
      
      <div style={{display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'}}>
        {[-10, -20, -30, -50].map((pct) => (
          <button 
            key={pct}
            onClick={() => handleSimulate(pct)}
            className={activePercent === pct ? 'btn-primary' : 'btn-outline'}
            style={{flex: 1}}
            disabled={loading}
          >
            {pct}%
          </button>
        ))}
      </div>

      {simulationResult && (
        <div style={{
          background: 'rgba(0,0,0,0.2)', 
          padding: '20px', 
          borderRadius: '12px',
          marginTop: 'auto'
        }}>
          <div className="flex-between" style={{marginBottom: '12px'}}>
            <span style={{color: 'var(--text-secondary)'}}>Projected Income</span>
            <span style={{fontWeight: 600, fontSize: '1.2rem'}}>{formatCurrency(simulationResult.scenarioIncome)}</span>
          </div>
          
          <div className="flex-between" style={{marginBottom: '12px'}}>
            <span style={{color: 'var(--text-secondary)'}}>Monthly Deficit/Surplus</span>
            <span style={{
              fontWeight: 600, 
              color: simulationResult.monthlySurplus < 0 ? 'var(--danger-color)' : 'var(--success-color)'
            }}>
              {formatCurrency(simulationResult.monthlySurplus)}
            </span>
          </div>
          
          <div className="flex-between" style={{marginBottom: '12px'}}>
            <span style={{color: 'var(--text-secondary)'}}>Savings Coverage</span>
            <span style={{fontWeight: 600}}>{simulationResult.savingsCoverage} months</span>
          </div>
          
          <div className="flex-between" style={{marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)'}}>
            <span>Risk Level</span>
            <span className={`status-badge ${simulationResult.risk === 'High' ? 'status-critical' : simulationResult.risk === 'Moderate' ? 'status-vulnerable' : 'status-resilient'}`}>
              {simulationResult.risk}
            </span>
          </div>
        </div>
      )}

      {!simulationResult && (
        <div className="flex-center" style={{height: '100%', color: 'var(--text-secondary)', opacity: 0.5}}>
          Select a percentage above to run simulation
        </div>
      )}
    </div>
  );
}
