import React, { useState, useEffect } from 'react';
import { api } from '../api';

export function CoachChat({ analysis, user }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (analysis && user) {
      fetchAdvice();
    }
  }, [analysis, user]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      // Build metrics payload for Gemini
      const metrics = {
        incomeRange: analysis.forecast,
        essentialExpenses: user.essentialExpenses,
        savings: user.currentSavings,
        debtPayment: user.monthlyDebtPayment,
        incomeVolatility: analysis.incomeAnalysis.volatility,
        resilienceScore: analysis.resilience.score
      };
      
      const res = await api.getAIAdvice(metrics);
      if (res.success) {
        setAdvice(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch advice", err);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel coach-section">
      <div className="flex-between" style={{marginBottom: '20px'}}>
        <h2 style={{fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span style={{fontSize: '2rem'}}>🧠</span> Krypton Coach
        </h2>
        {loading && <span style={{color: 'var(--accent-color)'}}>Thinking...</span>}
      </div>

      {!advice && !loading && (
        <div style={{color: 'var(--text-secondary)'}}>Waiting for financial data to analyze...</div>
      )}

      {advice && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
          <div style={{background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
            <h3 style={{color: '#93c5fd', marginBottom: '12px', fontSize: '1.1rem'}}>Analysis Summary</h3>
            <p>{advice.summary}</p>
            <p style={{marginTop: '12px'}}>{advice.simpleExplanation}</p>
          </div>
          
          <div style={{background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)'}}>
            <h3 style={{color: '#fcd34d', marginBottom: '12px', fontSize: '1.1rem'}}>Primary Risk Factor</h3>
            <p>{advice.risk}</p>
            
            <h4 style={{color: '#fcd34d', marginTop: '16px', marginBottom: '8px'}}>Buffer Strategy</h4>
            <p>{advice.bufferAdvice}</p>
          </div>
          
          <div style={{background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
            <h3 style={{color: '#6ee7b7', marginBottom: '12px', fontSize: '1.1rem'}}>Actionable Recommendations</h3>
            <ul style={{listStylePosition: 'inside', paddingLeft: 0}}>
              {advice.recommendations?.map((rec, i) => (
                <li key={i} style={{marginBottom: '8px'}}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
