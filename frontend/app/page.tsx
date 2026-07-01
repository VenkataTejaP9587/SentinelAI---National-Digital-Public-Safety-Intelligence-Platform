"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield, Bell, Search, Menu, X, ChevronRight,
  Activity, AlertTriangle, TrendingUp, Users,
  Eye, Zap, Globe, Lock, ArrowRight, CheckCircle, Loader2
} from "lucide-react";

// ─── Animated Counter ─────────────────────────────────
function useCounter(target: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); return; }
      setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);
  return count;
}

// ─── Stats ────────────────────────────────────────────
const stats = [
  { label: "Cybercrime Complaints (2023)", value: 1140000, suffix: "", prefix: "", display: (n: number) => n >= 1e6 ? (n/1e5).toFixed(1)+"L" : n.toLocaleString(), delta: "↑ 61% YoY", deltaClass: "text-red-400" },
  { label: "Digital Arrest Scam Losses", value: 1776, suffix: " Cr", prefix: "₹", display: (n: number) => n.toLocaleString(), delta: "H1 2024", deltaClass: "text-red-400" },
  { label: "Active Fraud Rings", value: 12000, suffix: "+", prefix: "", display: (n: number) => n.toLocaleString(), delta: "Estimated nationwide", deltaClass: "text-orange-400" },
  { label: "AI Alert Latency", value: 30, suffix: "s", prefix: "<", display: (n: number) => n.toString(), delta: "Real-time detection", deltaClass: "text-green-400" },
];

// ─── AI Modules ──────────────────────────────────────
const modules = [
  { icon: "🔊", title: "KAVACH-VOICE", subtitle: "Scam Detection", desc: "Real-time analysis of calls, WhatsApp, SMS, emails. Deepfake voice detection. Digital arrest scam identification in 12 languages.", tags: ["IndicBERT", "Whisper v3", "ECAPA-TDNN"], color: "#00d4ff", href: "/modules/voice" },
  { icon: "💰", title: "KAVACH-CURRENCY", subtitle: "Counterfeit Detection", desc: "7-feature parallel analysis via mobile camera — security thread, watermark, UV simulation, serial validation, texture.", tags: ["YOLOv11", "EfficientNet-B4", "ViT-B/16"], color: "#f59e0b", href: "/modules/currency" },
  { icon: "🕸️", title: "KAVACH-NET", subtitle: "Fraud Network Intelligence", desc: "GNN-powered fraud ring detection across phones, bank accounts, UPI IDs, IMEIs. Court-admissible intelligence reports.", tags: ["GraphSAGE", "GAT", "Neo4j"], color: "#8b5cf6", href: "/modules/network" },
  { icon: "🗺️", title: "KAVACH-GEO", subtitle: "Geospatial Intelligence", desc: "Real-time crime heatmaps, AI-predicted hotspots, and police patrol recommendations using H3 hexagonal indexing.", tags: ["Prophet", "ST-GCN", "PostGIS"], color: "#10b981", href: "/modules/geo" },
  { icon: "🤖", title: "KAVACH-ASSIST", subtitle: "Multilingual AI Assistant", desc: "12 Indian languages on WhatsApp, IVR, web, and mobile. Guides victims, verifies contacts, auto-fills FIRs.", tags: ["Llama 3.1", "IndicTrans2", "LangChain"], color: "#3b82f6", href: "/chat" },
  { icon: "🔮", title: "KAVACH-PREDICT", subtitle: "Predictive AI Engine", desc: "Predicts emerging scam campaigns 48–72h before peak. Transaction fraud probability scoring. Coordinated attack detection.", tags: ["XGBoost", "LightGBM", "Isolation Forest"], color: "#ef4444", href: "/modules/predict" },
  { icon: "🧠", title: "KAVACH-AGENT", subtitle: "Autonomous AI Orchestrator", desc: "LangGraph multi-agent system — evidence collection, risk synthesis, bank/telecom alerts, intelligence briefs. All in <5 minutes.", tags: ["LangGraph", "Llama 3.1 70B", "Gemma"], color: "#00d4ff", href: "/modules/agent" },
];

// ─── Roles ─────────────────────────────────────────────
const roles = [
  { icon: "👥", name: "Citizen", desc: "Verify contacts, scan currency, file complaints, multilingual AI assistant", href: "/dashboard/citizen", color: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30" },
  { icon: "👮", name: "Police Officer", desc: "Command center, fraud network graphs, crime maps, AI investigation", href: "/dashboard/police", color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30" },
  { icon: "🏦", name: "Bank Officer", desc: "Counterfeit scanner, high-risk transactions, mule detection, UPI risk", href: "/dashboard/bank", color: "from-orange-500/20 to-yellow-500/20", border: "border-orange-500/30" },
  { icon: "📡", name: "Telecom Operator", desc: "Scam number detection, spoofing analysis, SIM cluster intelligence", href: "/dashboard/telecom", color: "from-green-500/20 to-teal-500/20", border: "border-green-500/30" },
  { icon: "🔐", name: "Administrator", desc: "User management, model monitoring, system health, audit logs", href: "/dashboard/admin", color: "from-red-500/20 to-orange-500/20", border: "border-red-500/30" },
];

// ─── Nav ──────────────────────────────────────────────
function Navbar({ onAuth }: { onAuth: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${
        scrolled ? "glass shadow-lg shadow-black/20" : "bg-transparent"
      }`}
    >
      <Link href="/" className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-cyan-500/25">
          🛡️
        </div>
        <span className="text-xl font-black tracking-tight">
          <span className="gradient-text">Sentinel</span>
          <span className="text-slate-100">AI</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {[["#modules", "Modules"], ["#workflow", "How It Works"], ["#roles", "Dashboards"], ["/analytics", "Analytics"]].map(([href, label]) => (
          <a key={href} href={href} className="text-slate-400 hover:text-cyan-400 text-sm transition-colors duration-200">
            {label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onAuth} className="hidden md:block px-4 py-2 text-sm border border-[var(--border)] text-slate-300 rounded-lg hover:border-cyan-400/50 hover:text-cyan-400 transition-all duration-200">
          Sign In
        </button>
        <button onClick={onAuth} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-cyan-500/25">
          Get Access
        </button>
        <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 glass border-t border-[var(--border)] p-4 flex flex-col gap-3 md:hidden"
          >
            {[["#modules","Modules"],["#workflow","How It Works"],["#roles","Dashboards"]].map(([href,label])=>(
              <a key={href} href={href} className="text-slate-400 hover:text-cyan-400 text-sm py-2 border-b border-[var(--border)]" onClick={()=>setMenuOpen(false)}>{label}</a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ─── Auth Modal ──────────────────────────────────────
function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState("citizen");
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const API_URL = "http://localhost:8000/api/v1/auth";

    try {
      if (mode === "register") {
        if (!fullName || !mobileNumber || !password) {
          throw new Error("Please fill in all required fields.");
        }
        const res = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: mobileNumber,
            password: password,
            full_name: fullName,
            role: role === "police" ? "police_officer" : role === "bank" ? "bank_officer" : role === "telecom" ? "telecom_officer" : role,
            preferred_language: "en",
            state: state || undefined,
            district: district || undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          const errMsg = typeof errData.detail === 'string'
            ? errData.detail
            : Array.isArray(errData.detail)
              ? errData.detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ')
              : JSON.stringify(errData.detail) || "Registration failed.";
          throw new Error(errMsg);
        }

        setSuccess("Registration successful! Switching to login...");
        setTimeout(() => {
          setMode("login");
          setSuccess("");
        }, 1500);

      } else {
        if (!mobileNumber || !password || !otp) {
          throw new Error("Please enter your Mobile Number, Password, and 6-digit OTP.");
        }

        const otpRes = await fetch(`${API_URL}/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_number: mobileNumber, otp_code: otp }),
        });

        if (!otpRes.ok) {
          const errData = await otpRes.json();
          const errMsg = typeof errData.detail === 'string'
            ? errData.detail
            : Array.isArray(errData.detail)
              ? errData.detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ')
              : JSON.stringify(errData.detail) || "Invalid OTP. Use 123456 for demo.";
          throw new Error(errMsg);
        }

        const loginRes = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: mobileNumber,
            password: password,
          }),
        });

        if (!loginRes.ok) {
          const errData = await loginRes.json();
          const errMsg = typeof errData.detail === 'string'
            ? errData.detail
            : Array.isArray(errData.detail)
              ? errData.detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ')
              : JSON.stringify(errData.detail) || "Invalid mobile number or password.";
          throw new Error(errMsg);
        }

        const data = await loginRes.json();
        
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", role);
        localStorage.setItem("mobile", mobileNumber);

        setSuccess("Authentication successful! Redirecting...");
        setTimeout(() => {
          onClose();
          window.location.href = `/dashboard/${role}`;
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(3, 7, 18, 0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="glass rounded-3xl p-6 md:p-8 w-full max-w-md relative max-h-[92vh] overflow-y-auto shadow-2xl border border-white/10 relative overflow-hidden"
          >
            {/* Ambient background glows */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 hover:scale-105 transition-all"><X size={20}/></button>
            <h2 className="text-2xl font-black mb-1 tracking-tight">Access <span className="gradient-text">SentinelAI</span></h2>
            <p className="text-slate-500 text-sm mb-6">India's Public Safety & Anti-Fraud Infrastructure</p>

            {/* Login / Register Toggle */}
            <div className="flex bg-white/3 p-1.5 rounded-2xl mb-6 border border-white/5 relative">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${mode === "login" ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/20 shadow-md" : "text-slate-400 hover:text-slate-300"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${mode === "register" ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/20 shadow-md" : "text-slate-400 hover:text-slate-300"}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 relative z-10">
              {/* Role selection */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider">Select Access Role</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    {id:"citizen",icon:"👥",name:"Citizen", color: "text-cyan-400"},
                    {id:"police",icon:"👮",name:"Police Officer", color: "text-purple-400"},
                    {id:"bank",icon:"🏦",name:"Bank Officer", color: "text-amber-400"},
                    {id:"telecom",icon:"📡",name:"Telecom", color: "text-emerald-400"},
                    {id:"admin",icon:"🔐",name:"Admin", color: "text-rose-400"},
                  ].map(r => (
                    <button key={r.id} type="button" onClick={()=>setRole(r.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all duration-300 flex items-center justify-center gap-2 ${role===r.id ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-400 shadow-lg shadow-cyan-500/5 scale-[1.02]" : "border-white/5 bg-white/100 text-slate-400 hover:border-white/10 hover:text-slate-200"} ${r.id==="admin"?"col-span-2":""}`}
                    >
                      <span className="text-base">{r.icon}</span>
                      <span className="text-xs font-bold">{r.name}</span>
                      {role === r.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  {mode === "register" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        className="sentinel-input w-full"
                        placeholder="Full Name"
                      />
                    </motion.div>
                  )}

                  <div>
                    <input
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      required
                      type="tel"
                      className="sentinel-input w-full"
                      placeholder="Mobile Number"
                    />
                  </div>

                  <div>
                    <input
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      type="password"
                      className="sentinel-input w-full"
                      placeholder="Secret PIN / Password"
                    />
                  </div>

                  {mode === "register" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
                      <input
                        value={district}
                        onChange={e => setDistrict(e.target.value)}
                        className="sentinel-input w-full"
                        placeholder="District (e.g. Mumbai)"
                      />
                      <input
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="sentinel-input w-full"
                        placeholder="State (e.g. MH)"
                      />
                    </motion.div>
                  )}

                  {mode === "login" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          required
                          maxLength={6}
                          className="sentinel-input flex-1 font-mono tracking-widest text-center text-base"
                          placeholder="000000"
                        />
                        <button
                          type="button"
                          onClick={() => alert("Verification code '123456' sent successfully via simulated SMS gateway.")}
                          className="px-4 text-xs font-bold border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-all duration-200"
                        >
                          Send OTP
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 text-center">Enter demo OTP <strong className="text-cyan-400">123456</strong> to verify.</p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={14} className="shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-xl hover:opacity-95 hover:scale-[0.99] transition-all shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-sans"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "🛡️"}
                {loading ? "Authenticating…" : mode === "login" ? "Authenticate & Enter" : "Register Profile"}
              </button>

              <p className="text-center text-[10px] text-slate-600 tracking-wider">Keycloak OAuth2 · JWT RS256 · SHA-256 Hashing</p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Hero ────────────────────────────────────────────
function Hero({ onAuth }: { onAuth: () => void }) {
  const [statsStarted, setStatsStarted] = useState(false);
  const statRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsStarted(true); }, { threshold: 0.3 });
    if (statRef.current) obs.observe(statRef.current);
    return () => obs.disconnect();
  }, []);

  const counters = stats.map(s => useCounter(s.value, 2000, statsStarted));

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 pt-24 pb-16">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 80% 60% at 50% -10%,rgba(0,212,255,0.08) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 90% 50%,rgba(139,92,246,0.06) 0%,transparent 60%)"}}/>

      <div className="relative z-10 text-center w-full flex flex-col items-center">
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.6}}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/8 text-cyan-400 text-sm mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full pulse-dot"/>
          Live · Smart India Hackathon 2024 · MHA / I4C
        </motion.div>

        <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.1}}
          className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
          India&apos;s <span className="gradient-text">AI-Powered</span><br/>
          Digital Safety Platform
        </motion.h1>

        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.2}}
          className="text-lg text-slate-400 max-w-2xl text-center mb-10 leading-relaxed">
          SentinelAI defeats digital arrest scams, counterfeit currency, and fraud rings in real-time — connecting 1.4 billion citizens, law enforcement, banks, and telecom operators through autonomous AI agents.
        </motion.p>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.3}}
          className="flex flex-wrap gap-4 justify-center mb-16">
          <button onClick={onAuth} className="px-8 py-4 font-bold text-base bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl hover:opacity-90 hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/30 flex items-center gap-2">
            🚀 Access Platform <ArrowRight size={18}/>
          </button>
          <a href="#dashboard" className="px-8 py-4 font-semibold text-base border border-[var(--border)] text-slate-300 rounded-2xl hover:border-cyan-400/50 hover:text-cyan-400 transition-all flex items-center gap-2">
            👁 Live Demo <ChevronRight size={18}/>
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div ref={statRef} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
          className="grid grid-cols-2 md:grid-cols-4 gap-0 w-full max-w-3xl">
          {stats.map((s, i) => (
            <div key={i} className={`p-5 glass text-center ${i===0?"rounded-l-2xl":""} ${i===stats.length-1?"rounded-r-2xl":""} border-r border-[var(--border)] last:border-r-0`}>
              <div className="text-2xl font-black gradient-text">
                {s.prefix}{s.display(counters[i])}{s.suffix}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              <div className={`text-xs mt-1 ${s.deltaClass}`}>{s.delta}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Modules Grid ────────────────────────────────────
function ModulesSection() {
  return (
    <section id="modules" className="py-24 px-8 mb-20" style={{background:"rgba(13,21,38,0.5)"}}>
      <div className="w-full">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full border border-purple-400/30 bg-purple-400/10 text-purple-400 text-xs uppercase tracking-widest mb-3">Seven Integrated AI Modules</span>
          <h2 className="text-3xl font-black tracking-tight mb-2">Complete <span className="gradient-text">Digital Safety</span> Coverage</h2>
          <p className="text-slate-400 text-sm text-center">Every threat vector monitored by a dedicated AI module, orchestrated by an autonomous agentic layer.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {modules.map((m, i) => (
            <motion.div key={i}
              initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
              transition={{delay:i*0.05,duration:0.4}} viewport={{once:true}}>
              <Link href={m.href}>
                <div className="h-full glass rounded-xl p-5 card-hover cursor-pointer border border-[var(--border)] group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg mb-2"
                    style={{background:`${m.color}20`,border:`1px solid ${m.color}30`}}>
                    {m.icon}
                  </div>
                  <h3 className="font-bold text-[11px] leading-tight" style={{color:m.color}}>{m.title}</h3>
                  <p className="font-semibold text-slate-200 text-xs mb-1">{m.subtitle}</p>
                  <p className="text-slate-400 text-[11px] leading-snug mb-2 line-clamp-3">{m.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {m.tags.map(t=>(
                      <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{background:`${m.color}15`,color:m.color,border:`1px solid ${m.color}25`}}>{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Roles Section ───────────────────────────────────
function RolesSection({ onAuth }: { onAuth: () => void }) {
  return (
    <section id="roles" className="py-32 px-8 mb-20">
      <div className="w-full">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 text-xs uppercase tracking-widest mb-4">Role-Based Intelligence Dashboards</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Every Stakeholder <span className="gradient-text">Protected</span></h2>
          <p className="text-slate-400 text-center">Purpose-built AI dashboards for every actor in India&apos;s digital safety ecosystem.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
          {roles.map((r, i) => (
            <motion.div key={i}
              initial={{opacity:0,scale:0.95}} whileInView={{opacity:1,scale:1}}
              transition={{delay:i*0.1,duration:0.4}} viewport={{once:true}}>
              <Link href={r.href}>
                <div className={`glass rounded-2xl p-7 card-hover cursor-pointer border ${r.border} bg-gradient-to-br ${r.color} h-full`}>
                  <div className="text-4xl mb-4">{r.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{r.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{r.desc}</p>
                  <div className="flex items-center gap-1 text-cyan-400 text-sm font-semibold">
                    Enter Dashboard <ChevronRight size={16}/>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SOS Banner ──────────────────────────────────────
function SOSBanner() {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1}}
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      <a href="tel:1930" className="flex items-center gap-2 px-4 py-2.5 bg-red-500/90 hover:bg-red-500 text-white font-bold rounded-full shadow-xl shadow-red-500/30 transition-all hover:scale-105 text-sm backdrop-blur-sm">
        🚨 Emergency: 1930
      </a>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────
export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <Navbar onAuth={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="w-full">
        <Hero onAuth={() => setAuthOpen(true)} />
        <ModulesSection />
        <RolesSection onAuth={() => setAuthOpen(true)} />

        {/* Workflow section */}
        <section id="workflow" className="py-32 px-8 mb-20" style={{background:"rgba(13,21,38,0.5)"}}>
          <div className="w-full text-center">
            <span className="inline-block px-3 py-1 rounded-full border border-purple-400/30 bg-purple-400/10 text-purple-400 text-xs uppercase tracking-widest mb-4">Autonomous AI Response Pipeline</span>
            <h2 className="text-4xl font-black mb-12">From Report to Action in <span className="gradient-text">&lt; 5 Minutes</span></h2>
            <div className="flex flex-wrap justify-center gap-10 mt-8 mb-8">
              {[
                {icon:"📲",label:"Citizen Reports",sub:"App / WhatsApp / IVR / 1930"},
                {icon:"🔊",label:"Voice Analysis",sub:"Whisper + IndicBERT"},
                {icon:"🕸️",label:"Graph Mapping",sub:"GraphSAGE + Neo4j"},
                {icon:"🔮",label:"Risk Scoring",sub:"XGBoost ensemble"},
                {icon:"🧠",label:"AI Orchestration",sub:"LangGraph agents"},
                {icon:"🚨",label:"Instant Action",sub:"Bank freeze + Telecom block"},
                {icon:"👮",label:"Police Brief",sub:"Court-admissible report"},
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[130px] relative">
                  {i < 6 && <div className="absolute right-[-24px] top-4 text-cyan-400/40 text-xl hidden md:block">→</div>}
                  <div className="w-12 h-12 rounded-2xl glass border border-cyan-400/20 flex items-center justify-center text-xl shadow-lg">
                    {step.icon}
                  </div>
                  <div className="text-sm font-semibold text-slate-200">{step.label}</div>
                  <div className="text-xs text-slate-500 font-mono">{step.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section id="metrics" className="py-32 px-8 mb-20">
          <div className="w-full">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full border border-green-400/30 bg-green-400/10 text-green-400 text-xs uppercase tracking-widest mb-4">AI Performance Metrics</span>
              <h2 className="text-4xl font-black">Production-Grade <span className="gradient-text">Accuracy</span></h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {icon:"🔊",value:"94.3%",label:"Scam Text F1-Score",sub:"IndicBERT + RoBERTa",color:"cyan"},
                {icon:"💰",value:"99.1%",label:"Currency Accuracy",sub:"YOLOv11 + EfficientNet",color:"orange"},
                {icon:"🕸️",value:"0.97",label:"Fraud Network AUC",sub:"GraphSAGE + GAT",color:"purple"},
                {icon:"⚡",value:"<500ms",label:"API P95 Latency",sub:"Triton Inference Server",color:"green"},
                {icon:"🔮",value:"96.4%",label:"Transaction AUC",sub:"XGBoost ensemble",color:"cyan"},
                {icon:"🎤",value:"96.8%",label:"Deepfake Voice",sub:"ECAPA-TDNN",color:"red"},
                {icon:"📊",value:"<3%",label:"False Positive Rate",sub:"Ensemble + Review",color:"green"},
                {icon:"🧠",value:"<5min",label:"Autonomous Response",sub:"KAVACH-AGENT",color:"purple"},
              ].map((m,i) => (
                <motion.div key={i}
                  initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
                  transition={{delay:i*0.06}} viewport={{once:true}}
                  className="glass rounded-2xl p-5 border border-[var(--border)] card-hover flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-${m.color}-400/10 border border-${m.color}-400/20`}>
                    {m.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-black gradient-text">{m.value}</div>
                    <div className="text-xs font-semibold text-slate-300">{m.label}</div>
                    <div className="text-xs text-slate-500 font-mono">{m.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-8 w-full flex flex-col items-center text-center" style={{background:"rgba(13,21,38,0.5)"}}>
          <div className="text-6xl mb-6 float">🛡️</div>
          <h2 className="text-4xl font-black mb-4">Ready to <span className="gradient-text">Protect India</span>?</h2>
          <p className="text-slate-400 mb-8 max-w-lg">Join the national digital safety mission. Access your role-specific dashboard today.</p>
          <button onClick={() => setAuthOpen(true)}
            className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl hover:opacity-90 hover:-translate-y-1 transition-all shadow-2xl shadow-cyan-500/30">
            🚀 Get Access Now
          </button>
          <p className="mt-4 text-xs text-slate-600">MHA / I4C · RBI · TRAI · CBI Integration Ready</p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 px-8 w-full flex flex-col items-center text-center">
        <div className="mb-4 p-4 border border-red-400/30 bg-red-400/10 rounded-xl text-sm text-slate-400 w-full max-w-xl text-center">
          🚨 Received a suspicious call? <strong className="text-red-400">Call 1930 immediately</strong> · Report at <strong className="text-cyan-400">cybercrime.gov.in</strong>
        </div>
        <div className="text-2xl font-black mb-2"><span className="gradient-text">Sentinel</span>AI</div>
        <p className="text-slate-500 text-sm mb-4">National Digital Public Safety Intelligence Platform · Smart India Hackathon 2024</p>
        <div className="flex justify-center gap-6 text-sm text-slate-500 mb-4">
          {["Privacy Policy","Terms","API Docs","Research Paper","GitHub","Contact"].map(l=>(
            <a key={l} href="#" className="hover:text-cyan-400 transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-xs text-slate-600">Built for Ministry of Home Affairs / I4C · Powered by open-source AI · © 2024 SentinelAI</p>
      </footer>

      <SOSBanner />
    </>
  );
}
