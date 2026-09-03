import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
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
    const refs = { dashboard: dashboardRef, income: incomeRef, forecast: forecastRef, simulator: simulatorRef, coach: coachRef };
    if (refs[id]?.current) {
      refs[id].current.scrollIntoView({ behavior: "smooth" });
    }
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

      <div style={{ flex: 1, padding: "24px 32px", maxWidth: 920, overflowY: "auto" }}>
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

        {/* ── Metric cards ── */}
        <div ref={dashboardRef} style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <MetricCard label="Current savings" value={inr(user.currentSavings)} />
          <MetricCard
            label="Resilience score"
            value={`${resilience.score} / 100`}
            sub={resilience.band}
            tone={tone}
          />
          <MetricCard
            label="Safe to spend"
            value={inr(safeToSpend.amount)}
            sub={`₹${Math.round(safeToSpend.emergencyReserve / 1000)}k reserved`}
          />
          <MetricCard
            label="Emergency cover"
            value={`${coverageMonths} mo`}
            sub={`on ${inr(user.essentialExpenses)}/mo essentials`}
          />
        </div>

        {/* ── Income chart ── */}
        <div
          ref={incomeRef}
          style={{
            background: "#FBFAF6",
            border: "1px solid #E4E1D6",
            borderRadius: 4,
            padding: "20px 24px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 13, color: "#8A887F" }}>Income history</div>
            <div style={{ fontSize: 12, color: "#8A887F" }}>
              — <span style={{ color: "#D85A30" }}>Monthly obligations: {inr(monthlyObligations)}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E4E1D6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#8A887F" }}
                axisLine={{ stroke: "#E4E1D6" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={inr}
                tick={{ fontSize: 11, fill: "#8A887F" }}
                axisLine={false}
                tickLine={false}
                width={54}
              />
              <ReferenceLine y={monthlyObligations} stroke="#D85A30" strokeDasharray="3 3" />
              <Tooltip
                formatter={(v) => inr(v)}
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid #E4E1D6",
                  borderRadius: 4,
                  background: "#FBFAF6",
                }}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#1A1A17"
                strokeWidth={2}
                dot={{ r: 3, fill: "#1A1A17" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12.5, color: "#8A887F" }}>
            <span>
              Forecast: {inr(forecast.low)} – {inr(forecast.high)}
            </span>
            <span>·</span>
            <span>Volatility: {(incomeAnalysis.volatility * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* ── Two columns: risk factors + recommendations ── */}
        <div ref={forecastRef} style={{ display: "flex", gap: 20, marginBottom: 24 }}>
          <div
            style={{
              flex: 1,
              background: "#FBFAF6",
              border: "1px solid #E4E1D6",
              borderRadius: 4,
              padding: "20px 24px",
            }}
          >
            <div style={{ fontSize: 13, color: "#8A887F", marginBottom: 14 }}>
              What's affecting resilience?
            </div>
            {riskFactors.map((f) => (
              <RiskFactorBar key={f.label} {...f} />
            ))}
          </div>

          <div
            style={{
              flex: 1.3,
              background: "#FBFAF6",
              border: "1px solid #E4E1D6",
              borderRadius: 4,
              padding: "20px 24px",
            }}
          >
            <div style={{ fontSize: 13, color: "#8A887F", marginBottom: 4 }}>What should I do?</div>
            {recommendations.length === 0 && (
              <div style={{ fontSize: 13, color: "#8A887F", padding: "12px 0" }}>
                No urgent actions at this time.
              </div>
            )}
            {recommendations.map((r, i) => (
              <RecommendationRow key={i} rec={r} />
            ))}
          </div>
        </div>

        {/* ── Simulator ── */}
        <div
          ref={simulatorRef}
          style={{
            background: "#FBFAF6",
            border: "1px solid #E4E1D6",
            borderRadius: 4,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, color: "#8A887F", marginBottom: 14 }}>
            What if my income changes?
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[-10, -20, -30, -50].map((pct) => (
              <button
                key={pct}
                onClick={() => handleSimulate(pct)}
                disabled={simLoading}
                style={{
                  padding: "6px 16px",
                  fontSize: 13,
                  border:
                    simPercent === pct ? "1px solid #1A1A17" : "1px solid #E4E1D6",
                  background: simPercent === pct ? "#1A1A17" : "#FBFAF6",
                  color: simPercent === pct ? "#FBFAF6" : "#4A4941",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {pct}%
              </button>
            ))}
          </div>
          {simResult && (
            <div style={{ display: "flex", gap: 24, fontSize: 13.5 }}>
              <div>
                <div style={{ color: "#8A887F", fontSize: 12, marginBottom: 4 }}>
                  Projected income
                </div>
                <div style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {inr(simResult.scenarioIncome)}
                </div>
              </div>
              <div>
                <div style={{ color: "#8A887F", fontSize: 12, marginBottom: 4 }}>
                  Monthly surplus
                </div>
                <div
                  style={{
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                    color: simResult.monthlySurplus < 0 ? "#A32D2D" : "#173404",
                  }}
                >
                  {inr(simResult.monthlySurplus)}
                </div>
              </div>
              <div>
                <div style={{ color: "#8A887F", fontSize: 12, marginBottom: 4 }}>
                  Savings coverage
                </div>
                <div style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {simResult.savingsCoverage} months
                </div>
              </div>
              <div>
                <div style={{ color: "#8A887F", fontSize: 12, marginBottom: 4 }}>Risk</div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "3px 8px",
                    borderRadius: 3,
                    background:
                      simResult.risk === "High"
                        ? "#FCEBEB"
                        : simResult.risk === "Moderate"
                        ? "#FAEEDA"
                        : "#EAF3DE",
                    color:
                      simResult.risk === "High"
                        ? "#791F1F"
                        : simResult.risk === "Moderate"
                        ? "#633806"
                        : "#173404",
                  }}
                >
                  {simResult.risk}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── AI Coach Chat ── */}
        <div
          ref={coachRef}
          style={{
            background: "#FBFAF6",
            border: "1px solid #E4E1D6",
            borderRadius: 4,
            padding: "0",
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            height: 400,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #E4E1D6",
              fontSize: 13,
              fontWeight: 500,
              color: "#1A1A17"
            }}
          >
            🧠 Krypton Smart Assistant
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
                Typing...
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
              placeholder="E.g., Can I afford to buy this phone?"
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
      </div>
    </div>
  );
}
