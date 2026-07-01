"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, MessageCircle, Camera, FileText,
  Bell, CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  Upload, Send, Loader2, Phone, Hash, ExternalLink
} from "lucide-react";

const API = "http://localhost:8000";

// ─── Types ────────────────────────────────────────────
interface VerifyResult {
  is_flagged: boolean;
  risk_score: number;
  cases_count: number;
  in_ring: boolean;
  source: string;
  message: string;
}
interface AnalysisResult {
  fraud_risk_score: number;
  risk_level: string;
  is_fraud: boolean;
  scam_type: string | null;
  fraud_keywords: string[];
  recommended_action: string;
  is_whatsapp_forward?: boolean;
  forward_signals?: string[];
}
interface ChatMsg { role: "bot" | "user"; text: string; }

// ─── Sidebar nav ────────────────────────────────────
const navItems = [
  { icon: Search,       label: "Verify Contact",    id: "verify"   },
  { icon: MessageCircle,label: "AI Assistant",      id: "chat"     },
  { icon: Camera,       label: "Currency Scanner",  id: "currency" },
  { icon: FileText,     label: "Analyze Message",   id: "analyze"  },
  { icon: Shield,       label: "File Complaint",    id: "report"   },
  { icon: Hash,         label: "Track Complaint",   id: "track"    },
  { icon: Bell,         label: "Alerts",            id: "alerts"   },
];

const verifyTypes = [
  { id: "phone", icon: "📞", label: "Phone Number", placeholder: "e.g. 9876543210" },
  { id: "upi",   icon: "💳", label: "UPI ID",       placeholder: "e.g. name@okicici" },
  { id: "url",   icon: "🌐", label: "Website URL",  placeholder: "e.g. https://sbi-verify.net" },
  { id: "bank",  icon: "🏦", label: "Bank Account", placeholder: "e.g. 12345678904" },
  { id: "email", icon: "📧", label: "Email Address", placeholder: "e.g. contact@suspicious-domain.com" },
];

const langs = [
  { code: "en", label: "English" }, { code: "hi", label: "हिंदी" },
  { code: "ta", label: "தமிழ்" },   { code: "te", label: "తెలుగు" },
  { code: "kn", label: "ಕನ್ನಡ" },   { code: "ml", label: "മലയാളം" },
  { code: "bn", label: "বাংলা" },   { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" }, { code: "pa", label: "ਪੰਜਾਬੀ" },
];

const INIT_MSG: ChatMsg = {
  role: "bot",
  text: "👋 **Namaste! I'm the KAVACH Safety Assistant.**\n\nI can help you:\n• 🔍 Identify scam tactics & fraud patterns\n• 📋 Guide you to file a cybercrime complaint\n• 📞 Connect you to helpline **1930**\n\nDescribe what happened — in English or Hindi."
};

// ─── Risk bar ────────────────────────────────────────
function RiskBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#10b981";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }} className="font-bold">{Math.round(score)}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }}
        />
      </div>
    </div>
  );
}

// ─── Quick suggestion chips ───────────────────────────
const CHAT_SUGGESTIONS = [
  "Someone called claiming to be CBI",
  "Got a UPI collect request",
  "Received a suspicious WhatsApp message",
  "How to report cybercrime?",
  "My bank account may be compromised",
];

// ─── Alerts (static) ─────────────────────────────────
const ALERTS = [
  { level: "critical", time: "2m ago", title: "Digital Arrest Wave", body: "New wave of CBI impersonation calls reported in Mumbai & Delhi. Do not engage." },
  { level: "high",     time: "18m ago", title: "Fake KBC Prize Calls", body: "Calls claiming KBC lottery wins demanding ₹2,500 processing fee. It's a scam." },
  { level: "high",     time: "45m ago", title: "UPI QR Scam Alert", body: "Scammers asking victims to scan QR codes claiming to 'send' money. Never scan." },
  { level: "medium",   time: "2h ago",  title: "Phishing SMS Campaign", body: "Fake SMS claiming SBI KYC expiry with link to sbi-verify-now.xyz" },
];
const alertBg: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/5",
  high: "border-orange-500/40 bg-orange-500/5",
  medium: "border-purple-500/40 bg-purple-500/5",
};
const alertBadge: Record<string, string> = {
  critical: "bg-red-500 text-white", high: "bg-orange-500 text-white", medium: "bg-purple-500 text-white",
};

// ─── Main ────────────────────────────────────────────
export default function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState("verify");
  const [verifyType, setVerifyType] = useState("phone");
  const [input, setInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([INIT_MSG]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [lang, setLang] = useState("en");
  const chatRef = useRef<HTMLDivElement>(null);

  // Currency
  const [currencyFile, setCurrencyFile] = useState<File | null>(null);
  const [currencyResult, setCurrencyResult] = useState<any>(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);

  // Analyze message
  const [analyzeText, setAnalyzeText] = useState("");
  const [analyzeSource, setAnalyzeSource] = useState("sms");
  const [analyzeResult, setAnalyzeResult] = useState<AnalysisResult | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // Complaint
  const [complaint, setComplaint] = useState({
    type: "", desc: "", phone: "", amount: "", district: "", state: ""
  });
  const [caseId, setCaseId] = useState<string | null>(null);
  const [complaintLoading, setComplaintLoading] = useState(false);

  // Track
  const [trackId, setTrackId] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  // Scroll chat to bottom
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Verify contact ──
  const runVerify = async () => {
    if (!input.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyError("");
    try {
      const res = await fetch(`${API}/api/v1/citizen/verify-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_type: verifyType, query_value: input.trim() })
      });
      if (!res.ok) throw new Error(await res.text());
      setVerifyResult(await res.json());
    } catch (e: any) {
      setVerifyError("Could not connect to the SentinelAI server. Make sure the backend is running.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Chat ──
  const sendChat = async (msg?: string) => {
    const text = (msg || chatInput).trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/citizen/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: lang, session_id: chatSessionId })
      });
      const data = await res.json();
      if (!chatSessionId) setChatSessionId(data.session_id);
      setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "⚠️ Connection error. Please check your backend server. Call **1930** for immediate help." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Currency scan ──
  const runCurrencyScan = async () => {
    if (!currencyFile) return;
    setCurrencyLoading(true);
    setCurrencyResult(null);
    try {
      const fd = new FormData();
      fd.append("file", currencyFile);
      const res = await fetch(`${API}/api/v1/citizen/scan-currency`, { method: "POST", body: fd });
      const data = await res.json();
      setCurrencyResult(data.analysis);
    } catch {
      setCurrencyResult({ error: "Could not scan. Ensure the backend server is running." });
    } finally {
      setCurrencyLoading(false);
    }
  };

  // ── Analyze message ──
  const runAnalyze = async () => {
    if (!analyzeText.trim()) return;
    setAnalyzeLoading(true);
    setAnalyzeResult(null);
    try {
      const res = await fetch(`${API}/api/v1/citizen/analyze-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: analyzeText, source: analyzeSource })
      });
      const data = await res.json();
      setAnalyzeResult(data.analysis);
    } catch {
      setAnalyzeResult(null);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // ── File complaint ──
  const submitComplaint = async () => {
    if (!complaint.type || !complaint.desc.trim()) return;
    setComplaintLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/citizen/complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_type: complaint.type,
          description: complaint.desc,
          suspect_value: complaint.phone,
          fraud_amount: parseFloat(complaint.amount) || 0,
          district: complaint.district || "Unknown",
          state: complaint.state || "Unknown",
          report_source: "web"
        })
      });
      const data = await res.json();
      setCaseId(data.case_id || "KV2024-DEMO");
    } catch {
      setCaseId("KV2024-OFFLINE");
    } finally {
      setComplaintLoading(false);
    }
  };

  // ── Track complaint ──
  const trackComplaint = async () => {
    if (!trackId.trim()) return;
    setTrackLoading(true);
    setTrackResult(null);
    setTrackError("");
    try {
      const res = await fetch(`${API}/api/v1/citizen/complaint/${trackId.trim()}/status`);
      if (!res.ok) {
        setTrackError(`Case ID "${trackId}" not found. Please double-check the ID from your complaint confirmation.`);
      } else {
        setTrackResult(await res.json());
      }
    } catch {
      setTrackError("Server connection error. Ensure the backend is running.");
    } finally {
      setTrackLoading(false);
    }
  };

  const riskColor = (s: number) => s >= 70 ? "#ef4444" : s >= 40 ? "#f59e0b" : "#10b981";
  const riskLabel = (s: number) => s >= 70 ? "HIGH RISK" : s >= 40 ? "MEDIUM RISK" : "LOW RISK";

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)]">
      {/* Top bar */}
      <header className="glass border-b border-[var(--border)] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft size={18} className="text-slate-400" />
          <span className="font-black text-base"><span className="gradient-text">Sentinel</span>AI</span>
        </Link>
        <div className="text-sm font-semibold text-slate-300">Citizen Dashboard</div>
        <a href="tel:1930" className="px-3 py-1.5 bg-red-500/90 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">
          🚨 1930
        </a>
      </header>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 py-6 px-3 border-r border-[var(--border)] min-h-[calc(100vh-57px)]">
          <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-base">👥</div>
            <div>
              <div className="text-sm font-semibold">Citizen</div>
              <div className="text-xs text-slate-500">Protected</div>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map(n => (
              <button key={n.id} onClick={() => setActiveTab(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === n.id
                    ? "bg-cyan-400/15 text-cyan-400 border border-cyan-400/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}>
                <n.icon size={16} /> {n.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-red-400 mb-1">🚨 Emergency</p>
            <p>Call <strong>1930</strong> immediately</p>
            <p>Report: <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">cybercrime.gov.in</a></p>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-[var(--border)] flex overflow-x-auto">
          {navItems.slice(0, 5).map(n => (
            <button key={n.id} onClick={() => setActiveTab(n.id)}
              className={`flex flex-col items-center gap-0.5 flex-1 min-w-[60px] px-1 py-2 text-[10px] font-medium transition-all ${
                activeTab === n.id ? "text-cyan-400" : "text-slate-500"
              }`}>
              <n.icon size={18} />
              {n.label.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <AnimatePresence mode="wait">

            {/* ── VERIFY TAB ── */}
            {activeTab === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-1">🔍 Fraud Verification Tool</h2>
                  <p className="text-slate-500 text-sm">Check any phone number, UPI ID, URL, or bank account before engaging.</p>
                </div>

                {/* Type selector */}
                <div className="flex flex-wrap gap-2">
                  {verifyTypes.map(t => (
                    <button key={t.id} onClick={() => { setVerifyType(t.id); setInput(""); setVerifyResult(null); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        verifyType === t.id ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-400" : "border-[var(--border)] text-slate-400 hover:border-cyan-400/30"
                      }`}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="glass rounded-2xl p-5 border border-[var(--border)]">
                  <div className="flex gap-3">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && runVerify()}
                      placeholder={verifyTypes.find(t => t.id === verifyType)?.placeholder || "Enter value to check"}
                      className="flex-1 bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50"
                    />
                    <button onClick={runVerify} disabled={verifyLoading || !input.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:opacity-90 transition flex items-center gap-2">
                      {verifyLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      {verifyLoading ? "Checking…" : "Check"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Try: <button className="text-cyan-500 hover:underline" onClick={() => setInput("9876543210")}>9876543210</button> (flagged scammer) or <button className="text-cyan-500 hover:underline" onClick={() => { setVerifyType("url"); setInput("https://sbi-verify.net"); }}>sbi-verify.net</button> (phishing URL)</p>
                </div>

                {verifyError && (
                  <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 text-sm text-orange-400">{verifyError}</div>
                )}

                {/* Result */}
                {verifyResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-5 ${verifyResult.is_flagged ? "border-red-500/40 bg-red-500/5" : "border-green-500/40 bg-green-500/5"}`}>
                    <div className="flex items-start gap-3 mb-4">
                      {verifyResult.is_flagged
                        ? <XCircle size={24} className="text-red-400 mt-0.5 shrink-0" />
                        : <CheckCircle size={24} className="text-green-400 mt-0.5 shrink-0" />}
                      <div>
                        <p className="text-sm font-semibold leading-snug">{verifyResult.message}</p>
                        <p className="text-xs text-slate-500 mt-1">Source: {verifyResult.source}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <RiskBar score={verifyResult.risk_score} label="AI Risk Score" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[
                        { label: "Risk Score", val: `${Math.round(verifyResult.risk_score)}%` },
                        { label: "Cases Linked", val: verifyResult.cases_count.toString() },
                        { label: "In Fraud Ring", val: verifyResult.in_ring ? "YES" : "No" },
                      ].map(item => (
                        <div key={item.label} className="glass rounded-xl p-3 border border-[var(--border)] text-center">
                          <div className="text-xs text-slate-500">{item.label}</div>
                          <div className={`text-sm font-bold mt-1 ${item.val === "YES" ? "text-red-400" : "text-slate-200"}`}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                    {verifyResult.is_flagged && (
                      <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                        🚨 <strong>Do NOT</strong> share OTP, bank details, or transfer any money to this contact. Call <strong>1930</strong> to report.
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── CHAT TAB ── */}
            {activeTab === "chat" && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-black">🤖 KAVACH AI Assistant</h2>
                    <p className="text-slate-500 text-sm">Fraud guidance in 10 Indian languages</p>
                  </div>
                  <select value={lang} onChange={e => setLang(e.target.value)}
                    className="bg-white/5 border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
                    {langs.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>

                {/* Quick chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {CHAT_SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => sendChat(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all">
                      {s}
                    </button>
                  ))}
                </div>

                {/* Messages */}
                <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 glass rounded-2xl border border-[var(--border)] p-4 mb-4" style={{ minHeight: 0 }}>
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "bot" && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm mr-2 mt-1 shrink-0">🤖</div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        m.role === "user"
                          ? "bg-cyan-500/20 text-slate-200 rounded-tr-sm"
                          : "bg-white/5 border border-[var(--border)] text-slate-200 rounded-tl-sm"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Loader2 size={14} className="animate-spin" /> KAVACH is thinking…
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-3">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                    placeholder="Describe what happened… (English or Hindi)"
                    className="flex-1 bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50"
                  />
                  <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── CURRENCY TAB ── */}
            {activeTab === "currency" && (
              <motion.div key="currency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-1">💰 Counterfeit Currency Scanner</h2>
                  <p className="text-slate-500 text-sm">Upload a photo of any Indian currency note for AI-powered 7-feature analysis.</p>
                </div>

                <div className="glass rounded-2xl p-5 border border-[var(--border)]">
                  {!currencyFile ? (
                    <label className="h-40 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400/50 hover:bg-white/2 transition-all">
                      <input type="file" accept="image/*" className="hidden" onChange={e => { setCurrencyFile(e.target.files?.[0] || null); setCurrencyResult(null); }} />
                      <Upload size={32} className="text-slate-500 mb-3" />
                      <p className="text-slate-400 text-sm font-medium">Click to upload note image</p>
                      <p className="text-slate-600 text-xs mt-1">JPG, PNG, HEIC — any Indian denomination</p>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">📄</div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{currencyFile.name}</p>
                          <p className="text-xs text-slate-500">{(currencyFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button onClick={() => { setCurrencyFile(null); setCurrencyResult(null); }} className="text-slate-500 hover:text-red-400 transition">✕</button>
                    </div>
                  )}

                  {currencyFile && (
                    <button onClick={runCurrencyScan} disabled={currencyLoading}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                      {currencyLoading ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <><Camera size={16} /> Scan for Counterfeit</>}
                    </button>
                  )}
                </div>

                {/* Results */}
                {currencyResult && !currencyResult.error && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`glass rounded-2xl p-5 border ${currencyResult.is_counterfeit ? "border-red-500/40" : "border-green-500/40"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className={`text-lg font-black ${currencyResult.is_counterfeit ? "text-red-400" : "text-green-400"}`}>
                          {currencyResult.is_counterfeit ? "⚠️ COUNTERFEIT DETECTED" : "✅ GENUINE NOTE"}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">₹{currencyResult.denomination} · Series {currencyResult.series_year} · Confidence: {(currencyResult.overall_confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div className={`text-2xl font-black px-4 py-2 rounded-xl border ${currencyResult.is_counterfeit ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-green-400 border-green-500/30 bg-green-500/10"}`}>
                        {currencyResult.is_counterfeit ? "FAKE" : "REAL"}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {Object.entries(currencyResult.features as Record<string, number>).map(([k, v]) => (
                        <RiskBar key={k}
                          score={currencyResult.is_counterfeit ? (1 - v) * 100 : v * 100}
                          label={k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) + (currencyResult.is_counterfeit ? " — FAIL" : " — PASS")}
                        />
                      ))}
                    </div>
                    {currencyResult.report && (
                      <div className={`mt-4 p-3 rounded-xl text-xs ${currencyResult.is_counterfeit ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-green-500/10 border border-green-500/20 text-green-300"}`}>
                        {currencyResult.report.action_required}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── ANALYZE MESSAGE TAB ── */}
            {activeTab === "analyze" && (
              <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-1">🔎 Analyze Suspicious Message</h2>
                  <p className="text-slate-500 text-sm">Paste any SMS, WhatsApp message, or email to instantly check for scam patterns.</p>
                </div>

                <div className="glass rounded-2xl p-5 border border-[var(--border)] space-y-4">
                  <div className="flex gap-2">
                    {[["sms","📱 SMS"], ["whatsapp","💬 WhatsApp"], ["email","📧 Email"]].map(([id, label]) => (
                      <button key={id} onClick={() => setAnalyzeSource(id)}
                        className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${analyzeSource === id ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-400" : "border-[var(--border)] text-slate-400"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={analyzeText}
                    onChange={e => setAnalyzeText(e.target.value)}
                    rows={6}
                    placeholder={`Paste the suspicious ${analyzeSource} text here…\n\nExample: "Your SBI account will be blocked. Complete KYC at sbi-verify.net immediately."`}
                    className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 resize-none"
                  />
                  <button onClick={runAnalyze} disabled={analyzeLoading || !analyzeText.trim()}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                    {analyzeLoading ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <><Search size={16} /> Analyze for Scam</>}
                  </button>
                </div>

                {analyzeResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`glass rounded-2xl p-5 border ${analyzeResult.is_fraud ? "border-red-500/40 bg-red-500/5" : "border-green-500/40 bg-green-500/5"}`}>
                    <div className="flex items-center gap-3 mb-4">
                      {analyzeResult.is_fraud
                        ? <AlertTriangle size={22} className="text-red-400 shrink-0" />
                        : <CheckCircle size={22} className="text-green-400 shrink-0" />}
                      <div>
                        <p className="font-bold" style={{ color: riskColor(analyzeResult.fraud_risk_score) }}>
                          {riskLabel(analyzeResult.fraud_risk_score)} — {Math.round(analyzeResult.fraud_risk_score)}% Fraud Probability
                        </p>
                        {analyzeResult.scam_type && (
                          <p className="text-xs text-slate-400 mt-0.5">Scam type: <span className="text-orange-400 font-semibold">{analyzeResult.scam_type.replace(/_/g, " ").toUpperCase()}</span></p>
                        )}
                      </div>
                    </div>
                    <RiskBar score={analyzeResult.fraud_risk_score} label="Fraud Risk Score" />
                    {analyzeResult.fraud_keywords.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-500 mb-2">Detected Keywords:</p>
                        <div className="flex flex-wrap gap-2">
                          {analyzeResult.fraud_keywords.map(kw => (
                            <span key={kw} className="text-xs px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-300">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-3 rounded-xl bg-white/5 border border-[var(--border)] text-xs text-slate-300 leading-relaxed">
                      <strong>Recommended Action:</strong> {analyzeResult.recommended_action}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── FILE COMPLAINT TAB ── */}
            {activeTab === "report" && (
              <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-1">📋 File a Cybercrime Complaint</h2>
                  <p className="text-slate-500 text-sm">Your complaint is analyzed by AI and routed to the relevant cyber cell automatically.</p>
                </div>

                {caseId ? (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-2xl p-8 border border-green-500/30 bg-green-500/5 text-center">
                    <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-green-400 mb-2">Complaint Filed Successfully</h3>
                    <p className="text-slate-400 text-sm mb-5">Your case has been submitted and assigned an AI risk score. Keep this Case ID safe.</p>
                    <div className="inline-block bg-white/5 border border-green-500/30 rounded-2xl px-6 py-4 mb-5">
                      <p className="text-xs text-slate-500 mb-1">Your Case ID</p>
                      <p className="text-2xl font-black text-green-400 font-mono tracking-wider">{caseId}</p>
                    </div>
                    <div className="text-left space-y-2 text-sm text-slate-400">
                      <p>✅ Save this Case ID to track your complaint status</p>
                      <p>✅ A cyber officer will be assigned within 24 hours</p>
                      <p>✅ Preserve all evidence (screenshots, recordings)</p>
                      <p>✅ Call <strong className="text-cyan-400">1930</strong> if the fraud is ongoing</p>
                    </div>
                    <button onClick={() => { setCaseId(null); setComplaint({ type: "", desc: "", phone: "", amount: "", district: "", state: "" }); }}
                      className="mt-6 px-6 py-2.5 border border-[var(--border)] rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-all">
                      File Another Complaint
                    </button>
                  </motion.div>
                ) : (
                  <div className="glass rounded-2xl p-5 border border-[var(--border)] space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Complaint Type *</label>
                      <select value={complaint.type} onChange={e => setComplaint(p => ({ ...p, type: e.target.value }))}
                        className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400/50">
                        <option value="">-- Select scam type --</option>
                        <option value="digital_arrest">Digital Arrest Scam</option>
                        <option value="bank_fraud">Bank / KYC Fraud</option>
                        <option value="upi_fraud">UPI / QR Code Fraud</option>
                        <option value="investment_scam">Investment / Crypto Scam</option>
                        <option value="lottery_scam">Lottery / Prize Scam</option>
                        <option value="job_scam">Fake Job Offer</option>
                        <option value="courier_scam">Courier / FedEx Scam</option>
                        <option value="currency_counterfeit">Counterfeit Currency</option>
                        <option value="other">Other Cybercrime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Describe what happened * (be specific)</label>
                      <textarea rows={5} value={complaint.desc} onChange={e => setComplaint(p => ({ ...p, desc: e.target.value }))}
                        placeholder="Describe the incident in detail — who called, what they said, what was asked of you, what happened to your money…"
                        className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 resize-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Suspect Phone / UPI / URL</label>
                        <input value={complaint.phone} onChange={e => setComplaint(p => ({ ...p, phone: e.target.value }))}
                          placeholder="e.g. 9876543210 or mule@okaxis"
                          className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Amount Lost (₹)</label>
                        <input type="number" value={complaint.amount} onChange={e => setComplaint(p => ({ ...p, amount: e.target.value }))}
                          placeholder="e.g. 50000"
                          className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Your District</label>
                        <input value={complaint.district} onChange={e => setComplaint(p => ({ ...p, district: e.target.value }))}
                          placeholder="e.g. Mumbai"
                          className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Your State</label>
                        <input value={complaint.state} onChange={e => setComplaint(p => ({ ...p, state: e.target.value }))}
                          placeholder="e.g. Maharashtra"
                          className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50" />
                      </div>
                    </div>
                    <button onClick={submitComplaint} disabled={complaintLoading || !complaint.type || !complaint.desc.trim()}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition">
                      {complaintLoading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><FileText size={16} /> Submit Complaint</>}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── TRACK COMPLAINT TAB ── */}
            {activeTab === "track" && (
              <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-1">🔖 Track Your Complaint</h2>
                  <p className="text-slate-500 text-sm">Enter the Case ID you received after filing your complaint to check its status.</p>
                </div>

                <div className="glass rounded-2xl p-5 border border-[var(--border)]">
                  <div className="flex gap-3">
                    <input
                      value={trackId}
                      onChange={e => setTrackId(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && trackComplaint()}
                      placeholder="Enter Case ID (e.g. KV2024001234)"
                      className="flex-1 bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50"
                    />
                    <button onClick={trackComplaint} disabled={trackLoading || !trackId.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-xl disabled:opacity-50">
                      {trackLoading ? <Loader2 size={16} className="animate-spin" /> : "Track"}
                    </button>
                  </div>
                  {trackError && <p className="text-sm text-orange-400 mt-3">{trackError}</p>}
                </div>

                {trackResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border border-[var(--border)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Case ID</p>
                        <p className="text-lg font-black font-mono text-cyan-400">{trackResult.case_id}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        trackResult.status === "resolved" ? "border-green-500/40 bg-green-500/10 text-green-400"
                        : trackResult.status === "investigating" ? "border-purple-500/40 bg-purple-500/10 text-purple-400"
                        : "border-orange-500/40 bg-orange-500/10 text-orange-400"
                      }`}>
                        {trackResult.status.toUpperCase().replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-[var(--border)]">{trackResult.status_message}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-slate-500 text-xs">Type</p><p className="text-slate-200 font-medium">{trackResult.case_type?.replace(/_/g, " ").toUpperCase()}</p></div>
                      <div><p className="text-slate-500 text-xs">Risk</p><p className={`font-bold ${trackResult.risk_level === "critical" ? "text-red-400" : trackResult.risk_level === "high" ? "text-orange-400" : "text-yellow-400"}`}>{trackResult.risk_level?.toUpperCase()}</p></div>
                      <div><p className="text-slate-500 text-xs">Location</p><p className="text-slate-200">{trackResult.district}, {trackResult.state}</p></div>
                      <div><p className="text-slate-500 text-xs">Amount</p><p className="text-slate-200">₹{trackResult.fraud_amount_inr?.toLocaleString()}</p></div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2 font-semibold">Next Steps:</p>
                      <ul className="space-y-1.5">
                        {trackResult.next_steps?.map((step: string, i: number) => (
                          <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-cyan-500 font-bold">→</span> {step}</li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── ALERTS TAB ── */}
            {activeTab === "alerts" && (
              <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div>
                  <h2 className="text-xl font-black mb-1">🔔 Safety Alerts</h2>
                  <p className="text-slate-500 text-sm">Active nationwide fraud campaigns and safety warnings from cybercrime authorities.</p>
                </div>
                {ALERTS.map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className={`rounded-2xl p-4 border ${alertBg[a.level]}`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-sm text-slate-200">{a.title}</p>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${alertBadge[a.level]}`}>{a.level}</span>
                        <span className="text-xs text-slate-500">{a.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{a.body}</p>
                  </motion.div>
                ))}
                <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 text-sm text-cyan-300">
                  <p className="font-semibold mb-1">📡 Stay Informed</p>
                  <p>Follow <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="underline">cybercrime.gov.in</a> for the latest safety advisories from the Ministry of Home Affairs.</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
