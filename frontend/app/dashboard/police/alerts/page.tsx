"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Bell, AlertTriangle, Shield, RefreshCw } from "lucide-react";

const API = "http://localhost:8000";

const alertBg: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/5 text-red-200",
  high: "border-orange-500/40 bg-orange-500/5 text-orange-200",
  medium: "border-purple-500/40 bg-purple-500/5 text-purple-200",
  low: "border-green-500/40 bg-green-500/5 text-green-200",
};

const badgeStyle: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function PoliceAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/police/alerts`);
      if (res.ok) setAlerts(await res.json());
    } catch {
      console.warn("Backend offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/police"><ArrowLeft size={18} className="text-slate-400" /></Link>
          <span className="text-xl font-black"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">Live Alerts</span></span>
          <button onClick={fetchAlerts} className="ml-auto p-2 bg-white/5 border border-[var(--border)] rounded-xl hover:bg-white/10 text-slate-400 transition">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-200">🚨 National Threat Feed</h2>
          <p className="text-slate-500 text-xs mt-0.5">Real-time alerts generated from ongoing investigations, cyber honeypots, and multi-state telecom reports.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-purple-400 mr-2" /> Loading threat feed…
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-2xl border flex items-start gap-4 ${alertBg[a.level] || "border-[var(--border)] bg-white/2"}`}
              >
                <div className="p-2 rounded-xl bg-black/20 shrink-0">
                  {a.level === "critical" || a.level === "high" ? <AlertTriangle size={18} className="text-red-400" /> : <Bell size={18} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wide ${badgeStyle[a.level] || "bg-white/10"}`}>
                      {a.level}
                    </span>
                    <span className="text-xs text-slate-500">{a.time}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200 leading-snug">{a.msg}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass p-8 rounded-2xl border border-[var(--border)] text-center text-slate-500 text-sm">
            No live threat alerts currently active.
          </div>
        )}
      </div>
    </div>
  );
}
