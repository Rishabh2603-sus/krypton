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

/* ── Formatting & Tone Helpers ── */

const inr = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const bandTone = {
  Critical:   { bg: "#FCEBEB", border: "#A32D2D", text: "#501313", badge: "#791F1F", lightBg: "#FFF5F5" },
  Vulnerable: { bg: "#FAEEDA", border: "#BA7517", text: "#412402", badge: "#633806", lightBg: "#FFFDF8" },
  Stable:     { bg: "#EAF3DE", border: "#639922", text: "#173404", badge: "#225206", lightBg: "#F9FCF5" },
  Resilient:  { bg: "#E8F4EE", border: "#2D8A56", text: "#0E3D1F", badge: "#0E3D1F", lightBg: "#F5FAF7" },
};

const priorityTone = {
  HIGH:   { bg: "#FCEBEB", border: "#F0D5CC", text: "#791F1F", badgeBg: "#FCEBEB" },
  MEDIUM: { bg: "#FAEEDA", border: "#F0DFC0", text: "#633806", badgeBg: "#FAEEDA" },
  LOW:    { bg: "#F1EFE8", border: "#E4E1D6", text: "#444441", badgeBg: "#EFEDE4" },
};

/* ── Derive Risk Factors ── */
function deriveRiskFactors(breakdown) {
  if (!breakdown) return [];
  const factors = [
    { label: "Income Volatility", pct: Math.max(0, 100 - (breakdown.incomeStability || 0)), desc: "Fluctuations across months" },
    { label: "Savings Buffer Deficit", pct: Math.max(0, 100 - (breakdown.savingsBuffer || 0)), desc: "Gap from 6-month target" },
    { label: "Debt Payment Pressure", pct: Math.max(0, 100 - (breakdown.debtCapacity || 0)), desc: "Fixed debt vs monthly income" },
    { label: "Fixed Expense Rigidity", pct: Math.max(0, 100 - (breakdown.expenseFlexibility || 0)), desc: "Inflexible living necessities" },
  ];
  return factors.sort((a, b) => b.pct - a.pct).filter((f) => f.pct > 0);
}

/* ── Derive Recommendations ── */
function deriveRecommendations(analysis, user) {
  if (!analysis || !user) return [];
  const recs = [];
  const { incomeAnalysis, safeToSpend } = analysis;

  const coverageMonths = user.currentSavings / (user.essentialExpenses || 1);
  if (coverageMonths < 3) {
    const target = user.essentialExpenses * 3;
    recs.push({
      priority: "HIGH",
      action: "Build 3-month emergency safety buffer",
      reason: `Current reserves cover only ${coverageMonths.toFixed(1)} months of essentials`,
      impact: Math.max(0, target - user.currentSavings),
      category: "Savings"
    });
  }

  if (incomeAnalysis.volatility > 0.2) {
    recs.push({
      priority: "HIGH",
      action: "Deposit 50% of windfall earnings during peak months",
      reason: `High ${(incomeAnalysis.volatility * 100).toFixed(0)}% volatility requires counter-cyclical buffers`,
      impact: Math.round((incomeAnalysis.maximum - incomeAnalysis.average) * 0.5),
      category: "Income"
    });
  }

  const debtRatio = user.monthlyDebtPayment / (incomeAnalysis.average || 1);
  if (debtRatio > 0.1) {
    recs.push({
      priority: "MEDIUM",
      action: "Prioritize debt principal paydown to unlock cash flow",
      reason: `Debt payments consume ${(debtRatio * 100).toFixed(0)}% of your monthly average earnings`,
      impact: user.monthlyDebtPayment,
      category: "Debt"
    });
  }

  const expenseRatio = user.essentialExpenses / (incomeAnalysis.average || 1);
  if (expenseRatio > 0.7) {
    recs.push({
      priority: "MEDIUM",
      action: "Audit recurring bills and optimize non-essential overhead",
      reason: `Essentials account for ${(expenseRatio * 100).toFixed(0)}% of baseline income`,
      impact: Math.round(user.essentialExpenses * 0.1),
      category: "Budgeting"
    });
  }

  if (safeToSpend.amount < 5000) {
    recs.push({
      priority: "HIGH",
      action: "Pause discretionary non-essential purchases this week",
      reason: `Safe-to-spend is currently restricted to ${inr(safeToSpend.amount)}`,
      impact: 0,
      category: "Spending"
    });
  }

  return recs;
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════════════════════════════ */

function Sidebar({
  activeUser,
  onUserChange,
  onNavClick,
  activeSection,
  collapsed,
  onToggleCollapse
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "income", label: "Income & Cashflow", icon: "💰" },
    { id: "forecast", label: "Forecast & Trends", icon: "🔮" },
    { id: "simulator", label: "Shock Simulator", icon: "⚡" },
    { id: "coach", label: "Smart AI Coach", icon: "🧠" },
  ];

  const users = [
    { id: "ravi", name: "Ravi", role: "Delivery Partner", icon: "🛵", tag: "Volatile" },
    { id: "priya", name: "Priya", role: "Freelance Designer", icon: "🎨", tag: "Moderate" },
    { id: "arjun", name: "Arjun", role: "Auto Driver", icon: "🛺", tag: "Vulnerable" },
  ];

  return (
    <aside
      style={{
        width: collapsed ? 72 : 240,
        flexShrink: 0,
        borderRight: "1px solid var(--border-light)",
        padding: collapsed ? "20px 10px" : "24px 16px",
        background: "var(--bg-sidebar)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease",
        zIndex: 20,
      }}
    >
      {/* Brand & 3-Dots Collapse Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          marginBottom: 28,
        }}
      >
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "#1A1A17",
                color: "#FBFAF6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              K
            </div>
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.02em" }}>
                KRYPTON
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Financial Resilience
              </div>
            </div>
          </div>
        )}

        {/* 3-Dots Toggle Button */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand Sidebar (•••)" : "Collapse Sidebar (•••)"}
          className="krypton-btn"
          style={{
            background: collapsed ? "#1A1A17" : "transparent",
            color: collapsed ? "#FBFAF6" : "var(--text-secondary)",
            border: "1px solid " + (collapsed ? "#1A1A17" : "var(--border-light)"),
            borderRadius: 6,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          •••
        </button>
      </div>

      {/* Main Navigation */}
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, paddingLeft: collapsed ? 0 : 8, textAlign: collapsed ? "center" : "left" }}>
        {collapsed ? "NAV" : "NAVIGATION"}
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 28 }}>
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onNavClick && onNavClick(item.id)}
              title={collapsed ? item.label : ""}
              className="krypton-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 12,
                padding: collapsed ? "10px 0" : "10px 12px",
                fontSize: 13.5,
                borderRadius: 8,
                cursor: "pointer",
                color: isActive ? "#1A1A17" : "var(--text-secondary)",
                background: isActive ? "var(--bg-subtle)" : "transparent",
                fontWeight: isActive ? 600 : 400,
                border: isActive ? "1px solid var(--border-light)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Persona Switcher Section */}
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-light)", paddingTop: 16 }}>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            marginBottom: 10,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textAlign: collapsed ? "center" : "left",
            paddingLeft: collapsed ? 0 : 4,
          }}
        >
          {collapsed ? "USER" : "SWITCH PERSONA"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {users.map((u) => {
            const isUserActive = activeUser === u.id;
            return (
              <div
                key={u.id}
                onClick={() => onUserChange(u.id)}
                title={collapsed ? `${u.name} (${u.role})` : ""}
                className="krypton-btn"
                style={{
                  padding: collapsed ? "8px 0" : "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: isUserActive ? "#1A1A17" : "var(--text-secondary)",
                  background: isUserActive ? "#FFFFFF" : "transparent",
                  border: isUserActive ? "1px solid var(--border-light)" : "1px solid transparent",
                  boxShadow: isUserActive ? "var(--shadow-sm)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "space-between",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{u.icon}</span>
                  {!collapsed && (
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: isUserActive ? 600 : 400 }}>{u.name}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{u.role}</div>
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 500,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: isUserActive ? "var(--bg-subtle)" : "transparent",
                      color: "var(--text-muted)",
                    }}
                  >
                    {u.tag}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ label, value, sub, tone, icon, badge, trend }) {
  return (
    <div
      className="krypton-card krypton-card-interactive"
      style={{
        flex: 1,
        minWidth: 200,
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Tone Accent Line */}
      {tone && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: tone.border || "#1A1A17",
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 4,
                background: tone?.bg || "var(--bg-subtle)",
                color: tone?.text || "var(--text-secondary)",
              }}
            >
              {badge}
            </span>
          )}
          {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        </div>
      </div>

      <div
        style={{
          fontSize: 26,
          fontVariantNumeric: "tabular-nums",
          color: tone?.text || "var(--text-primary)",
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>

      {(sub || trend) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>
          {trend && (
            <span style={{ color: trend.startsWith("+") || trend.includes("↑") ? "var(--accent-green)" : "var(--accent-orange)", fontWeight: 600 }}>
              {trend}
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}

function RiskFactorBar({ label, pct, desc }) {
  const isHigh = pct > 60;
  const isMed = pct > 30;
  const color = isHigh ? "var(--accent-red)" : isMed ? "var(--accent-orange)" : "var(--accent-gold)";
  const bgBadge = isHigh ? "#FCEBEB" : isMed ? "#FAECE7" : "#FAEEDA";

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, marginBottom: 5 }}>
        <div>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{label}</span>
          {desc && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>· {desc}</span>}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "1px 6px",
            borderRadius: 4,
            background: bgBadge,
            color: color,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}%
        </span>
      </div>
      <div style={{ height: 6, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

function RecommendationRow({ rec }) {
  const tone = priorityTone[rec.priority] || priorityTone.LOW;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 12px",
        borderRadius: 8,
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        marginBottom: 8,
        transition: "all 0.15s ease",
      }}
      className="krypton-card-interactive"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 4,
            background: tone.badgeBg,
            color: tone.text,
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {rec.priority}
        </span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{rec.action}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{rec.reason}</div>
        </div>
      </div>
      {rec.impact > 0 && (
        <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 13.5, fontVariantNumeric: "tabular-nums", color: "var(--accent-green)", fontWeight: 600 }}>
            +{inr(rec.impact)}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Est. Buffer Boost</div>
        </div>
      )}
    </div>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

  // Simulator State
  const [simPercent, setSimPercent] = useState(-20);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Coach State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current && activeSection === "coach") {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping, activeSection]);

  // Load User Data
  useEffect(() => {
    loadUser(activeUserId);
  }, [activeUserId]);

  const loadUser = async (userId) => {
    setLoading(true);
    setSimPercent(-20);
    setChatHistory([
      {
        role: "model",
        parts: [{
          text: `Hi **${userId === "ravi" ? "Ravi" : userId === "priya" ? "Priya" : "Arjun"}**! I'm your **Krypton Financial Coach**. I've analyzed your real cash flows, debt commitments, and income volatility. Ask me about spending decisions, loan affordability, or savings targets!`
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
        // Auto-run initial -20% simulation
        const initialSim = await api.simulateShock(demoRes.data, -20);
        if (initialSim.success) setSimResult(initialSim.data);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
    setLoading(false);
  };

  const handleSimulate = async (pct) => {
    setSimLoading(true);
    setSimPercent(pct);
    try {
      const res = await api.simulateShock(user, pct);
      if (res.success) setSimResult(res.data);
    } catch (err) {
      console.error(err);
    }
    setSimLoading(false);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim() || !analysis || !user) return;

    const newMsg = { role: "user", parts: [{ text: text.trim() }] };
    setChatHistory((prev) => [...prev, newMsg]);
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

      const res = await api.chatWithAI(metrics, [...chatHistory, newMsg]);
      if (res.success) {
        setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: res.data }] }]);
      } else {
        throw new Error(res.message || "API Error");
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          parts: [{ text: "⚠️ I'm having trouble connecting to the AI brain right now. Please check your network or try again in a moment." }]
        }
      ]);
    }
    setIsTyping(false);
  };

  if (loading || !user || !analysis) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-main)",
          color: "var(--text-secondary)",
          gap: 12,
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--border-light)", borderTopColor: "var(--text-primary)", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Connecting to Krypton Engine...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Derived Metrics ── */
  const { incomeAnalysis, forecast, resilience, safeToSpend } = analysis;
  const tone = bandTone[resilience.band] || bandTone.Stable;
  const coverageMonths = (user.currentSavings / (user.essentialExpenses || 1)).toFixed(1);
  const monthlyObligations = user.essentialExpenses + user.monthlyDebtPayment;
  const avgIncome = incomeAnalysis.average;
  const surplus = avgIncome - monthlyObligations;
  const savingsRate = avgIncome > 0 ? ((surplus / avgIncome) * 100).toFixed(1) : 0;
  const debtToIncomeRatio = avgIncome > 0 ? ((user.monthlyDebtPayment / avgIncome) * 100).toFixed(1) : 0;
  const expenseToIncomeRatio = avgIncome > 0 ? ((user.essentialExpenses / avgIncome) * 100).toFixed(1) : 0;
  const monthsOfRunway = monthlyObligations > 0 ? (user.currentSavings / monthlyObligations).toFixed(1) : "∞";

  const now = new Date();
  const chartData = user.income.map((val, i) => {
    const mIdx = (now.getMonth() - user.income.length + 1 + i + 12) % 12;
    return { month: MONTHS[mIdx], income: val };
  });

  const incomeGrowth = user.income.length >= 2
    ? (((user.income[user.income.length - 1] - user.income[0]) / user.income[0]) * 100).toFixed(1)
    : 0;

  const riskFactors = deriveRiskFactors(resilience.breakdown);
  const recommendations = deriveRecommendations(analysis, user);

  // Cash flow breakdown data
  const breakdownData = [
    { name: "Avg Income", value: avgIncome, fill: "#1A1A17" },
    { name: "Essentials", value: user.essentialExpenses, fill: "#D85A30" },
    { name: "Debt Pay", value: user.monthlyDebtPayment, fill: "#BA7517" },
    { name: "Net Surplus", value: Math.max(0, surplus), fill: "#2D8A56" },
  ];

  // 5-Factor Resilience breakdown
  const resilienceData = [
    { name: "Income Stability", score: resilience.breakdown.incomeStability || 0 },
    { name: "Savings Buffer", score: resilience.breakdown.savingsBuffer || 0 },
    { name: "Debt Capacity", score: resilience.breakdown.debtCapacity || 0 },
    { name: "Expense Flex", score: resilience.breakdown.expenseFlexibility || 0 },
    { name: "Income Trend", score: resilience.breakdown.incomeTrend || 0 },
  ];

  // 3-Month Projected Forecast chart
  const forecastChartData = user.income.map((val, i) => {
    const mIdx = (now.getMonth() - user.income.length + 1 + i + 12) % 12;
    return { month: MONTHS[mIdx], actual: val, expected: null, low: null, high: null };
  });
  // Add projected months
  for (let i = 1; i <= 3; i++) {
    const mIdx = (now.getMonth() + i) % 12;
    forecastChartData.push({
      month: `${MONTHS[mIdx]}*`,
      actual: null,
      expected: forecast.expected,
      low: forecast.low,
      high: forecast.high,
    });
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-main)",
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: "var(--text-primary)",
      }}
    >
      {/* ── Left Collapsible Sidebar ── */}
      <Sidebar
        activeUser={activeUserId}
        onUserChange={setActiveUserId}
        onNavClick={setActiveSection}
        activeSection={activeSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* ── Main Content Container ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto" }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: 64,
            padding: "0 32px",
            borderBottom: "1px solid var(--border-light)",
            background: "rgba(251, 250, 246, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#1A1A17",
                color: "#FBFAF6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {user.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{user.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: tone.bg,
                    color: tone.text,
                    border: `1px solid ${tone.border}`,
                  }}
                >
                  {resilience.band}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                {user.occupation} · {user.incomeType} income
              </div>
            </div>
          </div>

          {/* Right Header Badges & 3-Dots Options */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                color: "var(--text-secondary)",
                padding: "6px 12px",
                borderRadius: 20,
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-light)",
              }}
            >
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)" }} />
              <span>Engine Active</span>
            </div>

            {/* 3-Dots Kebab Options Menu */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
                className="krypton-btn"
                style={{
                  background: optionsMenuOpen ? "var(--bg-subtle)" : "transparent",
                  border: "1px solid var(--border-light)",
                  borderRadius: 6,
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                •••
              </button>

              {optionsMenuOpen && (
                <div
                  className="krypton-card"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 40,
                    width: 220,
                    padding: "6px 0",
                    zIndex: 30,
                    background: "#FFFFFF",
                    borderRadius: 8,
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  <div style={{ padding: "8px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Quick Settings
                  </div>
                  <div
                    onClick={() => { setActiveUserId("ravi"); setOptionsMenuOpen(false); }}
                    className="krypton-btn"
                    style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}
                  >
                    <span>🛵</span> Ravi (Delivery)
                  </div>
                  <div
                    onClick={() => { setActiveUserId("priya"); setOptionsMenuOpen(false); }}
                    className="krypton-btn"
                    style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}
                  >
                    <span>🎨</span> Priya (Freelance)
                  </div>
                  <div
                    onClick={() => { setActiveUserId("arjun"); setOptionsMenuOpen(false); }}
                    className="krypton-btn"
                    style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}
                  >
                    <span>🛺</span> Arjun (Driver)
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-light)", margin: "6px 0" }} />
                  <div
                    onClick={() => { loadUser(activeUserId); setOptionsMenuOpen(false); }}
                    className="krypton-btn"
                    style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}
                  >
                    <span>🔄</span> Refresh Financial Data
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard View Container */}
        <div style={{ flex: 1, padding: "28px 36px", maxWidth: 1280, width: "100%", margin: "0 auto" }}>
          
          {/* ═══════════════════════════════════════════════════════════
              TAB 1: DASHBOARD (Full Overview)
          ═══════════════════════════════════════════════════════════ */}
          {activeSection === "dashboard" && (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Highlight Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <MetricCard
                  label="Liquid Savings"
                  value={inr(user.currentSavings)}
                  sub={`${coverageMonths} months of essentials`}
                  icon="🛡️"
                  trend={user.currentSavings >= user.essentialExpenses * 3 ? "Healthy" : "Needs Growth"}
                />
                <MetricCard
                  label="Resilience Score"
                  value={`${resilience.score}/100`}
                  sub={resilience.band}
                  tone={tone}
                  badge="Scored"
                  icon="⚡"
                />
                <MetricCard
                  label="Safe to Spend"
                  value={inr(safeToSpend.amount)}
                  sub={`₹${Math.round(safeToSpend.emergencyReserve / 1000)}k buffer protected`}
                  icon="💳"
                  trend="Spend Ceiling"
                />
                <MetricCard
                  label="Monthly Obligations"
                  value={inr(monthlyObligations)}
                  sub={`${inr(user.essentialExpenses)} essentials + ${inr(user.monthlyDebtPayment)} debt`}
                  icon="📑"
                  trend={`Net Surplus: ${inr(surplus)}`}
                />
              </div>

              {/* 2-Column Balanced Section */}
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
                {/* Income Curve & Trend */}
                <div className="krypton-card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Income Cash Flow vs Commitments</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Past 6 months vs fixed ₹{inr(monthlyObligations)} obligations</div>
                    </div>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: Number(incomeGrowth) >= 0 ? "var(--accent-green)" : "var(--accent-orange)",
                        color: "#FBFAF6",
                      }}
                    >
                      {Number(incomeGrowth) >= 0 ? "↑" : "↓"} {incomeGrowth}%
                    </span>
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAE7DC" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={60} />
                      <ReferenceLine y={monthlyObligations} stroke="var(--accent-orange)" strokeDasharray="4 4" label={{ value: "Obligations", fill: "var(--accent-orange)", fontSize: 10, position: "insideTopLeft" }} />
                      <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-light)", borderRadius: 6, background: "var(--bg-card)", boxShadow: "var(--shadow-md)" }} />
                      <Line type="monotone" dataKey="income" stroke="#1A1A17" strokeWidth={2.5} dot={{ r: 4, fill: "#1A1A17" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>

                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-light)", paddingTop: 14, marginTop: 14, fontSize: 12 }}>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Average Income: </span>
                      <strong style={{ color: "var(--text-primary)" }}>{inr(avgIncome)}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Income Volatility: </span>
                      <strong style={{ color: incomeAnalysis.volatility > 0.2 ? "var(--accent-red)" : "var(--accent-green)" }}>
                        {(incomeAnalysis.volatility * 100).toFixed(0)}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Risk Factors Breakdown */}
                <div className="krypton-card" style={{ padding: 22, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Resilience Pressure Points</div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Top Vulnerabilities</span>
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    {riskFactors.slice(0, 4).map((f) => (
                      <RiskFactorBar key={f.label} {...f} />
                    ))}
                  </div>

                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 6,
                      background: tone.lightBg,
                      border: `1px solid ${tone.border}`,
                      fontSize: 12,
                      color: tone.text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}
                  >
                    <span>Overall Health Status: <strong>{resilience.band}</strong></span>
                    <button
                      onClick={() => setActiveSection("forecast")}
                      style={{ background: "transparent", border: "none", color: tone.text, fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                    >
                      View Breakdown →
                    </button>
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations & Goal Tracker */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
                <div className="krypton-card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Priority Action Checklist</div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>AI Derived Insights</span>
                  </div>
                  {recommendations.slice(0, 3).map((r, i) => (
                    <RecommendationRow key={i} rec={r} />
                  ))}
                </div>

                {/* Goal & Milestone Card */}
                <div className="krypton-card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Target Financial Goal</div>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--bg-subtle)", color: "var(--text-secondary)", fontWeight: 600, textTransform: "capitalize" }}>
                        {user.financialGoal?.replace("_", " ")}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14 }}>
                      {user.financialGoal === "emergency_fund" && `Targeting 3 months of emergency expenses (${inr(user.essentialExpenses * 3)}). You have currently funded ${inr(user.currentSavings)}.`}
                      {user.financialGoal === "investment" && `Safety buffer ready. Aim to allocate excess monthly surplus (${inr(Math.max(0, surplus))}/mo) into low-volatility assets.`}
                      {user.financialGoal === "debt_repayment" && `Active debt payment is ${inr(user.monthlyDebtPayment)}/mo. Fast-track debt clearance to free up ${inr(user.monthlyDebtPayment * 12)} annually.`}
                    </div>

                    {/* Progress to target */}
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
                    className="krypton-btn"
                    style={{
                      marginTop: 18,
                      width: "100%",
                      padding: "10px 14px",
                      background: "#1A1A17",
                      color: "#FBFAF6",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <span>🧠 Consult AI Coach on Strategy</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 2: INCOME (Deep Cash Flow Breakdown)
          ═══════════════════════════════════════════════════════════ */}
          {activeSection === "income" && (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Top Stat Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <MetricCard label="Average Monthly Earnings" value={inr(incomeAnalysis.average)} sub={`Based on ${incomeAnalysis.periods} recorded periods`} icon="📈" />
                <MetricCard label="Median Cash Baseline" value={inr(incomeAnalysis.median)} sub="Half of months earned above this" icon="📊" />
                <MetricCard
                  label="Volatility Index"
                  value={`${(incomeAnalysis.volatility * 100).toFixed(0)}%`}
                  sub={incomeAnalysis.volatility > 0.2 ? "High swings (Risk)" : "Predictable"}
                  tone={incomeAnalysis.volatility > 0.2 ? bandTone.Critical : bandTone.Stable}
                  icon="⚡"
                />
                <MetricCard
                  label="Income Range Spread"
                  value={inr(incomeAnalysis.maximum - incomeAnalysis.minimum)}
                  sub={`Min: ${inr(incomeAnalysis.minimum)} · Max: ${inr(incomeAnalysis.maximum)}`}
                  icon="↕️"
                />
              </div>

              {/* Main Chart + Money Flow */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
                <div className="krypton-card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Historical Inflow vs Fixed Commitments</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Visualizing months above and below safety thresholds</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                      <span style={{ color: "#1A1A17" }}>● Income</span>
                      <span style={{ color: "var(--accent-orange)" }}>- - Fixed Debt + Essentials</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAE7DC" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={60} />
                      <ReferenceLine y={monthlyObligations} stroke="var(--accent-orange)" strokeDasharray="4 4" />
                      <ReferenceLine y={avgIncome} stroke="var(--accent-green)" strokeDasharray="2 2" />
                      <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-light)", borderRadius: 6, background: "var(--bg-card)", boxShadow: "var(--shadow-md)" }} />
                      <Line type="monotone" dataKey="income" stroke="#1A1A17" strokeWidth={2.5} dot={{ r: 4, fill: "#1A1A17" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Money Flow Allocation Bar */}
                <div className="krypton-card" style={{ padding: 22, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Monthly Cash Allocation</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>How average monthly income splits</div>

                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                        <XAxis type="number" tickFormatter={inr} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} width={75} />
                        <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-light)", borderRadius: 6, background: "var(--bg-card)" }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                          {breakdownData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 10, marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span>Fixed Load: <strong>{expenseToIncomeRatio}%</strong></span>
                    <span>Debt Ratio: <strong>{debtToIncomeRatio}%</strong></span>
                    <span>Surplus: <strong style={{ color: "var(--accent-green)" }}>{savingsRate}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Monthly Income Breakdown Grid */}
              <div className="krypton-card" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Monthly Earnings Log</div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Threshold: {inr(monthlyObligations)}/mo</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {chartData.map((d, i) => {
                    const isAboveAvg = user.income[i] >= avgIncome;
                    const isCovering = user.income[i] >= monthlyObligations;
                    return (
                      <div
                        key={i}
                        style={{
                          padding: "12px 14px",
                          background: isCovering ? "var(--bg-card)" : "#FDF5F3",
                          border: `1px solid ${isCovering ? "var(--border-light)" : "#F0D5CC"}`,
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                          <span>{d.month}</span>
                          <span style={{ color: isCovering ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 600 }}>
                            {isCovering ? "✓ Safe" : "⚠️ Short"}
                          </span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                          {inr(user.income[i])}
                        </div>
                        <div style={{ fontSize: 10.5, color: isAboveAvg ? "var(--accent-green)" : "var(--text-muted)" }}>
                          {isAboveAvg ? `+${inr(user.income[i] - avgIncome)} vs avg` : `${inr(user.income[i] - avgIncome)} vs avg`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 3: FORECAST (Future Projections & Scenarios)
          ═══════════════════════════════════════════════════════════ */}
          {activeSection === "forecast" && (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Scenario Range Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <MetricCard
                  label="Pessimistic Forecast"
                  value={inr(forecast.low)}
                  sub="Low 16th percentile scenario"
                  tone={forecast.low < monthlyObligations ? bandTone.Critical : bandTone.Vulnerable}
                  icon="🌧️"
                />
                <MetricCard
                  label="Expected Baseline"
                  value={inr(forecast.expected)}
                  sub="Median 50th percentile expectation"
                  icon="⛅"
                  badge="Target"
                />
                <MetricCard
                  label="Optimistic Potential"
                  value={inr(forecast.high)}
                  sub="High 84th percentile scenario"
                  tone={bandTone.Stable}
                  icon="☀️"
                />
                <MetricCard
                  label="Volatility Range"
                  value={inr(forecast.high - forecast.low)}
                  sub="Projected earnings variance"
                  icon="↕️"
                />
              </div>

              {/* 3-Month Projection Chart with Shaded Bands */}
              <div className="krypton-card" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>3-Month Projected Income Envelope</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Historical data + 3-month forecast range (* projected months)</div>
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
                    <span style={{ color: "#1A1A17" }}>● Actual Income</span>
                    <span style={{ color: "var(--accent-green)" }}>- - Expected Median</span>
                    <span style={{ color: "var(--accent-orange)" }}>- - Minimum Expected</span>
                    <span style={{ color: "var(--accent-red)" }}>— Obligations</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={forecastChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE7DC" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip formatter={(v) => v ? inr(v) : "—"} contentStyle={{ fontSize: 12, border: "1px solid var(--border-light)", borderRadius: 6, background: "var(--bg-card)" }} />
                    <Area type="monotone" dataKey="high" stroke="none" fill="#EAF3DE" fillOpacity={0.6} name="Optimistic" />
                    <Area type="monotone" dataKey="expected" stroke="var(--accent-green)" fill="#EAF3DE" fillOpacity={0.4} strokeWidth={2} strokeDasharray="4 4" name="Expected" />
                    <Area type="monotone" dataKey="low" stroke="var(--accent-orange)" fill="#FAEEDA" fillOpacity={0.4} strokeWidth={2} strokeDasharray="4 4" name="Pessimistic" />
                    <Line type="monotone" dataKey="actual" stroke="#1A1A17" strokeWidth={2.5} dot={{ r: 4, fill: "#1A1A17" }} name="Actual Income" connectNulls={false} />
                    <ReferenceLine y={monthlyObligations} stroke="var(--accent-red)" strokeDasharray="3 3" label={{ value: "Fixed Commitments", fill: "var(--accent-red)", fontSize: 10, position: "insideTopLeft" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 5-Dimensional Resilience Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="krypton-card" style={{ padding: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>5-Pillar Resilience Index</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Weighted factors contributing to your overall score</div>

                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={resilienceData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip contentStyle={{ fontSize: 12, border: "1px solid var(--border-light)", borderRadius: 6, background: "var(--bg-card)" }} />
                      <Bar dataKey="score" fill="#1A1A17" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="krypton-card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Scenario Outlook Assessment</div>
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        background: forecast.low >= monthlyObligations ? "#F6FAF2" : "#FDF5F3",
                        border: `1px solid ${forecast.low >= monthlyObligations ? "#D4E8C0" : "#F0D5CC"}`,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: forecast.low >= monthlyObligations ? "var(--accent-green)" : "var(--accent-red)",
                      }}
                    >
                      {forecast.low >= monthlyObligations ? (
                        <>
                          <strong>✅ Resilient Outlook:</strong> Even in your lowest expected earning month ({inr(forecast.low)}), your cash flow covers all essential living expenses and debt payments ({inr(monthlyObligations)}).
                        </>
                      ) : (
                        <>
                          <strong>⚠️ Vulnerability Detected:</strong> In a pessimistic month ({inr(forecast.low)}), your income falls short of fixed commitments ({inr(monthlyObligations)}) by <strong>{inr(monthlyObligations - forecast.low)}</strong>. This deficit must be cushioned by your savings.
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 12 }}>
                    <strong>Recommended Rule:</strong> Maintain at least {inr((monthlyObligations - forecast.low) * 3)} in liquid buffer to ride out 3 consecutive low-earning months safely.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 4: SIMULATOR (Income Shock Stress Testing)
          ═══════════════════════════════════════════════════════════ */}
          {activeSection === "simulator" && (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Baseline Info */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <MetricCard label="Normal Expected Income" value={inr(forecast.expected)} sub="Baseline Monthly Inflow" icon="💵" />
                <MetricCard label="Fixed Monthly Commitments" value={inr(monthlyObligations)} sub={`${inr(user.essentialExpenses)} essentials + ${inr(user.monthlyDebtPayment)} debt`} icon="🔒" />
                <MetricCard label="Available Liquid Savings" value={inr(user.currentSavings)} sub="Emergency Buffer Available" icon="🛡️" />
              </div>

              {/* Shock Control Card */}
              <div className="krypton-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Simulate an Income Shock Scenario</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Test how your emergency runway holds up if earnings drop</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-orange)" }}>
                    {simPercent}% Drop
                  </div>
                </div>

                {/* Preset Shock Buttons */}
                <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                  {[-10, -20, -30, -50, -75].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleSimulate(pct)}
                      disabled={simLoading}
                      className="krypton-btn"
                      style={{
                        padding: "8px 18px",
                        fontSize: 13,
                        fontWeight: simPercent === pct ? 600 : 500,
                        border: simPercent === pct ? "1px solid #1A1A17" : "1px solid var(--border-light)",
                        background: simPercent === pct ? "#1A1A17" : "var(--bg-card)",
                        color: simPercent === pct ? "#FBFAF6" : "var(--text-primary)",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      {pct}% Shock
                    </button>
                  ))}
                </div>

                {/* Range Slider for Custom Shock */}
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="range"
                    min="-90"
                    max="-5"
                    step="5"
                    value={simPercent}
                    onChange={(e) => handleSimulate(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#1A1A17", cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    <span>-5% (Minor Dip)</span>
                    <span>-50% (Severe Crisis)</span>
                    <span>-90% (Catastrophic Loss)</span>
                  </div>
                </div>

                {/* Simulation Output Cards */}
                {simResult && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 16 }}>
                    <div style={{ padding: 14, borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Projected Inflow</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                        {inr(simResult.scenarioIncome)}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                        Down from {inr(simResult.expectedIncome)}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        background: simResult.monthlySurplus >= 0 ? "#F6FAF2" : "#FDF5F3",
                        border: `1px solid ${simResult.monthlySurplus >= 0 ? "#D4E8C0" : "#F0D5CC"}`,
                      }}
                    >
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Monthly Deficit / Surplus</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: simResult.monthlySurplus >= 0 ? "var(--accent-green)" : "var(--accent-red)", marginTop: 4 }}>
                        {inr(simResult.monthlySurplus)}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                        {simResult.monthlySurplus >= 0 ? "Positive Cashflow" : "Monthly Savings Drain"}
                      </div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Savings Runway</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                        {simResult.savingsCoverage} Months
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                        Until savings depleted
                      </div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Stress Level</div>
                      <div style={{ marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 4,
                            background: simResult.risk === "High" ? "#FCEBEB" : simResult.risk === "Moderate" ? "#FAEEDA" : "#EAF3DE",
                            color: simResult.risk === "High" ? "var(--accent-red)" : simResult.risk === "Moderate" ? "var(--accent-orange)" : "var(--accent-green)",
                          }}
                        >
                          {simResult.risk} Risk
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 6 }}>
                        {simResult.risk === "High" ? "Immediate Action Required" : "Manageable Buffer"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stress Comparison Chart */}
              {simResult && (
                <div className="krypton-card" style={{ padding: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Side-by-Side Inflow vs Obligations Comparison</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={[
                        { name: "Normal Inflow", current: simResult.expectedIncome, shocked: 0 },
                        { name: `Shocked (${simPercent}%)`, current: 0, shocked: simResult.scenarioIncome },
                        { name: "Fixed Obligations", current: simResult.monthlyObligations, shocked: simResult.monthlyObligations },
                      ]}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAE7DC" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--border-light)", borderRadius: 6, background: "var(--bg-card)" }} />
                      <Bar dataKey="current" fill="#1A1A17" radius={[4, 4, 0, 0]} barSize={36} name="Standard" />
                      <Bar dataKey="shocked" fill="var(--accent-orange)" radius={[4, 4, 0, 0]} barSize={36} name="Shock Scenario" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 5: COACH (Smart AI Conversational Assistant)
          ═══════════════════════════════════════════════════════════ */}
          {activeSection === "coach" && (
            <div className="tab-content-enter" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20, height: "calc(100vh - 120px)" }}>
              
              {/* Left Column: Full Chat Interface */}
              <div
                className="krypton-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {/* Chat Header */}
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--border-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(251, 250, 246, 0.6)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#1A1A17",
                        color: "#FBFAF6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                      }}
                    >
                      🧠
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Krypton AI Financial Coach</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Contextual reasoning on {user.name}'s real finances</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setChatHistory([{ role: "model", parts: [{ text: `Chat refreshed. How can I help you manage your finances today, ${user.name}?` }] }])}
                    className="krypton-btn"
                    style={{ fontSize: 11.5, color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border-light)", padding: "4px 8px", borderRadius: 4 }}
                  >
                    Clear Chat
                  </button>
                </div>

                {/* Messages Container */}
                <div
                  style={{
                    flex: 1,
                    padding: "20px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {chatHistory.map((msg, idx) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignSelf: isUser ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                        }}
                      >
                        {!isUser && (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A1A17", color: "#FBFAF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
                            🤖
                          </div>
                        )}
                        <div
                          style={{
                            background: isUser ? "#1A1A17" : "var(--bg-subtle)",
                            color: isUser ? "#FBFAF6" : "var(--text-primary)",
                            padding: "12px 16px",
                            borderRadius: 10,
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          <div className="markdown-body">
                            <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && (
                    <div style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A1A17", color: "#FBFAF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                        🤖
                      </div>
                      <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg-subtle)", color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
                        Analyzing financial cash flow & reasoning...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Box */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-light)", background: "var(--bg-card)" }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={`Ask anything (e.g. "Can I afford to spend ₹4,000 this week?")...`}
                      style={{
                        flex: 1,
                        padding: "11px 14px",
                        borderRadius: 6,
                        border: "1px solid var(--border-light)",
                        background: "#FFFFFF",
                        fontSize: 13.5,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isTyping || !chatInput.trim()}
                      className="krypton-btn"
                      style={{
                        padding: "0 22px",
                        background: isTyping || !chatInput.trim() ? "var(--border-light)" : "var(--accent-orange)",
                        color: isTyping || !chatInput.trim() ? "var(--text-muted)" : "#FBFAF6",
                        border: "none",
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: isTyping || !chatInput.trim() ? "not-allowed" : "pointer",
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Context & Quick Prompts Drawer */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
                {/* Live Context Card */}
                <div className="krypton-card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📊</span>
                    <span>Live AI Financial Context</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Safe to Spend:</span>
                      <strong>{inr(safeToSpend.amount)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Liquid Savings:</span>
                      <strong>{inr(user.currentSavings)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Monthly Fixed Load:</span>
                      <strong style={{ color: "var(--accent-orange)" }}>{inr(monthlyObligations)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-light)", paddingBottom: 6 }}>
                      <span style={{ color: "var(--text-muted)" }}>Income Volatility:</span>
                      <strong>{(incomeAnalysis.volatility * 100).toFixed(0)}%</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Resilience Band:</span>
                      <strong style={{ color: tone.text }}>{resilience.band} ({resilience.score}/100)</strong>
                    </div>
                  </div>
                </div>

                {/* Suggested Prompts by Category */}
                <div className="krypton-card" style={{ padding: 18, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>💡</span>
                    <span>Suggested Questions</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { icon: "📱", text: "Can I afford to buy a ₹20,000 phone?" },
                      { icon: "💰", text: "How much should I save this month?" },
                      { icon: "💳", text: "Can I take on a ₹3,000/mo EMI loan?" },
                      { icon: "🛡️", text: "What is my biggest financial risk right now?" },
                      { icon: "🛵", text: "Can I spend ₹5,000 on bike repairs?" },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(item.text)}
                        className="krypton-btn krypton-card-interactive"
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: 6,
                          background: "#FFFFFF",
                          border: "1px solid var(--border-light)",
                          fontSize: 12.5,
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{item.icon}</span>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
