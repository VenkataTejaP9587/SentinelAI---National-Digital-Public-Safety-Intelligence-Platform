"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, Unlock, Upload, Camera, Search, AlertTriangle, CheckCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend
} from "recharts";

const API = "http://localhost:8000";
const TS = { backgroundColor: "#0d1526", border: "1px solid #1e2d45", color: "#f1f5f9", fontSize: "12px" };

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#10b981";
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-16">
      <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
    </div>
  );
}

export default function BankDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [mules, setMules] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezingId, setFreezingId] = useState<string | null>(null);
  const [freezeMsg, setFreezeMsg] = useState<string | null>(null);

  // Currency scanner
  const [currencyFile, setCurrencyFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  // Transaction scorer
  const [txAmount, setTxAmount] = useState("");
  const [txSender, setTxSender] = useState("");
  const [txReceiver, setTxReceiver] = useState("");
  const [txResult, setTxResult] = useState<any>(null);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, m, t] = await Promise.all([
          fetch(`${API}/api/v1/bank/stats`),
          fetch(`${API}/api/v1/bank/mules`),
          fetch(`${API}/api/v1/bank/transactions`),
        ]);
        if (s.ok) setStats(await s.json());
        if (m.ok) setMules(await m.json());
        if (t.ok) setTransactions(await t.json());
      } catch {
        console.warn("Backend offline");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const freezeAccount = async (hash: string) => {
    setFreezingId(hash);
    setFreezeMsg(null);
    try {
      const res = await fetch(`${API}/api/v1/bank/freeze/${hash}`, { method: "POST" });
      const data = await res.json();
      setFreezeMsg(data.message);
      // Update local state
      setMules(prev => prev.map(m => m.account_hash === hash ? { ...m, is_frozen: true } : m));
    } catch {
      setFreezeMsg("Error: Could not freeze account.");
    } finally {
      setFreezingId(null);
    }
  };

  const scanCurrency = async () => {
    if (!currencyFile) return;
    setScanning(true);
    setScanResult(null);
    try {
      const fd = new FormData();
      fd.append("file", currencyFile);
      const res = await fetch(`${API}/api/v1/citizen/scan-currency`, { method: "POST", body: fd });
      const data = await res.json();
      setScanResult(data.analysis);
    } catch {
      setScanResult({ error: true });
    } finally {
      setScanning(false);
    }
  };

  const scoreTransaction = async () => {
    if (!txAmount || !txSender || !txReceiver) return;
    setTxLoading(true);
    setTxResult(null);
    try {
      const res = await fetch(`${API}/api/v1/bank/score-transaction?amount=${txAmount}&sender=${txSender}&receiver=${txReceiver}`, { method: "POST" });
      setTxResult(await res.json());
    } catch {
      setTxResult({ error: true });
    } finally {
      setTxLoading(false);
    }
  };

  const kpis = stats ? [
    { icon: "⚠️", label: "Flagged Today", val: stats.flagged_transactions_today.toLocaleString(), color: "#f59e0b", delta: `${stats.pending_review} pending review` },
    { icon: "🧊", label: "Mule Accounts", val: stats.mule_accounts_detected.toString(), color: "#ef4444", delta: `${stats.frozen_accounts} frozen` },
    { icon: "💵", label: "Counterfeit Notes", val: stats.counterfeit_notes_today.toString(), color: "#8b5cf6", delta: "Detected today" },
    { icon: "🛡️", label: "Amount Blocked", val: `₹${(stats.amount_blocked_today / 1e7).toFixed(1)}Cr`, color: "#10b981", delta: "Saved today" },
  ] : [
    { icon: "⚠️", label: "Flagged Today", val: "—", color: "#f59e0b", delta: "Loading…" },
    { icon: "🧊", label: "Mule Accounts", val: "—", color: "#ef4444", delta: "Loading…" },
    { icon: "💵", label: "Counterfeit Notes", val: "—", color: "#8b5cf6", delta: "Loading…" },
    { icon: "🛡️", label: "Amount Blocked", val: "—", color: "#10b981", delta: "Loading…" },
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/"><ArrowLeft size={18} className="text-slate-400" /></Link>
          <span className="text-xl font-black"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">Bank Dashboard</span></span>
          <span className="ml-auto px-3 py-1 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold">🏦 Bank Officer</span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 border border-[var(--border)]">
              <div className="flex justify-between mb-2"><span className="text-xs text-slate-500">{k.label}</span><span className="text-xl">{k.icon}</span></div>
              <div className="text-2xl font-black" style={{ color: k.color }}>{k.val}</div>
              <div className="text-xs text-slate-500 mt-1">{k.delta}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Transactions risk distribution */}
          <div className="lg:col-span-2 glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">Transaction Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { range: "0-20", count: 12400 }, { range: "20-40", count: 3200 },
                { range: "40-60", count: 890 }, { range: "60-80", count: 234 }, { range: "80-100", count: 47 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey="count" name="Transactions" radius={[4, 4, 0, 0]}>
                  {[0, 1, 2, 3, 4].map(i => <Cell key={i} fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#dc2626"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Counterfeit Scanner */}
          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">💵 Counterfeit Scanner</h3>
            {!currencyFile ? (
              <label className="h-32 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400/50 transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={e => { setCurrencyFile(e.target.files?.[0] || null); setScanResult(null); }} />
                <Upload size={24} className="text-slate-500 mb-2" />
                <p className="text-xs text-slate-500">Upload note image</p>
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-sm text-slate-300 truncate flex-1">{currencyFile.name}</span>
                  <button onClick={() => { setCurrencyFile(null); setScanResult(null); }} className="text-slate-500 ml-2">✕</button>
                </div>
                <button onClick={scanCurrency} disabled={scanning}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {scanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {scanning ? "Analyzing…" : "Scan"}
                </button>
              </div>
            )}
            {scanResult && !scanResult.error && (
              <div className={`mt-3 p-3 rounded-xl text-xs ${scanResult.is_counterfeit ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-green-500/10 border border-green-500/20 text-green-300"}`}>
                <p className="font-bold mb-1">{scanResult.is_counterfeit ? "⚠️ COUNTERFEIT" : "✅ GENUINE"}</p>
                <p>₹{scanResult.denomination} · Confidence: {(scanResult.overall_confidence * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Flagged Transactions Table */}
        <div className="glass rounded-2xl p-5 border border-[var(--border)] mb-6">
          <h3 className="font-bold text-sm text-slate-300 mb-4">🚩 Flagged Transactions (Live)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[var(--border)]">
                  <th className="text-left pb-2 pr-3">TXN ID</th>
                  <th className="text-left pb-2 pr-3">Sender</th>
                  <th className="text-left pb-2 pr-3">Receiver</th>
                  <th className="text-right pb-2 pr-3">Amount</th>
                  <th className="text-center pb-2 pr-3">Risk</th>
                  <th className="text-left pb-2 pr-3">Flag</th>
                  <th className="text-center pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr key={t.txid} className="border-b border-[var(--border)]/50 hover:bg-white/3">
                    <td className="py-2 pr-3 font-mono text-cyan-400">{t.txid}</td>
                    <td className="py-2 pr-3 text-slate-300">{t.sender}</td>
                    <td className="py-2 pr-3 text-slate-300">{t.receiver}</td>
                    <td className="py-2 pr-3 text-right text-slate-200 font-medium">₹{t.amount.toLocaleString()}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2 justify-center">
                        <RiskBar score={t.risk_score} />
                        <span className="font-mono font-bold" style={{ color: t.risk_score >= 70 ? "#ef4444" : t.risk_score >= 40 ? "#f59e0b" : "#10b981" }}>
                          {t.risk_score.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-500">{t.flag}</td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        t.status === "BLOCKED" ? "bg-red-500/20 text-red-400" :
                        t.status === "HOLD_VERIFY" ? "bg-orange-500/20 text-orange-400" :
                        t.status === "WATCH" ? "bg-purple-500/20 text-purple-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mule Accounts + Transaction Scorer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Mule Accounts */}
          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">🧊 Mule Account Registry</h3>
            {freezeMsg && (
              <div className="mb-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300">{freezeMsg}</div>
            )}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
              {mules.map((m: any) => (
                <div key={m.account_hash} className="p-3 rounded-xl bg-white/5 border border-[var(--border)] flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{m.bank_name}</p>
                    <p className="text-xs text-slate-500">{m.ifsc} · {m.type} · {m.account_hash}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Credits: <span className="text-orange-400 font-medium">₹{(m.credits || 0).toLocaleString()}</span></p>
                  </div>
                  {m.is_frozen ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <Lock size={12} /> Frozen
                    </span>
                  ) : (
                    <button onClick={() => freezeAccount(m.account_hash)}
                      disabled={freezingId === m.account_hash}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition disabled:opacity-50 flex items-center gap-1">
                      {freezingId === m.account_hash ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
                      Freeze
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Transaction Scorer */}
          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">⚡ Real-Time Transaction Scorer</h3>
            <div className="space-y-3">
              <input value={txAmount} onChange={e => setTxAmount(e.target.value)} type="number" placeholder="Amount (₹)"
                className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-400/50" />
              <input value={txSender} onChange={e => setTxSender(e.target.value)} placeholder="Sender account (e.g. ACC5678)"
                className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-400/50" />
              <input value={txReceiver} onChange={e => setTxReceiver(e.target.value)} placeholder="Receiver (e.g. mule1@okaxis)"
                className="w-full bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-400/50" />
              <button onClick={scoreTransaction} disabled={txLoading || !txAmount || !txSender || !txReceiver}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {txLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Score Transaction
              </button>
            </div>

            {txResult && !txResult.error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`mt-4 p-4 rounded-xl border ${txResult.is_high_risk ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: txResult.is_high_risk ? "#ef4444" : "#10b981" }}>
                    {txResult.risk_level.toUpperCase()} — {txResult.transaction_risk_score}%
                  </span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    txResult.decision === "BLOCK_TRANSACTION" ? "bg-red-500/20 text-red-400" :
                    txResult.decision === "HOLD_AND_VERIFY" ? "bg-orange-500/20 text-orange-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>{txResult.decision.replace(/_/g, " ")}</span>
                </div>
                {txResult.indicators?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {txResult.indicators.map((ind: string) => (
                      <span key={ind} className="text-[10px] px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-300">{ind}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">{txResult.recommended_action}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
