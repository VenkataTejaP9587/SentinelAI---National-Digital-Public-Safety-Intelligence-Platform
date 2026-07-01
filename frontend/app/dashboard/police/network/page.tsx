"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

const API = "http://localhost:8000";

const NODE_COLORS: Record<string, string> = {
  Suspect: "#ef4444", Phone: "#f59e0b", Device: "#8b5cf6",
  Bank_Account: "#3b82f6", UPI_ID: "#10b981", Victim: "#64748b",
};
const LINK_COLORS: Record<string, string> = {
  CALLED: "#ef4444", SMS_SENT: "#f59e0b", REGISTERED_ON: "#8b5cf6",
  TRANSFERRED_TO: "#10b981", LINKS_TO: "#3b82f6", LAUNDERED_TO: "#ef4444",
  CONTROLLED_BY: "#f43f5e",
};

interface GNode { id: string; type: string; label: string; risk: string; details: string; x: number; y: number; vx: number; vy: number; }
interface GLink { source: string; target: string; type: string; details: string; }

export default function FraudNetworkPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GNode[]>([]);
  const [links, setLinks] = useState<GLink[]>([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ dragging: boolean; node: GNode | null; startX: number; startY: number }>({ dragging: false, node: null, startX: 0, startY: 0 });
  const animRef = useRef<number>(0);

  // Load graph data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/v1/police/network`);
        const data = await res.json();
        const cx = 400, cy = 300;
        const parsed: GNode[] = (data.nodes || []).map((n: any, i: number) => {
          const angle = (2 * Math.PI * i) / data.nodes.length;
          const radius = 180 + Math.random() * 60;
          return { ...n, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, vx: 0, vy: 0 };
        });
        setNodes(parsed);
        setLinks(data.links || []);
        setSource(data.source || "");
      } catch {
        console.warn("Could not load fraud network");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Simple force simulation
  const simulate = useCallback(() => {
    setNodes(prev => {
      const next = prev.map(n => ({ ...n }));
      // Repulsion
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const dx = next[j].x - next[i].x;
          const dy = next[j].y - next[i].y;
          const dist = Math.max(30, Math.sqrt(dx * dx + dy * dy));
          const force = 800 / (dist * dist);
          next[i].vx -= (dx / dist) * force;
          next[i].vy -= (dy / dist) * force;
          next[j].vx += (dx / dist) * force;
          next[j].vy += (dy / dist) * force;
        }
      }
      // Spring links
      for (const link of links) {
        const s = next.find(n => n.id === link.source);
        const t = next.find(n => n.id === link.target);
        if (!s || !t) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = (dist - 150) * 0.02;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
        t.vx -= (dx / dist) * force;
        t.vy -= (dy / dist) * force;
      }
      // Center gravity
      for (const n of next) {
        n.vx += (400 - n.x) * 0.003;
        n.vy += (300 - n.y) * 0.003;
        n.vx *= 0.85;
        n.vy *= 0.85;
        if (!dragRef.current.dragging || dragRef.current.node?.id !== n.id) {
          n.x += n.vx;
          n.y += n.vy;
        }
      }
      return next;
    });
  }, [links]);

  // Animation loop
  useEffect(() => {
    if (nodes.length === 0) return;
    let running = true;
    const loop = () => {
      if (!running) return;
      simulate();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [nodes.length > 0, simulate]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, offset.x * dpr, offset.y * dpr);
    ctx.clearRect(-offset.x / zoom, -offset.y / zoom, canvas.width / (dpr * zoom), canvas.height / (dpr * zoom));

    // Draw links
    for (const link of links) {
      const s = nodes.find(n => n.id === link.source);
      const t = nodes.find(n => n.id === link.target);
      if (!s || !t) continue;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = LINK_COLORS[link.type] || "#334155";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Label
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(link.type.replace(/_/g, " "), mx, my - 4);
    }

    // Draw nodes
    for (const node of nodes) {
      const radius = selected?.id === node.id ? 22 : (node.risk === "critical" ? 18 : node.risk === "high" ? 15 : 12);
      const color = NODE_COLORS[node.type] || "#64748b";

      // Glow
      if (node.risk === "critical") {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = color + "22";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color + "33";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = selected?.id === node.id ? 3 : 2;
      ctx.stroke();

      // Icon inside
      const icons: Record<string, string> = { Suspect: "👤", Phone: "📞", Device: "📱", Bank_Account: "🏦", UPI_ID: "💳", Victim: "🙋" };
      ctx.font = `${radius * 0.9}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icons[node.type] || "●", node.x, node.y);

      // Label below
      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.textBaseline = "top";
      ctx.fillText(node.label.length > 20 ? node.label.slice(0, 18) + "…" : node.label, node.x, node.y + radius + 5);
    }
  });

  // Click handler
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;
    const clicked = nodes.find(n => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 22);
    setSelected(clicked || null);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)]">
      <header className="glass border-b border-[var(--border)] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard/police" className="flex items-center gap-2">
          <ArrowLeft size={18} className="text-slate-400" />
          <span className="font-black text-base"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">Fraud Network Graph</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400"><ZoomIn size={16} /></button>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400"><ZoomOut size={16} /></button>
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400"><RefreshCw size={16} /></button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Graph canvas */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 size={32} className="animate-spin text-purple-400" />
            </div>
          )}
          <canvas ref={canvasRef} onClick={handleClick} className="w-full h-full cursor-crosshair" style={{ background: "rgba(13,21,38,0.5)" }} />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass rounded-xl p-4 border border-[var(--border)] text-xs space-y-1.5">
            <p className="text-slate-400 font-semibold mb-2">Node Types</p>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-slate-300">{type.replace(/_/g, " ")}</span>
              </div>
            ))}
            <p className="text-slate-600 mt-2 pt-2 border-t border-[var(--border)]">Source: {source || "Loading…"}</p>
          </div>
        </div>

        {/* Details sidebar */}
        {selected && (
          <motion.aside initial={{ x: 300 }} animate={{ x: 0 }}
            className="w-80 border-l border-[var(--border)] bg-[#0d1526] p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-200">Node Details</h3>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Type</p>
                <p className="text-sm font-bold" style={{ color: NODE_COLORS[selected.type] }}>{selected.type.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Label</p>
                <p className="text-sm text-slate-200">{selected.label}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Risk Level</p>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${selected.risk === "critical" ? "bg-red-500/20 text-red-400" : selected.risk === "high" ? "bg-orange-500/20 text-orange-400" : selected.risk === "low" ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"}`}>
                  {selected.risk}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500">Details</p>
                <p className="text-sm text-slate-300">{selected.details}</p>
              </div>
              {/* Connected links */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Connections</p>
                <div className="space-y-2">
                  {links.filter(l => l.source === selected.id || l.target === selected.id).map((l, i) => {
                    const other = nodes.find(n => n.id === (l.source === selected.id ? l.target : l.source));
                    return (
                      <div key={i} className="p-2 rounded-lg bg-white/5 border border-[var(--border)] text-xs">
                        <p className="text-slate-400"><span className="text-slate-200 font-medium">{l.type.replace(/_/g, " ")}</span> → {other?.label || "Unknown"}</p>
                        <p className="text-slate-500 mt-0.5">{l.details}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </div>
    </div>
  );
}
