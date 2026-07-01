"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, Network, Map,
  FileText, Bell, Search, BarChart3,
  ChevronRight, Eye, LogOut, Menu, X
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

const API = "http://localhost:8000";

const navItems = [
  { icon: Activity, label: "Command Center", href: "/dashboard/police", active: true },
  { icon: Network,  label: "Fraud Network",  href: "/dashboard/police/network" },
  { icon: Map,      label: "Crime Map",      href: "/dashboard/police/map" },
  { icon: Eye,      label: "AI Investigation",href: "/dashboard/police/investigate" },
  { icon: FileText, label: "Evidence Reports",href: "/dashboard/police/reports" },
  { icon: Bell,     label: "Alerts",          href: "/dashboard/police/alerts", badge: "47" },
  { icon: BarChart3,label: "Analytics",        href: "/dashboard/police/analytics" },
];

const stateData = [
  { state: "MH", score: 91 }, { state: "DL", score: 88 }, { state: "UP", score: 84 },
  { state: "KA", score: 79 }, { state: "GJ", score: 76 }, { state: "JH", score: 72 },
  { state: "HR", score: 69 }, { state: "WB", score: 66 },
];

const tooltipStyle = { backgroundColor: "#0d1526", border: "1px solid #1e2d45", color: "#f1f5f9", fontSize: "12px" };
const alertStyle: Record<string,string> = {
  critical: "border-red-500 bg-red-500/5", high: "border-orange-500 bg-orange-500/5",
  medium: "border-purple-500 bg-purple-500/5", low: "border-green-500 bg-green-500/5",
};

function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  return (
    <aside className={`${mobile ? "fixed inset-0 z-50 w-64" : "hidden lg:flex w-64 flex-col"} bg-[#0d1526] border-r border-[var(--border)] flex-col py-6 px-4 h-screen`}>
      {mobile && <button onClick={onClose} className="absolute top-4 right-4 text-slate-500"><X size={20}/></button>}
      <Link href="/" className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm">🛡️</div>
        <span className="font-black text-lg"><span className="gradient-text">Sentinel</span>AI</span>
      </Link>
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-base">👮</div>
        <div>
          <div className="text-sm font-semibold">Inspector Sharma</div>
          <div className="text-xs text-slate-500">Mumbai Cyber Cell</div>
        </div>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map(n => (
          <Link key={n.href} href={n.href}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${n.active ? "bg-purple-500/15 text-purple-400 border border-purple-500/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
              <n.icon size={16} />
              <span className="flex-1">{n.label}</span>
              {n.badge && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{n.badge}</span>}
            </div>
          </Link>
        ))}
      </nav>
      <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-300 mt-4">
        <LogOut size={17}/> Sign Out
      </button>
    </aside>
  );
}

function StatCard({ icon, label, value, delta, color }: { icon: string; label: string; value: string; delta: string; color: string; }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-[var(--border)] card-hover">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs mt-1 font-medium text-slate-500">{delta}</div>
    </motion.div>
  );
}

export default function PoliceDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load all data from API
  useEffect(() => {
    const load = async () => {
      try {
        const [metricsRes, alertsRes, casesRes, trendRes] = await Promise.all([
          fetch(`${API}/api/v1/police/metrics`),
          fetch(`${API}/api/v1/police/alerts`),
          fetch(`${API}/api/v1/police/cases?limit=5`),
          fetch(`${API}/api/v1/police/stats/trend`),
        ]);
        if (metricsRes.ok) setMetrics(await metricsRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
        if (casesRes.ok) setCases(await casesRes.json());
        if (trendRes.ok) setTrendData(await trendRes.json());
      } catch {
        console.warn("Backend offline — using fallback data");
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : n.toLocaleString();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      {sidebarOpen && <Sidebar mobile onClose={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 glass border-b border-[var(--border)] z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button>
            <div>
              <h1 className="text-lg font-black">Police Command Center</h1>
              <p className="text-xs text-slate-500 font-mono">
                {time.toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })} · {time.toLocaleTimeString("en-IN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-[var(--border)] rounded-lg text-slate-300 w-52 focus:outline-none focus:border-cyan-400/50" placeholder="Search cases, numbers…"/>
            </div>
            <button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Bell size={18} className="text-slate-400"/>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="📋" label="Active Cases" color="#00d4ff"
              value={metrics ? metrics.active_cases.toLocaleString() : "—"}
              delta={metrics ? `${metrics.total_cases} total reported` : "Loading…"} />
            <StatCard icon="🚨" label="Critical Alerts" color="#ef4444"
              value={metrics ? metrics.critical_alerts.toString() : "—"}
              delta="Needs immediate action" />
            <StatCard icon="🕸️" label="Fraud Rings Found" color="#8b5cf6"
              value={metrics ? metrics.fraud_rings_detected.toString() : "—"}
              delta="GNN network clusters" />
            <StatCard icon="💸" label="Fraud Prevented" color="#10b981"
              value={metrics ? fmt(metrics.fraud_prevented_inr) : "—"}
              delta={metrics ? `₹${(metrics.total_lost_inr / 1e5).toFixed(1)}L total losses` : "Loading…"} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Trend Chart */}
            <div className="lg:col-span-2 glass rounded-2xl p-5 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-slate-300">Fraud Detection Trend (Last 7 Days) — Live</h2>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"/>
                  Auto-refresh: 30s
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData.length ? trendData : [
                  {day:"Mon",cases:120,digital_arrest:50,bank_fraud:34},{day:"Tue",cases:145,digital_arrest:61,bank_fraud:41},
                  {day:"Wed",cases:132,digital_arrest:55,bank_fraud:37},{day:"Thu",cases:178,digital_arrest:75,bank_fraud:50},
                  {day:"Fri",cases:165,digital_arrest:69,bank_fraud:46},{day:"Sat",cases:142,digital_arrest:60,bank_fraud:40},
                  {day:"Sun",cases:189,digital_arrest:79,bank_fraud:53},
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="day" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tooltipStyle}/>
                  <Legend wrapperStyle={{color:"#94a3b8",fontSize:11}}/>
                  <Line type="monotone" dataKey="cases" name="Total Cases" stroke="#00d4ff" strokeWidth={2.5} dot={false} activeDot={{r:5}}/>
                  <Line type="monotone" dataKey="digital_arrest" name="Digital Arrest" stroke="#ef4444" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="bank_fraud" name="Bank Fraud" stroke="#f59e0b" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Alert Feed */}
            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                <h2 className="font-bold text-sm text-slate-300">Live Alert Feed</h2>
              </div>
              <div className="space-y-2.5 overflow-y-auto max-h-[230px]">
                {(alerts.length ? alerts : [
                  {level:"critical",msg:"Digital Arrest Ring — 47 nodes — MH/GJ",time:"2m ago"},
                  {level:"high",msg:"Counterfeit ₹500 seized — Mumbai Central",time:"7m ago"},
                  {level:"high",msg:"Investment scam cluster — ₹84L at risk",time:"15m ago"},
                  {level:"medium",msg:"Phishing URL cluster — 12 new domains",time:"22m ago"},
                ]).map((a: any, i: number) => (
                  <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border-l-2 text-xs ${alertStyle[a.level]}`}>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      a.level==="critical"?"bg-red-500 text-white":a.level==="high"?"bg-orange-500 text-white":"bg-purple-500 text-white"
                    }`}>{a.level}</span>
                    <span className="text-slate-300 leading-snug flex-1">{a.msg}</span>
                    <span className="text-slate-600 shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* State Risk + Cases */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              <h2 className="font-bold text-sm text-slate-300 mb-4">State Cybercrime Risk Index</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stateData} layout="vertical">
                  <XAxis type="number" domain={[0,100]} tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="state" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false} width={28}/>
                  <Tooltip contentStyle={tooltipStyle}/>
                  <Bar dataKey="score" name="Risk Score" radius={[0,4,4,0]}>
                    {stateData.map((_,i) => <Cell key={i} fill={i<2?"#ef4444":i<4?"#f59e0b":i<6?"#8b5cf6":"#10b981"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-slate-300">High-Priority Cases (Live)</h2>
                <Link href="/dashboard/police/investigate" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  Investigate <ChevronRight size={13}/>
                </Link>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-[var(--border)]">
                    <th className="text-left pb-2">Case ID</th>
                    <th className="text-left pb-2">Type</th>
                    <th className="text-left pb-2">Risk</th>
                    <th className="text-right pb-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(cases.length ? cases : [
                    {case_id:"KV2024001234",type:"digital_arrest",risk_level:"critical",score:97},
                    {case_id:"KV2024001235",type:"bank_fraud",risk_level:"critical",score:94},
                    {case_id:"KV2024001236",type:"investment_scam",risk_level:"high",score:88},
                    {case_id:"KV2024001237",type:"upi_fraud",risk_level:"high",score:82},
                    {case_id:"KV2024001238",type:"lottery_scam",risk_level:"medium",score:71},
                  ]).slice(0,5).map((c: any) => (
                    <tr key={c.case_id} className="border-b border-[var(--border)]/50 hover:bg-white/3 cursor-pointer">
                      <td className="py-2 font-mono text-cyan-400">{c.case_id}</td>
                      <td className="py-2 text-slate-300">{(c.type||"").replace(/_/g," ")}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${c.risk_level==="critical"?"bg-red-500/20 text-red-400":c.risk_level==="high"?"bg-orange-500/20 text-orange-400":"bg-purple-500/20 text-purple-400"}`}>
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="py-2 text-right font-bold font-mono" style={{color:c.score>90?"#ef4444":c.score>80?"#f59e0b":"#8b5cf6"}}>
                        {Math.round(c.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h2 className="font-bold text-sm text-slate-300 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: "🕸️", label: "Analyze Fraud Network", href: "/dashboard/police/network" },
                { icon: "🗺️", label: "View Crime Map", href: "/dashboard/police/map" },
                { icon: "🤖", label: "AI Investigation", href: "/dashboard/police/investigate" },
                { icon: "📄", label: "Download Case Report", href: "/dashboard/police/reports" },
                { icon: "🚨", label: "Alert Telecom Cell", href: "#" },
              ].map(a => (
                <Link key={a.label} href={a.href}>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white/5 hover:border-purple-400/40 hover:bg-purple-400/5 text-sm font-medium text-slate-300 hover:text-slate-100 transition-all">
                    {a.icon} {a.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
