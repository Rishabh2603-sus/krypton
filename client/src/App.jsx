import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

/* ── Utility formatters ── */
const inr = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── Badge status helper ── */
const getStatusBadge = (band) => {
  switch (band) {
    case "Resilient":
    case "Stable":
      return { bg: "var(--accent-green-bg)", color: "var(--accent-green)", label: band };
    case "Vulnerable":
      return { bg: "var(--accent-amber-bg)", color: "var(--accent-amber)", label: band };
    default:
      return { bg: "var(--accent-red-bg)", color: "var(--accent-red)", label: band };
  }
};

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT (Linear/Raycast Minimalist Style)
══════════════════════════════════════════════════════════════════ */
function Sidebar({ activeUser, onUserChange, onNavClick, activeSection }) {
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
        width: 220,
        flexShrink: 0,
        borderRight: "1px solid var(--border-subtle)",
        padding: "24px 16px",
        background: "#FAF9F6",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {/* Logo */}
        <div style={{ padding: "0 8px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              background: "#191918",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            K
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>Krypton</span>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className="btn-interactive"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  fontSize: 13,
                  borderRadius: 6,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "#EDECE6" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 13, color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Persona Switcher */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "0 8px 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Persona
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {personas.map((p) => {
            const isSelected = activeUser === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onUserChange(p.id)}
                className="btn-interactive"
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  fontSize: 12.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isSelected ? "var(--bg-card)" : "transparent",
                  border: isSelected ? "1px solid var(--border-subtle)" : "1px solid transparent",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span>{p.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.role}</span>
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

  // Simulator
  const [simPercent, setSimPercent] = useState(-20);
  const [simResult, setSimResult] = useState(null);

  // Coach Chat
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
        parts: [{ text: `Hello! I'm your Krypton Advisor. I have full context on your income patterns and fixed commitments. How can I guide your finances today?` }]
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

      const res = await api.chatWithAI(metrics, [...chatHistory, userMessage]);
      if (res.success) {
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: res.data }] }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: "Unable to reach the AI engine. Please try again." }] }]);
    }
    setIsTyping(false);
  };

  if (loading || !user || !analysis) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-app)", color: "var(--text-muted)", fontSize: 13 }}>
        Loading financial data...
      </div>
    );
  }

  /* ── Calculations ── */
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

      {/* ── Main View Area ── */}
      <main style={{ flex: 1, padding: "36px 48px", maxWidth: 1040, margin: "0 auto", overflowY: "auto", height: "100vh" }}>
        
        {/* Header */}
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              {user.occupation} · {user.incomeType} income stream
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: statusBadge.bg, color: statusBadge.color }}>
              ● {statusBadge.label} ({resilience.score}/100)
            </span>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════
            1. OVERVIEW (Dashboard)
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "dashboard" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* 4 Clean Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <div className="minimal-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Safe to Spend</div>
                <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6, letterSpacing: "-0.01em" }}>{inr(safeToSpend.amount)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>After reserves</div>
              </div>

              <div className="minimal-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Liquid Savings</div>
                <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6, letterSpacing: "-0.01em" }}>{inr(user.currentSavings)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{coverageMonths} mo essentials</div>
              </div>

              <div className="minimal-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Average Income</div>
                <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6, letterSpacing: "-0.01em" }}>{inr(avgIncome)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{(incomeAnalysis.volatility * 100).toFixed(0)}% volatility</div>
              </div>

              <div className="minimal-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Fixed Commitments</div>
                <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6, letterSpacing: "-0.01em" }}>{inr(monthlyObligations)}</div>
                <div style={{ fontSize: 11.5, color: netSurplus >= 0 ? "var(--accent-green)" : "var(--accent-red)", marginTop: 4 }}>
                  {netSurplus >= 0 ? `+${inr(netSurplus)} surplus` : `${inr(netSurplus)} deficit`}
                </div>
              </div>
            </div>

            {/* Income Trend Chart */}
            <div className="minimal-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Income Cash Flow</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Historical monthly earnings vs {inr(monthlyObligations)} fixed commitments</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <span style={{ color: "#191918" }}>● Income</span> · <span style={{ color: "var(--accent-amber)" }}>-- Fixed obligations</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={monthlyObligations} stroke="var(--accent-amber)" strokeDasharray="4 4" />
                  <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-subtle)", borderRadius: 6, background: "#FFFFFF" }} />
                  <Line type="monotone" dataKey="income" stroke="#191918" strokeWidth={2} dot={{ r: 3, fill: "#191918" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendations & Actions */}
            <div className="minimal-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Key Recommendations</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {coverageMonths < 3 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-app)", borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Build emergency buffer to 3 months ({inr(user.essentialExpenses * 3)})</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Currently covering {coverageMonths} months of essentials</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--accent-red-bg)", color: "var(--accent-red)", fontWeight: 500 }}>
                      High Priority
                    </span>
                  </div>
                )}
                {incomeAnalysis.volatility > 0.2 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-app)", borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Save excess earnings in peak months</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>High volatility ({(incomeAnalysis.volatility * 100).toFixed(0)}%) requires counter-cyclical buffers</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--accent-amber-bg)", color: "var(--accent-amber)", fontWeight: 500 }}>
                      Medium
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-app)", borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Maintain discretionary spending ceiling of {inr(safeToSpend.amount)}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Safeguards emergency reserve while meeting fixed debts</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--accent-green-bg)", color: "var(--accent-green)", fontWeight: 500 }}>
                    Guideline
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2. CASH FLOW (Income)
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "income" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="minimal-card" style={{ padding: 22 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Monthly Income Range</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{inr(incomeAnalysis.minimum)} – {inr(incomeAnalysis.maximum)}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Spread of {inr(incomeAnalysis.maximum - incomeAnalysis.minimum)}</div>
              </div>
              <div className="minimal-card" style={{ padding: 22 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Fixed Expense Ratio</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>{((monthlyObligations / avgIncome) * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Of average monthly income goes to essentials & debt</div>
              </div>
            </div>

            {/* Monthly Earnings Grid */}
            <div className="minimal-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Historical Months Log</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {chartData.map((d, i) => {
                  const isSafe = user.income[i] >= monthlyObligations;
                  return (
                    <div key={i} style={{ padding: "12px", background: "var(--bg-app)", borderRadius: 6, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.month}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{inr(user.income[i])}</div>
                      <div style={{ fontSize: 10.5, color: isSafe ? "var(--accent-green)" : "var(--accent-red)", marginTop: 4 }}>
                        {isSafe ? "Surplus" : "Deficit"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            3. FORECAST
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "forecast" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div className="minimal-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Low Scenario</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: forecast.low < monthlyObligations ? "var(--accent-red)" : "inherit" }}>
                  {inr(forecast.low)}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Pessimistic estimate</div>
              </div>
              <div className="minimal-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Expected Baseline</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{inr(forecast.expected)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Median monthly projection</div>
              </div>
              <div className="minimal-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Optimistic Scenario</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: "var(--accent-green)" }}>{inr(forecast.high)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Peak potential</div>
              </div>
            </div>

            <div className="minimal-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>3-Month Projected Inflow Envelope</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={forecastData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="high" stroke="none" fill="#E8F4EE" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="low" stroke="none" fill="#FDF3E7" fillOpacity={0.6} />
                  <Line type="monotone" dataKey="income" stroke="#191918" strokeWidth={2} dot={{ r: 3, fill: "#191918" }} />
                  <ReferenceLine y={monthlyObligations} stroke="var(--accent-red)" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            4. SIMULATOR
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "simulator" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="minimal-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Stress Test Income Shock</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 18 }}>Select a potential earnings drop to model savings depletion</div>

              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[-10, -20, -30, -50].map((pct) => (
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

              {simResult && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Projected Inflow</div>
                    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{inr(simResult.scenarioIncome)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Monthly Balance</div>
                    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4, color: simResult.monthlySurplus >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                      {inr(simResult.monthlySurplus)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Runway Available</div>
                    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{simResult.savingsCoverage} Months</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            5. AI ADVISOR (Coach)
        ═══════════════════════════════════════════════════════════ */}
        {activeSection === "coach" && (
          <div className="view-fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
            <div className="minimal-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              
              {/* Messages list */}
              <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                {chatHistory.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isUser ? "flex-end" : "flex-start",
                        maxWidth: "80%",
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
                  <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: 8, background: "var(--bg-app)", color: "var(--text-muted)", fontSize: 12.5 }}>
                    Thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick suggestions */}
              <div style={{ padding: "0 24px 12px", display: "flex", gap: 8, overflowX: "auto" }}>
                {[
                  "Can I spend ₹3,000 on shoes today?",
                  "Can I afford to buy a ₹20,000 phone?",
                  "How much should I save this month?",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="btn-interactive"
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      background: "var(--bg-app)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input field */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 10 }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask a question about your budget, loans, or spending..."
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
                    padding: "0 20px",
                    borderRadius: 6,
                    background: "#191918",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 500,
                    fontSize: 13,
                    opacity: isTyping || !chatInput.trim() ? 0.4 : 1,
                    cursor: isTyping || !chatInput.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  Send
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
