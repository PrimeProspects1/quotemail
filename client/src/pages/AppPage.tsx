/*
 * QuoteMail — Contractor App Page
 * Features: Map pin-drop, address search, CSV upload, satellite measurement,
 *           pitch-based pricing engine, estimate generation, batch ordering
 * Design: Clean B2B SaaS, Space Grotesk, navy + electric blue
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MapPin, Upload, Search, Plus, Trash2, Settings2, Mail,
  ChevronRight, X, Check, AlertCircle, BarChart3, Package,
  FileSpreadsheet, Ruler, DollarSign, ArrowLeft, Eye, Download
} from "lucide-react";
import { MapView } from "@/components/Map";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PitchRate {
  label: string;
  key: string;
  factor: number;
  rate: number;
}

interface TargetAddress {
  id: string;
  address: string;
  lat: number;
  lng: number;
  sqft: number | null;
  pitch: string;
  estimatedPrice: number | null;
  status: "pending" | "measured" | "priced" | "ordered";
}

// ─── Default pitch rates ──────────────────────────────────────────────────────
const DEFAULT_RATES: PitchRate[] = [
  { label: "Flat / Low (2/12–3/12)", key: "flat", factor: 1.0, rate: 350 },
  { label: "4/12 – 5/12", key: "4_12", factor: 1.15, rate: 380 },
  { label: "6/12 – 7/12", key: "6_12", factor: 1.30, rate: 410 },
  { label: "8/12 – 9/12", key: "8_12", factor: 1.50, rate: 450 },
  { label: "10/12+", key: "10_12", factor: 1.75, rate: 520 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function estimateSqft(lat: number, lng: number): number {
  // Simulated satellite measurement — in production this calls a roofing measurement API
  // Returns a realistic residential roof footprint in sq ft
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 1000));
  return Math.round((1200 + seed * 2400) / 10) * 10;
}

function calcPrice(sqft: number, pitchKey: string, rates: PitchRate[]): number {
  const r = rates.find(r => r.key === pitchKey) ?? rates[1];
  const squares = sqft / 100;
  return Math.round(squares * r.rate * r.factor);
}

// ─── Pricing Settings Panel ───────────────────────────────────────────────────
function PricingSettings({ rates, setRates, onClose }: {
  rates: PitchRate[];
  setRates: (r: PitchRate[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(rates);
  const update = (key: string, val: number) => {
    setLocal(prev => prev.map(r => r.key === key ? { ...r, rate: val } : r));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-xl text-[oklch(0.17_0.03_255)]">Your Pricing Rates</h3>
            <p className="text-sm text-slate-500 mt-0.5">Set your price per square (100 sq ft) for each pitch tier</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {local.map(r => (
            <div key={r.key} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-[oklch(0.17_0.03_255)]">{r.label}</p>
                <p className="text-xs text-slate-400 font-mono-data">Factor: ×{r.factor}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">$</span>
                <Input
                  type="number"
                  value={r.rate}
                  onChange={e => update(r.key, Number(e.target.value))}
                  className="w-24 text-right font-mono-data text-sm"
                  min={100}
                  max={2000}
                />
                <span className="text-slate-400 text-xs whitespace-nowrap">/square</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[oklch(0.96_0.04_264)] rounded-xl p-4 mb-6">
          <p className="text-xs text-[oklch(0.45_0.18_264)] font-medium">
            Example: A 2,400 sq ft roof at 6/12 pitch = 24 squares × $410 × 1.30 = <strong>${(24 * 410 * 1.30).toLocaleString()}</strong>
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => { setRates(local); onClose(); toast.success("Pricing rates saved"); }} className="flex-1 bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white">
            Save Rates
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Address Row ──────────────────────────────────────────────────────────────
function AddressRow({ addr, rates, onRemove, onMeasure, onPitchChange }: {
  addr: TargetAddress;
  rates: PitchRate[];
  onRemove: (id: string) => void;
  onMeasure: (id: string) => void;
  onPitchChange: (id: string, pitch: string) => void;
}) {
  const price = addr.sqft ? calcPrice(addr.sqft, addr.pitch, rates) : null;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 group">
      <div className="w-2 h-2 rounded-full bg-[oklch(0.55_0.22_264)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[oklch(0.17_0.03_255)] truncate">{addr.address}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {addr.sqft ? (
            <span className="text-xs font-mono-data text-slate-500">{addr.sqft.toLocaleString()} sq ft</span>
          ) : (
            <button onClick={() => onMeasure(addr.id)} className="text-xs text-[oklch(0.55_0.22_264)] hover:underline font-medium flex items-center gap-1">
              <Ruler className="w-3 h-3" /> Measure
            </button>
          )}
          {addr.sqft && (
            <select
              value={addr.pitch}
              onChange={e => onPitchChange(addr.id, e.target.value)}
              className="text-xs border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 bg-white"
            >
              {rates.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          )}
        </div>
      </div>
      {price !== null && (
        <span className="font-mono-data font-bold text-sm text-[oklch(0.55_0.22_264)] flex-shrink-0">
          ${price.toLocaleString()}
        </span>
      )}
      <button
        onClick={() => onRemove(addr.id)}
        className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AppPage() {
  const [addresses, setAddresses] = useState<TargetAddress[]>([]);
  const [rates, setRates] = useState<PitchRate[]>(DEFAULT_RATES);
  const [showSettings, setShowSettings] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<"map" | "list" | "csv">("map");
  const [mapReady, setMapReady] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add address from geocoded result
  const addAddress = useCallback((address: string, lat: number, lng: number) => {
    const newAddr: TargetAddress = {
      id: uid(),
      address,
      lat,
      lng,
      sqft: null,
      pitch: "6_12",
      estimatedPrice: null,
      status: "pending",
    };
    setAddresses(prev => [...prev, newAddr]);
    return newAddr;
  }, []);

  // Measure a single address
  const measureAddress = useCallback((id: string) => {
    setAddresses(prev => prev.map(a => {
      if (a.id !== id) return a;
      const sqft = estimateSqft(a.lat, a.lng);
      const price = calcPrice(sqft, a.pitch, rates);
      return { ...a, sqft, estimatedPrice: price, status: "measured" };
    }));
    toast.success("Roof measured from satellite imagery");
  }, [rates]);

  // Measure all pending
  const measureAll = useCallback(() => {
    setAddresses(prev => prev.map(a => {
      if (a.sqft) return a;
      const sqft = estimateSqft(a.lat, a.lng);
      const price = calcPrice(sqft, a.pitch, rates);
      return { ...a, sqft, estimatedPrice: price, status: "measured" };
    }));
    toast.success("All roofs measured from satellite imagery");
  }, [rates]);

  // Update pitch and recalculate
  const updatePitch = useCallback((id: string, pitch: string) => {
    setAddresses(prev => prev.map(a => {
      if (a.id !== id) return a;
      const price = a.sqft ? calcPrice(a.sqft, pitch, rates) : null;
      return { ...a, pitch, estimatedPrice: price };
    }));
  }, [rates]);

  // Remove address
  const removeAddress = useCallback((id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  }, []);

  // Map ready callback
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    map.setMapTypeId("satellite");
    setMapReady(true);

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Reverse geocode
      geocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const address = results[0].formatted_address;
          const newAddr = addAddress(address, lat, lng);

          // Add marker
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#2563EB",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            animation: google.maps.Animation.DROP,
          });
          markersRef.current.push(marker);

          // Measure immediately
          setTimeout(() => {
            setAddresses(prev => prev.map(a => {
              if (a.id !== newAddr.id) return a;
              const sqft = estimateSqft(lat, lng);
              const price = calcPrice(sqft, a.pitch, rates);
              return { ...a, sqft, estimatedPrice: price, status: "measured" };
            }));
          }, 600);

          toast.success(`Pinned: ${address.split(",")[0]}`);
        }
      });
    });
  }, [addAddress, rates]);

  // Search address
  const handleSearch = useCallback(() => {
    if (!searchInput.trim() || !geocoderRef.current || !mapRef.current) {
      if (!geocoderRef.current) toast.error("Map not ready yet — switch to Map tab first");
      return;
    }
    geocoderRef.current.geocode({ address: searchInput }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        const address = results[0].formatted_address;
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(18);
        const newAddr = addAddress(address, lat, lng);

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current!,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#2563EB",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          animation: google.maps.Animation.DROP,
        });
        markersRef.current.push(marker);

        setTimeout(() => {
          setAddresses(prev => prev.map(a => {
            if (a.id !== newAddr.id) return a;
            const sqft = estimateSqft(lat, lng);
            const price = calcPrice(sqft, a.pitch, rates);
            return { ...a, sqft, estimatedPrice: price, status: "measured" };
          }));
        }, 600);

        setSearchInput("");
        toast.success(`Added: ${address.split(",")[0]}`);
      } else {
        toast.error("Address not found. Try a more specific address.");
      }
    });
  }, [searchInput, addAddress, rates]);

  // CSV upload
  const handleCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const header = lines[0].toLowerCase();
      const isCSV = header.includes("address") || header.includes("street");
      const dataLines = isCSV ? lines.slice(1) : lines;

      let added = 0;
      const geocoder = geocoderRef.current ?? new google.maps.Geocoder();

      const processLine = (i: number) => {
        if (i >= dataLines.length) {
          toast.success(`Imported ${added} addresses from CSV`);
          return;
        }
        const parts = dataLines[i].split(",");
        const address = (parts[0] || "").trim().replace(/^"|"$/g, "");
        if (!address) { processLine(i + 1); return; }

        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            const loc = results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();
            const fullAddress = results[0].formatted_address;
            const newAddr = addAddress(fullAddress, lat, lng);
            const sqft = estimateSqft(lat, lng);
            const price = calcPrice(sqft, "6_12", rates);
            setAddresses(prev => prev.map(a =>
              a.id === newAddr.id ? { ...a, sqft, estimatedPrice: price, status: "measured" } : a
            ));
            added++;
          }
          setTimeout(() => processLine(i + 1), 200);
        });
      };

      processLine(0);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [addAddress, rates]);

  // Totals
  const totalAddresses = addresses.length;
  const measuredCount = addresses.filter(a => a.sqft).length;
  const totalEstimate = addresses.reduce((sum, a) => sum + (a.estimatedPrice ?? 0), 0);
  const totalQMail = totalAddresses * 3.50;

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
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.55_0.22_264)] flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-[oklch(0.17_0.03_255)] text-base">QuoteMail</span>
          </div>
          <Badge variant="outline" className="text-xs border-[oklch(0.85_0.10_264)] text-[oklch(0.45_0.18_264)]">
            New Campaign
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${activeTab === tab.key ? "bg-white shadow-sm text-[oklch(0.17_0.03_255)]" : "text-slate-500 hover:text-slate-700"}`}
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
                <Button onClick={handleSearch} size="sm" className="bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white">
                  <Plus className="w-4 h-4 mr-1" /> Add
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
                  className="border-dashed border-slate-300 text-slate-600 hover:border-[oklch(0.55_0.22_264)] hover:text-[oklch(0.55_0.22_264)]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV File
                </Button>
                <p className="text-xs text-slate-400">One address per row. First column = street address.</p>
              </div>
            )}

            {activeTab === "map" && (
              <p className="text-xs text-slate-400 ml-2">Click anywhere on the satellite map to pin a house and auto-measure its roof</p>
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
          </div>
        </div>

        {/* Right: Address list + pricing */}
        <div className="w-96 bg-white border-l border-slate-100 flex flex-col">
          {/* Summary bar */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-[oklch(0.17_0.03_255)] text-base">Target List</h2>
              <div className="flex items-center gap-2">
                {addresses.length > 0 && (
                  <button
                    onClick={measureAll}
                    className="text-xs text-[oklch(0.55_0.22_264)] hover:underline font-medium flex items-center gap-1"
                  >
                    <Ruler className="w-3 h-3" /> Measure All
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                <p className="font-mono-data font-bold text-lg text-[oklch(0.17_0.03_255)]">{totalAddresses}</p>
                <p className="text-xs text-slate-400">Addresses</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                <p className="font-mono-data font-bold text-lg text-[oklch(0.17_0.03_255)]">{measuredCount}</p>
                <p className="text-xs text-slate-400">Measured</p>
              </div>
              <div className="bg-[oklch(0.96_0.04_264)] rounded-lg p-2.5 text-center">
                <p className="font-mono-data font-bold text-lg text-[oklch(0.55_0.22_264)]">${totalEstimate.toLocaleString()}</p>
                <p className="text-xs text-[oklch(0.55_0.22_264)]/70">Est. Revenue</p>
              </div>
            </div>
          </div>

          {/* Address list */}
          <div className="flex-1 overflow-y-auto px-5 py-2">
            {addresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <MapPin className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-display font-semibold text-slate-400 text-sm mb-1">No addresses yet</p>
                <p className="text-xs text-slate-300 max-w-[200px]">Click the map to pin houses, search an address, or upload a CSV</p>
              </div>
            ) : (
              addresses.map(addr => (
                <AddressRow
                  key={addr.id}
                  addr={addr}
                  rates={rates}
                  onRemove={removeAddress}
                  onMeasure={measureAddress}
                  onPitchChange={updatePitch}
                />
              ))
            )}
          </div>

          {/* Order footer */}
          {addresses.length > 0 && (
            <div className="border-t border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Q Mail cost ({totalAddresses} pieces)</span>
                <span className="font-mono-data font-bold text-sm text-[oklch(0.17_0.03_255)]">${totalQMail.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-[oklch(0.17_0.03_255)]">Total estimate value</span>
                <span className="font-mono-data font-bold text-base text-[oklch(0.55_0.22_264)]">${totalEstimate.toLocaleString()}</span>
              </div>
              <Button
                onClick={() => setShowOrderModal(true)}
                className="w-full bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white font-semibold h-11"
                disabled={measuredCount === 0}
              >
                <Mail className="w-4 h-4 mr-2" />
                Order Q Mail Batch
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

      {/* Pricing settings modal */}
      {showSettings && (
        <PricingSettings rates={rates} setRates={setRates} onClose={() => setShowSettings(false)} />
      )}

      {/* Order confirmation modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
            <div className="w-12 h-12 rounded-2xl bg-[oklch(0.96_0.04_264)] flex items-center justify-center mb-5">
              <Package className="w-6 h-6 text-[oklch(0.55_0.22_264)]" />
            </div>
            <h3 className="font-display font-bold text-xl text-[oklch(0.17_0.03_255)] mb-2">Confirm Q Mail Batch</h3>
            <p className="text-slate-500 text-sm mb-6">Review your order before we send it to print.</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Addresses</span>
                <span className="font-medium text-[oklch(0.17_0.03_255)]">{totalAddresses} homes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Q Mail packets</span>
                <span className="font-medium text-[oklch(0.17_0.03_255)]">{totalAddresses} × $3.50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total estimate value</span>
                <span className="font-medium text-[oklch(0.55_0.22_264)]">${totalEstimate.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <span className="font-semibold text-[oklch(0.17_0.03_255)]">Total charge</span>
                <span className="font-mono-data font-bold text-[oklch(0.17_0.03_255)]">${totalQMail.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[oklch(0.96_0.04_264)] rounded-xl p-4 mb-6">
              <p className="text-xs text-[oklch(0.45_0.18_264)]">
                <strong>Turnaround:</strong> Packets are printed and dropped at USPS within 48 hours. Homeowners receive mail in 3–7 business days.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowOrderModal(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  setShowOrderModal(false);
                  toast.success("Batch submitted! Q Mail packets will be mailed within 48 hours.");
                  setAddresses([]);
                }}
                className="flex-1 bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
