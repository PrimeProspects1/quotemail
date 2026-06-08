/*
 * Contractor Onboarding Wizard
 * 3-step setup: Company Profile → Pitch Rates → Launch First Campaign
 * Shown automatically to new users who haven't completed setup.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building2, DollarSign, Rocket, ChevronRight, ChevronLeft,
  CheckCircle2, Mail, Phone, Globe, Shield, Loader2,
  MapPin, FileSpreadsheet, Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Company Profile", icon: Building2 },
  { id: 2, label: "Pricing Setup", icon: DollarSign },
  { id: 3, label: "Launch", icon: Rocket },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                done ? "bg-[oklch(0.55_0.22_264)] text-white" :
                active ? "bg-[oklch(0.55_0.22_264)] text-white shadow-lg shadow-blue-200" :
                "bg-slate-100 text-slate-400"
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-[oklch(0.55_0.22_264)]" : done ? "text-slate-600" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-px mx-2 mb-5 transition-colors duration-300 ${current > step.id ? "bg-[oklch(0.55_0.22_264)]" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Company Profile ──────────────────────────────────────────────────
function Step1Profile({ onNext }: { onNext: () => void }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.profile.get.useQuery();
  const saveProfile = trpc.profile.save.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); onNext(); },
    onError: () => toast.error("Failed to save profile — please try again"),
  });

  const [form, setForm] = useState({
    companyName: "", phone: "", licenseNumber: "", website: "", tagline: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        companyName: existing.companyName ?? "",
        phone: existing.phone ?? "",
        licenseNumber: existing.licenseNumber ?? "",
        website: existing.website ?? "",
        tagline: existing.tagline ?? "",
      });
    }
  }, [existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    saveProfile.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[oklch(0.96_0.04_264)] flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-[oklch(0.55_0.22_264)]" />
        </div>
        <h2 className="font-display font-bold text-[oklch(0.17_0.03_255)] text-xl mb-1">
          Tell us about your company
        </h2>
        <p className="text-slate-500 text-sm">
          This information appears on every Q Mail packet you send. Homeowners will see your name, not ours.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="companyName" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Company Name <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="companyName"
              placeholder="Apex Roofing & Restoration"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="phone"
              placeholder="(555) 867-5309"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="license" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Contractor License #
          </Label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="license"
              placeholder="ROC-123456"
              value={form.licenseNumber}
              onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="website" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Website
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="website"
              placeholder="https://apexroofing.com"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tagline" className="text-sm font-medium text-slate-700 mb-1.5 block">
            Tagline
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="tagline"
              placeholder="Trusted by 500+ homeowners"
              value={form.tagline}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={saveProfile.isPending}
          className="w-full bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white font-semibold h-11"
        >
          {saveProfile.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
          ) : (
            <>Save & Continue <ChevronRight className="w-4 h-4 ml-1.5" /></>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 2: Pitch Rates ──────────────────────────────────────────────────────
const PITCH_LABELS = [
  { key: "flatRate", label: "Flat / Low Slope", pitch: "flat", example: "≤ 2/12" },
  { key: "pitch4Rate", label: "Low Pitch", pitch: "4/12", example: "3/12 – 4/12" },
  { key: "pitch6Rate", label: "Standard Pitch", pitch: "6/12", example: "5/12 – 6/12" },
  { key: "pitch8Rate", label: "Steep Pitch", pitch: "8/12", example: "7/12 – 8/12" },
  { key: "pitch10Rate", label: "Very Steep", pitch: "10/12+", example: "9/12 and above" },
];

function Step2Rates({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const utils = trpc.useUtils();
  const { data: existing } = trpc.pitchRates.get.useQuery();
  const saveRates = trpc.pitchRates.save.useMutation({
    onSuccess: () => { utils.pitchRates.get.invalidate(); onNext(); },
    onError: () => toast.error("Failed to save rates — please try again"),
  });

  const [rates, setRates] = useState({
    flatRate: "350.00", pitch4Rate: "400.00", pitch6Rate: "450.00",
    pitch8Rate: "500.00", pitch10Rate: "575.00",
    flatMultiplier: "1.00", pitch4Multiplier: "1.05", pitch6Multiplier: "1.12",
    pitch8Multiplier: "1.20", pitch10Multiplier: "1.30",
  });

  useEffect(() => {
    if (existing) {
      setRates({
        flatRate: existing.flatRate ?? "350.00",
        pitch4Rate: existing.pitch4Rate ?? "400.00",
        pitch6Rate: existing.pitch6Rate ?? "450.00",
        pitch8Rate: existing.pitch8Rate ?? "500.00",
        pitch10Rate: existing.pitch10Rate ?? "575.00",
        flatMultiplier: existing.flatMultiplier ?? "1.00",
        pitch4Multiplier: existing.pitch4Multiplier ?? "1.05",
        pitch6Multiplier: existing.pitch6Multiplier ?? "1.12",
        pitch8Multiplier: existing.pitch8Multiplier ?? "1.20",
        pitch10Multiplier: existing.pitch10Multiplier ?? "1.30",
      });
    }
  }, [existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRates.mutate(rates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[oklch(0.96_0.04_264)] flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-7 h-7 text-[oklch(0.55_0.22_264)]" />
        </div>
        <h2 className="font-display font-bold text-[oklch(0.17_0.03_255)] text-xl mb-1">
          Set your pricing by pitch
        </h2>
        <p className="text-slate-500 text-sm">
          Enter your price per square (100 sq ft) for each roof pitch. QuoteMail auto-calculates every estimate using these rates.
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 mb-2">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3 items-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pitch</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">$/Square</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Multiplier</div>

          {PITCH_LABELS.map(({ key, label, pitch, example }) => (
            <>
              <div key={`${key}-label`}>
                <p className="text-sm font-medium text-[oklch(0.17_0.03_255)]">{label}</p>
                <p className="text-xs text-slate-400">{example}</p>
              </div>
              <div key={`${key}-rate`} className="w-24">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rates[key as keyof typeof rates]}
                    onChange={e => setRates(r => ({ ...r, [key]: e.target.value }))}
                    className="pl-6 text-right h-8 text-sm"
                  />
                </div>
              </div>
              <div key={`${key}-mult`} className="w-20">
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={rates[`${key.replace("Rate", "Multiplier")}` as keyof typeof rates]}
                  onChange={e => setRates(r => ({ ...r, [`${key.replace("Rate", "Multiplier")}`]: e.target.value }))}
                  className="text-right h-8 text-sm"
                />
              </div>
            </>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        The multiplier adjusts for pitch difficulty. A 1.12× multiplier on a 6/12 roof means your actual rate is 12% higher than the base $/square.
      </p>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11">
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={saveRates.isPending}
          className="flex-1 bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white font-semibold h-11"
        >
          {saveRates.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
          ) : (
            <>Save & Continue <ChevronRight className="w-4 h-4 ml-1.5" /></>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 3: Launch ───────────────────────────────────────────────────────────
function Step3Launch() {
  const [, navigate] = useLocation();

  const LAUNCH_OPTIONS = [
    {
      icon: MapPin,
      title: "Pin a Neighborhood",
      desc: "Drop pins on the satellite map to target specific homes in any area.",
      action: () => navigate("/app"),
      cta: "Open Map",
      color: "bg-blue-50 text-[oklch(0.55_0.22_264)]",
    },
    {
      icon: FileSpreadsheet,
      title: "Upload a CSV",
      desc: "Import a list of addresses from storm data, permit records, or any source.",
      action: () => navigate("/app"),
      cta: "Import CSV",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Zap,
      title: "Browse Storm Events",
      desc: "Find neighborhoods recently hit by hail or wind and target them first.",
      action: () => navigate("/storm-data"),
      cta: "View Storm Data",
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="font-display font-bold text-[oklch(0.17_0.03_255)] text-xl mb-1">
          You're all set!
        </h2>
        <p className="text-slate-500 text-sm">
          Your company profile and pricing are saved. Now choose how you want to build your first campaign.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {LAUNCH_OPTIONS.map((opt, i) => (
          <button
            key={i}
            onClick={opt.action}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-[oklch(0.85_0.10_264)] hover:shadow-sm transition-all duration-200 text-left group"
          >
            <div className={`w-10 h-10 rounded-xl ${opt.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
              <opt.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[oklch(0.17_0.03_255)] text-sm">{opt.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[oklch(0.55_0.22_264)] flex-shrink-0">
              {opt.cta}
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
      >
        Skip for now — go to dashboard
      </button>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export default function Onboarding() {
  const { isAuthenticated, loading } = useAuth();
  const [step, setStep] = useState(1);

  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[oklch(0.55_0.22_264/0.04)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.55_0.22_264/0.03)] blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[oklch(0.55_0.22_264)] flex items-center justify-center shadow-lg shadow-blue-200">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-[oklch(0.17_0.03_255)] text-xl tracking-tight">QuoteMail</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          <StepIndicator current={step} />

          {step === 1 && <Step1Profile onNext={() => setStep(2)} />}
          {step === 2 && <Step2Rates onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3Launch />}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          You can update these settings anytime from the{" "}
          <a href="/settings" className="text-[oklch(0.55_0.22_264)] hover:underline">Settings page</a>.
        </p>
      </div>
    </div>
  );
}
