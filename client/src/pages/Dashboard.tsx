/*
 * QuoteMail — Contractor Dashboard
 * Shows: batch history, response tracking, ROI stats, estimate management
 * Design: Clean B2B SaaS, Space Grotesk, navy + electric blue
 */

import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, MapPin, BarChart3, Package, Settings2, Plus,
  TrendingUp, DollarSign, Home, Phone, QrCode,
  ChevronRight, ArrowUpRight, Clock, CheckCircle2,
  AlertCircle, Eye, Download, Zap
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
const BATCHES = [
  {
    id: "B-2024-041",
    name: "Westlake Estates — Storm Follow-up",
    date: "Jun 3, 2026",
    count: 47,
    cost: 164.50,
    status: "delivered",
    responses: 4,
    calls: 2,
    scans: 7,
    estimateValue: 312400,
    neighborhood: "Westlake Estates, Atlanta GA",
  },
  {
    id: "B-2024-040",
    name: "Ridgeview Dr — Hail Zone",
    date: "May 27, 2026",
    count: 83,
    cost: 290.50,
    status: "delivered",
    responses: 9,
    calls: 5,
    scans: 14,
    estimateValue: 587600,
    neighborhood: "Ridgeview Dr, Marietta GA",
  },
  {
    id: "B-2024-039",
    name: "Oakwood Heights — New Build Area",
    date: "May 20, 2026",
    count: 31,
    cost: 108.50,
    status: "delivered",
    responses: 2,
    calls: 1,
    scans: 5,
    estimateValue: 198400,
    neighborhood: "Oakwood Heights, Alpharetta GA",
  },
  {
    id: "B-2024-042",
    name: "Peachtree Corners — Weekly Run",
    date: "Jun 7, 2026",
    count: 62,
    cost: 217.00,
    status: "printing",
    responses: 0,
    calls: 0,
    scans: 0,
    estimateValue: 421800,
    neighborhood: "Peachtree Corners, Gwinnett GA",
  },
];

const RECENT_RESPONSES = [
  { address: "1234 Westlake Dr", type: "call", time: "2h ago", value: 18400 },
  { address: "1248 Ridgeview Dr", type: "scan", time: "5h ago", value: 34900 },
  { address: "1256 Ridgeview Dr", type: "call", time: "1d ago", value: 27500 },
  { address: "1240 Ridgeview Dr", type: "scan", time: "1d ago", value: 22100 },
  { address: "1264 Ridgeview Dr", type: "scan", time: "2d ago", value: 31200 },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300" />
      </div>
      <p className="font-mono-data font-bold text-2xl text-[oklch(0.17_0.03_255)] mb-0.5">{value}</p>
      <p className="text-sm font-medium text-[oklch(0.17_0.03_255)] mb-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Batch Row ────────────────────────────────────────────────────────────────
function BatchRow({ batch }: { batch: typeof BATCHES[0] }) {
  const responseRate = batch.count > 0 ? ((batch.responses / batch.count) * 100).toFixed(1) : "0.0";
  const roi = batch.cost > 0 ? ((batch.responses * 14200) / batch.cost).toFixed(1) : "0";

  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 -mx-5 px-5 rounded-lg transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-display font-semibold text-sm text-[oklch(0.17_0.03_255)] truncate">{batch.name}</p>
          <Badge
            className={`text-xs flex-shrink-0 ${batch.status === "delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
            variant="outline"
          >
            {batch.status === "delivered" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
            {batch.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{batch.neighborhood}</span>
          <span>{batch.date}</span>
          <span className="font-mono-data">{batch.count} pieces</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm">
        <div className="text-center">
          <p className="font-mono-data font-bold text-[oklch(0.17_0.03_255)]">{batch.responses}</p>
          <p className="text-xs text-slate-400">Responses</p>
        </div>
        <div className="text-center">
          <p className="font-mono-data font-bold text-[oklch(0.55_0.22_264)]">{responseRate}%</p>
          <p className="text-xs text-slate-400">Rate</p>
        </div>
        <div className="text-center">
          <p className="font-mono-data font-bold text-[oklch(0.17_0.03_255)]">${batch.cost.toFixed(0)}</p>
          <p className="text-xs text-slate-400">Cost</p>
        </div>
        <div className="text-center">
          <p className="font-mono-data font-bold text-emerald-600">{roi}×</p>
          <p className="text-xs text-slate-400">ROI</p>
        </div>
      </div>

      <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[oklch(0.55_0.22_264)] font-medium">
        <Eye className="w-3.5 h-3.5" /> View
      </button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");

  const totalSent = BATCHES.reduce((s, b) => s + b.count, 0);
  const totalResponses = BATCHES.reduce((s, b) => s + b.responses, 0);
  const totalCost = BATCHES.reduce((s, b) => s + b.cost, 0);
  const totalEstimateValue = BATCHES.reduce((s, b) => s + b.estimateValue, 0);
  const avgResponseRate = totalSent > 0 ? ((totalResponses / totalSent) * 100).toFixed(1) : "0.0";

  const navItems = [
    { key: "dashboard", icon: BarChart3, label: "Dashboard" },
    { key: "campaigns", icon: Package, label: "Campaigns" },
    { key: "app", icon: MapPin, label: "New Campaign" },
    { key: "responses", icon: Phone, label: "Responses" },
    { key: "settings", icon: Settings2, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[oklch(0.55_0.22_264)] flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-[oklch(0.17_0.03_255)] text-base">QuoteMail</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            item.key === "app" ? (
              <Link key={item.key} href="/app">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  <Plus className="w-3.5 h-3.5 ml-auto text-slate-400" />
                </button>
              </Link>
            ) : (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeNav === item.key ? "bg-[oklch(0.96_0.04_264)] text-[oklch(0.55_0.22_264)]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[oklch(0.55_0.22_264)] flex items-center justify-center text-white text-xs font-bold">
              JT
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[oklch(0.17_0.03_255)] truncate">John's Roofing</p>
              <p className="text-xs text-slate-400 truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-[oklch(0.17_0.03_255)]">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Week of June 7, 2026</p>
          </div>
          <Link href="/app">
            <Button className="bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Mail}
            label="Q Mails Sent"
            value={totalSent.toLocaleString()}
            sub="This month"
            color="bg-[oklch(0.96_0.04_264)] text-[oklch(0.55_0.22_264)]"
          />
          <StatCard
            icon={Phone}
            label="Responses"
            value={totalResponses.toString()}
            sub={`${avgResponseRate}% response rate`}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={DollarSign}
            label="Total Spent"
            value={`$${totalCost.toFixed(0)}`}
            sub="Print + postage"
            color="bg-amber-50 text-amber-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Est. Pipeline"
            value={`$${(totalEstimateValue / 1000).toFixed(0)}K`}
            sub="From active batches"
            color="bg-violet-50 text-violet-600"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Batch history */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-[oklch(0.17_0.03_255)]">Recent Batches</h2>
              <button className="text-xs text-[oklch(0.55_0.22_264)] font-medium hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              {BATCHES.map(b => <BatchRow key={b.id} batch={b} />)}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Recent responses */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-[oklch(0.17_0.03_255)]">Recent Responses</h2>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" variant="outline">
                  Live
                </Badge>
              </div>
              <div className="space-y-3">
                {RECENT_RESPONSES.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type === "call" ? "bg-emerald-50" : "bg-blue-50"}`}>
                      {r.type === "call" ? (
                        <Phone className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <QrCode className="w-4 h-4 text-[oklch(0.55_0.22_264)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[oklch(0.17_0.03_255)] truncate">{r.address}</p>
                      <p className="text-xs text-slate-400">{r.type === "call" ? "Phone call" : "QR scan"} · {r.time}</p>
                    </div>
                    <span className="font-mono-data text-xs font-bold text-[oklch(0.55_0.22_264)] flex-shrink-0">
                      ${(r.value / 1000).toFixed(0)}K
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-[oklch(0.17_0.03_255)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[oklch(0.75_0.14_264)]" />
                <h3 className="font-display font-semibold text-white text-sm">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                <Link href="/app">
                  <button className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-medium transition-colors text-left">
                    <MapPin className="w-4 h-4 text-[oklch(0.75_0.14_264)]" />
                    Pin a new neighborhood
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />
                  </button>
                </Link>
                <Link href="/app">
                  <button className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-medium transition-colors text-left">
                    <Download className="w-4 h-4 text-[oklch(0.75_0.14_264)]" />
                    Upload CSV list
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />
                  </button>
                </Link>
                <button
                  onClick={() => {}}
                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-medium transition-colors text-left"
                >
                  <Settings2 className="w-4 h-4 text-[oklch(0.75_0.14_264)]" />
                  Update pricing rates
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />
                </button>
              </div>
            </div>

            {/* ROI summary */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h3 className="font-display font-semibold text-[oklch(0.17_0.03_255)] text-sm mb-4">ROI This Month</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Q Mails sent</span>
                  <span className="font-mono-data font-medium text-[oklch(0.17_0.03_255)]">{totalSent}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total cost</span>
                  <span className="font-mono-data font-medium text-[oklch(0.17_0.03_255)]">${totalCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Responses</span>
                  <span className="font-mono-data font-medium text-emerald-600">{totalResponses} ({avgResponseRate}%)</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="font-semibold text-sm text-[oklch(0.17_0.03_255)]">Est. pipeline value</span>
                  <span className="font-mono-data font-bold text-[oklch(0.55_0.22_264)]">${(totalEstimateValue / 1000).toFixed(0)}K</span>
                </div>
                <div className="bg-[oklch(0.96_0.04_264)] rounded-lg p-3">
                  <p className="text-xs text-[oklch(0.45_0.18_264)] font-medium text-center">
                    Avg cost per lead: <strong>${(totalCost / Math.max(totalResponses, 1)).toFixed(0)}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
