/**
 * PrimeMail — Contractor App Page (Mobile-First)
 * Mobile: full-screen satellite map + GPS follow mode + bottom drawer
 * Desktop: side-panel layout (preserved)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import {
  MapPin, Upload, Search, Plus, Trash2, Settings2, Mail,
  ChevronRight, X, Check, AlertCircle, BarChart3, Package,
  FileSpreadsheet, Ruler, DollarSign, ArrowLeft, Loader2,
  RefreshCw, FileDown, Eye, Layers, Navigation, Navigation2,
  Crosshair, ChevronUp, List,
} from "lucide-react";
import { MapView } from "@/components/Map";
import { QMailPreview } from "@/components/QMailPreview";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RoofSegment {
  id: number;
  pitchDegrees: number;
  azimuthDegrees: number;
  areaMeters2: number;
  sqft: number;
  center: { lat: number; lng: number };
  boundingBox: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  };
}

interface PitchRate {
  label: string;
  key: string;
  factor: number;
  rate: number;
}

// DB address row shape (from tRPC)
interface DBAddress {
  id: number;
  fullAddress: string;
  lat: string | null;
  lng: string | null;
  measuredSqFt: string | null;
  roofSquares: string | null;
  pitch: string | null;
  estimatePrice: string | null;
  status: string;
  source: string | null;
}

// ─── Default pitch rates ──────────────────────────────────────────────────────
const DEFAULT_RATES: PitchRate[] = [
  { label: "Flat / Low (2/12–3/12)", key: "flat", factor: 1.0, rate: 350 },
  { label: "4/12 – 5/12", key: "4_12", factor: 1.15, rate: 380 },
  { label: "6/12 – 7/12", key: "6_12", factor: 1.30, rate: 410 },
  { label: "8/12 – 9/12", key: "8_12", factor: 1.50, rate: 450 },
  { label: "10/12+", key: "10_12", factor: 1.75, rate: 520 },
];

// Map local pitch key → DB enum value
const PITCH_KEY_TO_DB: Record<string, "flat" | "4/12" | "6/12" | "8/12" | "10/12+"> = {
  flat: "flat",
  "4_12": "4/12",
  "6_12": "6/12",
  "8_12": "8/12",
  "10_12": "10/12+",
};

// Map DB pitch → local key
const DB_TO_PITCH_KEY: Record<string, string> = {
  flat: "flat",
  "4/12": "4_12",
  "6/12": "6_12",
  "8/12": "8_12",
  "10/12+": "10_12",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function estimateSqft(lat: number, lng: number): number {
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 1000));
  return Math.round((1200 + seed * 2400) / 10) * 10;
}

function calcPrice(sqft: number, pitchKey: string, rates: PitchRate[]): number {
  const r = rates.find(r => r.key === pitchKey) ?? rates[2];
  const squares = sqft / 100;
  return Math.round(squares * r.rate * r.factor);
}

function speedLabel(mps: number): string {
  const mph = mps * 2.237;
  return `${Math.round(mph)} mph`;
}

// ─── Pricing Settings Panel ───────────────────────────────────────────────────
function PricingSettings({ rates, setRates, onClose }: {
  rates: PitchRate[];
  setRates: (r: PitchRate[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(rates);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg text-[oklch(0.13_0.03_162)]">Pricing Rates</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="space-y-3 mb-5">
          {local.map((r, i) => (
            <div key={r.key} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-40 flex-shrink-0">{r.label}</span>
              <div className="flex items-center gap-1 flex-1">
                <span className="text-slate-400 text-sm">$</span>
                <Input
                  type="number"
                  value={r.rate}
                  onChange={e => {
                    const next = [...local];
                    next[i] = { ...next[i], rate: Number(e.target.value) };
                    setLocal(next);
                  }}
                  className="h-8 text-sm"
                />
                <span className="text-slate-400 text-xs">/sq</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={() => { setRates(local); onClose(); }}
            className="flex-1 bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white"
          >
            Save Rates
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Address Row (shared desktop + mobile) ────────────────────────────────────
function AddressRow({ addr, rates, onRemove, onMeasure, onPitchChange, removing, isMobile }: {
  addr: DBAddress;
  rates: PitchRate[];
  onRemove: (id: number) => void;
  onMeasure: (addr: DBAddress) => void;
  onPitchChange: (addr: DBAddress, pitch: string) => void;
  removing: boolean;
  isMobile?: boolean;
}) {
  const sqft = addr.measuredSqFt ? parseFloat(addr.measuredSqFt) : null;
  const pitchKey = addr.pitch ? (DB_TO_PITCH_KEY[addr.pitch] ?? "6_12") : "6_12";
  const price = sqft ? calcPrice(sqft, pitchKey, rates) : null;
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePreviewPdf = () => {
    window.open(`/api/mailer/preview/${addr.id}`, "_blank");
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/mailer/download/${addr.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${addr.fullAddress.replace(/[^a-zA-Z0-9]/g, "_")}_Mailer.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Mailer PDF downloaded!");
    } catch {
      toast.error("Could not generate mailer PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  if (isMobile) {
    // Mobile: larger touch targets, always-visible actions
    return (
      <div className="flex items-start gap-3 py-4 border-b border-slate-100 last:border-0">
        <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.62_0.17_162)] flex-shrink-0 mt-1.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[oklch(0.13_0.03_162)] leading-snug">{addr.fullAddress}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {sqft ? (
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{sqft.toLocaleString()} sq ft</span>
            ) : (
              <button
                onClick={() => onMeasure(addr)}
                className="text-xs text-white bg-[oklch(0.62_0.17_162)] px-3 py-1 rounded-full font-medium flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Ruler className="w-3 h-3" /> Measure
              </button>
            )}
            {sqft && (
              <select
                value={pitchKey}
                onChange={e => onPitchChange(addr, e.target.value)}
                className="text-xs border border-slate-200 rounded-full px-2 py-1 text-slate-600 bg-white"
              >
                {rates.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            )}
          </div>
          {/* Mobile action row */}
          <div className="flex items-center gap-2 mt-2">
            {price !== null && (
              <span className="font-mono font-bold text-sm text-[oklch(0.62_0.17_162)]">${price.toLocaleString()}</span>
            )}
            {sqft && (
              <>
                <button
                  onClick={handlePreviewPdf}
                  className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full font-medium active:scale-95 transition-transform"
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium active:scale-95 transition-transform disabled:opacity-50"
                >
                  {pdfLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                  PDF
                </button>
              </>
            )}
            <button
              onClick={() => onRemove(addr.id)}
              disabled={removing}
              className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2.5 py-1 rounded-full font-medium active:scale-95 transition-transform disabled:opacity-50 ml-auto"
            >
              {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: compact hover-based actions
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 group">
      <div className="w-2 h-2 rounded-full bg-[oklch(0.62_0.17_162)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[oklch(0.13_0.03_162)] truncate">{addr.fullAddress}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {sqft ? (
            <span className="text-xs font-mono text-slate-500">{sqft.toLocaleString()} sq ft</span>
          ) : (
            <button
              onClick={() => onMeasure(addr)}
              className="text-xs text-[oklch(0.62_0.17_162)] hover:underline font-medium flex items-center gap-1"
            >
              <Ruler className="w-3 h-3" /> Measure
            </button>
          )}
          {sqft && (
            <select
              value={pitchKey}
              onChange={e => onPitchChange(addr, e.target.value)}
              className="text-xs border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 bg-white"
            >
              {rates.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          )}
          {addr.source && (
            <span className="text-xs text-slate-300 capitalize">{addr.source.replace("_", " ")}</span>
          )}
        </div>
      </div>
      {price !== null && (
        <span className="font-mono font-bold text-sm text-[oklch(0.62_0.17_162)] flex-shrink-0">
          ${price.toLocaleString()}
        </span>
      )}
      {sqft && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePreviewPdf}
            title="Preview mailer PDF"
            className="w-6 h-6 rounded hover:bg-blue-50 flex items-center justify-center"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            title="Download mailer PDF"
            className="w-6 h-6 rounded hover:bg-green-50 flex items-center justify-center disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : <FileDown className="w-3.5 h-3.5 text-green-500" />}
          </button>
        </div>
      )}
      <button
        onClick={() => onRemove(addr.id)}
        disabled={removing}
        className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
      >
        {removing ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : <Trash2 className="w-3.5 h-3.5 text-red-400" />}
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AppPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams<{ campaignId?: string }>();
  const isMobile = useIsMobile();

  const [rates, setRates] = useState<PitchRate[]>(DEFAULT_RATES);
  const [showSettings, setShowSettings] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<"map" | "list" | "csv">("map");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [campaignId, setCampaignId] = useState<number | null>(
    params.campaignId ? parseInt(params.campaignId) : null
  );
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [campaignName, setCampaignName] = useState("New Campaign");

  // Mobile-specific state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [gpsFollow, setGpsFollow] = useState(false);
  const [gpsSpeed, setGpsSpeed] = useState<number | null>(null);
  const [gpsHeading, setGpsHeading] = useState<number | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const gpsMarkerRef = useRef<google.maps.Marker | null>(null);
  const gpsCircleRef = useRef<google.maps.Circle | null>(null);

  // ── Handle Stripe redirect back (success / cancelled) ──
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Payment confirmed! Your Prime Mail batch is queued for printing.");
      window.history.replaceState({}, "", window.location.pathname);
      utils.campaigns.list.invalidate();
      utils.dashboard.stats.invalidate();
    } else if (payment === "cancelled") {
      toast.info("Checkout cancelled — your batch is still saved as a draft.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Roof segment overlay
  const overlayPolygonsRef = useRef<google.maps.Rectangle[]>([]);
  const overlayInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [roofSegments, setRoofSegments] = useState<RoofSegment[]>([]);
  const [showOverlay, setShowOverlay] = useState(true);

  const utils = trpc.useUtils();

  // ── Load contractor profile for preview ──
  const { data: profileData } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  // ── Queries ──
  const { data: dbAddresses = [], isLoading: addressesLoading, refetch: refetchAddresses } =
    trpc.addresses.list.useQuery(
      { campaignId: campaignId! },
      { enabled: campaignId !== null }
    );

  // ── Mutations ──
  const createCampaign = trpc.campaigns.create.useMutation({
    onSuccess: () => utils.campaigns.list.invalidate(),
  });

  const addAddress = trpc.addresses.add.useMutation({
    onSuccess: () => refetchAddresses(),
  });

  const addBulk = trpc.addresses.addBulk.useMutation({
    onSuccess: () => refetchAddresses(),
  });

  const updateMeasurement = trpc.addresses.updateMeasurement.useMutation({
    onSuccess: () => refetchAddresses(),
  });

  const deleteAddress = trpc.addresses.delete.useMutation({
    onSuccess: () => {
      setRemovingId(null);
      refetchAddresses();
    },
  });

  const orderCampaign = trpc.campaigns.order.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  const createCheckout = trpc.payments.createCheckout.useMutation();

  // ── Solar API measurement helper ──
  const solarUtils = trpc.useUtils();
  const measureWithSolar = useCallback(async (
    lat: number,
    lng: number
  ): Promise<{ sqft: number; pitch: "flat" | "4/12" | "6/12" | "8/12" | "10/12+"; pitchKey: string; fromSolar: boolean }> => {
    try {
      const result = await solarUtils.solar.getRoofMeasurements.fetch({ lat, lng });
      if (result.success && result.measuredSqFt && result.pitch) {
        const pitchMap: Record<string, string> = {
          flat: "flat", "4/12": "4_12", "6/12": "6_12", "8/12": "8_12", "10/12+": "10_12",
        };
        if (result.segments && result.segments.length > 0) {
          setRoofSegments(result.segments as RoofSegment[]);
        }
        return {
          sqft: result.measuredSqFt,
          pitch: result.pitch as "flat" | "4/12" | "6/12" | "8/12" | "10/12+",
          pitchKey: pitchMap[result.pitch] ?? "6_12",
          fromSolar: true,
        };
      }
    } catch {
      // Solar API unavailable — fall through to estimate
    }
    return { sqft: estimateSqft(lat, lng), pitch: "6/12", pitchKey: "6_12", fromSolar: false };
  }, [solarUtils]);

  // ── Pitch → overlay color ──
  const pitchColor = (deg: number): { fill: string; stroke: string } => {
    if (deg < 5)  return { fill: "#94a3b8", stroke: "#64748b" };
    if (deg < 22) return { fill: "#3b82f6", stroke: "#1d4ed8" };
    if (deg < 30) return { fill: "#22c55e", stroke: "#15803d" };
    if (deg < 38) return { fill: "#f97316", stroke: "#c2410c" };
    return { fill: "#ef4444", stroke: "#b91c1c" };
  };

  // ── Draw / clear segment overlay ──
  const clearOverlayPolygons = useCallback(() => {
    overlayPolygonsRef.current.forEach(r => r.setMap(null));
    overlayPolygonsRef.current = [];
    overlayInfoWindowRef.current?.close();
  }, []);

  const drawSegmentOverlay = useCallback((segments: RoofSegment[], map: google.maps.Map) => {
    clearOverlayPolygons();
    if (!segments.length) return;
    const infoWindow = new google.maps.InfoWindow();
    overlayInfoWindowRef.current = infoWindow;

    segments.forEach(seg => {
      const { fill, stroke } = pitchColor(seg.pitchDegrees);
      const rect = new google.maps.Rectangle({
        bounds: {
          south: seg.boundingBox.sw.lat,
          west:  seg.boundingBox.sw.lng,
          north: seg.boundingBox.ne.lat,
          east:  seg.boundingBox.ne.lng,
        },
        strokeColor: stroke,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: fill,
        fillOpacity: 0.35,
        map,
        clickable: true,
      });

      const pitchLabel =
        seg.pitchDegrees < 5  ? "Flat" :
        seg.pitchDegrees < 22 ? "4/12" :
        seg.pitchDegrees < 30 ? "6/12" :
        seg.pitchDegrees < 38 ? "8/12" : "10/12+";

      const azDir = (az: number) => {
        const dirs = ["N","NE","E","SE","S","SW","W","NW"];
        return dirs[Math.round(az / 45) % 8];
      };

      rect.addListener("click", () => {
        infoWindow.setContent(
          `<div style="font-family:sans-serif;font-size:13px;line-height:1.6;padding:2px 4px">
            <strong style="font-size:14px">${pitchLabel} Pitch</strong><br/>
            <span style="color:#555">${seg.pitchDegrees}° slope</span><br/>
            <span style="color:#555">${seg.sqft.toLocaleString()} sq ft (${seg.areaMeters2} m²)</span><br/>
            <span style="color:#555">Facing: ${azDir(seg.azimuthDegrees)} (${seg.azimuthDegrees}°)</span>
          </div>`
        );
        infoWindow.setPosition({ lat: seg.center.lat, lng: seg.center.lng });
        infoWindow.open(map);
      });

      overlayPolygonsRef.current.push(rect);
    });
  }, [clearOverlayPolygons]);

  // ── Redraw overlay when segments or toggle changes ──
  useEffect(() => {
    if (!mapRef.current) return;
    if (showOverlay && roofSegments.length > 0) {
      drawSegmentOverlay(roofSegments, mapRef.current);
    } else {
      clearOverlayPolygons();
    }
  }, [showOverlay, roofSegments, drawSegmentOverlay, clearOverlayPolygons]);

  // ── GPS Follow Me ──
  const startGpsFollow = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("GPS not available on this device");
      return;
    }
    setGpsFollow(true);
    // Request a one-shot first to center immediately
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(19);
      }
    }, () => {
      toast.error("Could not get GPS location — check browser permissions");
      setGpsFollow(false);
    }, { enableHighAccuracy: true });

    // Then watch continuously
    const watchId = navigator.geolocation.watchPosition(pos => {
      const { latitude: lat, longitude: lng, speed, heading } = pos.coords;
      setGpsSpeed(speed);
      setGpsHeading(heading);

      // Update or create the blue GPS dot
      if (mapRef.current) {
        if (!gpsMarkerRef.current) {
          gpsMarkerRef.current = new google.maps.Marker({
            position: { lat, lng },
            map: mapRef.current,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#2563EB",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
            zIndex: 999,
            title: "Your location",
          });
        } else {
          gpsMarkerRef.current.setPosition({ lat, lng });
        }

        // Accuracy circle
        if (!gpsCircleRef.current) {
          gpsCircleRef.current = new google.maps.Circle({
            center: { lat, lng },
            radius: pos.coords.accuracy,
            strokeColor: "#2563EB",
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillColor: "#2563EB",
            fillOpacity: 0.08,
            map: mapRef.current,
          });
        } else {
          gpsCircleRef.current.setCenter({ lat, lng });
          gpsCircleRef.current.setRadius(pos.coords.accuracy);
        }

        // Pan to follow
        mapRef.current.panTo({ lat, lng });
      }
    }, err => {
      console.warn("[GPS]", err);
    }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 });

    gpsWatchRef.current = watchId;
  }, []);

  const stopGpsFollow = useCallback(() => {
    setGpsFollow(false);
    setGpsSpeed(null);
    setGpsHeading(null);
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    if (gpsMarkerRef.current) {
      gpsMarkerRef.current.setMap(null);
      gpsMarkerRef.current = null;
    }
    if (gpsCircleRef.current) {
      gpsCircleRef.current.setMap(null);
      gpsCircleRef.current = null;
    }
  }, []);

  // Clean up GPS watch on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
    };
  }, []);

  // ── Ensure a campaign exists before saving addresses ──
  const ensureCampaign = useCallback(async (): Promise<number> => {
    if (campaignId !== null) return campaignId;
    const name = `Campaign ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    setCampaignName(name);
    await createCampaign.mutateAsync({ name });
    const campaigns = await utils.campaigns.list.fetch();
    const newest = campaigns[campaigns.length - 1];
    if (newest) {
      setCampaignId(newest.id);
      return newest.id;
    }
    throw new Error("Failed to create campaign");
  }, [campaignId, createCampaign, utils]);

  // ── Map ready ──
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    map.setMapTypeId("satellite");

    map.addListener("click", async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng || !isAuthenticated) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      geocoderRef.current?.geocode({ location: { lat, lng } }, async (results, status) => {
        if (status !== "OK" || !results?.[0]) return;
        const address = results[0].formatted_address;

        try {
          const cid = await ensureCampaign();

          await addAddress.mutateAsync({
            campaignId: cid,
            fullAddress: address,
            lat: lat.toString(),
            lng: lng.toString(),
            source: "pin_drop",
          });

          const fresh = await utils.addresses.list.fetch({ campaignId: cid });
          const newEntry = fresh.find(a => a.fullAddress === address && !a.measuredSqFt);
          if (newEntry) {
            const { sqft, pitch, pitchKey, fromSolar } = await measureWithSolar(lat, lng);
            const price = calcPrice(sqft, pitchKey, rates);
            await updateMeasurement.mutateAsync({
              id: newEntry.id,
              campaignId: cid,
              measuredSqFt: sqft.toString(),
              roofSquares: (sqft / 100).toFixed(2),
              pitch,
              estimatePrice: price.toString(),
              status: "estimated",
            });
            if (!fromSolar) console.warn("[Solar] No data for", address, "— used estimate fallback");
          }

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#0EA875",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            animation: google.maps.Animation.DROP,
          });
          if (newEntry) markersRef.current.set(newEntry.id, marker);

          toast.success(`Saved: ${address.split(",")[0]}`);
          // On mobile, briefly open the drawer to confirm the pin was added
          if (isMobile) setDrawerOpen(true);
        } catch {
          toast.error("Failed to save address — are you signed in?");
        }
      });
    });
  }, [isAuthenticated, ensureCampaign, addAddress, updateMeasurement, rates, utils, isMobile]);

  // ── Address search ──
  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) return;
    if (!geocoderRef.current) {
      toast.error("Map not ready — switch to Map tab first");
      return;
    }
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    geocoderRef.current.geocode({ address: searchInput }, async (results, status) => {
      if (status !== "OK" || !results?.[0]) {
        toast.error("Address not found. Try a more specific address.");
        return;
      }
      const loc = results[0].geometry.location;
      const lat = loc.lat();
      const lng = loc.lng();
      const address = results[0].formatted_address;

      try {
        const cid = await ensureCampaign();

        await addAddress.mutateAsync({
          campaignId: cid,
          fullAddress: address,
          lat: lat.toString(),
          lng: lng.toString(),
          source: "address_search",
        });

        const fresh = await utils.addresses.list.fetch({ campaignId: cid });
        const newEntry = fresh.find(a => a.fullAddress === address && !a.measuredSqFt);
        if (newEntry) {
          const { sqft, pitch, pitchKey, fromSolar } = await measureWithSolar(lat, lng);
          const price = calcPrice(sqft, pitchKey, rates);
          await updateMeasurement.mutateAsync({
            id: newEntry.id,
            campaignId: cid,
            measuredSqFt: sqft.toString(),
            roofSquares: (sqft / 100).toFixed(2),
            pitch,
            estimatePrice: price.toString(),
            status: "estimated",
          });
          if (!fromSolar) console.warn("[Solar] No data for", address, "— used estimate fallback");
        }

        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(18);
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map: mapRef.current,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#0EA875",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            animation: google.maps.Animation.DROP,
          });
          if (newEntry) markersRef.current.set(newEntry.id, marker);
        }

        setSearchInput("");
        toast.success(`Added: ${address.split(",")[0]}`);
      } catch {
        toast.error("Failed to save address");
      }
    });
  }, [searchInput, isAuthenticated, ensureCampaign, addAddress, updateMeasurement, rates, utils]);

  // ── CSV upload ──
  const handleCSV = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const header = lines[0].toLowerCase();
      const isCSV = header.includes("address") || header.includes("street");
      const dataLines = isCSV ? lines.slice(1) : lines;

      const geocoder = geocoderRef.current ?? new google.maps.Geocoder();
      const batch: Array<{ fullAddress: string; lat: string; lng: string; source: "csv_import" }> = [];

      let processed = 0;
      const processLine = (i: number) => {
        if (i >= Math.min(dataLines.length, 200)) {
          ensureCampaign().then(cid => {
            if (batch.length === 0) { toast.error("No valid addresses found in CSV"); return; }
            addBulk.mutateAsync({ campaignId: cid, addresses: batch }).then(() => {
              toast.success(`Imported ${batch.length} addresses from CSV`);
            });
          });
          return;
        }
        const raw = dataLines[i].split(",")[0].trim();
        if (!raw) { processLine(i + 1); return; }
        geocoder.geocode({ address: raw }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            const loc = results[0].geometry.location;
            batch.push({
              fullAddress: results[0].formatted_address,
              lat: loc.lat().toString(),
              lng: loc.lng().toString(),
              source: "csv_import",
            });
          }
          processed++;
          if (processed % 10 === 0) toast.loading(`Processing ${processed}/${Math.min(dataLines.length, 200)} addresses...`, { id: "csv" });
          setTimeout(() => processLine(i + 1), 200);
        });
      };
      toast.loading("Processing CSV...", { id: "csv" });
      processLine(0);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [isAuthenticated, ensureCampaign, addBulk]);

  // ── Single measure ──
  const handleMeasure = useCallback(async (addr: DBAddress) => {
    if (!campaignId || !addr.lat || !addr.lng) return;
    const lat = parseFloat(addr.lat);
    const lng = parseFloat(addr.lng);
    try {
      const { sqft, pitch, pitchKey, fromSolar } = await measureWithSolar(lat, lng);
      const price = calcPrice(sqft, pitchKey, rates);
      await updateMeasurement.mutateAsync({
        id: addr.id,
        campaignId,
        measuredSqFt: sqft.toString(),
        roofSquares: (sqft / 100).toFixed(2),
        pitch,
        estimatePrice: price.toString(),
        status: "estimated",
      });
      toast.success(fromSolar ? "Roof measured from Google Solar satellite data" : "Roof measured (estimated — no Solar data for this address)");
    } catch {
      toast.error("Failed to save measurement");
    }
  }, [campaignId, rates, updateMeasurement, measureWithSolar]);

  // ── Measure all ──
  const handleMeasureAll = useCallback(async () => {
    if (!campaignId) return;
    const unmeasured = dbAddresses.filter(a => !a.measuredSqFt);
    let solarCount = 0;
    for (const addr of unmeasured) {
      if (!addr.lat || !addr.lng) continue;
      const lat = parseFloat(addr.lat);
      const lng = parseFloat(addr.lng);
      const { sqft, pitch, pitchKey, fromSolar } = await measureWithSolar(lat, lng);
      if (fromSolar) solarCount++;
      const price = calcPrice(sqft, pitchKey, rates);
      await updateMeasurement.mutateAsync({
        id: addr.id,
        campaignId,
        measuredSqFt: sqft.toString(),
        roofSquares: (sqft / 100).toFixed(2),
        pitch,
        estimatePrice: price.toString(),
        status: "estimated",
      });
    }
    const fallbackCount = unmeasured.length - solarCount;
    if (fallbackCount > 0) {
      toast.success(`Measured ${unmeasured.length} roofs (${solarCount} from Google Solar, ${fallbackCount} estimated)`);
    } else {
      toast.success(`Measured ${unmeasured.length} roofs from Google Solar satellite data`);
    }
  }, [campaignId, dbAddresses, rates, updateMeasurement, measureWithSolar]);

  // ── Update pitch ──
  const handlePitchChange = useCallback(async (addr: DBAddress, pitchKey: string) => {
    if (!campaignId || !addr.measuredSqFt) return;
    const sqft = parseFloat(addr.measuredSqFt);
    const price = calcPrice(sqft, pitchKey, rates);
    const dbPitch = PITCH_KEY_TO_DB[pitchKey] ?? "6/12";
    try {
      await updateMeasurement.mutateAsync({
        id: addr.id,
        campaignId,
        measuredSqFt: addr.measuredSqFt,
        roofSquares: addr.roofSquares ?? (sqft / 100).toFixed(2),
        pitch: dbPitch,
        estimatePrice: price.toString(),
        status: "estimated",
      });
    } catch {
      toast.error("Failed to update pitch");
    }
  }, [campaignId, rates, updateMeasurement]);

  // ── Delete address ──
  const handleRemove = useCallback(async (id: number) => {
    if (!campaignId) return;
    setRemovingId(id);
    try {
      await deleteAddress.mutateAsync({ id, campaignId });
      const marker = markersRef.current.get(id);
      if (marker) { marker.setMap(null); markersRef.current.delete(id); }
    } catch {
      toast.error("Failed to remove address");
      setRemovingId(null);
    }
  }, [campaignId, deleteAddress]);

  // ── Order batch ──
  const handleOrder = useCallback(async () => {
    if (!campaignId) return;
    try {
      toast.loading("Preparing checkout...", { id: "checkout" });
      const { checkoutUrl } = await createCheckout.mutateAsync({
        campaignId,
        origin: window.location.origin,
      });
      toast.dismiss("checkout");
      toast.success("Redirecting to secure checkout...");
      setShowPreview(false);
      setShowOrderModal(false);
      window.open(checkoutUrl, "_blank");
    } catch {
      toast.dismiss("checkout");
      toast.error("Failed to start checkout. Please try again.");
    }
  }, [campaignId, createCheckout]);

  // ── Derived totals ──
  const totalAddresses = dbAddresses.length;
  const measuredCount = dbAddresses.filter(a => a.measuredSqFt).length;
  const totalEstimate = dbAddresses.reduce((sum, a) => {
    if (!a.measuredSqFt) return sum;
    const sqft = parseFloat(a.measuredSqFt);
    const pitchKey = a.pitch ? (DB_TO_PITCH_KEY[a.pitch] ?? "6_12") : "6_12";
    return sum + calcPrice(sqft, pitchKey, rates);
  }, 0);
  const totalQMail = totalAddresses * 3.50;

  // ── Auth gate ──
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.62_0.17_162)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[oklch(0.62_0.17_162)] flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <h2 className="font-display font-bold text-xl text-[oklch(0.13_0.03_162)]">Sign in to use PrimeMail</h2>
        <p className="text-slate-500 text-sm">Your campaigns and addresses are saved to your account.</p>
        <Button
          onClick={() => window.location.href = getLoginUrl()}
          className="bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white font-semibold px-8"
        >
          Sign In
        </Button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="relative w-full bg-black" style={{ height: "100dvh" }}>
        {/* Full-screen map */}
        <MapView
          onMapReady={handleMapReady}
          initialCenter={{ lat: 33.749, lng: -84.388 }}
          initialZoom={17}
          className="absolute inset-0 w-full h-full"
        />

        {/* ── Floating top bar ── */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex items-center justify-between px-3 pt-3 pb-2 pointer-events-auto">
            {/* Left: back + brand */}
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <button className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
              </Link>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[oklch(0.62_0.17_162)] flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[oklch(0.13_0.03_162)] text-sm">PrimeMail</span>
                {campaignId && (
                  <span className="text-xs text-slate-400">#{campaignId}</span>
                )}
              </div>
            </div>

            {/* Right: speed badge + settings */}
            <div className="flex items-center gap-2">
              {gpsFollow && (
                <div className="bg-[oklch(0.62_0.17_162)] text-white rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                  {gpsSpeed !== null && gpsSpeed > 0.5 && (
                    <span className="font-mono font-bold text-sm">{speedLabel(gpsSpeed)}</span>
                  )}
                  {gpsHeading !== null ? (
                    <span
                      className="text-base leading-none font-bold"
                      style={{ display: "inline-block", transform: `rotate(${gpsHeading}deg)` }}
                      title={`Heading ${Math.round(gpsHeading)}\u00b0`}
                    >
                      &#8593;
                    </span>
                  ) : (
                    <span className="text-xs font-medium opacity-80">GPS</span>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              >
                <Settings2 className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Search bar (always visible on mobile) */}
          <div className="px-3 pb-2 pointer-events-auto">
            <div className="flex gap-2">
              <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center gap-2 px-3">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Search address..."
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 py-3 outline-none"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput("")} className="p-1">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={addAddress.isPending || !searchInput.trim()}
                className="w-12 h-12 rounded-xl bg-[oklch(0.62_0.17_162)] shadow-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              >
                {addAddress.isPending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Plus className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tap-to-pin hint (shown when no addresses yet) ── */}
        {totalAddresses === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm text-white rounded-2xl px-5 py-3 text-center shadow-xl">
              <MapPin className="w-6 h-6 mx-auto mb-1 text-[oklch(0.62_0.17_162)]" />
              <p className="text-sm font-semibold">Tap any house to pin it</p>
              <p className="text-xs text-white/70 mt-0.5">Roof measured automatically</p>
            </div>
          </div>
        )}

        {/* ── Right-side floating controls ── */}
        <div className="absolute right-3 z-20 flex flex-col gap-3" style={{ bottom: "120px" }}>
          {/* Overlay toggle */}
          {roofSegments.length > 0 && (
            <button
              onClick={() => setShowOverlay(v => !v)}
              className={`w-12 h-12 rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-all ${
                showOverlay ? "bg-[oklch(0.62_0.17_162)] text-white" : "bg-white/90 backdrop-blur-sm text-slate-600"
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>
          )}

          {/* GPS Follow Me button */}
          <button
            onClick={() => gpsFollow ? stopGpsFollow() : startGpsFollow()}
            className={`w-14 h-14 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all ${
              gpsFollow
                ? "bg-blue-600 text-white shadow-blue-500/40 shadow-xl"
                : "bg-white/90 backdrop-blur-sm text-slate-700"
            }`}
          >
            {gpsFollow ? (
              <Navigation className="w-6 h-6" />
            ) : (
              <Crosshair className="w-6 h-6" />
            )}
            <span className="text-[9px] font-semibold leading-none">
              {gpsFollow ? "ON" : "GPS"}
            </span>
          </button>
        </div>

        {/* ── Bottom drawer handle / pull-up ── */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          {/* Persistent handle bar (always visible, not part of drawer) */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto"
            onClick={() => setDrawerOpen(true)}
          >
            <div className="bg-white rounded-t-2xl shadow-2xl px-5 pt-3 pb-6">
              {/* Drag handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[oklch(0.62_0.17_162)]" />
                    <span className="font-semibold text-sm text-[oklch(0.13_0.03_162)]">
                      {totalAddresses} {totalAddresses === 1 ? "address" : "addresses"}
                    </span>
                  </div>
                  {measuredCount > 0 && (
                    <span className="text-xs text-slate-400">{measuredCount} measured</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totalEstimate > 0 && (
                    <span className="font-mono font-bold text-sm text-[oklch(0.62_0.17_162)]">
                      ${totalEstimate.toLocaleString()}
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DrawerContent className="max-h-[85dvh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="flex items-center justify-between">
                <span className="font-display font-bold text-[oklch(0.13_0.03_162)]">Target List</span>
                <div className="flex items-center gap-2">
                  {dbAddresses.length > 0 && (
                    <button
                      onClick={handleMeasureAll}
                      disabled={updateMeasurement.isPending}
                      className="text-xs text-[oklch(0.62_0.17_162)] font-medium flex items-center gap-1 bg-[oklch(0.95_0.04_162)] px-3 py-1.5 rounded-full disabled:opacity-50"
                    >
                      <Ruler className="w-3 h-3" /> Measure All
                    </button>
                  )}
                </div>
              </DrawerTitle>
            </DrawerHeader>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-3">
              <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                <p className="font-mono font-bold text-lg text-[oklch(0.13_0.03_162)]">{totalAddresses}</p>
                <p className="text-xs text-slate-400">Addresses</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                <p className="font-mono font-bold text-lg text-[oklch(0.13_0.03_162)]">{measuredCount}</p>
                <p className="text-xs text-slate-400">Measured</p>
              </div>
              <div className="bg-[oklch(0.95_0.04_162)] rounded-xl p-2.5 text-center">
                <p className="font-mono font-bold text-lg text-[oklch(0.62_0.17_162)]">${totalEstimate.toLocaleString()}</p>
                <p className="text-xs text-[oklch(0.62_0.17_162)]/70">Revenue</p>
              </div>
            </div>

            {/* Address list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {addressesLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : dbAddresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MapPin className="w-10 h-10 text-slate-200 mb-3" />
                  <p className="font-semibold text-slate-400 text-sm">No addresses yet</p>
                  <p className="text-xs text-slate-300 mt-1">Tap the map to pin houses</p>
                </div>
              ) : (
                dbAddresses.map(addr => (
                  <AddressRow
                    key={addr.id}
                    addr={addr}
                    rates={rates}
                    onRemove={handleRemove}
                    onMeasure={handleMeasure}
                    onPitchChange={handlePitchChange}
                    removing={removingId === addr.id}
                    isMobile
                  />
                ))
              )}
            </div>

            {/* Order footer */}
            {dbAddresses.length > 0 && (
              <div className="border-t border-slate-100 p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500">Prime Mail ({totalAddresses} pieces)</span>
                  <span className="font-mono font-bold text-sm text-[oklch(0.13_0.03_162)]">${totalQMail.toFixed(2)}</span>
                </div>
                <Button
                  onClick={() => setShowPreview(true)}
                  className="w-full bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white font-semibold h-12 text-base"
                  disabled={measuredCount === 0}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Order Prime Mail Batch
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                {measuredCount < totalAddresses && (
                  <p className="text-xs text-amber-600 text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {totalAddresses - measuredCount} address(es) not yet measured
                  </p>
                )}
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* Modals */}
        {showPreview && (
          <QMailPreview
            onClose={() => setShowPreview(false)}
            onConfirm={handleOrder}
            confirming={createCheckout.isPending}
            totalAddresses={totalAddresses}
            totalQMailCost={totalQMail}
            totalEstimateValue={totalEstimate}
            companyName={profileData?.companyName ?? undefined}
            phone={profileData?.phone ?? undefined}
            website={profileData?.website ?? undefined}
            licenseNumber={profileData?.licenseNumber ?? undefined}
            logoUrl={profileData?.logoUrl ?? undefined}
            tagline={profileData?.tagline ?? undefined}
            sampleAddress={dbAddresses.find(a => a.measuredSqFt) ? {
              fullAddress: dbAddresses.find(a => a.measuredSqFt)!.fullAddress,
              measuredSqFt: parseFloat(dbAddresses.find(a => a.measuredSqFt)!.measuredSqFt!),
              pitch: dbAddresses.find(a => a.measuredSqFt)!.pitch ?? "6/12",
              estimatePrice: parseFloat(dbAddresses.find(a => a.measuredSqFt)!.estimatePrice ?? "0"),
              lat: dbAddresses.find(a => a.measuredSqFt)!.lat ?? undefined,
              lng: dbAddresses.find(a => a.measuredSqFt)!.lng ?? undefined,
            } : undefined}
          />
        )}
        {showSettings && (
          <PricingSettings rates={rates} setRates={setRates} onClose={() => setShowSettings(false)} />
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.62_0.17_162)] flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-[oklch(0.13_0.03_162)] text-base">PrimeMail</span>
          </div>
          <Badge variant="outline" className="text-xs border-[oklch(0.82_0.08_162)] text-[oklch(0.45_0.15_162)]">
            {campaignId ? `Campaign #${campaignId}` : "New Campaign"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Pricing Rates
          </button>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Map / Input */}
        <div className="flex-1 flex flex-col">
          {/* Tab bar + search */}
          <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              {([
                { key: "map", icon: MapPin, label: "Map" },
                { key: "list", icon: Search, label: "Address" },
                { key: "csv", icon: FileSpreadsheet, label: "CSV" },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${activeTab === tab.key ? "bg-white shadow-sm text-[oklch(0.13_0.03_162)]" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "list" && (
              <div className="flex flex-1 gap-2">
                <Input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Enter a street address, city, state..."
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSearch}
                  disabled={addAddress.isPending}
                  size="sm"
                  className="bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white"
                >
                  {addAddress.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
                </Button>
              </div>
            )}

            {activeTab === "csv" && (
              <div className="flex-1 flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleCSV} className="hidden" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={addBulk.isPending}
                  className="border-dashed border-slate-300 text-slate-600 hover:border-[oklch(0.62_0.17_162)] hover:text-[oklch(0.62_0.17_162)]"
                >
                  {addBulk.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload CSV File
                </Button>
                <p className="text-xs text-slate-400">One address per row. First column = street address. Max 200 rows.</p>
              </div>
            )}

            {activeTab === "map" && (
              <div className="flex items-center gap-3 ml-2">
                <p className="text-xs text-slate-400">Click anywhere on the satellite map to pin a house — it saves automatically</p>
                {roofSegments.length > 0 && (
                  <button
                    onClick={() => setShowOverlay(v => !v)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150 ${
                      showOverlay
                        ? "bg-[oklch(0.62_0.17_162)] border-[oklch(0.62_0.17_162)] text-white"
                        : "bg-white border-slate-200 text-slate-500 hover:border-[oklch(0.62_0.17_162)] hover:text-[oklch(0.62_0.17_162)]"
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    {showOverlay ? "Hide Overlay" : "Show Overlay"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MapView
              onMapReady={handleMapReady}
              initialCenter={{ lat: 33.749, lng: -84.388 }}
              initialZoom={16}
              className="w-full h-full"
            />
            {activeTab !== "map" && (
              <div className="absolute inset-0 bg-slate-900/5 pointer-events-none" />
            )}
            {/* Roof segment color legend */}
            {showOverlay && roofSegments.length > 0 && (
              <div className="absolute bottom-6 left-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 px-3 py-2.5 pointer-events-none">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Roof Pitch</p>
                {([
                  { label: "Flat",   color: "#94a3b8", range: "< 5°" },
                  { label: "4/12",   color: "#3b82f6", range: "5–22°" },
                  { label: "6/12",   color: "#22c55e", range: "22–30°" },
                  { label: "8/12",   color: "#f97316", range: "30–38°" },
                  { label: "10/12+", color: "#ef4444", range: "> 38°" },
                ] as const).map(item => (
                  <div key={item.label} className="flex items-center gap-2 mb-1 last:mb-0">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color, opacity: 0.7, border: `1.5px solid ${item.color}` }} />
                    <span className="text-[11px] font-medium text-slate-700">{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.range}</span>
                  </div>
                ))}
                <p className="text-[9px] text-slate-400 mt-1.5 border-t border-slate-100 pt-1.5">Click a segment for details</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Address list */}
        <div className="w-96 bg-white border-l border-slate-100 flex flex-col">
          {/* Summary bar */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-[oklch(0.13_0.03_162)] text-base">Target List</h2>
              <div className="flex items-center gap-2">
                {dbAddresses.length > 0 && (
                  <button
                    onClick={handleMeasureAll}
                    disabled={updateMeasurement.isPending}
                    className="text-xs text-[oklch(0.62_0.17_162)] hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Ruler className="w-3 h-3" /> Measure All
                  </button>
                )}
                {campaignId && (
                  <button
                    onClick={() => refetchAddresses()}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                <p className="font-mono font-bold text-lg text-[oklch(0.13_0.03_162)]">{totalAddresses}</p>
                <p className="text-xs text-slate-400">Addresses</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                <p className="font-mono font-bold text-lg text-[oklch(0.13_0.03_162)]">{measuredCount}</p>
                <p className="text-xs text-slate-400">Measured</p>
              </div>
              <div className="bg-[oklch(0.95_0.04_162)] rounded-lg p-2.5 text-center">
                <p className="font-mono font-bold text-lg text-[oklch(0.62_0.17_162)]">${totalEstimate.toLocaleString()}</p>
                <p className="text-xs text-[oklch(0.62_0.17_162)]/70">Est. Revenue</p>
              </div>
            </div>
          </div>

          {/* Address list */}
          <div className="flex-1 overflow-y-auto px-5 py-2">
            {addressesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : dbAddresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <MapPin className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-display font-semibold text-slate-400 text-sm mb-1">No addresses yet</p>
                <p className="text-xs text-slate-300 max-w-[200px]">Click the map to pin houses, search an address, or upload a CSV</p>
              </div>
            ) : (
              dbAddresses.map(addr => (
                <AddressRow
                  key={addr.id}
                  addr={addr}
                  rates={rates}
                  onRemove={handleRemove}
                  onMeasure={handleMeasure}
                  onPitchChange={handlePitchChange}
                  removing={removingId === addr.id}
                />
              ))
            )}
          </div>

          {/* Order footer */}
          {dbAddresses.length > 0 && (
            <div className="border-t border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Prime Mail cost ({totalAddresses} pieces)</span>
                <span className="font-mono font-bold text-sm text-[oklch(0.13_0.03_162)]">${totalQMail.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-[oklch(0.13_0.03_162)]">Total estimate value</span>
                <span className="font-mono font-bold text-base text-[oklch(0.62_0.17_162)]">${totalEstimate.toLocaleString()}</span>
              </div>
              <Button
                onClick={() => setShowPreview(true)}
                className="w-full bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white font-semibold h-11"
                disabled={measuredCount === 0}
              >
                <Mail className="w-4 h-4 mr-2" />
                Order Prime Mail Batch
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              {measuredCount < totalAddresses && (
                <p className="text-xs text-amber-600 text-center mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {totalAddresses - measuredCount} address(es) not yet measured
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prime Mail Packet Preview */}
      {showPreview && (
        <QMailPreview
          onClose={() => setShowPreview(false)}
          onConfirm={handleOrder}
          confirming={createCheckout.isPending}
          totalAddresses={totalAddresses}
          totalQMailCost={totalQMail}
          totalEstimateValue={totalEstimate}
          companyName={profileData?.companyName ?? undefined}
          phone={profileData?.phone ?? undefined}
          website={profileData?.website ?? undefined}
          licenseNumber={profileData?.licenseNumber ?? undefined}
          logoUrl={profileData?.logoUrl ?? undefined}
          tagline={profileData?.tagline ?? undefined}
          sampleAddress={dbAddresses.find(a => a.measuredSqFt) ? {
            fullAddress: dbAddresses.find(a => a.measuredSqFt)!.fullAddress,
            measuredSqFt: parseFloat(dbAddresses.find(a => a.measuredSqFt)!.measuredSqFt!),
            pitch: dbAddresses.find(a => a.measuredSqFt)!.pitch ?? "6/12",
            estimatePrice: parseFloat(dbAddresses.find(a => a.measuredSqFt)!.estimatePrice ?? "0"),
            lat: dbAddresses.find(a => a.measuredSqFt)!.lat ?? undefined,
            lng: dbAddresses.find(a => a.measuredSqFt)!.lng ?? undefined,
          } : undefined}
        />
      )}

      {/* Pricing settings modal */}
      {showSettings && (
        <PricingSettings rates={rates} setRates={setRates} onClose={() => setShowSettings(false)} />
      )}

      {/* Order confirmation modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
            <div className="w-12 h-12 rounded-2xl bg-[oklch(0.95_0.04_162)] flex items-center justify-center mb-5">
              <Package className="w-6 h-6 text-[oklch(0.62_0.17_162)]" />
            </div>
            <h3 className="font-display font-bold text-xl text-[oklch(0.13_0.03_162)] mb-2">Confirm Prime Mail Batch</h3>
            <p className="text-slate-500 text-sm mb-6">Review your order before we send it to print.</p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Addresses</span>
                <span className="font-medium text-[oklch(0.13_0.03_162)]">{totalAddresses} homes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Prime Mail packets</span>
                <span className="font-medium text-[oklch(0.13_0.03_162)]">{totalAddresses} × $3.50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total estimate value</span>
                <span className="font-medium text-[oklch(0.62_0.17_162)]">${totalEstimate.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <span className="font-semibold text-[oklch(0.13_0.03_162)]">Total charge</span>
                <span className="font-mono font-bold text-[oklch(0.13_0.03_162)]">${totalQMail.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-[oklch(0.95_0.04_162)] rounded-xl p-4 mb-6">
              <p className="text-xs text-[oklch(0.45_0.15_162)]">
                <strong>Turnaround:</strong> Packets are printed and dropped at USPS within 48 hours.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowOrderModal(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleOrder}
                disabled={orderCampaign.isPending}
                className="flex-1 bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white font-semibold"
              >
                {orderCampaign.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Confirm Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
