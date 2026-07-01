"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, Ban, Shield, AlertTriangle, CheckCircle, Phone, Radio } from "lucide-react";

const API = "http://localhost:8000";

export default function TelecomDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [simLinks, setSimLinks] = useState<any[]>([]);
  const [scamNumbers, setScamNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Spoof check
  const [callerId, setCallerId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [spoofResult, setSpoofResult] = useState<any>(null);
  const [spoofLoading, setSpoofLoading] = useState(false);

  // Block number
  const [blockingNumber, setBlockingNumber] = useState<string | null>(null);
  const [blockMsg, setBlockMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, sim, nums] = await Promise.all([
          fetch(`${API}/api/v1/telecom/stats`),
          fetch(`${API}/api/v1/telecom/sim-links`),
          fetch(`${API}/api/v1/telecom/scam-numbers`),
        ]);
        if (s.ok) setStats(await s.json());
        if (sim.ok) setSimLinks(await sim.json());
        if (nums.ok) setScamNumbers(await nums.json());
      } catch { console.warn("Backend offline"); }
      finally { setLoading(false); }
    })();
  }, []);

  const checkSpoof = async () => {
    if (!callerId.trim() || !receiverId.trim()) return;
    setSpoofLoading(true);
    setSpoofResult(null);
    try {
      const res = await fetch(`${API}/api/v1/telecom/spoof-check?caller_id=${encodeURIComponent(callerId)}&receiver_id=${encodeURIComponent(receiverId)}`);
      setSpoofResult(await res.json());
    } catch { setSpoofResult({ error: true }); }
    finally { setSpoofLoading(false); }
  };

  const blockNumber = async (number: string) => {
    setBlockingNumber(number);
    setBlockMsg(null);
    try {
      const res = await fetch(`${API}/api/v1/telecom/block-number/${encodeURIComponent(number)}`, { method: "POST" });
      const data = await res.json();
      setBlockMsg(data.message);
      setScamNumbers(prev => prev.map(n => n.number === number ? { ...n, status: "BLOCKED" } : n));
    } catch { setBlockMsg("Error: Could not submit block request."); }
    finally { setBlockingNumber(null); }
  };

  const kpis = stats ? [
    { icon: "📡", label: "Scam Numbers Detected", val: stats.scam_numbers_detected.toLocaleString(), color: "#ef4444" },
    { icon: "🛑", label: "Numbers Blocked Today", val: stats.numbers_blocked_today.toString(), color: "#f59e0b" },
    { icon: "🔊", label: "Spoofed Calls Today", val: stats.spoofed_calls_today.toString(), color: "#8b5cf6" },
    { icon: "📱", label: "SIM Clusters Active", val: stats.sim_clusters_active.toString(), color: "#3b82f6" },
  ] : Array(4).fill(null).map((_, i) => ({ icon: ["📡","🛑","🔊","📱"][i], label: "Loading…", val: "—", color: "#64748b" }));

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/"><ArrowLeft size={18} className="text-slate-400" /></Link>
          <span className="text-xl font-black"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">Telecom Dashboard</span></span>
          <span className="ml-auto px-3 py-1 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold">📡 Telecom Operator</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 border border-[var(--border)]">
              <div className="flex justify-between mb-2"><span className="text-xs text-slate-500">{k.label}</span><span className="text-xl">{k.icon}</span></div>
              <div className="text-2xl font-black" style={{ color: k.color }}>{k.val}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Spoof Check Tool */}
          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2"><Radio size={16} className="text-blue-400" /> Call Spoof Detection Tool</h3>
            <div className="space-y-3">
              <input value={callerId} onChange={e => setCallerId(e.target.value)} placeholder="Caller ID (e.g. +91 9876543210 or 14088901234)"
                className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-400/50" />
              <input value={receiverId} onChange={e => setReceiverId(e.target.value)} placeholder="Receiver ID (e.g. +91 8888777766)"
                className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-400/50" />
              <button onClick={checkSpoof} disabled={spoofLoading || !callerId.trim() || !receiverId.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {spoofLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Check for Spoofing
              </button>
              <p className="text-xs text-slate-600">Try: <button className="text-blue-400 hover:underline" onClick={() => { setCallerId("14088901234"); setReceiverId("+91 8888777766"); }}>14088901234</button> (spoofed) or <button className="text-blue-400 hover:underline" onClick={() => { setCallerId("+91 9999888877"); setReceiverId("+91 8888777766"); }}>+91 9999888877</button> (legit)</p>
            </div>

            {spoofResult && !spoofResult.error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`mt-4 p-4 rounded-xl border ${spoofResult.is_spoofed ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {spoofResult.is_spoofed
                    ? <AlertTriangle size={18} className="text-red-400" />
                    : <CheckCircle size={18} className="text-green-400" />}
                  <span className="text-sm font-bold" style={{ color: spoofResult.is_spoofed ? "#ef4444" : "#10b981" }}>
                    {spoofResult.verdict.replace(/_/g, " ")} — {spoofResult.ai_confidence}% confidence
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <p>Gateway: <span className="text-slate-200">{spoofResult.gateway_origin}</span></p>
                  <p>Recommendation: <span className="text-slate-200">{spoofResult.recommendation}</span></p>
                  {spoofResult.signals_detected?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {spoofResult.signals_detected.map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-300">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* SIM Clusters */}
          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">📱 SIM–IMEI Cluster Detection</h3>
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
              {simLinks.map((s: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-cyan-400">{s.imei}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      s.status === "FLAGGED_BLOCK" ? "bg-red-500/20 text-red-400" :
                      s.status === "MONITORING" ? "bg-orange-500/20 text-orange-400" :
                      s.status === "WATCH" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>{s.status}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{s.circle}</span>
                    <span>{s.carrier}</span>
                    <span className={s.sims_linked > 10 ? "text-red-400 font-bold" : "text-slate-400"}>{s.sims_linked} SIMs</span>
                  </div>
                  <div className="h-1 mt-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, s.risk_score)}%`,
                      background: s.risk_score >= 80 ? "#ef4444" : s.risk_score >= 60 ? "#f59e0b" : "#10b981"
                    }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Scam Numbers Table */}
        <div className="glass rounded-2xl p-5 border border-[var(--border)]">
          <h3 className="font-bold text-sm text-slate-300 mb-4">📞 Known Scam Caller IDs</h3>
          {blockMsg && (
            <div className="mb-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300">{blockMsg}</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[var(--border)]">
                  <th className="text-left pb-2 pr-3">Number</th>
                  <th className="text-left pb-2 pr-3">Circle</th>
                  <th className="text-left pb-2 pr-3">Carrier</th>
                  <th className="text-left pb-2 pr-3">Scam Type</th>
                  <th className="text-center pb-2 pr-3">Reports</th>
                  <th className="text-left pb-2 pr-3">Flagged By</th>
                  <th className="text-center pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {scamNumbers.map((n: any) => (
                  <tr key={n.number} className="border-b border-[var(--border)]/50 hover:bg-white/3">
                    <td className="py-2.5 pr-3 font-mono text-slate-200 font-medium">{n.number}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{n.circle}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{n.carrier}</td>
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400">{n.scam_type?.replace(/_/g, " ")}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-center text-slate-200 font-bold">{n.reports}</td>
                    <td className="py-2.5 pr-3 text-slate-500">{n.flagged_by}</td>
                    <td className="py-2.5 text-center">
                      {n.status === "BLOCKED" ? (
                        <span className="px-2 py-1 rounded text-[9px] font-bold bg-red-500/20 text-red-400">BLOCKED</span>
                      ) : (
                        <button onClick={() => blockNumber(n.number)}
                          disabled={blockingNumber === n.number}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition disabled:opacity-50 flex items-center gap-1 mx-auto">
                          {blockingNumber === n.number ? <Loader2 size={10} className="animate-spin" /> : <Ban size={10} />}
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
