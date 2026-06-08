import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Building2, DollarSign, Save, Loader2, Mail } from "lucide-react";

export default function Settings() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // ─── Profile ────────────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const saveProfile = trpc.profile.save.useMutation({
    onSuccess: () => { toast.success("Company profile saved"); utils.profile.get.invalidate(); },
    onError: () => toast.error("Failed to save profile"),
  });

  const [profileForm, setProfileForm] = useState({
    companyName: "", phone: "", licenseNumber: "", website: "", tagline: "",
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        companyName: profile.companyName ?? "",
        phone: profile.phone ?? "",
        licenseNumber: profile.licenseNumber ?? "",
        website: profile.website ?? "",
        tagline: profile.tagline ?? "",
      });
    }
  }, [profile]);

  // ─── Pitch Rates ─────────────────────────────────────────────────────────────
  const { data: rates, isLoading: ratesLoading } = trpc.pitchRates.get.useQuery(undefined, { enabled: isAuthenticated });
  const saveRates = trpc.pitchRates.save.useMutation({
    onSuccess: () => { toast.success("Pitch rates saved"); utils.pitchRates.get.invalidate(); },
    onError: () => toast.error("Failed to save rates"),
  });

  const [ratesForm, setRatesForm] = useState({
    flatRate: "350.00",
    pitch4Rate: "400.00",
    pitch6Rate: "450.00",
    pitch8Rate: "500.00",
    pitch10Rate: "575.00",
    flatMultiplier: "1.00",
    pitch4Multiplier: "1.05",
    pitch6Multiplier: "1.12",
    pitch8Multiplier: "1.20",
    pitch10Multiplier: "1.30",
  });

  useEffect(() => {
    if (rates) {
      setRatesForm({
        flatRate: rates.flatRate ?? "350.00",
        pitch4Rate: rates.pitch4Rate ?? "400.00",
        pitch6Rate: rates.pitch6Rate ?? "450.00",
        pitch8Rate: rates.pitch8Rate ?? "500.00",
        pitch10Rate: rates.pitch10Rate ?? "575.00",
        flatMultiplier: rates.flatMultiplier ?? "1.00",
        pitch4Multiplier: rates.pitch4Multiplier ?? "1.05",
        pitch6Multiplier: rates.pitch6Multiplier ?? "1.12",
        pitch8Multiplier: rates.pitch8Multiplier ?? "1.20",
        pitch10Multiplier: rates.pitch10Multiplier ?? "1.30",
      });
    }
  }, [rates]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Sign in to access settings</h2>
          <a href={getLoginUrl()}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
          </a>
        </div>
      </div>
    );
  }

  const pitchTiers = [
    { key: "flat", label: "Flat / Low Slope", rateKey: "flatRate" as const, multKey: "flatMultiplier" as const },
    { key: "4/12", label: "4/12 Pitch", rateKey: "pitch4Rate" as const, multKey: "pitch4Multiplier" as const },
    { key: "6/12", label: "6/12 Pitch", rateKey: "pitch6Rate" as const, multKey: "pitch6Multiplier" as const },
    { key: "8/12", label: "8/12 Pitch", rateKey: "pitch8Rate" as const, multKey: "pitch8Multiplier" as const },
    { key: "10/12+", label: "10/12+ Steep", rateKey: "pitch10Rate" as const, multKey: "pitch10Multiplier" as const },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">QuoteMail</span>
          </div>
        </div>
        <span className="text-sm text-slate-500">{user?.name ?? user?.email}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your company profile and pricing rates for Q Mail estimates.</p>
        </div>

        {/* Company Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Company Profile</CardTitle>
                <CardDescription>This information appears on every Q Mail packet you send.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading profile...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="Apex Roofing Co." value={profileForm.companyName}
                      onChange={e => setProfileForm(p => ({ ...p, companyName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="(555) 123-4567" value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input id="licenseNumber" placeholder="ROC-123456" value={profileForm.licenseNumber}
                      onChange={e => setProfileForm(p => ({ ...p, licenseNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" placeholder="https://apexroofing.com" value={profileForm.website}
                      onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tagline">Tagline / Slogan</Label>
                  <Input id="tagline" placeholder="Trusted Roofing Since 2005" value={profileForm.tagline}
                    onChange={e => setProfileForm(p => ({ ...p, tagline: e.target.value }))} />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => saveProfile.mutate(profileForm)}
                    disabled={saveProfile.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    {saveProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Profile
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pitch Rates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">Pitch-Based Pricing</CardTitle>
                <CardDescription>
                  Set your price per roofing square (100 sq ft) for each pitch tier. The multiplier adjusts the measured flat area to account for pitch slope.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ratesLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading rates...
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-slate-200 overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Pitch Tier</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">$/Square</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Area Multiplier</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Example (20 sq flat)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pitchTiers.map(tier => {
                        const rate = parseFloat(ratesForm[tier.rateKey] || "0");
                        const mult = parseFloat(ratesForm[tier.multKey] || "1");
                        const example = (20 * mult * rate).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
                        return (
                          <tr key={tier.key} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-700">{tier.label}</td>
                            <td className="px-4 py-3">
                              <div className="relative w-28">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                <Input
                                  className="pl-6 h-8 text-sm font-mono"
                                  value={ratesForm[tier.rateKey]}
                                  onChange={e => setRatesForm(p => ({ ...p, [tier.rateKey]: e.target.value }))}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                className="w-20 h-8 text-sm font-mono"
                                value={ratesForm[tier.multKey]}
                                onChange={e => setRatesForm(p => ({ ...p, [tier.multKey]: e.target.value }))}
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500 text-xs">{example}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Estimate = (Measured flat sq ft × multiplier / 100) × $/square. The multiplier accounts for the extra material needed on steeper pitches.
                </p>
                <div className="flex justify-end">
                  <Button
                    onClick={() => saveRates.mutate(ratesForm)}
                    disabled={saveRates.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {saveRates.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Rates
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
