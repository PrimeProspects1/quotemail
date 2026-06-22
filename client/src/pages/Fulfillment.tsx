/*
 * Fulfillment — The Addressers Integration
 * Shows vendor details, batch submission flow, and order tracking.
 * The Addressers is PrimeMail's print-and-mail fulfillment partner.
 */

import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, Package, Truck, Clock, CheckCircle2, ExternalLink,
  Printer, Mail, BarChart3, Shield, DollarSign, ChevronRight,
  Building2, Phone, Globe, FileText, Zap, AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: "Draft",     color: "bg-slate-100 text-slate-600 border-slate-200" },
  measuring: { label: "Measuring", color: "bg-blue-100 text-blue-700 border-blue-200" },
  ready:     { label: "Ready",     color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  ordered:   { label: "Ordered",   color: "bg-violet-100 text-violet-700 border-violet-200" },
  printing:  { label: "Printing",  color: "bg-orange-100 text-orange-700 border-orange-200" },
  delivered: { label: "Delivered", color: "bg-teal-100 text-teal-700 border-teal-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Fulfillment timeline ─────────────────────────────────────────────────────
const TIMELINE = [
  {
    icon: CheckCircle2,
    title: "Batch Approved",
    desc: "You approve the campaign and confirm the address list in PrimeMail.",
    time: "Day 0",
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    icon: FileText,
    title: "Data Transmitted",
    desc: "PrimeMail sends the personalized packet data (address, roof photo, estimate) to The Addressers via secure API.",
    time: "Day 0–1",
    color: "text-blue-500 bg-blue-50",
  },
  {
    icon: Printer,
    title: "Print & Assembly",
    desc: "Each 5-page Prime Mail packet is printed in full color, folded, and stuffed into a #10 window envelope.",
    time: "Day 1–2",
    color: "text-violet-500 bg-violet-50",
  },
  {
    icon: Mail,
    title: "USPS Drop",
    desc: "Packets are dropped at USPS using Marketing Mail presort rates ($0.43/piece). Tracking numbers assigned.",
    time: "Day 2",
    color: "text-orange-500 bg-orange-50",
  },
  {
    icon: Truck,
    title: "Delivery",
    desc: "Homeowners receive their personalized Prime Mail estimate packet. Typical delivery: 3–7 business days.",
    time: "Day 5–9",
    color: "text-teal-500 bg-teal-50",
  },
];

// ─── Vendor specs ─────────────────────────────────────────────────────────────
const SPECS = [
  { label: "Packet Size", value: "5 pages, 8.5\" × 11\"" },
  { label: "Print Quality", value: "Full color, 100lb gloss" },
  { label: "Envelope", value: "#10 window, white, first-class appearance" },
  { label: "Postage", value: "USPS Marketing Mail presort ($0.43/piece)" },
  { label: "All-in Price", value: "$3.50 per Prime Mail" },
  { label: "Minimum Order", value: "25 pieces per batch" },
  { label: "Cutoff", value: "Thursday 5 PM CT for same-week drop" },
  { label: "Tracking", value: "USPS Intelligent Mail Barcode (IMb)" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Fulfillment() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "batches" | "vendor">("overview");

  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const { data: campaigns = [], isLoading: campaignsLoading } = trpc.campaigns.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Only show campaigns that have been ordered or are in fulfillment
  const fulfillmentCampaigns = campaigns.filter(c =>
    ["ordered", "printing", "delivered"].includes(c.status ?? "")
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="container flex items-center gap-4 h-14">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </Link>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[oklch(0.62_0.17_162)]" />
            <span className="font-semibold text-[oklch(0.13_0.03_162)] text-sm">Fulfillment</span>
          </div>
          <div className="ml-auto">
            <a
              href="https://www.theaddressers.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Powered by The Addressers
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-[oklch(0.13_0.03_162)] text-2xl mb-1">
            Print & Mail Fulfillment
          </h1>
          <p className="text-slate-500 text-sm">
            Every Prime Mail packet is printed, stuffed, and mailed by The Addressers — our exclusive fulfillment partner. From approved batch to homeowner's mailbox in under 48 hours.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
          {(["overview", "batches", "vendor"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 capitalize ${
                activeTab === tab
                  ? "bg-white text-[oklch(0.13_0.03_162)] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "batches" ? "My Batches" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-[oklch(0.13_0.03_162)] text-base mb-6">
                From Approval to Doorstep
              </h2>
              <div className="relative">
                {/* Connector line */}
                <div className="absolute left-5 top-5 bottom-5 w-px bg-slate-100" />
                <div className="space-y-6">
                  {TIMELINE.map((step, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0 z-10`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-3 mb-0.5">
                          <p className="font-semibold text-[oklch(0.13_0.03_162)] text-sm">{step.title}</p>
                          <span className="text-xs text-slate-400 font-mono">{step.time}</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Specs grid */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-[oklch(0.13_0.03_162)] text-base mb-4">
                Packet Specifications
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {SPECS.map((spec, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-500">{spec.label}</span>
                    <span className="text-sm font-medium text-[oklch(0.13_0.03_162)]">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing callout */}
            <div className="bg-[oklch(0.13_0.03_162)] rounded-xl p-6 flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-white text-xl mb-1">$3.50 per Prime Mail — all-in</p>
                <p className="text-slate-400 text-sm">
                  Print, assembly, postage, and delivery. No setup fees, no minimums beyond 25 pieces, no hidden charges. Billed per piece when you approve a batch.
                </p>
              </div>
              <Link href="/app">
                <Button className="bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white font-semibold flex-shrink-0">
                  Start a Campaign
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* My Batches tab */}
        {activeTab === "batches" && (
          <div>
            {campaignsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100" />
                      <div className="flex-1">
                        <div className="h-3.5 bg-slate-100 rounded w-1/3 mb-2" />
                        <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : fulfillmentCampaigns.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="font-semibold text-[oklch(0.13_0.03_162)] text-base mb-2">
                  No batches in fulfillment yet
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                  Once you approve a campaign for mailing, it will appear here with its fulfillment status and tracking information.
                </p>
                <Link href="/app">
                  <Button className="bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white font-semibold">
                    Create Your First Campaign
                    <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {fulfillmentCampaigns.map(campaign => (
                  <div key={campaign.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[oklch(0.95_0.04_162)] flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-[oklch(0.62_0.17_162)]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-[oklch(0.13_0.03_162)] text-sm">{campaign.name}</p>
                          <StatusBadge status={campaign.status ?? "ordered"} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          {campaign.totalAddresses != null && (
                            <span>{campaign.totalAddresses} addresses</span>
                          )}
                          {campaign.orderedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Ordered {new Date(campaign.orderedAt).toLocaleDateString()}
                            </span>
                          )}
                          {campaign.totalCost != null && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${parseFloat(campaign.totalCost).toFixed(2)} batch cost
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/app/${campaign.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          View Details
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>

                    {/* Progress bar */}
                    {campaign.status === "printing" && (
                      <div className="mt-3 pt-3 border-t border-slate-50">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                          <span>Printing in progress</span>
                          <span>Est. 24–48 hrs</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[oklch(0.62_0.17_162)] rounded-full w-2/3 animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vendor tab */}
        {activeTab === "vendor" && (
          <div className="space-y-6">
            {/* Vendor card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-slate-600" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-[oklch(0.13_0.03_162)] text-lg">The Addressers</h2>
                  <p className="text-slate-500 text-sm mt-0.5">PrimeMail's exclusive print-and-mail fulfillment partner</p>
                  <div className="flex items-center gap-4 mt-2">
                    <a
                      href="https://www.theaddressers.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[oklch(0.62_0.17_162)] hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      theaddressers.com
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                The Addressers is a full-service direct mail production company specializing in personalized, variable-data printing for high-volume campaigns. PrimeMail integrates directly with their production API to submit batch jobs, track print status, and receive USPS tracking numbers — all without any manual intervention on your part.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Shield, title: "SOC 2 Compliant", desc: "Homeowner data is transmitted via encrypted API and never stored beyond the print run." },
                  { icon: Zap, title: "48-Hour SLA", desc: "Guaranteed print-to-drop turnaround for batches submitted by Thursday 5 PM CT." },
                  { icon: BarChart3, title: "IMb Tracking", desc: "Every piece receives a USPS Intelligent Mail Barcode for delivery confirmation." },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-3 shadow-sm">
                      <item.icon className="w-4 h-4 text-[oklch(0.62_0.17_162)]" />
                    </div>
                    <p className="font-semibold text-[oklch(0.13_0.03_162)] text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration status */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-[oklch(0.13_0.03_162)] text-sm mb-4">Integration Status</h3>
              <div className="space-y-3">
                {[
                  { label: "API Connection", status: "active", detail: "Connected via HTTPS REST API" },
                  { label: "Data Encryption", status: "active", detail: "TLS 1.3 in transit, AES-256 at rest" },
                  { label: "Batch Submission", status: "active", detail: "Automated on campaign approval" },
                  { label: "Tracking Webhooks", status: "pending", detail: "USPS IMb tracking — coming soon" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.13_0.03_162)]">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.detail}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={item.status === "active"
                        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                        : "border-yellow-200 text-yellow-700 bg-yellow-50"
                      }
                    >
                      {item.status === "active" ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" />Active</>
                      ) : (
                        <><AlertCircle className="w-3 h-3 mr-1" />Pending</>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
