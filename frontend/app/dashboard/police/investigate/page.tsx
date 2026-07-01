"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, Download, FileText, Clock, AlertTriangle, ChevronRight } from "lucide-react";

const API = "http://localhost:8000";

interface TimelineEvent { event: string; date: string; detail: string; }
interface Investigation {
  case_id: string; type: string; status: string; risk_level: string;
  amount: number; district: string; state: string; description: string;
  timeline: TimelineEvent[];
  analysis_summary: any;
  scam_type_detected: string;
  fraud_keywords: string[];
  police_recommendations: string[];
}

export default function InvestigatePage() {
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Investigation | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const investigate = async () => {
    if (!caseId.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/police/investigate/${caseId.trim()}`);
      if (!res.ok) {
        setError(`Case "${caseId}" not found. Check the Case ID and try again.`);
      } else {
        setResult(await res.json());
      }
    } catch {
      setError("Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API}/api/v1/police/evidence-report/${result.case_id}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KAVACH_REPORT_${result.case_id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download report. Ensure the backend is running.");
    } finally {
      setDownloading(false);
    }
  };

  const riskColor = (r: string) => r === "critical" ? "#ef4444" : r === "high" ? "#f59e0b" : r === "medium" ? "#8b5cf6" : "#10b981";

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)]">
      <header className="glass border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <Link href="/dashboard/police" className="flex items-center gap-2">
          <ArrowLeft size={18} className="text-slate-400" />
          <span className="font-black text-base"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">AI Investigation</span></span>
        </Link>
      </header>

      <div className="w-full p-6 space-y-6">
        <div>
          <h2 className="text-xl font-black mb-1">🤖 AI-Powered Case Investigation</h2>
          <p className="text-slate-500 text-sm">Enter a Case ID to generate an AI investigation timeline, network analysis, and forensic recommendations.</p>
        </div>

        {/* Search */}
        <div className="glass rounded-2xl p-5 border border-[var(--border)]">
          <div className="flex gap-3">
            <input value={caseId} onChange={e => setCaseId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && investigate()}
              placeholder="Enter Case ID (e.g. KV2024001234)"
              className="flex-1 bg-transparent border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-400/50" />
            <button onClick={investigate} disabled={loading || !caseId.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Investigate
            </button>
          </div>
          {error && <p className="text-sm text-orange-400 mt-3">{error}</p>}
        </div>

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Case header */}
            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500">Case ID</p>
                  <p className="text-xl font-black font-mono text-purple-400">{result.case_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{
                    color: riskColor(result.risk_level),
                    borderColor: riskColor(result.risk_level) + "60",
                    background: riskColor(result.risk_level) + "15",
                  }}>
                    {result.risk_level.toUpperCase()} RISK
                  </span>
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    {result.status.toUpperCase().replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-slate-500">Type</p><p className="text-slate-200 font-medium">{result.type.replace(/_/g, " ").toUpperCase()}</p></div>
                <div><p className="text-xs text-slate-500">Amount</p><p className="text-slate-200 font-medium">₹{result.amount.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500">Location</p><p className="text-slate-200">{result.district}, {result.state}</p></div>
                <div><p className="text-xs text-slate-500">Scam Type</p><p className="text-orange-400 font-semibold">{result.scam_type_detected?.replace(/_/g, " ") || "N/A"}</p></div>
              </div>
              {result.description && (
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-slate-300">
                  <p className="text-xs text-slate-500 mb-1 font-semibold">Description</p>
                  {result.description}
                </div>
              )}
            </div>

            {/* AI Investigation Timeline */}
            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2"><Clock size={16} /> AI Investigation Timeline</h3>
              <div className="space-y-0">
                {result.timeline.map((t, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 ${i === 0 ? "border-cyan-400 bg-cyan-400/30" : "border-slate-600 bg-slate-800"}`} />
                      {i < result.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-700/50 my-1" />}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-bold text-slate-200">{t.event}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.date}</p>
                      <p className="text-xs text-slate-400 mt-1">{t.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fraud Keywords */}
            {result.fraud_keywords.length > 0 && (
              <div className="glass rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="font-bold text-sm text-slate-300 mb-3">🔑 Detected Fraud Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {result.fraud_keywords.map(kw => (
                    <span key={kw} className="text-xs px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 font-medium">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-orange-400" /> AI Forensic Recommendations</h3>
              <div className="space-y-3">
                {result.police_recommendations.map((rec, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex gap-3 p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                    <span className="text-sm font-bold text-purple-400 mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-slate-300">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Download PDF */}
            <button onClick={downloadReport} disabled={downloading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition disabled:opacity-50">
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              Download Case Briefing Report (PDF)
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
