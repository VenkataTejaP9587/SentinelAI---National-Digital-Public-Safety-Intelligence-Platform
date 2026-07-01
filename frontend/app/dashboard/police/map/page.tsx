"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MapPin, AlertTriangle } from "lucide-react";

const API = "http://localhost:8000";

const SCAM_COLORS: Record<string, string> = {
  digital_arrest: "#ef4444",
  currency_counterfeit: "#f59e0b",
  phishing: "#8b5cf6",
  upi_fraud: "#3b82f6",
  investment_scam: "#ec4899",
  lottery_scam: "#f97316",
  courier_scam: "#14b8a6",
  bank_fraud: "#6366f1",
};

interface Hotspot {
  lat: number; lng: number; weight: number; scam_type: string;
  district: string; state: string; risk_level: string; cases: number;
}

export default function CrimeMapPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Hotspot | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/v1/police/hotspots`);
        const data = await res.json();
        setHotspots(data);
      } catch {
        console.warn("Could not load hotspots");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = selectedType ? hotspots.filter(h => h.scam_type === selectedType) : hotspots;

  // Map projection: lat/lng to SVG coordinates (India approx bounds)
  const project = (lat: number, lng: number): [number, number] => {
    const minLat = 8, maxLat = 35, minLng = 68, maxLng = 97;
    const x = ((lng - minLng) / (maxLng - minLng)) * 900 + 50;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 600 + 20;
    return [x, y];
  };

  // Aggregate by district
  const districts = Array.from(new Set(hotspots.map(h => h.district))).map(d => {
    const pts = hotspots.filter(h => h.district === d);
    return {
      district: d,
      state: pts[0]?.state || "",
      cases: pts[0]?.cases || pts.length,
      risk_level: pts[0]?.risk_level || "medium",
      lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
      lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
      dominant_scam: pts.sort((a, b) => b.weight - a.weight)[0]?.scam_type || "unknown",
    };
  }).sort((a, b) => b.cases - a.cases);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)]">
      <header className="glass border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <Link href="/dashboard/police" className="flex items-center gap-2">
          <ArrowLeft size={18} className="text-slate-400" />
          <span className="font-black text-base"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">Crime Hotspot Map</span></span>
        </Link>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} hotspots displayed</span>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Map area */}
        <div className="flex-1 relative p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="glass rounded-2xl border border-[var(--border)] h-full relative overflow-hidden">
              {/* SVG Map */}
              <svg viewBox="0 0 1000 660" className="w-full h-full" style={{ background: "rgba(13,21,38,0.6)" }}>
                {/* India outline (simplified) */}
                <text x="500" y="640" textAnchor="middle" fill="#1e293b" fontSize="12">India · Cybercrime Density Map</text>

                {/* Grid */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <g key={i}>
                    <line x1={i * 100 + 50} y1={20} x2={i * 100 + 50} y2={620} stroke="#1e293b" strokeWidth={0.5} />
                    <line x1={50} y1={i * 60 + 20} x2={950} y2={i * 60 + 20} stroke="#1e293b" strokeWidth={0.5} />
                  </g>
                ))}

                {/* Hotspot circles */}
                {filtered.map((h, i) => {
                  const [x, y] = project(h.lat, h.lng);
                  const r = 4 + h.weight * 12;
                  const color = SCAM_COLORS[h.scam_type] || "#64748b";
                  return (
                    <g key={i} onMouseEnter={() => setHovered(h)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
                      {/* Outer glow */}
                      <circle cx={x} cy={y} r={r + 4} fill={color} opacity={0.12} />
                      {/* Main circle */}
                      <circle cx={x} cy={y} r={r} fill={color} opacity={0.35} stroke={color} strokeWidth={1.5} />
                      {/* Center dot */}
                      <circle cx={x} cy={y} r={2} fill={color} opacity={0.9} />
                    </g>
                  );
                })}

                {/* District labels */}
                {districts.slice(0, 15).map((d, i) => {
                  const [x, y] = project(d.lat, d.lng);
                  return (
                    <text key={i} x={x} y={y - 20} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
                      {d.district}
                    </text>
                  );
                })}
              </svg>

              {/* Hover tooltip */}
              {hovered && (
                <div className="absolute top-4 right-4 glass rounded-xl p-4 border border-[var(--border)] text-xs w-56 z-10">
                  <p className="font-bold text-slate-200 mb-1">{hovered.district}, {hovered.state}</p>
                  <p className="text-slate-400">Scam Type: <span style={{ color: SCAM_COLORS[hovered.scam_type] }} className="font-semibold">{hovered.scam_type.replace(/_/g, " ")}</span></p>
                  <p className="text-slate-400">Weight: <span className="text-slate-200">{hovered.weight}</span></p>
                  <p className="text-slate-400">Risk: <span className={`font-bold ${hovered.risk_level === "critical" ? "text-red-400" : hovered.risk_level === "high" ? "text-orange-400" : "text-yellow-400"}`}>{hovered.risk_level.toUpperCase()}</span></p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-72 border-l border-[var(--border)] bg-[#0d1526] p-4 overflow-y-auto">
          <h3 className="font-bold text-sm text-slate-300 mb-4">🗺️ Filter by Scam Type</h3>
          <div className="space-y-1.5 mb-6">
            <button onClick={() => setSelectedType(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${!selectedType ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:bg-white/5"}`}>
              All Types ({hotspots.length})
            </button>
            {Object.entries(SCAM_COLORS).map(([type, color]) => {
              const count = hotspots.filter(h => h.scam_type === type).length;
              if (count === 0) return null;
              return (
                <button key={type} onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${selectedType === type ? "bg-white/10 border border-[var(--border)]" : "text-slate-400 hover:bg-white/5"}`}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="flex-1 text-left" style={selectedType === type ? { color } : {}}>{type.replace(/_/g, " ")}</span>
                  <span className="text-slate-600">{count}</span>
                </button>
              );
            })}
          </div>

          <h3 className="font-bold text-sm text-slate-300 mb-3">📊 District Risk Ranking</h3>
          <div className="space-y-2">
            {districts.slice(0, 10).map((d, i) => (
              <motion.div key={d.district} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">{d.district}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.risk_level === "critical" ? "bg-red-500/20 text-red-400" : d.risk_level === "high" ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {d.risk_level.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{d.state}</span>
                  <span>{d.cases} cases</span>
                </div>
                <div className="h-1.5 mt-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (d.cases / (districts[0]?.cases || 1)) * 100)}%`,
                    background: SCAM_COLORS[d.dominant_scam] || "#64748b"
                  }} />
                </div>
              </motion.div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
