/*
 * Storm Data — NOAA Hail & Wind Event Targeting
 * Contractors can browse active NWS severe weather alerts and recent
 * storm events by state, then import affected addresses into a new campaign.
 */

import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CloudLightning, Wind, AlertTriangle, MapPin, ArrowLeft,
  RefreshCw, ExternalLink, ChevronRight, Clock, Shield,
  Zap, Droplets, Search, Info, CheckCircle2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ─── US States ────────────────────────────────────────────────────────────────
const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],
  ["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],
  ["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],
  ["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],
  ["WI","Wisconsin"],["WY","Wyoming"],
];

// ─── Severity badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    Extreme: "bg-red-100 text-red-700 border-red-200",
    Severe: "bg-orange-100 text-orange-700 border-orange-200",
    Moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Minor: "bg-blue-100 text-blue-700 border-blue-200",
    Unknown: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[severity] ?? map.Unknown}`}>
      {severity}
    </span>
  );
}

// ─── Event icon ───────────────────────────────────────────────────────────────
function EventIcon({ event }: { event: string }) {
  if (event.includes("Hail")) return <Droplets className="w-4 h-4 text-blue-500" />;
  if (event.includes("Wind") || event.includes("Thunderstorm")) return <Wind className="w-4 h-4 text-orange-500" />;
  if (event.includes("Tornado")) return <AlertTriangle className="w-4 h-4 text-red-500" />;
  return <CloudLightning className="w-4 h-4 text-yellow-500" />;
}

// ─── Alert card ───────────────────────────────────────────────────────────────
interface Alert {
  id: string;
  event: string;
  headline: string;
  severity: string;
  certainty: string;
  effective: string;
  expires: string;
  areaDesc: string;
}

function AlertCard({ alert, onTarget }: { alert: Alert; onTarget: (alert: Alert) => void }) {
  const effectiveDate = new Date(alert.effective);
  const expiresDate = new Date(alert.expires);
  const isExpired = expiresDate < new Date();

  return (
    <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200 ${isExpired ? "opacity-60" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
            <EventIcon event={alert.event} />
          </div>
          <div>
            <p className="font-semibold text-[oklch(0.13_0.03_162)] text-sm leading-tight">{alert.event}</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {alert.areaDesc.length > 60 ? alert.areaDesc.slice(0, 60) + "…" : alert.areaDesc}
            </p>
          </div>
        </div>
        <SeverityBadge severity={alert.severity} />
      </div>

      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">{alert.headline}</p>

      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {effectiveDate.toLocaleDateString()} {effectiveDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span>→</span>
        <span className={isExpired ? "text-red-400" : "text-slate-400"}>
          {isExpired ? "Expired" : "Expires"} {expiresDate.toLocaleDateString()}
        </span>
      </div>

      <Button
        size="sm"
        onClick={() => onTarget(alert)}
        className="w-full bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white text-xs font-medium h-8"
      >
        <MapPin className="w-3.5 h-3.5 mr-1.5" />
        Target This Area
        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
      </Button>
    </div>
  );
}

// ─── Storm tip cards ──────────────────────────────────────────────────────────
const TIPS = [
  {
    icon: Zap,
    title: "Strike While It's Fresh",
    desc: "Homeowners are most receptive to roofing outreach within 2–4 weeks of a hail or wind event. Prime Mail packets sent in this window see 3× higher response rates.",
  },
  {
    icon: Shield,
    title: "Insurance Claim Window",
    desc: "Most homeowner policies allow claims up to 1 year after a storm. Reaching out early positions you as the expert before the adjuster even visits.",
  },
  {
    icon: MapPin,
    title: "Precision Targeting",
    desc: "Use the alert's affected area to pin-drop neighborhoods in the app. Pair with satellite measurement to send personalized estimates to every home.",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StormData() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedState, setSelectedState] = useState("TX");
  const [stateSearch, setStateSearch] = useState("");
  const [targetedAlert, setTargetedAlert] = useState<Alert | null>(null);

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const { data: alertsData, isLoading: alertsLoading, refetch, isFetching } =
    trpc.storm.alerts.useQuery({ state: selectedState });

  const filteredStates = useMemo(
    () => US_STATES.filter(([code, name]) =>
      stateSearch === "" ||
      name.toLowerCase().includes(stateSearch.toLowerCase()) ||
      code.toLowerCase().includes(stateSearch.toLowerCase())
    ),
    [stateSearch]
  );

  const handleTarget = (alert: Alert) => {
    setTargetedAlert(alert);
  };

  const handleCreateCampaign = () => {
    if (!targetedAlert) return;
    // Navigate to app with a pre-filled campaign name based on the storm event
    const campaignName = encodeURIComponent(`${targetedAlert.event} — ${selectedState} — ${new Date(targetedAlert.effective).toLocaleDateString()}`);
    navigate(`/app?storm=${campaignName}`);
    toast.success("Opening campaign builder for this storm event…");
  };

  const alerts = alertsData?.alerts ?? [];
  const totalAlerts = alertsData?.total ?? 0;

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
            <CloudLightning className="w-4 h-4 text-[oklch(0.62_0.17_162)]" />
            <span className="font-semibold text-[oklch(0.13_0.03_162)] text-sm">Storm Data</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="https://www.weather.gov/documentation/services-web-api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              Powered by NOAA NWS
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-[oklch(0.13_0.03_162)] text-2xl mb-1">
            Storm Event Targeting
          </h1>
          <p className="text-slate-500 text-sm">
            Browse active NOAA severe weather alerts by state. Identify hail and wind damage areas, then launch a targeted Prime Mail campaign before your competitors knock a single door.
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Left: State selector + tips */}
          <div className="space-y-4">
            {/* State picker */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-[oklch(0.13_0.03_162)] text-sm mb-3">Select State</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Search states…"
                  value={stateSearch}
                  onChange={e => setStateSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5">
                {filteredStates.map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => { setSelectedState(code); setTargetedAlert(null); }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedState === code
                        ? "bg-[oklch(0.62_0.17_162)] text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{name}</span>
                    <span className={`text-xs font-mono ${selectedState === code ? "text-white/70" : "text-slate-400"}`}>{code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              {TIPS.map((tip, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[oklch(0.95_0.04_162)] flex items-center justify-center">
                      <tip.icon className="w-3.5 h-3.5 text-[oklch(0.62_0.17_162)]" />
                    </div>
                    <p className="font-semibold text-[oklch(0.13_0.03_162)] text-xs">{tip.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Alerts feed */}
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-[oklch(0.13_0.03_162)] text-base">
                  Active Alerts — {US_STATES.find(([c]) => c === selectedState)?.[1] ?? selectedState}
                </h2>
                {!alertsLoading && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${totalAlerts > 0 ? "border-orange-200 text-orange-700 bg-orange-50" : "border-slate-200 text-slate-500"}`}
                  >
                    {totalAlerts} roofing-relevant alert{totalAlerts !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Targeted alert banner */}
            {targetedAlert && (
              <div className="bg-[oklch(0.95_0.04_162)] border border-[oklch(0.82_0.08_162)] rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[oklch(0.62_0.17_162)] flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[oklch(0.13_0.03_162)] text-sm">
                      {targetedAlert.event} selected
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {targetedAlert.areaDesc.length > 80 ? targetedAlert.areaDesc.slice(0, 80) + "…" : targetedAlert.areaDesc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setTargetedAlert(null)} className="text-xs h-8">
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateCampaign}
                    className="bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white text-xs h-8 font-semibold"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    Open in Campaign Builder
                  </Button>
                </div>
              </div>
            )}

            {/* Alerts grid */}
            {alertsLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100" />
                      <div className="flex-1">
                        <div className="h-3 bg-slate-100 rounded w-3/4 mb-1.5" />
                        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded w-full mb-1.5" />
                    <div className="h-2.5 bg-slate-100 rounded w-4/5 mb-3" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-[oklch(0.13_0.03_162)] text-base mb-2">
                  No Active Roofing Alerts
                </h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  There are no active hail, thunderstorm wind, or high wind alerts for {US_STATES.find(([c]) => c === selectedState)?.[1] ?? selectedState} right now. Check back after the next storm system, or select a different state.
                </p>
                <div className="mt-6 p-4 bg-slate-50 rounded-xl text-left max-w-sm mx-auto">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Pro tip: Don't wait for alerts</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You can target any neighborhood in the app — storm events are just one targeting method. Use the map pin-drop or CSV import to reach any area.
                  </p>
                </div>
                <Link href="/app">
                  <Button size="sm" className="mt-4 bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white font-medium">
                    Open Campaign Builder
                    <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {alerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onTarget={handleTarget}
                  />
                ))}
              </div>
            )}

            {/* NOAA attribution */}
            <p className="text-xs text-slate-400 text-center mt-6">
              Alert data provided by the{" "}
              <a
                href="https://www.weather.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[oklch(0.62_0.17_162)] hover:underline"
              >
                NOAA National Weather Service
              </a>
              {" "}— free public API, updated in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
