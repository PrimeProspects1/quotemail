/*
 * Prime Mail Packet Preview
 * A 5-page visual preview of the personalized estimate packet
 * that will be printed and mailed to the homeowner.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X, ChevronLeft, ChevronRight, Mail, Phone, Globe,
  MapPin, Ruler, DollarSign, Star, CheckCircle2, QrCode,
  FileText, Users, Gift, Shield, Award, Building2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface QMailPreviewProps {
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
  // Batch summary
  totalAddresses: number;
  totalQMailCost: number;
  totalEstimateValue: number;
  // Contractor profile (optional — shown if available)
  companyName?: string;
  phone?: string;
  website?: string;
  licenseNumber?: string;
  logoUrl?: string;
  tagline?: string;
  // Sample address for preview
  sampleAddress?: {
    fullAddress: string;
    measuredSqFt: number;
    pitch: string;
    estimatePrice: number;
    lat?: string;
    lng?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStreetViewUrl(lat: string, lng: string, size = "600x400") {
  // Uses Google Street View Static API via Manus proxy — front-facing view of the house
  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&pitch=10&fov=80&source=outdoor&key=MANUS_PROXY`;
}

function pitchLabel(pitch: string) {
  const map: Record<string, string> = {
    flat: "Flat / Low Slope",
    "4/12": "4/12 Moderate Slope",
    "6/12": "6/12 Standard Slope",
    "8/12": "8/12 Steep Slope",
    "10/12+": "10/12+ Very Steep",
  };
  return map[pitch] ?? pitch;
}

// ─── Page 1: Cover ────────────────────────────────────────────────────────────
function CoverPage({ props }: { props: QMailPreviewProps }) {
  const { companyName, phone, logoUrl, sampleAddress, tagline } = props;
  const co = companyName || "Peak Performance Roofing";
  const addr = sampleAddress?.fullAddress ?? "1234 Maple Street, Atlanta, GA 30301";
  const price = sampleAddress?.estimatePrice ?? 8400;
  const sqft = sampleAddress?.measuredSqFt ?? 1850;

  return (
    <div className="bg-white h-full flex flex-col" style={{ fontFamily: "Georgia, serif" }}>
      {/* Header band */}
      <div className="bg-[oklch(0.13_0.03_162)] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={co} className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[oklch(0.62_0.17_162)] flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <p className="text-white font-bold text-lg leading-tight">{co}</p>
            {tagline && <p className="text-slate-400 text-xs">{tagline}</p>}
          </div>
        </div>
        <div className="text-right">
          {phone && <p className="text-white text-sm font-medium">{phone}</p>}
          <p className="text-slate-400 text-xs">Licensed & Insured</p>
        </div>
      </div>

      {/* Street-view / front-facing house image */}
      <div className="relative bg-slate-800 flex-1 flex items-center justify-center overflow-hidden">
        {sampleAddress?.lat && sampleAddress?.lng ? (
          <img
            src={getStreetViewUrl(sampleAddress.lat, sampleAddress.lng)}
            alt={`Street view of ${addr.split(",")[0]}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if Street View is unavailable for this address
              const el = e.currentTarget;
              el.style.display = "none";
              const parent = el.parentElement;
              if (parent) {
                const fb = document.createElement("div");
                fb.className = "w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center";
                fb.innerHTML = `<div class="text-center"><div class="w-20 h-20 rounded-full bg-blue-900/50 flex items-center justify-center mx-auto mb-3"><svg xmlns='http://www.w3.org/2000/svg' class='w-10 h-10 text-blue-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div><p class='text-white font-semibold'>Your Home</p><p class='text-slate-400 text-sm mt-1'>${addr.split(",")[0]}</p></div>`;
                parent.appendChild(fb);
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[oklch(0.55_0.22_264/0.3)] flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-10 h-10 text-[oklch(0.78_0.10_162)]" />
              </div>
              <p className="text-white font-semibold">Your Home</p>
              <p className="text-slate-400 text-sm mt-1">Google Street View photo of your property</p>
            </div>
          </div>
        )}

        {/* Overlay badge */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg">
          <p className="text-xs text-slate-500 font-medium">Your Custom Roofing Estimate</p>
          <p className="text-2xl font-bold text-[oklch(0.13_0.03_162)]">${price.toLocaleString()}</p>
          <p className="text-xs text-slate-400">{sqft.toLocaleString()} sq ft · {pitchLabel(sampleAddress?.pitch ?? "6/12")}</p>
        </div>

        {/* QR code placeholder */}
        <div className="absolute bottom-4 right-4 bg-white rounded-xl p-2 shadow-lg">
          <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs text-center text-slate-500 mt-1">Scan for<br/>digital copy</p>
        </div>
      </div>

      {/* Address bar */}
      <div className="bg-[oklch(0.95_0.04_162)] px-8 py-3 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[oklch(0.62_0.17_162)]" />
        <p className="text-sm text-[oklch(0.13_0.03_162)] font-medium">{addr}</p>
      </div>
    </div>
  );
}

// ─── Page 2: Personal Letter ──────────────────────────────────────────────────
function LetterPage({ props }: { props: QMailPreviewProps }) {
  const { companyName, phone, website, licenseNumber } = props;
  const co = companyName || "Peak Performance Roofing";
  const addr = props.sampleAddress?.fullAddress ?? "1234 Maple Street, Atlanta, GA 30301";
  const homeowner = addr.split(",")[0];

  return (
    <div className="bg-white h-full flex flex-col px-10 py-8" style={{ fontFamily: "Georgia, serif" }}>
      {/* Letterhead */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <p className="font-bold text-[oklch(0.13_0.03_162)] text-xl">{co}</p>
          {licenseNumber && <p className="text-slate-500 text-xs mt-0.5">License #{licenseNumber}</p>}
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          {phone && <p className="mt-0.5">{phone}</p>}
          {website && <p className="text-[oklch(0.62_0.17_162)]">{website}</p>}
        </div>
      </div>

      {/* Salutation */}
      <p className="text-slate-700 mb-4">Dear Homeowner at <strong>{homeowner}</strong>,</p>

      {/* Body */}
      <div className="space-y-4 text-slate-600 text-sm leading-relaxed flex-1">
        <p>
          We recently conducted a satellite analysis of roofs in your neighborhood and noticed that your home may be due for a roof inspection or replacement. As a local, licensed roofing contractor, we wanted to reach out personally before you start shopping around.
        </p>
        <p>
          Based on our satellite measurements of your property, we have prepared a <strong className="text-[oklch(0.13_0.03_162)]">personalized roofing estimate</strong> specifically for your home. This is not a generic quote — it is calculated from the actual measured square footage and pitch of your roof.
        </p>
        <p>
          We believe in transparent pricing. The estimate on the following pages reflects our standard rates with no hidden fees. We are fully licensed, insured, and have served homeowners in your area for over a decade.
        </p>
        <p>
          We would love the opportunity to walk your property, confirm our measurements in person, and answer any questions you have. There is absolutely no obligation.
        </p>
        <div className="bg-[oklch(0.95_0.04_162)] rounded-xl p-4 border border-[oklch(0.82_0.08_162)]">
          <p className="font-semibold text-[oklch(0.13_0.03_162)] text-sm mb-1">📞 Call or text us to schedule your free inspection:</p>
          <p className="text-[oklch(0.62_0.17_162)] font-bold text-lg">{phone || "(555) 867-5309"}</p>
          <p className="text-slate-500 text-xs mt-1">Mention this letter for a $150 discount on any job over $5,000.</p>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-slate-500 text-sm">Sincerely,</p>
        <p className="font-bold text-[oklch(0.13_0.03_162)] mt-1">{co}</p>
        <p className="text-slate-400 text-xs mt-0.5">Your Neighborhood Roofing Specialist</p>
      </div>
    </div>
  );
}

// ─── Page 3: Itemized Estimate ─────────────────────────────────────────────────
function EstimatePage({ props }: { props: QMailPreviewProps }) {
  const { companyName } = props;
  const co = companyName || "Peak Performance Roofing";
  const sqft = props.sampleAddress?.measuredSqFt ?? 1850;
  const pitch = props.sampleAddress?.pitch ?? "6/12";
  const totalPrice = props.sampleAddress?.estimatePrice ?? 8400;
  const squares = (sqft / 100).toFixed(1);

  const lineItems = [
    { desc: "Tear-off & disposal of existing shingles", qty: `${squares} sq`, unit: "square", price: Math.round(totalPrice * 0.12) },
    { desc: "30-lb synthetic underlayment", qty: `${squares} sq`, unit: "square", price: Math.round(totalPrice * 0.08) },
    { desc: "Architectural shingles (30-yr warranty)", qty: `${squares} sq`, unit: "square", price: Math.round(totalPrice * 0.35) },
    { desc: "Ridge cap shingles", qty: "1 bundle", unit: "bundle", price: Math.round(totalPrice * 0.04) },
    { desc: "Drip edge (aluminum)", qty: "120 LF", unit: "linear ft", price: Math.round(totalPrice * 0.05) },
    { desc: "Ice & water shield (eaves)", qty: "2 sq", unit: "square", price: Math.round(totalPrice * 0.04) },
    { desc: "Pipe boot flashings (2)", qty: "2 ea", unit: "each", price: Math.round(totalPrice * 0.03) },
    { desc: "Labor & installation", qty: `${squares} sq`, unit: "square", price: Math.round(totalPrice * 0.25) },
    { desc: "Cleanup & haul-away", qty: "1 job", unit: "flat", price: Math.round(totalPrice * 0.04) },
  ];

  return (
    <div className="bg-white h-full flex flex-col px-8 py-6" style={{ fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200">
        <div>
          <h2 className="font-bold text-[oklch(0.13_0.03_162)] text-lg">Itemized Roofing Estimate</h2>
          <p className="text-slate-500 text-xs mt-0.5">Prepared by {co}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Roof: {sqft.toLocaleString()} sq ft · {squares} squares</p>
          <p className="text-xs text-slate-500">Pitch: {pitchLabel(pitch)}</p>
        </div>
      </div>

      {/* Line items */}
      <div className="flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs text-slate-400 font-medium pb-2">Description</th>
              <th className="text-right text-xs text-slate-400 font-medium pb-2">Qty</th>
              <th className="text-right text-xs text-slate-400 font-medium pb-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-2 text-slate-700 text-xs">{item.desc}</td>
                <td className="py-2 text-right text-slate-500 text-xs whitespace-nowrap">{item.qty}</td>
                <td className="py-2 text-right font-medium text-[oklch(0.13_0.03_162)] text-xs">${item.price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-4 border-t-2 border-[oklch(0.13_0.03_162)] pt-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium">${totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500">Letter discount (mention this mailer)</span>
          <span className="text-emerald-600 font-medium">-$150</span>
        </div>
        <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-slate-200">
          <span className="text-[oklch(0.13_0.03_162)]">Your Total Estimate</span>
          <span className="text-[oklch(0.62_0.17_162)]">${(totalPrice - 150).toLocaleString()}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">* Final price confirmed after in-person inspection. Financing available — ask about 0% for 12 months.</p>
      </div>
    </div>
  );
}

// ─── Page 4: Why Choose Us ────────────────────────────────────────────────────
function WhyUsPage({ props }: { props: QMailPreviewProps }) {
  const { companyName, licenseNumber } = props;
  const co = companyName || "Peak Performance Roofing";

  const comparisons = [
    { feature: "Local, licensed contractor", us: true, them: false },
    { feature: "Satellite-measured estimate", us: true, them: false },
    { feature: "Itemized pricing (no surprises)", us: true, them: false },
    { feature: "30-year manufacturer warranty", us: true, them: false },
    { feature: "0% financing available", us: true, them: false },
    { feature: "Same-week scheduling", us: true, them: false },
    { feature: "Post-job cleanup included", us: true, them: false },
  ];

  const certifications = [
    { icon: Shield, label: "Fully Licensed & Insured", sub: licenseNumber ? `#${licenseNumber}` : "State Licensed" },
    { icon: Award, label: "GAF Certified Installer", sub: "Master Elite Contractor" },
    { icon: Star, label: "5-Star Rated", sub: "200+ Google Reviews" },
    { icon: Building2, label: "10+ Years Local", sub: "Serving Your Area" },
  ];

  return (
    <div className="bg-white h-full flex flex-col px-8 py-6" style={{ fontFamily: "Georgia, serif" }}>
      <h2 className="font-bold text-[oklch(0.13_0.03_162)] text-lg mb-1">Why Choose {co}?</h2>
      <p className="text-slate-500 text-xs mb-5">We are not a national chain. We are your neighbors.</p>

      {/* Comparison table */}
      <div className="flex-1">
        <table className="w-full text-sm mb-5">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left text-xs text-slate-400 font-medium pb-2">What matters to you</th>
              <th className="text-center text-xs font-bold text-[oklch(0.62_0.17_162)] pb-2 w-20">{co.split(" ")[0]}</th>
              <th className="text-center text-xs text-slate-400 font-medium pb-2 w-20">Others</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-1.5 text-slate-700 text-xs">{row.feature}</td>
                <td className="py-1.5 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                </td>
                <td className="py-1.5 text-center">
                  <X className="w-4 h-4 text-slate-300 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Certifications */}
        <div className="grid grid-cols-2 gap-3">
          {certifications.map((cert, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-slate-50 rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.95_0.04_162)] flex items-center justify-center flex-shrink-0">
                <cert.icon className="w-4 h-4 text-[oklch(0.62_0.17_162)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[oklch(0.13_0.03_162)] leading-tight">{cert.label}</p>
                <p className="text-xs text-slate-400">{cert.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page 5: Referral & Upsell ────────────────────────────────────────────────
function ReferralPage({ props }: { props: QMailPreviewProps }) {
  const { companyName, phone, website } = props;
  const co = companyName || "Peak Performance Roofing";

  return (
    <div className="bg-white h-full flex flex-col px-8 py-6" style={{ fontFamily: "Georgia, serif" }}>
      {/* Referral offer */}
      <div className="bg-[oklch(0.13_0.03_162)] rounded-2xl p-6 mb-5 text-center">
        <Gift className="w-8 h-8 text-[oklch(0.78_0.10_162)] mx-auto mb-3" />
        <h3 className="font-bold text-white text-lg mb-1">Refer a Neighbor, Earn $250</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Know a neighbor who needs a new roof? Refer them to us. When they sign a contract, we send you a $250 check — no strings attached.
        </p>
        <div className="mt-4 bg-white/10 rounded-xl px-4 py-2">
          <p className="text-[oklch(0.78_0.10_162)] text-sm font-medium">Call or text to refer: {phone || "(555) 867-5309"}</p>
        </div>
      </div>

      {/* Upsell services */}
      <div className="mb-5">
        <h4 className="font-semibold text-[oklch(0.13_0.03_162)] text-sm mb-3">While we're on your roof, ask about:</h4>
        <div className="space-y-2">
          {[
            { service: "Gutter replacement & guards", discount: "10% off when bundled" },
            { service: "Attic insulation & ventilation", discount: "Free inspection" },
            { service: "Siding repair or replacement", discount: "Ask for quote" },
            { service: "Skylight installation", discount: "Free estimate" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-700">{item.service}</span>
              <span className="text-xs text-[oklch(0.62_0.17_162)] font-medium">{item.discount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[oklch(0.95_0.04_162)] rounded-xl p-4 text-center">
        <p className="font-bold text-[oklch(0.13_0.03_162)] text-base mb-1">Ready to get started?</p>
        <p className="text-[oklch(0.62_0.17_162)] font-bold text-lg">{phone || "(555) 867-5309"}</p>
        {website && <p className="text-slate-400 text-xs mt-1">{website}</p>}
        <p className="text-slate-500 text-xs mt-2">Free inspection · No obligation · Same-week scheduling</p>
        <p className="text-slate-400 text-xs mt-1 font-medium">{co} · Licensed & Insured</p>
      </div>
    </div>
  );
}

// ─── Page Navigator ───────────────────────────────────────────────────────────
const PAGES = [
  { label: "Cover", component: CoverPage },
  { label: "Letter", component: LetterPage },
  { label: "Estimate", component: EstimatePage },
  { label: "Why Us", component: WhyUsPage },
  { label: "Referral", component: ReferralPage },
];

// ─── Main Preview Modal ───────────────────────────────────────────────────────
export function QMailPreview(props: QMailPreviewProps) {
  const [page, setPage] = useState(0);
  const PageComponent = PAGES[page].component;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden" style={{ height: "90vh" }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-[oklch(0.13_0.03_162)] text-lg">Prime Mail Packet Preview</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              This is what {props.totalAddresses} homeowner{props.totalAddresses !== 1 ? "s" : ""} will receive in the mail
            </p>
          </div>
          <button
            onClick={props.onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Page tabs — left sidebar */}
          <div className="w-36 border-r border-slate-100 flex flex-col py-4 px-3 gap-1 flex-shrink-0 bg-slate-50/50">
            {PAGES.map((p, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                  page === i
                    ? "bg-[oklch(0.62_0.17_162)] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  page === i ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                }`}>{i + 1}</span>
                <span className="text-xs font-medium">{p.label}</span>
              </button>
            ))}

            <div className="mt-auto pt-4 border-t border-slate-200">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Batch total</p>
                <p className="font-mono font-bold text-sm text-[oklch(0.13_0.03_162)]">${props.totalQMailCost.toFixed(2)}</p>
                <p className="text-xs text-slate-400">{props.totalAddresses} pieces</p>
              </div>
            </div>
          </div>

          {/* Page preview — main area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page content */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-auto" style={{ maxWidth: 640, minHeight: 480 }}>
                <PageComponent props={props} />
              </div>
            </div>

            {/* Page navigation */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white flex-shrink-0">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1.5">
                {PAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-150 ${
                      page === i ? "bg-[oklch(0.62_0.17_162)] w-4" : "bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>

              {page < PAGES.length - 1 ? (
                <button
                  onClick={() => setPage(p => Math.min(PAGES.length - 1, p + 1))}
                  className="flex items-center gap-1.5 text-sm text-[oklch(0.62_0.17_162)] hover:text-[oklch(0.45_0.15_162)] font-medium transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-20" />
              )}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="text-sm text-slate-500">
            <span className="font-medium text-[oklch(0.13_0.03_162)]">{props.totalAddresses} packets</span> × $3.50 each =&nbsp;
            <span className="font-mono font-bold text-[oklch(0.13_0.03_162)]">${props.totalQMailCost.toFixed(2)}</span>
            <span className="text-slate-400"> total</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={props.onClose} size="sm">
              Edit List
            </Button>
            <Button
              onClick={props.onConfirm}
              disabled={props.confirming}
              size="sm"
              className="bg-[oklch(0.62_0.17_162)] hover:bg-[oklch(0.45_0.15_162)] text-white font-semibold px-6"
            >
              {props.confirming ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Submitting...</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" />Confirm & Order Batch</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
