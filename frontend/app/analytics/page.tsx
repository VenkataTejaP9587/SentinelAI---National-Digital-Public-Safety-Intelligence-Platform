"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";

const TS = { backgroundColor:"#0d1526",border:"1px solid #1e2d45",color:"#f1f5f9",fontSize:"12px" };
const COLORS = ["#ef4444","#3b82f6","#f59e0b","#8b5cf6","#10b981","#00d4ff"];

const monthly = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>({
  month:m,
  detected:[8420,9100,8750,11200,12800,14500,13900,16200,15400,17800,19200,21000][i],
  prevented:[4200,4800,4700,6800,8100,9400,8900,10800,10200,12100,13500,15200][i]
}));

const scamCategories = [
  {name:"Digital Arrest",value:34},{name:"Bank Fraud",value:22},
  {name:"Investment Scam",value:18},{name:"Lottery",value:12},
  {name:"Phishing",value:9},{name:"Counterfeit",value:5}
];

const stateData = [
  {state:"MH",complaints:28400},{state:"DL",complaints:22100},{state:"UP",complaints:18700},
  {state:"KA",complaints:14200},{state:"GJ",complaints:11800},{state:"TN",complaints:10300},
  {state:"WB",complaints:9200},{state:"RJ",complaints:8700}
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/"><ArrowLeft size={18} className="text-slate-400"/></Link>
          <span className="text-xl font-black"><span className="gradient-text">Sentinel</span>AI · <span className="text-slate-300">Platform Analytics</span></span>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {label:"Total Fraud Detected (2024)",val:"1,87,420",color:"#ef4444",delta:"↑ 61% vs 2023"},
            {label:"Fraud Prevented Value",val:"₹847Cr",color:"#10b981",delta:"Estimated savings"},
            {label:"Citizens Protected",val:"2.3M",color:"#00d4ff",delta:"Unique users"},
            {label:"Cases Closed",val:"74,200",color:"#8b5cf6",delta:"Closure rate: 39%"},
          ].map((k,i)=>(
            <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
              className="glass rounded-2xl p-5 border border-[var(--border)]">
              <div className="text-xs text-slate-500 mb-2">{k.label}</div>
              <div className="text-2xl font-black" style={{color:k.color}}>{k.val}</div>
              <div className="text-xs text-slate-500 mt-1">{k.delta}</div>
            </motion.div>
          ))}
        </div>

        {/* Main charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="lg:col-span-2 glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">Monthly Fraud Detections vs. Prevention (2024)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="detected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="prevented" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="month" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TS} formatter={(v: any) => v?.toLocaleString() || ""}/>
                <Legend wrapperStyle={{color:"#94a3b8",fontSize:11}}/>
                <Area type="monotone" dataKey="detected" name="Detected" stroke="#ef4444" strokeWidth={2.5} fill="url(#detected)"/>
                <Area type="monotone" dataKey="prevented" name="Prevented" stroke="#10b981" strokeWidth={2.5} fill="url(#prevented)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">Scam Category Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scamCategories} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {scamCategories.map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}
                </Pie>
                <Tooltip contentStyle={TS}/>
                <Legend wrapperStyle={{color:"#94a3b8",fontSize:10}} iconSize={8}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">State-wise Complaints (Top 8)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="state" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TS} formatter={(v: any) => v?.toLocaleString() || ""}/>
                <Bar dataKey="complaints" name="Complaints" radius={[4,4,0,0]}>
                  {stateData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-slate-300 mb-4">AI Model Performance Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={["Q1","Q2","Q3","Q4"].map((q,i)=>({quarter:q,voice:[91.2,92.8,93.7,94.3][i],currency:[98.1,98.5,98.9,99.1][i],network:[94.8,95.9,96.5,97.0][i]}))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="quarter" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis domain={[90,100]} tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TS}/>
                <Legend wrapperStyle={{color:"#94a3b8",fontSize:10}}/>
                <Line type="monotone" dataKey="voice" name="Voice/NLP" stroke="#00d4ff" strokeWidth={2.5} dot={{r:4,fill:"#00d4ff"}}/>
                <Line type="monotone" dataKey="currency" name="Currency" stroke="#f59e0b" strokeWidth={2.5} dot={{r:4,fill:"#f59e0b"}}/>
                <Line type="monotone" dataKey="network" name="Network" stroke="#8b5cf6" strokeWidth={2.5} dot={{r:4,fill:"#8b5cf6"}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI section */}
        <div className="glass rounded-2xl p-6 border border-green-400/20 bg-green-400/5">
          <h3 className="font-bold text-lg text-green-400 mb-4">💰 Return on Investment Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {label:"Platform Cost (Year 1)",val:"₹1.8 Crore",color:"#f59e0b"},
              {label:"Fraud Value Prevented",val:"₹847 Crore",color:"#10b981"},
              {label:"ROI Multiplier",val:"47× Return",color:"#00d4ff"},
              {label:"Per-citizen Cost",val:"₹0.08/year",color:"#8b5cf6"},
            ].map((r,i)=>(
              <div key={i} className="text-center">
                <div className="text-2xl font-black" style={{color:r.color}}>{r.val}</div>
                <div className="text-xs text-slate-500 mt-1">{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
