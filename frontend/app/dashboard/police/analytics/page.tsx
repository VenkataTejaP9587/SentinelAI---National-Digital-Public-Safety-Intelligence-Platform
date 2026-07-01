"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, BarChart3, TrendingUp, ShieldAlert, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, Cell
} from "recharts";

const API = "http://localhost:8000";
const TS = { backgroundColor: "#0d1526", border: "1px solid #1e2d45", color: "#f1f5f9", fontSize: "12px" };

export default function PoliceAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stateSummary, setStateSummary] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [sumRes, metRes] = await Promise.all([
          fetch(`${API}/api/v1/police/hotspots`),
          fetch(`${API}/api/v1/police/metrics`),
        ]);

        if (sumRes.ok) {
          const rawHotspots = await sumRes.json();
          // Aggregate by state
          const states: Record<string, number> = {};
          rawHotspots.forEach((h: any) => {
            states[h.state] = (states[h.state] || 0) + h.cases;
          });
          const formatted = Object.entries(states).map(([name, cases]) => ({
            state: name,
            cases: cases,
          })).sort((a, b) => b.cases - a.cases);
          setStateSummary(formatted);
        }

        if (metRes.ok) {
          setMetrics(await metRes.json());
        }
      } catch {
        console.warn("Backend offline");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dummyStateSummary = [
    { state: "Maharashtra", cases: 2120 },
    { state: "Delhi", cases: 1890 },
    { state: "Uttar Pradesh", cases: 1450 },
    { state: "Karnataka", cases: 1220 },
    { state: "Gujarat", cases: 980 },
    { state: "Jharkhand", cases: 820 },
    { state: "Haryana", cases: 670 },
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/police"><ArrowLeft size={18} className="text-slate-400" /></Link>
          <span className="text-xl font-black"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">National Analytics</span></span>
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-200">📊 Forensic Analytics Panel</h2>
          <p className="text-slate-500 text-xs mt-0.5">Statistical projections, regional threat index, and performance metrics updated in real-time.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-purple-400 mr-2" /> Loading analytics dashboards…
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 border border-[var(--border)] flex items-start gap-4">
                <div className="p-3 bg-red-500/10 rounded-xl text-red-400 shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Critical Thresholds</p>
                  <p className="text-2xl font-black text-slate-200 mt-1">{metrics?.critical_alerts || 47}</p>
                  <p className="text-[10px] text-red-400 font-medium mt-0.5">High-threat incidents</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-5 border border-[var(--border)] flex items-start gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Active Officers</p>
                  <p className="text-2xl font-black text-slate-200 mt-1">{metrics?.officers_active || 47}</p>
                  <p className="text-[10px] text-cyan-400 font-medium mt-0.5">Nationwide patrol</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-5 border border-[var(--border)] flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl text-green-400 shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Cases Resolved</p>
                  <p className="text-2xl font-black text-slate-200 mt-1">{metrics?.resolved_this_month || 142}</p>
                  <p className="text-[10px] text-green-400 font-medium mt-0.5">This month baseline</p>
                </div>
              </div>
            </div>

            {/* State Distribution chart */}
            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="font-bold text-sm text-slate-300 mb-4">State-wise Cybercrime Volume</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stateSummary.length ? stateSummary : dummyStateSummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="state" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="cases" name="Cases" radius={[4, 4, 0, 0]}>
                    {(stateSummary.length ? stateSummary : dummyStateSummary).map((_, i) => (
                      <Cell key={i} fill={i < 2 ? "#ef4444" : i < 4 ? "#f59e0b" : "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Projections chart */}
            <div className="glass rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="font-bold text-sm text-slate-300 mb-4">Forensic Risk Velocity Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[
                  { month: "Jan", threatIndex: 45 }, { month: "Feb", threatIndex: 52 },
                  { month: "Mar", threatIndex: 61 }, { month: "Apr", threatIndex: 58 },
                  { month: "May", threatIndex: 72 }, { month: "Jun", threatIndex: 85 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TS} />
                  <Line type="monotone" dataKey="threatIndex" name="Threat Velocity Index" stroke="#ef4444" strokeWidth={2.5} dot={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
