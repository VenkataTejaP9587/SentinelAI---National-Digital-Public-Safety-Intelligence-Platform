"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Download, FileText, Search } from "lucide-react";

const API = "http://localhost:8000";

export default function EvidenceReportsPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/v1/police/cases?limit=50`);
        if (res.ok) setCases(await res.json());
      } catch {
        console.warn("Backend offline");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadReport = async (caseId: string) => {
    setDownloadingId(caseId);
    try {
      const res = await fetch(`${API}/api/v1/police/evidence-report/${caseId}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KAVACH_REPORT_${caseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download report. Ensure the backend is running.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = cases.filter(c =>
    (c.case_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.type || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.district || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/police"><ArrowLeft size={18} className="text-slate-400" /></Link>
          <span className="text-xl font-black"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">Evidence Briefings</span></span>
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-200">📄 Generate & Download Case Briefings</h2>
          <p className="text-slate-500 text-xs mt-0.5">Prepare official court-admissible PDF reports containing GNN link analysis, risk indices, and AI forensic telemetry.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cases by ID, type, or district…"
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[var(--border)] rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-400/50"
          />
        </div>

        {/* List */}
        <div className="glass rounded-2xl border border-[var(--border)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 size={24} className="animate-spin mr-2 text-purple-400" /> Loading cases…
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-[var(--border)]/50">
              {filtered.map(c => (
                <div key={c.case_id} className="p-4 flex items-center justify-between hover:bg-white/2 transition">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold text-slate-200">{c.case_id}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.type?.replace(/_/g, " ").toUpperCase()} · {c.district} · ₹{c.amount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadReport(c.case_id)}
                    disabled={downloadingId === c.case_id}
                    className="px-4 py-2 bg-white/5 border border-[var(--border)] text-xs font-bold text-slate-300 rounded-xl hover:border-purple-400/40 hover:bg-purple-400/5 hover:text-slate-100 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {downloadingId === c.case_id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    {downloadingId === c.case_id ? "Generating…" : "PDF Report"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">No matching cases found in database.</div>
          )}
        </div>
      </div>
    </div>
  );
}
