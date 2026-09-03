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

/* ── helpers ── */

const inr = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const bandTone = {
  Critical:   { bg: "#FCEBEB", border: "#A32D2D", text: "#501313" },
  Vulnerable: { bg: "#FAEEDA", border: "#BA7517", text: "#412402" },
  Stable:     { bg: "#EAF3DE", border: "#639922", text: "#173404" },
  Resilient:  { bg: "#E8F4EE", border: "#2D8A56", text: "#0E3D1F" },
};

const priorityTone = {
  HIGH:   { bg: "#FCEBEB", text: "#791F1F" },
  MEDIUM: { bg: "#FAEEDA", text: "#633806" },
  LOW:    { bg: "#F1EFE8", text: "#444441" },
};

/* ── sub-components ── */

function Sidebar({ activeUser, onUserChange, onNavClick, activeSection }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "income", label: "Income" },
    { id: "forecast", label: "Forecast" },
    { id: "simulator", label: "Simulator" },
    { id: "coach", label: "Coach" },
  ];
  const users = [
    { id: "ravi", label: "Ravi – Delivery" },
    { id: "priya", label: "Priya – Freelance" },
    { id: "arjun", label: "Arjun – Auto Driver" },
  ];

  return (
    <div
      style={{
        width: 210,
        flexShrink: 0,
        borderRight: "1px solid #E4E1D6",
        padding: "24px 16px",
        background: "#FBFAF6",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 21,
          letterSpacing: "0.04em",
          marginBottom: 32,
          color: "#1A1A17",
          fontWeight: 400,
        }}
      >
        KRYPTON
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 32 }}>
        {navItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onNavClick && onNavClick(item.id)}
            style={{
              padding: "8px 10px",
              fontSize: 13.5,
              borderRadius: 6,
              cursor: "pointer",
              color: activeSection === item.id ? "#1A1A17" : "#6B6A63",
              background: activeSection === item.id ? "#EFEDE4" : "transparent",
              fontWeight: activeSection === item.id ? 500 : 400,
            }}
          >
            {item.label}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            fontSize: 11,
            color: "#8A887F",
            marginBottom: 8,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Demo users
        </div>
        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => onUserChange(u.id)}
            style={{
              padding: "6px 10px",
              fontSize: 13,
              borderRadius: 6,
              cursor: "pointer",
              color: activeUser === u.id ? "#1A1A17" : "#6B6A63",
              background: activeUser === u.id ? "#EFEDE4" : "transparent",
              fontWeight: activeUser === u.id ? 500 : 400,
              marginBottom: 2,
            }}
          >
            {u.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, tone }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "18px 20px",
        background: "#FBFAF6",
        border: "1px solid #E4E1D6",
        borderRadius: 4,
      }}
    >
      <div style={{ fontSize: 12.5, color: "#8A887F", marginBottom: 8 }}>{label}</div>
      <div
        style={{
          fontSize: 28,
          fontVariantNumeric: "tabular-nums",
          color: tone?.text || "#1A1A17",
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12.5, color: tone?.text || "#8A887F", marginTop: 8 }}>{sub}</div>
      )}
    </div>
  );
}

function RiskFactorBar({ label, pct }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        <span style={{ color: "#4A4941" }}>{label}</span>
        <span style={{ color: "#1A1A17", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 5, background: "#EFEDE4", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#D85A30", borderRadius: 3 }} />
      </div>
    </div>
  );
}

function RecommendationRow({ rec }) {
  const tone = priorityTone[rec.priority];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid #E4E1D6",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 500,
            padding: "3px 8px",
            borderRadius: 3,
            background: tone.bg,
            color: tone.text,
            letterSpacing: "0.03em",
            flexShrink: 0,
          }}
        >
          {rec.priority}
        </span>
        <div>
          <div style={{ fontSize: 13.5, color: "#1A1A17" }}>{rec.action}</div>
          <div style={{ fontSize: 12, color: "#8A887F", marginTop: 2 }}>{rec.reason}</div>
        </div>
      </div>
      {rec.impact > 0 && (
        <div
          style={{
            fontSize: 13.5,
            fontVariantNumeric: "tabular-nums",
            color: "#173404",
            fontWeight: 500,
            flexShrink: 0,
            marginLeft: 12,
          }}
        >
          +{inr(rec.impact)}
        </div>
      )}
    </div>
  );
}

/* ── data derivation ── */

function deriveRiskFactors(breakdown) {
  if (!breakdown) return [];
  const factors = [
    { label: "Income volatility", pct: Math.max(0, 100 - (breakdown.incomeStability || 0)) },
    { label: "Insufficient savings", pct: Math.max(0, 100 - (breakdown.savingsBuffer || 0)) },
    { label: "Debt burden", pct: Math.max(0, 100 - (breakdown.debtCapacity || 0)) },
    { label: "Expense rigidity", pct: Math.max(0, 100 - (breakdown.expenseFlexibility || 0)) },
  ];
  return factors.sort((a, b) => b.pct - a.pct).filter((f) => f.pct > 0);
}

function deriveRecommendations(analysis, user) {
  if (!analysis || !user) return [];
  const recs = [];
  const { incomeAnalysis, safeToSpend } = analysis;

  const coverageMonths = user.currentSavings / user.essentialExpenses;
  if (coverageMonths < 3) {
    const target = user.essentialExpenses * 3;
    recs.push({
      priority: "HIGH",
      action: "Build emergency buffer to 3 months",
      reason: `Current coverage is only ${coverageMonths.toFixed(1)} months`,
      impact: Math.max(0, target - user.currentSavings),
    });
  }

  if (incomeAnalysis.volatility > 0.2) {
    recs.push({
      priority: "HIGH",
      action: "Save more during high-income months",
      reason: `Income volatility is ${(incomeAnalysis.volatility * 100).toFixed(0)}%`,
      impact: Math.round((incomeAnalysis.maximum - incomeAnalysis.average) * 0.5),
    });
  }

  const debtRatio = user.monthlyDebtPayment / incomeAnalysis.average;
  if (debtRatio > 0.1) {
    recs.push({
      priority: "MEDIUM",
      action: "Reduce fixed monthly obligations",
      reason: `Debt consumes ${(debtRatio * 100).toFixed(0)}% of average income`,
      impact: user.monthlyDebtPayment,
    });
  }

  const expenseRatio = user.essentialExpenses / incomeAnalysis.average;
  if (expenseRatio > 0.7) {
    recs.push({
      priority: "MEDIUM",
      action: "Review essential expenses for savings",
      reason: `Essentials consume ${(expenseRatio * 100).toFixed(0)}% of average income`,
      impact: Math.round(user.essentialExpenses * 0.1),
    });
  }

  if (safeToSpend.amount < 5000) {
    recs.push({
      priority: "HIGH",
      action: "Limit discretionary spending this month",
      reason: `Safe-to-spend is only ${inr(safeToSpend.amount)}`,
      impact: 0,
    });
  }

  return recs;
}

/* ── main app ── */

export default function App() {
  const [activeUserId, setActiveUserId] = useState("ravi");
  const [user, setUser] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Nav Refs
  const dashboardRef = useRef(null);
  const incomeRef = useRef(null);
  const forecastRef = useRef(null);
  const simulatorRef = useRef(null);
  const coachRef = useRef(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  // Simulator
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simPercent, setSimPercent] = useState(null);

  // Coach Chat
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping]);

  useEffect(() => {
    loadUser(activeUserId);
  }, [activeUserId]);

  const scrollTo = (id) => {
    setActiveSection(id);
  };

  const loadUser = async (userId) => {
    setLoading(true);
    setSimResult(null);
    setSimPercent(null);
    setChatHistory([
      { role: "model", parts: [{ text: "Hi there! I'm your Krypton Financial Assistant. Ask me anything about your budget, what you can afford, or your financial decisions." }] }
    ]);
    try {
      const demoRes = await api.getDemoUser(userId);
      if (demoRes.success) {
        setUser(demoRes.data);
        const analysisRes = await api.analyzeFinancials(demoRes.data);
        if (analysisRes.success) {
          setAnalysis(analysisRes.data);
        }
      }
    } catch (err) {
      console.error("Error loading data", err);
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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !analysis || !user) return;
    const newMsg = { role: "user", parts: [{ text: chatInput }] };
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
        throw new Error("API Error");
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { role: "model", parts: [{ text: "Sorry, I'm having trouble responding right now. Check your API key or network connection." }] }]);
    }
    setIsTyping(false);
  };

  /* ── loading state ── */
  if (loading || !user || !analysis) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#F7F5EF",
          fontFamily: "'Inter', sans-serif",
          color: "#8A887F",
        }}
      >
        Loading…
      </div>
    );
  }

  /* ── derived values ── */
  const { incomeAnalysis, forecast, resilience, safeToSpend } = analysis;
  const tone = bandTone[resilience.band] || bandTone.Stable;
  const coverageMonths = (user.currentSavings / user.essentialExpenses).toFixed(1);
  const monthlyObligations = user.essentialExpenses + user.monthlyDebtPayment;

  const now = new Date();
  const chartData = user.income.map((val, i) => {
    const mIdx = (now.getMonth() - user.income.length + 1 + i + 12) % 12;
    return { month: MONTHS[mIdx], income: val };
  });

  const riskFactors = deriveRiskFactors(resilience.breakdown);
  const recommendations = deriveRecommendations(analysis, user);

  // Extra derived data for rich dashboards
  const avgIncome = incomeAnalysis.average;
  const surplus = avgIncome - monthlyObligations;
  const savingsRate = avgIncome > 0 ? ((surplus / avgIncome) * 100).toFixed(1) : 0;
  const debtToIncomeRatio = avgIncome > 0 ? ((user.monthlyDebtPayment / avgIncome) * 100).toFixed(1) : 0;
  const expenseToIncomeRatio = avgIncome > 0 ? ((user.essentialExpenses / avgIncome) * 100).toFixed(1) : 0;
  const monthsOfRunway = monthlyObligations > 0 ? (user.currentSavings / monthlyObligations).toFixed(1) : "∞";
  const incomeGrowth = user.income.length >= 2
    ? (((user.income[user.income.length - 1] - user.income[0]) / user.income[0]) * 100).toFixed(1)
    : 0;

  // For bar chart data (income breakdown)
  const breakdownData = [
    { name: "Avg Income", value: avgIncome, fill: "#1A1A17" },
    { name: "Essentials", value: user.essentialExpenses, fill: "#D85A30" },
    { name: "Debt", value: user.monthlyDebtPayment, fill: "#BA7517" },
    { name: "Surplus", value: Math.max(0, surplus), fill: "#639922" },
  ];

  // Resilience breakdown data
  const resilienceData = Object.entries(resilience.breakdown).map(([key, val]) => ({
    name: key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
    score: val,
  }));

  // Forecast area chart data
  const forecastChartData = user.income.map((val, i) => {
    const mIdx = (now.getMonth() - user.income.length + 1 + i + 12) % 12;
    return { month: MONTHS[mIdx], income: val, low: forecast.low, expected: forecast.expected, high: forecast.high };
  });
  // Add 3 projected months
  for (let i = 1; i <= 3; i++) {
    const mIdx = (now.getMonth() + i) % 12;
    forecastChartData.push({ month: MONTHS[mIdx], income: null, low: forecast.low, expected: forecast.expected, high: forecast.high });
  }

  /* ── style constants ── */
  const card = { background: "#FBFAF6", border: "1px solid #E4E1D6", borderRadius: 4, padding: "20px 24px", marginBottom: 20 };
  const sectionTitle = { fontSize: 15, fontWeight: 500, color: "#1A1A17", marginBottom: 16 };
  const statLabel = { fontSize: 12, color: "#8A887F", marginBottom: 4 };
  const statValue = { fontSize: 20, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "#1A1A17" };
  const statSmall = { fontSize: 11.5, color: "#8A887F", marginTop: 4 };
  const pill = (bg, color) => ({ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 3, background: bg, color, display: "inline-block" });

  /* ── render ── */
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F7F5EF",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        color: "#1A1A17",
      }}
    >
      <Sidebar activeUser={activeUserId} onUserChange={setActiveUserId} onNavClick={scrollTo} activeSection={activeSection} />

      <div style={{ flex: 1, padding: "24px 32px", maxWidth: 960, overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12.5, color: "#8A887F" }}>Financial resilience</div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 22,
              fontWeight: 400,
              margin: "2px 0 0",
            }}
          >
            {user.name} ·{" "}
            <span style={{ color: "#8A887F", fontStyle: "italic" }}>{user.occupation}</span>
          </h1>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            DASHBOARD TAB — Overview of everything
        ═══════════════════════════════════════════════════════════════ */}
        {activeSection === "dashboard" && (
          <>
            {/* Top metric cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <MetricCard label="Current savings" value={inr(user.currentSavings)} />
              <MetricCard label="Resilience score" value={`${resilience.score}/100`} sub={resilience.band} tone={tone} />
              <MetricCard label="Safe to spend" value={inr(safeToSpend.amount)} sub={`₹${Math.round(safeToSpend.emergencyReserve / 1000)}k reserved`} />
              <MetricCard label="Emergency cover" value={`${coverageMonths} mo`} sub={`on ${inr(user.essentialExpenses)}/mo essentials`} />
            </div>

            {/* Financial snapshot */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ ...card, flex: 1 }}>
                <div style={sectionTitle}>Monthly Snapshot</div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <div style={statLabel}>Avg income</div>
                    <div style={statValue}>{inr(avgIncome)}</div>
                  </div>
                  <div>
                    <div style={statLabel}>Obligations</div>
                    <div style={{ ...statValue, color: "#D85A30" }}>{inr(monthlyObligations)}</div>
                  </div>
                  <div>
                    <div style={statLabel}>Monthly surplus</div>
                    <div style={{ ...statValue, color: surplus >= 0 ? "#639922" : "#A32D2D" }}>{inr(surplus)}</div>
                  </div>
                  <div>
                    <div style={statLabel}>Savings rate</div>
                    <div style={statValue}>{savingsRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini income chart + quick risk */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ ...card, flex: 1.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={sectionTitle}>Income Trend</div>
                  <span style={pill(
                    Number(incomeGrowth) >= 0 ? "#EAF3DE" : "#FCEBEB",
                    Number(incomeGrowth) >= 0 ? "#173404" : "#791F1F"
                  )}>{Number(incomeGrowth) >= 0 ? "↑" : "↓"} {incomeGrowth}%</span>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#E4E1D6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={{ stroke: "#E4E1D6" }} tickLine={false} />
                    <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={false} tickLine={false} width={54} />
                    <ReferenceLine y={monthlyObligations} stroke="#D85A30" strokeDasharray="3 3" />
                    <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid #E4E1D6", borderRadius: 4, background: "#FBFAF6" }} />
                    <Line type="monotone" dataKey="income" stroke="#1A1A17" strokeWidth={2} dot={{ r: 3, fill: "#1A1A17" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...card, flex: 1 }}>
                <div style={sectionTitle}>Risk Summary</div>
                {riskFactors.slice(0, 3).map((f) => (
                  <RiskFactorBar key={f.label} {...f} />
                ))}
                <div style={{ ...statSmall, marginTop: 12 }}>
                  Overall: <span style={{ ...pill(tone.bg, tone.text) }}>{resilience.band}</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div style={card}>
              <div style={sectionTitle}>Top Recommendations</div>
              {recommendations.length === 0 && (
                <div style={{ fontSize: 13, color: "#8A887F", padding: "12px 0" }}>No urgent actions at this time.</div>
              )}
              {recommendations.slice(0, 3).map((r, i) => (
                <RecommendationRow key={i} rec={r} />
              ))}
            </div>

            {/* Financial goal */}
            <div style={card}>
              <div style={sectionTitle}>Financial Goal</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ ...pill("#EFEDE4", "#4A4941"), fontSize: 13, padding: "6px 14px", textTransform: "capitalize" }}>
                  {user.financialGoal?.replace("_", " ") || "Not set"}
                </span>
                <div style={{ fontSize: 13, color: "#8A887F" }}>
                  {user.financialGoal === "emergency_fund" && `Target: ${inr(user.essentialExpenses * 3)} (3 months of essentials)`}
                  {user.financialGoal === "investment" && `Build investments after establishing safety net`}
                  {user.financialGoal === "debt_repayment" && `Focus: Clear ${inr(user.monthlyDebtPayment)}/mo debt obligations`}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            INCOME TAB — Deep income analysis
        ═══════════════════════════════════════════════════════════════ */}
        {activeSection === "income" && (
          <>
            {/* Income summary cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <MetricCard label="Average income" value={inr(incomeAnalysis.average)} sub={`Over ${incomeAnalysis.periods} months`} />
              <MetricCard label="Median income" value={inr(incomeAnalysis.median)} sub="Middle value" />
              <MetricCard label="Income volatility" value={`${(incomeAnalysis.volatility * 100).toFixed(0)}%`}
                sub={incomeAnalysis.volatility > 0.2 ? "High risk" : incomeAnalysis.volatility > 0.1 ? "Moderate" : "Stable"}
                tone={incomeAnalysis.volatility > 0.2 ? bandTone.Critical : incomeAnalysis.volatility > 0.1 ? bandTone.Vulnerable : bandTone.Stable}
              />
              <MetricCard label="Growth" value={`${incomeGrowth}%`}
                sub={Number(incomeGrowth) >= 0 ? "Positive trend" : "Declining trend"}
                tone={Number(incomeGrowth) >= 0 ? bandTone.Stable : bandTone.Critical}
              />
            </div>

            {/* Main income chart */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={sectionTitle}>Income History</div>
                <div style={{ fontSize: 12, color: "#8A887F" }}>
                  — <span style={{ color: "#D85A30" }}>Monthly obligations: {inr(monthlyObligations)}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E4E1D6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={{ stroke: "#E4E1D6" }} tickLine={false} />
                  <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={false} tickLine={false} width={54} />
                  <ReferenceLine y={monthlyObligations} stroke="#D85A30" strokeDasharray="3 3" label={{ value: "Obligations", fill: "#D85A30", fontSize: 10, position: "insideTopLeft" }} />
                  <ReferenceLine y={avgIncome} stroke="#639922" strokeDasharray="3 3" label={{ value: "Average", fill: "#639922", fontSize: 10, position: "insideBottomLeft" }} />
                  <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid #E4E1D6", borderRadius: 4, background: "#FBFAF6" }} />
                  <Line type="monotone" dataKey="income" stroke="#1A1A17" strokeWidth={2} dot={{ r: 4, fill: "#1A1A17" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Income range + monthly breakdown */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ ...card, flex: 1 }}>
                <div style={sectionTitle}>Income Range</div>
                <div style={{ display: "flex", gap: 20 }}>
                  <div>
                    <div style={statLabel}>Minimum</div>
                    <div style={{ ...statValue, color: "#A32D2D" }}>{inr(incomeAnalysis.minimum)}</div>
                    <div style={statSmall}>{((incomeAnalysis.minimum / avgIncome) * 100).toFixed(0)}% of avg</div>
                  </div>
                  <div>
                    <div style={statLabel}>Maximum</div>
                    <div style={{ ...statValue, color: "#639922" }}>{inr(incomeAnalysis.maximum)}</div>
                    <div style={statSmall}>{((incomeAnalysis.maximum / avgIncome) * 100).toFixed(0)}% of avg</div>
                  </div>
                  <div>
                    <div style={statLabel}>Spread</div>
                    <div style={statValue}>{inr(incomeAnalysis.maximum - incomeAnalysis.minimum)}</div>
                    <div style={statSmall}>Std Dev: {inr(incomeAnalysis.standardDeviation)}</div>
                  </div>
                </div>
              </div>
              <div style={{ ...card, flex: 1 }}>
                <div style={sectionTitle}>Money Flow Breakdown</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                    <XAxis type="number" tickFormatter={inr} tick={{ fontSize: 10, fill: "#8A887F" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#4A4941" }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid #E4E1D6", borderRadius: 4, background: "#FBFAF6" }} />
                    <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={16}>
                      {breakdownData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly income history table */}
            <div style={card}>
              <div style={sectionTitle}>Monthly Income Log</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {chartData.map((d, i) => {
                  const isAboveAvg = user.income[i] >= avgIncome;
                  const isAboveObligations = user.income[i] >= monthlyObligations;
                  return (
                    <div key={i} style={{
                      padding: "12px 14px",
                      background: isAboveObligations ? "#F6FAF2" : "#FDF5F3",
                      border: `1px solid ${isAboveObligations ? "#D4E8C0" : "#F0D5CC"}`,
                      borderRadius: 4,
                    }}>
                      <div style={{ fontSize: 11, color: "#8A887F", marginBottom: 4 }}>{d.month}</div>
                      <div style={{ fontSize: 16, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: isAboveAvg ? "#173404" : "#791F1F" }}>{inr(user.income[i])}</div>
                      <div style={{ fontSize: 10, color: "#8A887F", marginTop: 4 }}>
                        {isAboveAvg ? "↑ Above avg" : "↓ Below avg"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Debt & expense ratios */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ ...card, flex: 1 }}>
                <div style={sectionTitle}>Key Ratios</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#4A4941" }}>Debt-to-income</span>
                      <span style={{ fontWeight: 500 }}>{debtToIncomeRatio}%</span>
                    </div>
                    <div style={{ height: 6, background: "#EFEDE4", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, debtToIncomeRatio)}%`, height: "100%", background: Number(debtToIncomeRatio) > 20 ? "#A32D2D" : "#BA7517", borderRadius: 3 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#4A4941" }}>Expense-to-income</span>
                      <span style={{ fontWeight: 500 }}>{expenseToIncomeRatio}%</span>
                    </div>
                    <div style={{ height: 6, background: "#EFEDE4", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, expenseToIncomeRatio)}%`, height: "100%", background: Number(expenseToIncomeRatio) > 70 ? "#A32D2D" : "#D85A30", borderRadius: 3 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#4A4941" }}>Savings rate</span>
                      <span style={{ fontWeight: 500 }}>{savingsRate}%</span>
                    </div>
                    <div style={{ height: 6, background: "#EFEDE4", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, height: "100%", background: "#639922", borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ ...card, flex: 1 }}>
                <div style={sectionTitle}>Runway Analysis</div>
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: 48, fontWeight: 500, color: Number(monthsOfRunway) >= 3 ? "#639922" : "#A32D2D" }}>{monthsOfRunway}</div>
                  <div style={{ fontSize: 13, color: "#8A887F" }}>months of coverage</div>
                  <div style={{ fontSize: 12, color: "#8A887F", marginTop: 8 }}>
                    at {inr(monthlyObligations)}/mo obligations with {inr(user.currentSavings)} savings
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <span style={pill(Number(monthsOfRunway) >= 6 ? "#EAF3DE" : Number(monthsOfRunway) >= 3 ? "#FAEEDA" : "#FCEBEB", Number(monthsOfRunway) >= 6 ? "#173404" : Number(monthsOfRunway) >= 3 ? "#633806" : "#791F1F")}>
                      {Number(monthsOfRunway) >= 6 ? "Healthy" : Number(monthsOfRunway) >= 3 ? "Adequate" : "Critical"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FORECAST TAB — Future projections and resilience breakdown
        ═══════════════════════════════════════════════════════════════ */}
        {activeSection === "forecast" && (
          <>
            {/* Forecast summary cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <MetricCard label="Pessimistic forecast" value={inr(forecast.low)} sub="Low scenario" tone={bandTone.Critical} />
              <MetricCard label="Expected forecast" value={inr(forecast.expected)} sub="Median projection" />
              <MetricCard label="Optimistic forecast" value={inr(forecast.high)} sub="High scenario" tone={bandTone.Stable} />
              <MetricCard label="Forecast range" value={inr(forecast.high - forecast.low)} sub="Uncertainty band" />
            </div>

            {/* Forecast chart with bands */}
            <div style={card}>
              <div style={sectionTitle}>Income Projection (Next 3 Months)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={forecastChartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E4E1D6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={{ stroke: "#E4E1D6" }} tickLine={false} />
                  <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={false} tickLine={false} width={54} />
                  <Tooltip formatter={(v) => v !== null ? inr(v) : "—"} contentStyle={{ fontSize: 12, border: "1px solid #E4E1D6", borderRadius: 4, background: "#FBFAF6" }} />
                  <Area type="monotone" dataKey="high" stroke="none" fill="#EAF3DE" fillOpacity={0.6} name="Optimistic" />
                  <Area type="monotone" dataKey="expected" stroke="#639922" fill="#EAF3DE" fillOpacity={0.3} strokeWidth={1.5} strokeDasharray="4 4" name="Expected" />
                  <Area type="monotone" dataKey="low" stroke="#D85A30" fill="#FAEEDA" fillOpacity={0.3} strokeWidth={1.5} strokeDasharray="4 4" name="Pessimistic" />
                  <Line type="monotone" dataKey="income" stroke="#1A1A17" strokeWidth={2} dot={{ r: 3, fill: "#1A1A17" }} name="Actual" connectNulls={false} />
                  <ReferenceLine y={monthlyObligations} stroke="#A32D2D" strokeDasharray="3 3" label={{ value: "Obligations", fill: "#A32D2D", fontSize: 10, position: "insideTopLeft" }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 12, color: "#8A887F" }}>
                <span>● Actual income</span>
                <span style={{ color: "#639922" }}>- - Expected</span>
                <span style={{ color: "#D85A30" }}>- - Pessimistic</span>
                <span style={{ color: "#A32D2D" }}>— Obligations</span>
              </div>
            </div>

            {/* Resilience breakdown */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ ...card, flex: 1 }}>
                <div style={sectionTitle}>Resilience Breakdown</div>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 56, fontWeight: 500, color: tone.text }}>{resilience.score}</div>
                  <div style={{ fontSize: 13, color: "#8A887F" }}>out of 100</div>
                  <span style={{ ...pill(tone.bg, tone.text), marginTop: 8 }}>{resilience.band}</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={resilienceData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#8A887F" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#4A4941" }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E4E1D6", borderRadius: 4, background: "#FBFAF6" }} />
                    <Bar dataKey="score" fill="#1A1A17" radius={[0, 3, 3, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...card, flex: 1 }}>
                <div style={sectionTitle}>What's Affecting Resilience?</div>
                {riskFactors.map((f) => (
                  <RiskFactorBar key={f.label} {...f} />
                ))}
                <div style={{ borderTop: "1px solid #E4E1D6", marginTop: 16, paddingTop: 16 }}>
                  <div style={sectionTitle}>Scenario Outlook</div>
                  <div style={{ fontSize: 13, color: "#4A4941", lineHeight: 1.6 }}>
                    {forecast.low >= monthlyObligations
                      ? "✅ Even in the worst-case scenario, your income covers obligations. You're in a strong position."
                      : forecast.expected >= monthlyObligations
                      ? `⚠️ In a low-income month (${inr(forecast.low)}), you'd fall short of obligations by ${inr(monthlyObligations - forecast.low)}.`
                      : `🚨 Your expected income (${inr(forecast.expected)}) doesn't cover obligations (${inr(monthlyObligations)}). Immediate attention needed.`
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div style={card}>
              <div style={sectionTitle}>Smart Recommendations</div>
              {recommendations.length === 0 && (
                <div style={{ fontSize: 13, color: "#8A887F", padding: "12px 0" }}>No urgent actions at this time.</div>
              )}
              {recommendations.map((r, i) => (
                <RecommendationRow key={i} rec={r} />
              ))}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SIMULATOR TAB — Income shock simulation
        ═══════════════════════════════════════════════════════════════ */}
        {activeSection === "simulator" && (
          <>
            {/* Simulator header cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <MetricCard label="Expected income" value={inr(forecast.expected)} sub="Current baseline" />
              <MetricCard label="Monthly obligations" value={inr(monthlyObligations)} sub={`${inr(user.essentialExpenses)} + ${inr(user.monthlyDebtPayment)} debt`} tone={bandTone.Vulnerable} />
              <MetricCard label="Current runway" value={`${monthsOfRunway} mo`} sub={`${inr(user.currentSavings)} in savings`} />
            </div>

            {/* Main simulator */}
            <div style={card}>
              <div style={sectionTitle}>What If My Income Changes?</div>
              <div style={{ fontSize: 13, color: "#8A887F", marginBottom: 16 }}>
                Simulate an income shock to see how your finances would be impacted. Select a percentage drop:
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[-10, -20, -30, -50, -75].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handleSimulate(pct)}
                    disabled={simLoading}
                    style={{
                      padding: "8px 20px",
                      fontSize: 13,
                      border: simPercent === pct ? "1px solid #1A1A17" : "1px solid #E4E1D6",
                      background: simPercent === pct ? "#1A1A17" : "#FBFAF6",
                      color: simPercent === pct ? "#FBFAF6" : "#4A4941",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: simPercent === pct ? 500 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {simResult && (
                <>
                  <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                    <div style={{ flex: 1, padding: 16, background: "#F7F5EF", borderRadius: 4, border: "1px solid #E4E1D6" }}>
                      <div style={statLabel}>Projected income</div>
                      <div style={statValue}>{inr(simResult.scenarioIncome)}</div>
                      <div style={statSmall}>Down from {inr(simResult.expectedIncome)}</div>
                    </div>
                    <div style={{ flex: 1, padding: 16, background: simResult.monthlySurplus >= 0 ? "#F6FAF2" : "#FDF5F3", borderRadius: 4, border: `1px solid ${simResult.monthlySurplus >= 0 ? "#D4E8C0" : "#F0D5CC"}` }}>
                      <div style={statLabel}>Monthly surplus/deficit</div>
                      <div style={{ ...statValue, color: simResult.monthlySurplus >= 0 ? "#639922" : "#A32D2D" }}>{inr(simResult.monthlySurplus)}</div>
                      <div style={statSmall}>{simResult.monthlySurplus >= 0 ? "You can still cover obligations" : "Deficit — dipping into savings"}</div>
                    </div>
                    <div style={{ flex: 1, padding: 16, background: "#F7F5EF", borderRadius: 4, border: "1px solid #E4E1D6" }}>
                      <div style={statLabel}>Savings coverage</div>
                      <div style={statValue}>{simResult.savingsCoverage} mo</div>
                      <div style={statSmall}>{simResult.monthlySurplus < 0 ? `Savings last ${simResult.savingsCoverage} months at this deficit` : "No savings drain expected"}</div>
                    </div>
                    <div style={{ flex: 1, padding: 16, background: "#F7F5EF", borderRadius: 4, border: "1px solid #E4E1D6" }}>
                      <div style={statLabel}>Risk level</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={pill(
                          simResult.risk === "High" ? "#FCEBEB" : simResult.risk === "Moderate" ? "#FAEEDA" : "#EAF3DE",
                          simResult.risk === "High" ? "#791F1F" : simResult.risk === "Moderate" ? "#633806" : "#173404"
                        )}>{simResult.risk}</span>
                      </div>
                      <div style={statSmall}>{simResult.risk === "High" ? "Urgent attention needed" : simResult.risk === "Moderate" ? "Monitor carefully" : "Manageable"}</div>
                    </div>
                  </div>

                  {/* Comparison chart */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ ...sectionTitle, fontSize: 13 }}>Before vs After Comparison</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={[
                        { name: "Current Income", current: simResult.expectedIncome, shocked: 0 },
                        { name: "Shocked Income", current: 0, shocked: simResult.scenarioIncome },
                        { name: "Obligations", current: simResult.monthlyObligations, shocked: simResult.monthlyObligations },
                      ]} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="#E4E1D6" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={{ stroke: "#E4E1D6" }} tickLine={false} />
                        <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={false} tickLine={false} width={54} />
                        <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid #E4E1D6", borderRadius: 4, background: "#FBFAF6" }} />
                        <Bar dataKey="current" fill="#1A1A17" radius={[3, 3, 0, 0]} barSize={32} name="Before" />
                        <Bar dataKey="shocked" fill="#D85A30" radius={[3, 3, 0, 0]} barSize={32} name="After Shock" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Impact analysis */}
                  <div style={{ padding: 16, background: simResult.risk === "High" ? "#FDF5F3" : simResult.risk === "Moderate" ? "#FFF9F0" : "#F6FAF2", borderRadius: 4, border: `1px solid ${simResult.risk === "High" ? "#F0D5CC" : simResult.risk === "Moderate" ? "#F0DFC0" : "#D4E8C0"}` }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: simResult.risk === "High" ? "#791F1F" : simResult.risk === "Moderate" ? "#633806" : "#173404" }}>
                      {simResult.risk === "High" ? "⚠️ High Risk Impact Analysis" : simResult.risk === "Moderate" ? "⚡ Moderate Impact Analysis" : "✅ Low Risk Assessment"}
                    </div>
                    <div style={{ fontSize: 13, color: "#4A4941", lineHeight: 1.7 }}>
                      {simResult.monthlySurplus < 0
                        ? `A ${Math.abs(simResult.percentage)}% income drop would create a monthly deficit of ${inr(Math.abs(simResult.monthlySurplus))}. At this rate, your savings of ${inr(user.currentSavings)} would last approximately ${simResult.savingsCoverage} months before running out. Consider cutting discretionary spending and building a larger emergency fund.`
                        : `A ${Math.abs(simResult.percentage)}% income drop would still leave you with a surplus of ${inr(simResult.monthlySurplus)}/month. Your finances can withstand this shock comfortably.`
                      }
                    </div>
                  </div>
                </>
              )}

              {!simResult && (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#8A887F", fontSize: 13 }}>
                  Select an income change percentage above to see the impact simulation
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            COACH TAB — Full AI assistant experience
        ═══════════════════════════════════════════════════════════════ */}
        {activeSection === "coach" && (
          <>
            {/* Quick context cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <MetricCard label="Safe to spend" value={inr(safeToSpend.amount)} />
              <MetricCard label="Resilience" value={`${resilience.score}/100`} sub={resilience.band} tone={tone} />
              <MetricCard label="Volatility" value={`${(incomeAnalysis.volatility * 100).toFixed(0)}%`} sub={incomeAnalysis.volatility > 0.2 ? "High" : "Low"} />
            </div>

            {/* Quick ask buttons */}
            <div style={{ ...card, paddingBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#8A887F", marginBottom: 10 }}>Quick questions</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  "Can I afford a ₹20,000 phone?",
                  "How much should I save this month?",
                  "Can I apply for a loan?",
                  "Am I spending too much?",
                  "What's my biggest financial risk?",
                  `Can I handle a ₹${user.monthlyDebtPayment} EMI?`,
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setChatInput(q); }}
                    style={{
                      padding: "6px 14px",
                      fontSize: 12.5,
                      border: "1px solid #E4E1D6",
                      background: "#FBFAF6",
                      color: "#4A4941",
                      borderRadius: 20,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat interface — full height */}
            <div
              style={{
                background: "#FBFAF6",
                border: "1px solid #E4E1D6",
                borderRadius: 4,
                padding: "0",
                marginBottom: 24,
                display: "flex",
                flexDirection: "column",
                height: 460,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid #E4E1D6",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1A1A17",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>🧠 Krypton Smart Assistant</span>
                <span style={{ fontSize: 11, color: "#8A887F", fontWeight: 400 }}>Powered by Gemini AI · Analyzing {user.name}'s finances</span>
              </div>
              
              <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      background: msg.role === "user" ? "#1A1A17" : "#EFEDE4",
                      color: msg.role === "user" ? "#FBFAF6" : "#1A1A17",
                      padding: "10px 14px",
                      borderRadius: 6,
                      fontSize: 13.5,
                      lineHeight: 1.5
                    }}
                  >
                    <div style={{ wordBreak: "break-word" }}>
                      {msg.role === "model" ? (
                        <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                      ) : (
                        msg.parts[0].text
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      background: "#EFEDE4",
                      color: "#8A887F",
                      padding: "10px 14px",
                      borderRadius: 6,
                      fontSize: 13.5,
                      fontStyle: "italic"
                    }}
                  >
                    Thinking...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: "16px 24px", borderTop: "1px solid #E4E1D6", display: "flex", gap: 12 }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything about your finances..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "1px solid #E4E1D6",
                    borderRadius: 4,
                    fontSize: 13.5,
                    background: "#FBFAF6",
                    color: "#1A1A17",
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isTyping || !chatInput.trim()}
                  style={{
                    padding: "0 20px",
                    background: isTyping || !chatInput.trim() ? "#E4E1D6" : "#D85A30",
                    color: isTyping || !chatInput.trim() ? "#8A887F" : "#FBFAF6",
                    border: "none",
                    borderRadius: 4,
                    cursor: isTyping || !chatInput.trim() ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

