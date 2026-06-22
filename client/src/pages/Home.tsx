/*
 * PrimeMail — Marketing Home Page
 * Design: Clean white + PrimeProspects teal-green, Space Grotesk display
 * Sections: Nav, Hero, Stats, How It Works, Prime Mail Anatomy, Features, Pricing, CTA, Footer
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Upload, Ruler, DollarSign, Mail, BarChart3,
  CheckCircle2, ArrowRight, ChevronRight, Star, Zap,
  FileSpreadsheet, Building2, Package, TrendingUp, Shield, Clock
} from "lucide-react";

// ─── Image URLs ───────────────────────────────────────────────────────────────
const HERO_PACKET = "/manus-storage/hero-qmail-streetview_819a98f8.png";
const HERO_MAP = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387203986/5yjUuUPFrtM8izMyu4HkX3/hero-map-pins-GSnpw5MXhUqbYEcLUZd8nH.png";
const SPREAD = "/manus-storage/qmail-spread-streetview_cd4005ea.png";
const APP_MOCKUP = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387203986/5yjUuUPFrtM8izMyu4HkX3/contractor-app-mockup-Hig5fJ2dH7bhRh2tRs3raX.png";

// Brand color shorthands
const G = "oklch(0.62 0.17 162)";       // primary green
const GD = "oklch(0.45 0.15 162)";      // dark green (hover)
const GL = "oklch(0.95 0.04 162)";      // light green tint
const GM = "oklch(0.78 0.10 162)";      // mid green
const INK = "oklch(0.13 0.03 162)";     // near-black

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100" : "bg-transparent"}`}>
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ background: G }}>
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight" style={{ color: INK }}>PrimeMail</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["How It Works", "Prime Mail", "Features", "Pricing"].map((label, i) => (
            <a key={i} href={`#${["how-it-works","primemail","features","pricing"][i]}`}
              className="text-sm text-slate-600 font-medium transition-colors"
              style={{ "--hover-color": G } as React.CSSProperties}
              onMouseEnter={e => (e.currentTarget.style.color = G)}
              onMouseLeave={e => (e.currentTarget.style.color = "")}
            >{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="font-medium text-slate-700">Sign In</Button>
          </Link>
          <Link href="/app">
            <Button size="sm" className="text-white font-semibold px-5 shadow-sm" style={{ background: G }}>
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-white">
      <div className="absolute inset-0 dot-grid opacity-60" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ background: `${G.replace(")", "/0.06)")}` }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ background: `${G.replace(")", "/0.04)")}` }} />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 animate-fade-up border" style={{ background: GL, borderColor: GM }}>
              <Zap className="w-3.5 h-3.5" style={{ color: G }} />
              <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: GD }}>Roofing's First Satellite-Measured Direct Mail</span>
            </div>

            <h1 className="font-display font-bold text-5xl lg:text-6xl leading-[1.08] tracking-tight mb-6 animate-fade-up animate-fade-up-delay-1" style={{ color: INK }}>
              Mail Real Estimates.<br />
              <span style={{ color: G }}>Get Real Calls.</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg animate-fade-up animate-fade-up-delay-2">
              Pin a neighborhood on the map, upload a CSV, or type an address — PrimeMail auto-measures the roof from satellite, calculates your price by pitch, and mails a personalized <strong style={{ color: INK }}>Prime Mail</strong> estimate packet to every homeowner. Before they start shopping.
            </p>

            <div className="flex flex-wrap gap-3 mb-10 animate-fade-up animate-fade-up-delay-3">
              <Link href="/app">
                <Button size="lg" className="text-white font-semibold px-8 h-12 shadow-md" style={{ background: G }}>
                  Try It Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#primemail">
                <Button size="lg" variant="outline" className="font-semibold px-8 h-12 border-slate-200 text-slate-700 hover:bg-slate-50">
                  See a Prime Mail Packet
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-6 animate-fade-up animate-fade-up-delay-4">
              <div className="flex -space-x-2">
                {["bg-emerald-400","bg-teal-400","bg-green-400","bg-cyan-400"].map((c,i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                    {["JT","MR","AK","SL"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-slate-500 font-medium">Trusted by 400+ roofing contractors</p>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-up animate-fade-up-delay-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200">
              <img src={HERO_PACKET} alt="Prime Mail estimate packet" className="w-full object-cover" />
            </div>
            <div className="absolute -left-6 top-1/3 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 animate-fade-up animate-fade-up-delay-3">
              <p className="text-xs text-slate-500 font-medium mb-1">Avg. Response Rate</p>
              <p className="font-display font-bold text-2xl" style={{ color: G }}>8.4%</p>
              <p className="text-xs text-slate-400">vs 1.2% industry avg</p>
            </div>
            <div className="absolute -right-4 bottom-12 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 animate-fade-up animate-fade-up-delay-4">
              <p className="text-xs text-slate-500 font-medium mb-1">Avg. Job Value</p>
              <p className="font-display font-bold text-2xl font-mono-data" style={{ color: INK }}>$14,200</p>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <p className="text-xs text-emerald-600 font-medium">+23% vs cold calls</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: "400+", label: "Active Contractors" },
    { value: "2.1M+", label: "Prime Mails Sent" },
    { value: "$3.50", label: "Per Piece, All-In" },
    { value: "8.4%", label: "Avg Response Rate" },
    { value: "48hr", label: "From Pin to Mailbox" },
  ];
  return (
    <section className="border-y border-slate-100 bg-slate-50/50">
      <div className="container py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-display font-bold text-2xl font-mono-data" style={{ color: INK }}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: MapPin,
      step: "01",
      title: "Target Your Neighborhood",
      desc: "Drop pins on the map, type addresses, or upload a CSV. PrimeMail instantly builds your target list from any input method.",
      bg: GL, color: G,
    },
    {
      icon: Ruler,
      step: "02",
      title: "Auto-Measure Every Roof",
      desc: "Satellite imagery measures each roof's footprint automatically. Enter the pitch and PrimeMail calculates exact square footage.",
      bg: "oklch(0.95 0.03 162)", color: "oklch(0.55 0.15 162)",
    },
    {
      icon: DollarSign,
      step: "03",
      title: "Set Your Pricing",
      desc: "Enter your rates per pitch tier once. The engine applies your pricing to every address — no manual math, no spreadsheets.",
      bg: "oklch(0.95 0.04 162)", color: "oklch(0.50 0.16 162)",
    },
    {
      icon: Package,
      step: "04",
      title: "Prime Mail Gets Printed & Mailed",
      desc: "Approve your batch. We print a 5-page personalized estimate packet with the homeowner's front-facing house photo and mail it that week.",
      bg: "oklch(0.94 0.05 162)", color: "oklch(0.58 0.17 162)",
    },
    {
      icon: BarChart3,
      step: "05",
      title: "Track Responses in Dashboard",
      desc: "Monitor which addresses respond, scan QR codes, or call in. Your dashboard shows ROI per batch in real time.",
      bg: "oklch(0.93 0.06 162)", color: G,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4" style={{ borderColor: GM, color: GD, background: GL }}>
            The Process
          </Badge>
          <h2 className="font-display font-bold text-4xl mb-4" style={{ color: INK }}>
            From pin drop to homeowner's mailbox<br />in under 48 hours
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            PrimeMail handles every step between targeting a neighborhood and a homeowner holding your estimate.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-105 transition-transform duration-200" style={{ background: s.bg }}>
                  <s.icon className="w-9 h-9" style={{ color: s.color }} />
                </div>
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2">
                  <span className="font-mono-data text-xs font-bold text-slate-300">{s.step}</span>
                </div>
                <h3 className="font-display font-semibold text-base mb-2" style={{ color: INK }}>{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-100">
          <img src={APP_MOCKUP} alt="PrimeMail app interface" className="w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

// ─── Prime Mail Anatomy ───────────────────────────────────────────────────────
function PrimeMailSection() {
  const pages = [
    { num: "1", title: "Cover Page", desc: "Front-facing photo of their home, your branding, the estimate price, and a QR code linking to a digital version." },
    { num: "2", title: "Personal Letter", desc: "A personalized letter addressed by name explaining why you're reaching out and what sets your company apart." },
    { num: "3", title: "Itemized Estimate", desc: "Full line-item breakdown: tear-off, underlayment, materials, labor, cleanup — with totals and financing options." },
    { num: "4", title: "Why Choose Us", desc: "A comparison table showing your company vs. generic competitors. Warranties, certifications, local trust signals." },
    { num: "5", title: "Referral & Upsell", desc: "A referral reward offer, cross-sell for gutters/siding, and your contact info for easy next-step action." },
  ];

  return (
    <section id="primemail" className="py-24" style={{ background: INK }}>
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Badge className="mb-6" style={{ background: `${G.replace(")", "/0.2)")}`, color: GM, borderColor: `${G.replace(")", "/0.3)")}` }}>
              What's Inside a Prime Mail
            </Badge>
            <h2 className="font-display font-bold text-4xl text-white mb-4 leading-tight">
              Not a postcard.<br />
              <span style={{ color: GM }}>A 5-page proposal</span><br />
              they didn't ask for.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Every Prime Mail packet is a fully personalized, satellite-measured roofing proposal — printed, stuffed, and mailed to the homeowner's door. It looks like you knocked and left a quote. Because you basically did.
            </p>

            <div className="space-y-4">
              {pages.map((p, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: G }}>
                    <span className="font-mono-data text-xs font-bold text-white">{p.num}</span>
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-sm mb-0.5">{p.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${G.replace(")", "/0.3)")}` }}>
                  <DollarSign className="w-5 h-5" style={{ color: GM }} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">$3.50 per Prime Mail — all-in</p>
                  <p className="text-slate-400 text-xs">Print, stuff, postage, and delivery. No hidden fees.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={SPREAD} alt="Prime Mail 5-page packet spread" className="w-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: MapPin,
      title: "3-Way Address Input",
      desc: "Pin-drop on satellite map, type or search an address, or upload a CSV with hundreds of addresses at once. All three methods feed the same pipeline.",
    },
    {
      icon: Ruler,
      title: "Satellite Roof Measurement",
      desc: "Google Maps satellite imagery auto-measures each roof's footprint. You enter the pitch; the system calculates exact squares and applies your rate.",
    },
    {
      icon: DollarSign,
      title: "Pitch-Based Pricing Engine",
      desc: "Set your price per square for flat, 4/12, 6/12, 8/12, and 10/12+ pitches. Every estimate auto-calculates using your own numbers.",
    },
    {
      icon: FileSpreadsheet,
      title: "Bulk CSV Import",
      desc: "Upload a CSV of addresses from storm data, permit records, or any list source. PrimeMail processes them all and queues them for measurement.",
    },
    {
      icon: Package,
      title: "Weekly Batch Fulfillment",
      desc: "Approve your batch by Thursday. We print, stuff, and drop your Prime Mail packets at USPS that week. Homeowners receive them within 3–7 days.",
    },
    {
      icon: BarChart3,
      title: "Response Tracking Dashboard",
      desc: "Track QR code scans, call-ins, and conversions per batch. See cost per lead, ROI per neighborhood, and which pitches convert best.",
    },
    {
      icon: Building2,
      title: "Your Brand, Not Ours",
      desc: "Every Prime Mail packet carries your company logo, colors, phone number, and license info. Homeowners call you — not PrimeMail.",
    },
    {
      icon: Shield,
      title: "USPS Presort Postage",
      desc: "We use Marketing Mail presort rates ($0.43/piece) instead of retail stamps ($0.78). That savings is built into your $3.50 all-in price.",
    },
    {
      icon: Clock,
      title: "48-Hour Turnaround",
      desc: "From approved batch to USPS drop in 48 hours. Most contractors see homeowner responses within 5–10 days of submitting their list.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-50/50">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4" style={{ borderColor: GM, color: GD, background: GL }}>
            Platform Features
          </Badge>
          <h2 className="font-display font-bold text-4xl mb-4" style={{ color: INK }}>
            Everything a roofing contractor needs<br />to run direct mail at scale
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Built specifically for roofing, storm restoration, and home improvement contractors who want to reach homeowners before the competition does.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 hover:shadow-md transition-all duration-200 group"
              style={{ "--hover-border": GM } as React.CSSProperties}
              onMouseEnter={e => (e.currentTarget.style.borderColor = GM)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200 group-hover:bg-[oklch(0.62_0.17_162)]" style={{ background: GL }}>
                <f.icon className="w-5 h-5 transition-colors duration-200 group-hover:text-white" style={{ color: G }} />
              </div>
              <h3 className="font-display font-semibold text-base mb-2" style={{ color: INK }}>{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      desc: "For contractors testing the waters with direct mail.",
      features: [
        "Up to 100 Prime Mails/month",
        "Map pin-drop targeting",
        "Address search input",
        "Satellite measurement",
        "Basic pitch pricing",
        "Email support",
      ],
      cta: "Start Free Trial",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$149",
      period: "/month",
      desc: "For active contractors running weekly campaigns.",
      features: [
        "Up to 500 Prime Mails/month",
        "CSV bulk import",
        "All 3 input methods",
        "Advanced pitch pricing",
        "Response tracking dashboard",
        "QR code tracking",
        "Priority support",
        "Custom branding",
      ],
      cta: "Start Free Trial",
      highlight: true,
    },
    {
      name: "Scale",
      price: "$349",
      period: "/month",
      desc: "For multi-crew operations and storm chasers.",
      features: [
        "Unlimited Prime Mails",
        "Multi-location targeting",
        "Team member accounts",
        "White-label packets",
        "API access",
        "Dedicated account manager",
        "Custom packet design",
        "Weekly batch analytics",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4" style={{ borderColor: GM, color: GD, background: GL }}>
            Simple Pricing
          </Badge>
          <h2 className="font-display font-bold text-4xl mb-4" style={{ color: INK }}>
            Platform fee + $3.50 per Prime Mail.<br />That's it.
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Every Prime Mail is $3.50 all-in: print, stuff, postage, and delivery. Your platform plan covers the targeting, measurement, and dashboard tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <div key={i} className={`rounded-2xl p-8 border transition-all duration-200 ${p.highlight ? "shadow-2xl scale-105" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
              style={p.highlight ? { background: INK, borderColor: INK } : {}}
            >
              <div className="mb-6">
                <p className="font-display font-semibold text-sm mb-1" style={{ color: p.highlight ? GM : G }}>{p.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="font-display font-bold text-4xl" style={{ color: p.highlight ? "white" : INK }}>{p.price}</span>
                  <span className={`text-sm mb-1.5 ${p.highlight ? "text-slate-400" : "text-slate-500"}`}>{p.period}</span>
                </div>
                <p className={`text-sm ${p.highlight ? "text-slate-400" : "text-slate-500"}`}>{p.desc}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: p.highlight ? GM : G }} />
                    <span className={`text-sm ${p.highlight ? "text-slate-300" : "text-slate-600"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/app">
                <Button className="w-full font-semibold"
                  style={p.highlight
                    ? { background: G, color: "white" }
                    : { background: "oklch(0.95 0.01 162)", color: INK }
                  }
                >
                  {p.cta}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          All plans include a 14-day free trial. No credit card required. Prime Mail pieces are billed at $3.50 each when ordered.
        </p>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24" style={{ background: G }}>
      <div className="container text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white mb-6 leading-tight">
            Your competitors are knocking doors.<br />
            You're mailing estimates.
          </h2>
          <p className="text-xl mb-10 leading-relaxed" style={{ color: "oklch(0.92 0.06 162)" }}>
            Start your free trial today. Pin your first neighborhood, measure the roofs, and preview your Prime Mail packet — no credit card needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/app">
              <Button size="lg" className="font-bold px-10 h-14 text-base shadow-xl" style={{ background: "white", color: G }}>
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-10 h-14 text-base">
                Watch How It Works
              </Button>
            </a>
          </div>
          <p className="text-sm mt-6" style={{ color: "oklch(0.88 0.07 162)" }}>14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-16" style={{ background: "oklch(0.10 0.02 162)" }}>
      <div className="container">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: G }}>
                <Mail className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-white text-base">PrimeMail</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              The only direct mail platform built for roofing contractors. Satellite-measured. Pitch-priced. Delivered.
            </p>
          </div>
          {[
            { title: "Product", links: ["How It Works", "Prime Mail Packets", "Pricing", "API Docs"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
            { title: "Support", links: ["Help Center", "Contact", "Status", "Privacy Policy"] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-display font-semibold text-white text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l, j) => (
                  <li key={j}>
                    <a href="#" className="text-slate-500 text-sm hover:text-slate-300 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">© 2026 PrimeMail. All rights reserved.</p>
          <p className="text-slate-600 text-sm">Prime Mail™ is a trademark of PrimeMail Inc.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <PrimeMailSection />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
