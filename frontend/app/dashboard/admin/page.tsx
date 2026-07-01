"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Users, Activity, Database, FileText, Loader2, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const API = "http://localhost:8000";
const TS = { backgroundColor: "#0d1526", border: "1px solid #1e2d45", color: "#f1f5f9", fontSize: "12px" };

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    (async () => {
      try {
        const [s, h, a, u] = await Promise.all([
          fetch(`${API}/api/v1/admin/stats`),
          fetch(`${API}/api/v1/admin/health`),
          fetch(`${API}/api/v1/admin/audits`),
          fetch(`${API}/api/v1/admin/users`),
        ]);
        if (s.ok) setStats(await s.json());
        if (h.ok) setHealth(await h.json());
        if (a.ok) setAudits(await a.json());
        if (u.ok) setUsers(await u.json());
      } catch { console.warn("Backend offline"); }
      finally { setLoading(false); }
    })();
  }, []);

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "models", label: "AI Models", icon: Database },
    { id: "users", label: "Users", icon: Users },
    { id: "audit", label: "Audit Log", icon: FileText },
  ];

  const kpis = stats ? [
    { icon: "📊", label: "Total Cases", val: stats.total_cases.toLocaleString(), color: "#00d4ff", delta: `${stats.cases_last_24h} in last 24h` },
    { icon: "🚨", label: "Critical Cases", val: stats.critical_cases.toString(), color: "#ef4444", delta: `${stats.resolution_rate_pct}% resolution rate` },
    { icon: "👥", label: "Platform Users", val: stats.total_users.toString(), color: "#8b5cf6", delta: "Across all roles" },
    { icon: "⏱️", label: "Uptime", val: `${stats.platform_uptime_pct}%`, color: "#10b981", delta: `${stats.api_requests_today.toLocaleString()} API calls today` },
    { icon: "🧊", label: "Frozen Accounts", val: stats.frozen_accounts.toString(), color: "#f59e0b", delta: "Mule accounts blocked" },
    { icon: "💵", label: "Counterfeit Scans", val: `${stats.counterfeit_detected}/${stats.currency_scans_total}`, color: "#ec4899", delta: "Detected/Scanned" },
  ] : Array(6).fill(null).map((_, i) => ({ icon: "—", label: "Loading…", val: "—", color: "#64748b", delta: "—" }));

  const modelColors: Record<string, string> = {
    "whisper-asr-large-v3": "#3b82f6",
    "indicbert-scam-classifier": "#10b981",
    "yolov11-currency-segmenter": "#f59e0b",
    "vit-b16-watermark-transformer": "#8b5cf6",
    "graphsage-mule-tracer": "#ef4444",
    "xgboost-transaction-ensemble": "#ec4899",
  };

  const auditIcons: Record<string, string> = {
    USER_LOGIN: "🔑", FREEZE_ACCOUNT: "🧊", COMPLAINT_FILED: "📋",
    EXPORT_PDF: "📄", SPOOF_CHECK: "📡", CASE_UPDATE: "🔄",
    SCAN_CURRENCY: "💵", BLOCK_NUMBER: "🛑", USER_REGISTER: "👤",
    ADMIN_LOGIN: "🛡️",
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/"><ArrowLeft size={18} className="text-slate-400" /></Link>
          <span className="text-xl font-black"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">Admin Dashboard</span></span>
          <span className="ml-auto px-3 py-1 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold">🛡️ Administrator</span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                  : "text-slate-400 border border-[var(--border)] hover:bg-white/5"
              }`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {kpis.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass rounded-2xl p-5 border border-[var(--border)]">
                  <div className="flex justify-between mb-2"><span className="text-xs text-slate-500">{k.label}</span><span className="text-xl">{k.icon}</span></div>
                  <div className="text-2xl font-black" style={{ color: k.color }}>{k.val}</div>
                  <div className="text-xs text-slate-500 mt-1">{k.delta}</div>
                </motion.div>
              ))}
            </div>

            {/* System status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="glass rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="font-bold text-sm text-slate-300 mb-4">🏥 System Health</h3>
                {health ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                      <span className="text-sm text-slate-200">Overall Status</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 flex items-center gap-1"><CheckCircle size={12} /> HEALTHY</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                      <span className="text-sm text-slate-200">SQLite</span>
                      <span className="text-xs text-green-400 font-mono">{health.databases.sqlite.status} ({health.databases.sqlite.latency_ms}ms)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                      <span className="text-sm text-slate-200">Neo4j</span>
                      <span className="text-xs text-orange-400 font-mono">{health.databases.neo4j.status}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                      <span className="text-sm text-slate-200">API Gateway</span>
                      <span className="text-xs text-green-400 font-mono">{health.api_gateway.requests_per_min} req/min · {health.api_gateway.error_rate_pct}% errors</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading…</div>
                )}
              </div>

              <div className="glass rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="font-bold text-sm text-slate-300 mb-4">📊 Case Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={[
                      { name: "Reported", value: 45, fill: "#3b82f6" },
                      { name: "Investigating", value: 30, fill: "#f59e0b" },
                      { name: "Resolved", value: 20, fill: "#10b981" },
                      { name: "Closed", value: 5, fill: "#64748b" },
                    ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {["#3b82f6", "#f59e0b", "#10b981", "#64748b"].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip contentStyle={TS} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI MODELS */}
        {activeTab === "models" && (
          <motion.div key="models" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-lg font-black text-slate-200 mb-2">🤖 AI Model Serving Status</h3>
            {health?.models ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(health.models).map(([name, m]: [string, any]) => (
                  <motion.div key={name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-5 border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-200">{name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${m.loaded ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {m.loaded ? "LOADED" : "OFFLINE"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-slate-500">Device:</span> <span className="text-slate-300">{m.device}</span></div>
                      <div><span className="text-slate-500">Version:</span> <span className="text-slate-300">{m.version}</span></div>
                      <div><span className="text-slate-500">P50 Latency:</span> <span className="text-cyan-400 font-mono">{m.p50_latency_ms}ms</span></div>
                      <div><span className="text-slate-500">P95 Latency:</span> <span className="text-orange-400 font-mono">{m.p95_latency_ms}ms</span></div>
                      <div><span className="text-slate-500">Requests:</span> <span className="text-slate-200 font-bold">{m.requests_today.toLocaleString()}</span></div>
                      <div><span className="text-slate-500">Error Rate:</span> <span className={`font-bold ${m.error_rate_pct > 0.5 ? "text-orange-400" : "text-green-400"}`}>{m.error_rate_pct}%</span></div>
                    </div>
                    <div className="h-1.5 mt-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, 100 - m.error_rate_pct)}%`,
                        background: modelColors[name] || "#3b82f6"
                      }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading model status…</div>
            )}
          </motion.div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-black text-slate-200 mb-4">👥 Registered Users</h3>
            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-[var(--border)]">
                        <th className="text-left pb-2 pr-3">Name</th>
                        <th className="text-left pb-2 pr-3">Mobile</th>
                        <th className="text-left pb-2 pr-3">Role</th>
                        <th className="text-left pb-2 pr-3">State</th>
                        <th className="text-left pb-2 pr-3">Language</th>
                        <th className="text-center pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => (
                        <tr key={u.id} className="border-b border-[var(--border)]/50 hover:bg-white/3">
                          <td className="py-2.5 pr-3 text-slate-200 font-medium">{u.full_name}</td>
                          <td className="py-2.5 pr-3 text-slate-400 font-mono">{u.mobile_number}</td>
                          <td className="py-2.5 pr-3"><span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400">{u.role}</span></td>
                          <td className="py-2.5 pr-3 text-slate-400">{u.state || "—"}</td>
                          <td className="py-2.5 pr-3 text-slate-400">{u.preferred_language || "en"}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No users registered yet. Users appear here after sign-up via the Auth module.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* AUDIT LOG */}
        {activeTab === "audit" && (
          <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-lg font-black text-slate-200 mb-4">📜 System Audit Log</h3>
            <div className="space-y-2.5">
              {audits.map((a: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl p-4 border border-[var(--border)] flex items-start gap-3">
                  <span className="text-lg">{auditIcons[a.action] || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold font-mono text-cyan-400">{a.action}</span>
                      <span className="text-[10px] text-slate-600 shrink-0 ml-2">{a.time}</span>
                    </div>
                    <p className="text-xs text-slate-300">{a.desc}</p>
                    {a.role && (
                      <span className="mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400">{a.role}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
