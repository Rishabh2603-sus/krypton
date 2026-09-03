import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function IncomeChart({ incomeHistory }) {
  if (!incomeHistory || !incomeHistory.length) return null;

  // Format data for Recharts
  const data = incomeHistory.map((val, index) => ({
    name: `Month ${index + 1}`,
    amount: val
  }));

  return (
    <div className="glass-panel chart-section">
      <div className="flex-between" style={{marginBottom: '24px'}}>
        <h2 style={{fontSize: '1.5rem', fontWeight: 600}}>Income History</h2>
        <div className="status-badge status-vulnerable">Highly Variable</div>
      </div>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: '#94a3b8'}} />
            <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: '#94a3b8'}} tickFormatter={(value) => `₹${value/1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#141a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`₹${value}`, 'Income']}
            />
            <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
