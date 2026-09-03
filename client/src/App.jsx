import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import ReactMarkdown from "react-markdown";
import { api } from "./api";
import "./App.css";

/* ── Custom Hooks ── */
function useCountUp(endValue, duration = 600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setValue(Math.floor(ease * endValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setValue(endValue);
      }
    };
    window.requestAnimationFrame(step);
  }, [endValue, duration]);

  return value;
}

/* ── Utility formatters ── */
const inr = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getStatusBadge = (band) => {
  switch (band) {
    case "Resilient":
    case "Stable":
      return { bg: "var(--accent-green-bg)", color: "var(--accent-green)", border: "#BBF7D0", label: band };
    case "Vulnerable":
      return { bg: "var(--accent-amber-bg)", color: "var(--accent-amber)", border: "#FDE68A", label: band };
    default:
      return { bg: "var(--accent-red-bg)", color: "var(--accent-red)", border: "#FECACA", label: band };
  }
};

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
══════════════════════════════════════════════════════════════════ */
function Sidebar({ activeUser, onUserChange, onNavClick, activeSection }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { id: "dashboard", label: "Overview", icon: "❖" },
    { id: "income", label: "Cash Flow", icon: "↗" },
    { id: "forecast", label: "Forecast", icon: "∿" },
    { id: "simulator", label: "Simulator", icon: "⚡" },
    { id: "coach", label: "AI Advisor", icon: "✦" },
  ];

  const personas = [
    { id: "ravi", name: "Ravi", role: "Delivery Partner" },
    { id: "priya", name: "Priya", role: "Freelancer" },
    { id: "arjun", name: "Arjun", role: "Auto Driver" },
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? 72 : 230,
        flexShrink: 0,
        borderRight: "1px solid var(--border-subtle)",
        padding: isCollapsed ? "24px 8px" : "24px 16px",
        background: "#FAF9F6",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease",
        overflow: "hidden"
      }}
    >
      <div>
        {/* Brand & Toggle */}
        <div style={{ padding: isCollapsed ? "0 4px 24px" : "0 8px 24px", display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "#191918",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              K
            </div>
            {!isCollapsed && (
              <div style={{ whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>Krypton</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Financial Resilience</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="btn-interactive"
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
        </div>

        {/* Collapsed Expand Button */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="btn-interactive"
            style={{ width: "100%", background: "transparent", border: "none", color: "var(--text-muted)", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, marginBottom: 16 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className="btn-interactive"
                title={isCollapsed ? item.label : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  gap: 10,
                  padding: isCollapsed ? "9px 0" : "9px 12px",
                  fontSize: 13,
                  borderRadius: 6,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "#EDECE6" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ fontSize: 14, color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Persona Switcher */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
        {!isCollapsed && (
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", padding: "0 8px 8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            Switch Persona
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {personas.map((p) => {
            const isSelected = activeUser === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onUserChange(p.id)}
                className="btn-interactive"
                title={isCollapsed ? p.name : ""}
                style={{
                  padding: isCollapsed ? "9px 0" : "7px 10px",
                  borderRadius: 6,
                  fontSize: 12.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "space-between",
                  color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isSelected ? "var(--bg-card)" : "transparent",
                  border: isSelected ? "1px solid var(--border-subtle)" : "1px solid transparent",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {isCollapsed ? (
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: isSelected ? "#191918" : "#D5D3CB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                    {p.name.charAt(0)}
                  </div>
                ) : (
                  <>
                    <span>{p.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.role}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN APPLICATION
══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [activeUserId, setActiveUserId] = useState("ravi");
  const [user, setUser] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");

  // Simulator State
  const [simPercent, setSimPercent] = useState(-20);
  const [simResult, setSimResult] = useState(null);

  // Coach Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadUser(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    if (chatEndRef.current && activeSection === "coach") {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping, activeSection]);

  const loadUser = async (userId) => {
    setLoading(true);
    setSimPercent(-20);
    setChatHistory([
      {
        role: "model",
        parts: [{
          text: `Hello **${userId === "ravi" ? "Ravi" : userId === "priya" ? "Priya" : "Arjun"}**! I'm your Krypton Financial Advisor. I have full real-time visibility into your earnings history, fixed commitments, and emergency reserves. What financial decisions can I help guide today?`
        }]
      }
    ]);

    try {
      const demoRes = await api.getDemoUser(userId);
      if (demoRes.success) {
        setUser(demoRes.data);
        const analysisRes = await api.analyzeFinancials(demoRes.data);
        if (analysisRes.success) {
          setAnalysis(analysisRes.data);
        }
        const simRes = await api.simulateShock(demoRes.data, -20);
        if (simRes.success) setSimResult(simRes.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSimulate = async (pct) => {
    setSimPercent(pct);
    try {
      const res = await api.simulateShock(user, pct);
      if (res.success) setSimResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (customPrompt) => {
    const text = customPrompt || chatInput;
    if (!text.trim() || !analysis || !user) return;

    const userMessage = { role: "user", parts: [{ text: text.trim() }] };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);

    try {
      const metrics = {
        incomeRange: analysis.forecast,
        essentialExpenses: user.essentialExpenses,
        savings: user.currentSavings,
        debtPayment: user.monthlyDebtPayment,
        incomeVolatility: analysis.incomeAnalysis.volatility,
        resilienceScore: analysis.resilience.score,
      };

      const res = await api.chatWithAI(metrics, [...chatHistory, userMessage], activeUserId);
      if (res.success) {
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: res.data }] }]);
        if (res.actionExecuted) {
           loadUser(activeUserId);
        }
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: "Unable to reach the AI engine right now. Please try again." }] }]);
    }
    setIsTyping(false);
  };

  const targetSafeToSpend = analysis?.safeToSpend?.amount || 0;
  const targetSavings = user?.currentSavings || 0;
  const targetAvgIncome = analysis?.incomeAnalysis?.average || 0;
  const targetObligations = (user?.essentialExpenses || 0) + (user?.monthlyDebtPayment || 0);

  const animatedSafeToSpend = useCountUp(targetSafeToSpend);
  const animatedSavings = useCountUp(targetSavings);
  const animatedAvgIncome = useCountUp(targetAvgIncome);
  const animatedObligations = useCountUp(targetObligations);

  if (loading || !user || !analysis) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-app)", color: "var(--text-muted)", fontSize: 13 }}>
        Loading financial data...
      </div>
    );
  }

  /* ── Derived Metrics ── */
  const { incomeAnalysis, forecast, resilience, safeToSpend } = analysis;
  const statusBadge = getStatusBadge(resilience.band);
  const monthlyObligations = user.essentialExpenses + user.monthlyDebtPayment;
  const avgIncome = incomeAnalysis.average;
  const netSurplus = avgIncome - monthlyObligations;
  const coverageMonths = (user.currentSavings / (user.essentialExpenses || 1)).toFixed(1);

  const now = new Date();
  const chartData = user.income.map((val, i) => {
    const mIdx = (now.getMonth() - user.income.length + 1 + i + 12) % 12;
    return { month: MONTHS[mIdx], income: val };
  });

  const breakdownData = [
    { name: "Avg Income", value: avgIncome, fill: "#191918" },
    { name: "Essentials", value: user.essentialExpenses, fill: "#D97706" },
    { name: "Debt Pay", value: user.monthlyDebtPayment, fill: "#B45309" },
    { name: "Surplus", value: Math.max(0, netSurplus), fill: "#15803D" },
  ];

  const resiliencePillars = [
    { label: "Income Stability", score: resilience.breakdown.incomeStability || 0 },
    { label: "Savings Buffer", score: resilience.breakdown.savingsBuffer || 0 },
    { label: "Debt Capacity", score: resilience.breakdown.debtCapacity || 0 },
    { label: "Expense Flexibility", score: resilience.breakdown.expenseFlexibility || 0 },
    { label: "Income Trend", score: resilience.breakdown.incomeTrend || 0 },
  ];

  const forecastData = chartData.concat([
    { month: "Next 1*", low: forecast.low, expected: forecast.expected, high: forecast.high },
    { month: "Next 2*", low: forecast.low, expected: forecast.expected, high: forecast.high },
    { month: "Next 3*", low: forecast.low, expected: forecast.expected, high: forecast.high },
  ]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>
      {/* ── Left Sidebar ── */}
      <Sidebar
        activeUser={activeUserId}
        onUserChange={setActiveUserId}
        onNavClick={setActiveSection}
        activeSection={activeSection}
      />

      {/* ── Main View Container (Balanced, well-filled layout) ── */}
      <main style={{ flex: 1, padding: "28px 40px", maxWidth: 1240, width: "100%", margin: "0 auto", overflowY: "auto", height: "100vh" }}>
        
        {/* Top Header Bar */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
              {user.occupation} · {user.incomeType} income
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}>
              ● {statusBadge.label} ({resilience.score}/100)
            </span>
            <button
              className="btn-interactive"
              style={{ background: "transparent", border: "1px solid var(--border-light)", color: "var(--text-primary)", width: 32, height: 32, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════
            1. OVERVIEW (Dashboard)
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "dashboard" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* 4 Essential Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <div className="minimal-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Safe to Spend</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>{inr(animatedSafeToSpend)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>Discretionary ceiling</div>
              </div>

              <div className="minimal-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Liquid Savings</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>{inr(animatedSavings)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{coverageMonths} months essentials</div>
              </div>

              <div className="minimal-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Monthly Earnings</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>{inr(animatedAvgIncome)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{(incomeAnalysis.volatility * 100).toFixed(0)}% volatility</div>
              </div>

              <div className="minimal-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Fixed Commitments</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>{inr(animatedObligations)}</div>
                <div style={{ fontSize: 11.5, color: netSurplus >= 0 ? "var(--accent-green)" : "var(--accent-red)", marginTop: 4 }}>
                  {netSurplus >= 0 ? `+${inr(netSurplus)} surplus` : `${inr(netSurplus)} deficit`}
                </div>
              </div>
            </div>

            {/* Row 2: 2 Balanced Side-by-Side Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
              {/* Income Line Chart */}
              <div className="minimal-card" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Income Cash Flow History</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Past 6 months vs {inr(monthlyObligations)} fixed commitments</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    <span style={{ color: "#191918" }}>● Inflow</span> · <span style={{ color: "var(--accent-amber)" }}>-- Fixed Obligations</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={monthlyObligations} stroke="var(--accent-amber)" strokeDasharray="4 4" />
                    <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-subtle)", borderRadius: 6, background: "#FFFFFF" }} />
                    <Line type="monotone" dataKey="income" stroke="#191918" strokeWidth={2} dot={{ r: 3.5, fill: "#191918" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Resilience Pillars Breakdown */}
              <div className="minimal-card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Resilience Pillar Breakdown</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Health score across 5 key dimensions</div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {resiliencePillars.map((p) => (
                      <div key={p.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "var(--text-secondary)" }}>{p.label}</span>
                          <strong style={{ fontVariantNumeric: "tabular-nums" }}>{p.score}%</strong>
                        </div>
                        <div style={{ height: 5, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${p.score}%`, height: "100%", background: p.score > 60 ? "var(--accent-green)" : p.score > 35 ? "var(--accent-amber)" : "var(--accent-red)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 10, marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)" }}>
                  <span>Overall Resilience:</span>
                  <strong style={{ color: statusBadge.color }}>{resilience.score} / 100 ({resilience.band})</strong>
                </div>
              </div>
            </div>

            {/* Row 3: Recommendations & Financial Goal */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
              {/* Recommendations */}
              <div className="minimal-card" style={{ padding: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Priority Action Checklist</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {coverageMonths < 3 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-app)", borderRadius: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>Build emergency buffer to 3 months ({inr(user.essentialExpenses * 3)})</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>Current savings cover {coverageMonths} months of essentials</div>
                      </div>
                      <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 4, background: "var(--accent-red-bg)", color: "var(--accent-red)", fontWeight: 600 }}>
                        High
                      </span>
                    </div>
                  )}
                  {incomeAnalysis.volatility > 0.2 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-app)", borderRadius: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>Save excess during peak earning months</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>{(incomeAnalysis.volatility * 100).toFixed(0)}% volatility requires counter-cyclical reserves</div>
                      </div>
                      <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 4, background: "var(--accent-amber-bg)", color: "var(--accent-amber)", fontWeight: 600 }}>
                        Medium
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-app)", borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Maintain discretionary spending ceiling of {inr(safeToSpend.amount)}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>Protects emergency reserve while fulfilling debt commitments</div>
                    </div>
                    <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 4, background: "var(--accent-green-bg)", color: "var(--accent-green)", fontWeight: 600 }}>
                      Guideline
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Goal Card */}
              <div className="minimal-card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Financial Target</div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--bg-subtle)", textTransform: "capitalize", fontWeight: 600 }}>
                      {user.financialGoal?.replace("_", " ")}
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14 }}>
                    {user.financialGoal === "emergency_fund" && `Targeting 3 months of emergency expenses (${inr(user.essentialExpenses * 3)}). You have currently funded ${inr(user.currentSavings)}.`}
                    {user.financialGoal === "investment" && `Safety buffer ready. Allocate excess monthly surplus (${inr(Math.max(0, netSurplus))}/mo) into low-volatility assets.`}
                    {user.financialGoal === "debt_repayment" && `Active debt payments are ${inr(user.monthlyDebtPayment)}/mo. Clear high-interest liabilities to free up monthly cashflow.`}
                  </div>

                  {user.financialGoal === "emergency_fund" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                        <span style={{ color: "var(--text-muted)" }}>Buffer Funded</span>
                        <strong>{Math.min(100, Math.round((user.currentSavings / (user.essentialExpenses * 3)) * 100))}%</strong>
                      </div>
                      <div style={{ height: 6, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, (user.currentSavings / (user.essentialExpenses * 3)) * 100)}%`, height: "100%", background: "var(--accent-green)", borderRadius: 3 }} />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveSection("coach")}
                  className="btn-interactive"
                  style={{
                    marginTop: 14,
                    width: "100%",
                    padding: "9px 12px",
                    background: "#191918",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  ✦ Consult AI Advisor
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2. CASH FLOW (Income)
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "income" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <div className="minimal-card" style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Average Inflow</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{inr(avgIncome)}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{incomeAnalysis.periods} recorded months</div>
              </div>
              <div className="minimal-card" style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Median Baseline</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{inr(incomeAnalysis.median)}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Typical month</div>
              </div>
              <div className="minimal-card" style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Volatility</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: incomeAnalysis.volatility > 0.2 ? "var(--accent-red)" : "inherit" }}>
                  {(incomeAnalysis.volatility * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Monthly variance</div>
              </div>
              <div className="minimal-card" style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Earning Range</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{inr(incomeAnalysis.maximum - incomeAnalysis.minimum)}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Min {inr(incomeAnalysis.minimum)} · Max {inr(incomeAnalysis.maximum)}</div>
              </div>
            </div>

            {/* Row 2: Cash Allocation Chart & Table */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
              <div className="minimal-card" style={{ padding: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Inflow vs Fixed Commitments</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={monthlyObligations} stroke="var(--accent-amber)" strokeDasharray="4 4" />
                    <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-subtle)", borderRadius: 6, background: "#FFFFFF" }} />
                    <Line type="monotone" dataKey="income" stroke="#191918" strokeWidth={2} dot={{ r: 3.5, fill: "#191918" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Cash Allocation */}
              <div className="minimal-card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Monthly Cash Allocation</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Distribution of average monthly income</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                      <XAxis type="number" tickFormatter={inr} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} width={75} />
                      <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-subtle)", borderRadius: 6, background: "#FFFFFF" }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                        {breakdownData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 10, marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                  <span>Fixed Load: <strong>{((monthlyObligations / avgIncome) * 100).toFixed(0)}%</strong></span>
                  <span>Surplus Rate: <strong style={{ color: "var(--accent-green)" }}>{((Math.max(0, netSurplus) / avgIncome) * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            </div>

            {/* Monthly Earnings Grid */}
            <div className="minimal-card" style={{ padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Historical Monthly Log</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {chartData.map((d, i) => {
                  const isSafe = user.income[i] >= monthlyObligations;
                  return (
                    <div key={i} style={{ padding: "12px 14px", background: "var(--bg-app)", borderRadius: 6, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.month}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{inr(user.income[i])}</div>
                      <div style={{ fontSize: 10.5, color: isSafe ? "var(--accent-green)" : "var(--accent-red)", marginTop: 4, fontWeight: 500 }}>
                        {isSafe ? "✓ Covered" : "⚠️ Deficit"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            3. FORECAST (Future Projections)
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "forecast" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div className="minimal-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Pessimistic Low (16th %)</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: forecast.low < monthlyObligations ? "var(--accent-red)" : "inherit" }}>
                  {inr(forecast.low)}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Low scenario projection</div>
              </div>
              <div className="minimal-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Expected Median (50th %)</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{inr(forecast.expected)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Baseline expectation</div>
              </div>
              <div className="minimal-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Optimistic High (84th %)</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "var(--accent-green)" }}>{inr(forecast.high)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Peak month potential</div>
              </div>
            </div>

            <div className="minimal-card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>3-Month Projected Inflow Envelope</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Historical data + 3-month forecast range (* projected months)</div>
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 11.5 }}>
                  <span style={{ color: "#191918" }}>● Actual</span>
                  <span style={{ color: "var(--accent-green)" }}>-- Expected</span>
                  <span style={{ color: "var(--accent-red)" }}>-- Fixed Commitments</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={forecastData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="high" stroke="none" fill="#E8F4EE" fillOpacity={0.7} />
                  <Area type="monotone" dataKey="low" stroke="none" fill="#FDF3E7" fillOpacity={0.7} />
                  <Line type="monotone" dataKey="income" stroke="#191918" strokeWidth={2} dot={{ r: 3.5, fill: "#191918" }} connectNulls={false} />
                  <ReferenceLine y={monthlyObligations} stroke="var(--accent-red)" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Narrative Scenario Assessment */}
            <div className="minimal-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>Scenario Stress Assessment</div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {forecast.low >= monthlyObligations ? (
                  `✅ In the lowest projected earning month (${inr(forecast.low)}), your income comfortably covers all fixed commitments (${inr(monthlyObligations)}). You are in a stable position.`
                ) : (
                  `⚠️ In a low-income month (${inr(forecast.low)}), you face a potential deficit of ${inr(monthlyObligations - forecast.low)}. Maintain at least ${inr((monthlyObligations - forecast.low) * 3)} in your emergency buffer to withstand 3 consecutive lean months.`
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            4. SIMULATOR (Shock Stress Testing)
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "simulator" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="minimal-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Income Shock Stress Test</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Model the impact of sudden earning drops on your liquid runway</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-amber)" }}>
                  {simPercent}% Shock
                </div>
              </div>

              {/* Preset Buttons */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[-10, -20, -30, -50, -75].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handleSimulate(pct)}
                    className="btn-interactive"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: simPercent === pct ? 600 : 400,
                      background: simPercent === pct ? "#191918" : "var(--bg-app)",
                      color: simPercent === pct ? "#FFFFFF" : "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {pct}% Drop
                  </button>
                ))}
              </div>

              {/* Output Strip */}
              {simResult && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ padding: "14px 16px", background: "var(--bg-app)", borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Projected Inflow</div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{inr(simResult.scenarioIncome)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Down from {inr(simResult.expectedIncome)}</div>
                  </div>

                  <div style={{ padding: "14px 16px", background: simResult.monthlySurplus >= 0 ? "var(--accent-green-bg)" : "var(--accent-red-bg)", borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Monthly Balance</div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: simResult.monthlySurplus >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                      {inr(simResult.monthlySurplus)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {simResult.monthlySurplus >= 0 ? "Positive buffer" : "Monthly savings drain"}
                    </div>
                  </div>

                  <div style={{ padding: "14px 16px", background: "var(--bg-app)", borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Runway Available</div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{simResult.savingsCoverage} Months</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Until savings depleted</div>
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Bar Chart */}
            {simResult && (
              <div className="minimal-card" style={{ padding: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Inflow vs Fixed Commitments Comparison</div>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart
                    data={[
                      { name: "Normal Inflow", current: simResult.expectedIncome, shocked: 0 },
                      { name: `Shocked (${simPercent}%)`, current: 0, shocked: simResult.scenarioIncome },
                      { name: "Fixed Commitments", current: simResult.monthlyObligations, shocked: simResult.monthlyObligations },
                    ]}
                    margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-subtle)", borderRadius: 6, background: "#FFFFFF" }} />
                    <Bar dataKey="current" fill="#191918" radius={[4, 4, 0, 0]} barSize={36} />
                    <Bar dataKey="shocked" fill="var(--accent-amber)" radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            5. AI ADVISOR (Coach - Full Screen Height Split View)
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "coach" && (
          <div className="view-fade-in" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18, height: "calc(100vh - 120px)" }}>
            
            {/* Left: Chat Messenger */}
            <div className="minimal-card" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>✦ Krypton Financial AI Advisor</div>
                <button
                  onClick={() => setChatHistory([{ role: "model", parts: [{ text: `Chat refreshed. How can I help you manage your finances today, ${user.name}?` }] }])}
                  className="btn-interactive"
                  style={{ fontSize: 11.5, color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border-subtle)", padding: "4px 8px", borderRadius: 4 }}
                >
                  Clear Chat
                </button>
              </div>

              {/* Message List */}
              <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
                {chatHistory.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isUser ? "flex-end" : "flex-start",
                        maxWidth: "82%",
                        padding: "12px 16px",
                        borderRadius: 8,
                        background: isUser ? "#191918" : "var(--bg-app)",
                        color: isUser ? "#FFFFFF" : "var(--text-primary)",
                      }}
                    >
                      <div className="chat-markdown">
                        <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: 8, background: "var(--bg-app)", color: "var(--text-muted)", fontSize: 12.5, fontStyle: "italic" }}>
                    Analyzing cash flow and reasoning...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input field */}
              <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask a financial question (e.g. 'Can I afford to spend ₹3,000 today?')..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: "1px solid var(--border-subtle)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isTyping || !chatInput.trim()}
                  className="btn-interactive"
                  style={{
                    padding: "0 18px",
                    borderRadius: 6,
                    background: "#191918",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    opacity: isTyping || !chatInput.trim() ? 0.4 : 1,
                    cursor: isTyping || !chatInput.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  Send
                </button>
              </div>
            </div>

            {/* Right: Live Financial Context & Suggested Prompts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", overflowY: "auto" }}>
              <div className="minimal-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Live Advisor Context</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Safe to Spend:</span>
                    <strong>{inr(safeToSpend.amount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Liquid Reserves:</span>
                    <strong>{inr(user.currentSavings)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>Monthly Fixed Load:</span>
                    <strong style={{ color: "var(--accent-amber)" }}>{inr(monthlyObligations)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Resilience Score:</span>
                    <strong style={{ color: statusBadge.color }}>{resilience.score}/100</strong>
                  </div>
                </div>
              </div>

              <div className="minimal-card" style={{ padding: 18, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Suggested Inquiries</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    "Can I afford to buy a ₹20,000 phone?",
                    "How much should I save this month?",
                    "Can I take on a ₹3,000/mo EMI loan?",
                    "What is my biggest financial risk right now?",
                    "Can I spend ₹4,000 on bike repairs today?",
                  ].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="btn-interactive"
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
