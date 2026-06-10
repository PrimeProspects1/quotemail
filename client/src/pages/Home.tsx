/*
 * QuoteMail — Marketing Home Page
 * Design: Clean B2B SaaS, Space Grotesk display, deep navy + electric blue
 * Sections: Nav, Hero, Stats, How It Works, Q Mail Anatomy, Features, Pricing, CTA, Footer
 */

import { useState, useEffect, useRef } from "react";
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
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.55_0.22_264)] flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-[oklch(0.17_0.03_255)] text-lg tracking-tight">QuoteMail</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-slate-600 hover:text-[oklch(0.55_0.22_264)] transition-colors font-medium">How It Works</a>
          <a href="#qmail" className="text-sm text-slate-600 hover:text-[oklch(0.55_0.22_264)] transition-colors font-medium">Q Mail</a>
          <a href="#features" className="text-sm text-slate-600 hover:text-[oklch(0.55_0.22_264)] transition-colors font-medium">Features</a>
          <a href="#pricing" className="text-sm text-slate-600 hover:text-[oklch(0.55_0.22_264)] transition-colors font-medium">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="font-medium text-slate-700">Sign In</Button>
          </Link>
          <Link href="/app">
            <Button size="sm" className="bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white font-semibold px-5 shadow-sm">
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
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-60" />
      {/* Blue gradient blob */}
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-[oklch(0.55_0.22_264/0.06)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.55_0.22_264/0.04)] blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center py-20">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[oklch(0.96_0.04_264)] border border-[oklch(0.85_0.10_264)] rounded-full px-4 py-1.5 mb-8 animate-fade-up">
              <Zap className="w-3.5 h-3.5 text-[oklch(0.55_0.22_264)]" />
              <span className="text-xs font-semibold text-[oklch(0.45_0.18_264)] tracking-wide uppercase">Roofing's First Satellite-Measured Direct Mail</span>
            </div>

            <h1 className="font-display font-bold text-[oklch(0.17_0.03_255)] text-5xl lg:text-6xl leading-[1.08] tracking-tight mb-6 animate-fade-up animate-fade-up-delay-1">
              Mail Real Estimates.<br />
              <span className="text-[oklch(0.55_0.22_264)]">Get Real Calls.</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg animate-fade-up animate-fade-up-delay-2">
              Pin a neighborhood on the map, upload a CSV, or type an address — QuoteMail auto-measures the roof from satellite, calculates your price by pitch, and mails a personalized <strong className="text-[oklch(0.17_0.03_255)]">Q Mail</strong> estimate packet to every homeowner. Before they start shopping.
            </p>

            <div className="flex flex-wrap gap-3 mb-10 animate-fade-up animate-fade-up-delay-3">
              <Link href="/app">
                <Button size="lg" className="bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white font-semibold px-8 h-12 shadow-md shadow-blue-200">
                  Try It Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#qmail">
                <Button size="lg" variant="outline" className="font-semibold px-8 h-12 border-slate-200 text-slate-700 hover:bg-slate-50">
                  See a Q Mail Packet
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-6 animate-fade-up animate-fade-up-delay-4">
              <div className="flex -space-x-2">
                {["bg-blue-400","bg-indigo-400","bg-sky-400","bg-violet-400"].map((c,i) => (
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

          {/* Right image */}
          <div className="relative animate-fade-up animate-fade-up-delay-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200">
              <img src={HERO_PACKET} alt="Q Mail estimate packet" className="w-full object-cover" />
            </div>
            {/* Floating stat cards */}
            <div className="absolute -left-6 top-1/3 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 animate-fade-up animate-fade-up-delay-3">
              <p className="text-xs text-slate-500 font-medium mb-1">Avg. Response Rate</p>
              <p className="font-display font-bold text-2xl text-[oklch(0.55_0.22_264)]">8.4%</p>
              <p className="text-xs text-slate-400">vs 1.2% industry avg</p>
            </div>
            <div className="absolute -right-4 bottom-12 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 animate-fade-up animate-fade-up-delay-4">
              <p className="text-xs text-slate-500 font-medium mb-1">Avg. Job Value</p>
              <p className="font-display font-bold text-2xl text-[oklch(0.17_0.03_255)] font-mono-data">$14,200</p>
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
    { value: "2.1M+", label: "Q Mails Sent" },
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
              <p className="font-display font-bold text-2xl text-[oklch(0.17_0.03_255)] font-mono-data">{s.value}</p>
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
      desc: "Drop pins on the map, type addresses, or upload a CSV. QuoteMail instantly builds your target list from any input method.",
      color: "bg-blue-50 text-[oklch(0.55_0.22_264)]",
    },
    {
      icon: Ruler,
      step: "02",
      title: "Auto-Measure Every Roof",
      desc: "Satellite imagery measures each roof's footprint automatically. Enter the pitch and QuoteMail calculates exact square footage.",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: DollarSign,
      step: "03",
      title: "Set Your Pricing",
      desc: "Enter your rates per pitch tier once. The engine applies your pricing to every address — no manual math, no spreadsheets.",
      color: "bg-violet-50 text-violet-600",
    },
    {
      icon: Package,
      step: "04",
      title: "Q Mail Gets Printed & Mailed",
      desc: "Approve your batch. We print a 5-page personalized estimate packet with the homeowner's satellite roof photo and mail it that week.",
      color: "bg-sky-50 text-sky-600",
    },
    {
      icon: BarChart3,
      step: "05",
      title: "Track Responses in Dashboard",
      desc: "Monitor which addresses respond, scan QR codes, or call in. Your dashboard shows ROI per batch in real time.",
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-[oklch(0.85_0.10_264)] text-[oklch(0.45_0.18_264)] bg-[oklch(0.96_0.04_264)]">
            The Process
          </Badge>
          <h2 className="font-display font-bold text-4xl text-[oklch(0.17_0.03_255)] mb-4">
            From pin drop to homeowner's mailbox<br />in under 48 hours
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            QuoteMail handles every step between targeting a neighborhood and a homeowner holding your estimate.
          </p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center group">
                <div className={`w-20 h-20 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <s.icon className="w-9 h-9" />
                </div>
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2">
                  <span className="font-mono-data text-xs font-bold text-slate-300">{s.step}</span>
                </div>
                <h3 className="font-display font-semibold text-[oklch(0.17_0.03_255)] text-base mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* App mockup */}
        <div className="mt-20 rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-100">
          <img src={APP_MOCKUP} alt="QuoteMail app interface" className="w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

// ─── Q Mail Anatomy ───────────────────────────────────────────────────────────
function QMailSection() {
  const pages = [
    { num: "1", title: "Cover Page", desc: "Homeowner's satellite roof photo, your branding, the estimate price, and a QR code linking to a digital version." },
    { num: "2", title: "Personal Letter", desc: "A personalized letter addressed by name explaining why you're reaching out and what sets your company apart." },
    { num: "3", title: "Itemized Estimate", desc: "Full line-item breakdown: tear-off, underlayment, materials, labor, cleanup — with totals and financing options." },
    { num: "4", title: "Why Choose Us", desc: "A comparison table showing your company vs. generic competitors. Warranties, certifications, local trust signals." },
    { num: "5", title: "Referral & Upsell", desc: "A referral reward offer, cross-sell for gutters/siding, and your contact info for easy next-step action." },
  ];

  return (
    <section id="qmail" className="py-24 bg-[oklch(0.17_0.03_255)]">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Badge className="mb-6 bg-[oklch(0.55_0.22_264/0.2)] text-[oklch(0.75_0.14_264)] border-[oklch(0.55_0.22_264/0.3)] hover:bg-[oklch(0.55_0.22_264/0.2)]">
              What's Inside a Q Mail
            </Badge>
            <h2 className="font-display font-bold text-4xl text-white mb-4 leading-tight">
              Not a postcard.<br />
              <span className="text-[oklch(0.75_0.14_264)]">A 5-page proposal</span><br />
              they didn't ask for.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Every Q Mail packet is a fully personalized, satellite-measured roofing proposal — printed, stuffed, and mailed to the homeowner's door. It looks like you knocked and left a quote. Because you basically did.
            </p>

            <div className="space-y-4">
              {pages.map((p, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-8 h-8 rounded-lg bg-[oklch(0.55_0.22_264)] flex items-center justify-center flex-shrink-0 mt-0.5">
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
                <div className="w-10 h-10 rounded-lg bg-[oklch(0.55_0.22_264/0.3)] flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[oklch(0.75_0.14_264)]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">$3.50 per Q Mail — all-in</p>
                  <p className="text-slate-400 text-xs">Print, stuff, postage, and delivery. No hidden fees.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={SPREAD} alt="Q Mail 5-page packet spread" className="w-full object-cover" />
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
      desc: "Upload a CSV of addresses from storm data, permit records, or any list source. QuoteMail processes them all and queues them for measurement.",
    },
    {
      icon: Package,
      title: "Weekly Batch Fulfillment",
      desc: "Approve your batch by Thursday. We print, stuff, and drop your Q Mail packets at USPS that week. Homeowners receive them within 3–7 days.",
    },
    {
      icon: BarChart3,
      title: "Response Tracking Dashboard",
      desc: "Track QR code scans, call-ins, and conversions per batch. See cost per lead, ROI per neighborhood, and which pitches convert best.",
    },
    {
      icon: Building2,
      title: "Your Brand, Not Ours",
      desc: "Every Q Mail packet carries your company logo, colors, phone number, and license info. Homeowners call you — not QuoteMail.",
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
          <Badge variant="outline" className="mb-4 border-[oklch(0.85_0.10_264)] text-[oklch(0.45_0.18_264)] bg-[oklch(0.96_0.04_264)]">
            Platform Features
          </Badge>
          <h2 className="font-display font-bold text-4xl text-[oklch(0.17_0.03_255)] mb-4">
            Everything a roofing contractor needs<br />to run direct mail at scale
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Built specifically for roofing, storm restoration, and home improvement contractors who want to reach homeowners before the competition does.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 hover:border-[oklch(0.85_0.10_264)] hover:shadow-md transition-all duration-200 group">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.96_0.04_264)] flex items-center justify-center mb-4 group-hover:bg-[oklch(0.55_0.22_264)] transition-colors duration-200">
                <f.icon className="w-5 h-5 text-[oklch(0.55_0.22_264)] group-hover:text-white transition-colors duration-200" />
              </div>
              <h3 className="font-display font-semibold text-[oklch(0.17_0.03_255)] text-base mb-2">{f.title}</h3>
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
        "Up to 100 Q Mails/month",
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
        "Up to 500 Q Mails/month",
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
        "Unlimited Q Mails",
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
          <Badge variant="outline" className="mb-4 border-[oklch(0.85_0.10_264)] text-[oklch(0.45_0.18_264)] bg-[oklch(0.96_0.04_264)]">
            Simple Pricing
          </Badge>
          <h2 className="font-display font-bold text-4xl text-[oklch(0.17_0.03_255)] mb-4">
            Platform fee + $3.50 per Q Mail.<br />That's it.
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Every Q Mail is $3.50 all-in: print, stuff, postage, and delivery. Your platform plan covers the targeting, measurement, and dashboard tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <div key={i} className={`rounded-2xl p-8 border transition-all duration-200 ${p.highlight ? "bg-[oklch(0.17_0.03_255)] border-[oklch(0.17_0.03_255)] shadow-2xl shadow-slate-900/20 scale-105" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"}`}>
              <div className="mb-6">
                <p className={`font-display font-semibold text-sm mb-1 ${p.highlight ? "text-[oklch(0.75_0.14_264)]" : "text-[oklch(0.55_0.22_264)]"}`}>{p.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`font-display font-bold text-4xl ${p.highlight ? "text-white" : "text-[oklch(0.17_0.03_255)]"}`}>{p.price}</span>
                  <span className={`text-sm mb-1.5 ${p.highlight ? "text-slate-400" : "text-slate-500"}`}>{p.period}</span>
                </div>
                <p className={`text-sm ${p.highlight ? "text-slate-400" : "text-slate-500"}`}>{p.desc}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.highlight ? "text-[oklch(0.75_0.14_264)]" : "text-[oklch(0.55_0.22_264)]"}`} />
                    <span className={`text-sm ${p.highlight ? "text-slate-300" : "text-slate-600"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/app">
                <Button className={`w-full font-semibold ${p.highlight ? "bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.48_0.22_264)] text-white" : "bg-slate-100 hover:bg-slate-200 text-[oklch(0.17_0.03_255)]"}`}>
                  {p.cta}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          All plans include a 14-day free trial. No credit card required. Q Mail pieces are billed at $3.50 each when ordered.
        </p>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24 bg-[oklch(0.55_0.22_264)]">
      <div className="container text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white mb-6 leading-tight">
            Your competitors are knocking doors.<br />
            You're mailing estimates.
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Start your free trial today. Pin your first neighborhood, measure the roofs, and preview your Q Mail packet — no credit card needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/app">
              <Button size="lg" className="bg-white text-[oklch(0.55_0.22_264)] hover:bg-blue-50 font-bold px-10 h-14 text-base shadow-xl">
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
          <p className="text-blue-200 text-sm mt-6">14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[oklch(0.12_0.02_255)] py-16">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[oklch(0.55_0.22_264)] flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-white text-base">QuoteMail</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              The only direct mail platform built for roofing contractors. Satellite-measured. Pitch-priced. Delivered.
            </p>
          </div>
          {[
            { title: "Product", links: ["How It Works", "Q Mail Packets", "Pricing", "API Docs"] },
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
          <p className="text-slate-600 text-sm">© 2026 QuoteMail. All rights reserved.</p>
          <p className="text-slate-600 text-sm">Q Mail™ is a trademark of QuoteMail Inc.</p>
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
      <QMailSection />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
