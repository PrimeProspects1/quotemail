/**
 * mailerPdf.ts
 * Generates a 5-page personalized roofing mailer PDF replicating the Ridgecap GC template.
 * All company branding and customer data are injected at generation time.
 */

import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { Readable } from "stream";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyData {
  companyName: string;
  phone: string;
  website: string;
  address: string;        // e.g. "5001 W Founders Way, Rogers AR 72758"
  licenseNumber: string;  // e.g. "#0414400422"
  logoUrl?: string | null;
  tagline?: string | null;
}

export interface CustomerData {
  firstName: string;      // "John"
  lastName: string;       // "Test"
  streetAddress: string;  // "123 Easy St"
  city: string;
  state: string;
  zip: string;
  estimatePrice: number;  // 17325
  roofSqFt: number;       // 2640
  pitch: string;          // "6/12"
  satelliteImageUrl?: string | null;
}

// ─── Color palette (matches Ridgecap navy/white style) ────────────────────────
const NAVY   = "#1B3A6B";
const NAVY2  = "#243F7A";
const BLUE   = "#2563EB";
const WHITE  = "#FFFFFF";
const GRAY   = "#F5F6FA";
const DARK   = "#1A1A2E";
const TEXT   = "#1F2937";
const MUTED  = "#6B7280";

// Letter size in points
const W = 612;
const H = 792;
const M = 36; // margin

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hex(doc: PDFKit.PDFDocument, color: string) {
  return color;
}

function fillRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function centeredText(doc: PDFKit.PDFDocument, text: string, y: number, opts?: PDFKit.Mixins.TextOptions) {
  doc.text(text, M, y, { width: W - M * 2, align: "center", ...opts });
}

function footer(doc: PDFKit.PDFDocument, company: CompanyData) {
  const fh = 36;
  const fy = H - fh;
  fillRect(doc, 0, fy, W, fh, NAVY);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9);
  doc.text(company.address, M, fy + 12, { width: (W - M * 2) / 2 });
  doc.text(`License Number ${company.licenseNumber}`, W / 2, fy + 12, {
    width: (W - M * 2) / 2,
    align: "right",
  });
}

async function generateQRBuffer(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    type: "png",
    width: 120,
    margin: 1,
    color: { dark: "#1B3A6B", light: "#FFFFFF" },
  });
}

// ─── Page 1: Cover ────────────────────────────────────────────────────────────

async function page1(doc: PDFKit.PDFDocument, company: CompanyData, customer: CustomerData) {
  // House photo (satellite or placeholder gradient)
  const photoH = 280;
  if (customer.satelliteImageUrl) {
    try {
      const res = await fetch(customer.satelliteImageUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        doc.image(buf, 0, 0, { width: W, height: photoH, cover: [W, photoH] });
      } else {
        fillRect(doc, 0, 0, W, photoH, "#2D4A7A");
      }
    } catch {
      fillRect(doc, 0, 0, W, photoH, "#2D4A7A");
    }
  } else {
    // Gradient-style placeholder
    fillRect(doc, 0, 0, W, photoH, "#2D4A7A");
    fillRect(doc, 0, photoH - 60, W, 60, "#1B3A6B");
  }

  // Dark overlay on bottom of photo for text readability
  doc.save()
    .rect(0, photoH - 80, W, 80)
    .fillOpacity(0.55)
    .fill(DARK)
    .restore();

  // ── Content section below photo ──────────────────────────────────────────
  const contentY = photoH;
  const contentH = H - photoH - 36; // 36 = footer height

  fillRect(doc, 0, contentY, W, contentH, WHITE);

  // Left: headline + customer info
  const leftW = 320;
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(28);
  doc.text("Your Custom", M, contentY + 16, { width: leftW });
  doc.text("Roofing Estimate", M, contentY + 50, { width: leftW });

  doc.fillColor(MUTED).font("Helvetica").fontSize(10);
  doc.text("Prepared Exclusively for:", M, contentY + 90, { width: leftW });

  doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(13);
  doc.text(`${customer.firstName} ${customer.lastName}`, M, contentY + 104, { width: leftW });

  doc.font("Helvetica").fontSize(11).fillColor(TEXT);
  doc.text(customer.streetAddress, M, contentY + 120, { width: leftW });
  doc.text(`${customer.city}, ${customer.state} ${customer.zip}`, M, contentY + 134, { width: leftW });

  // Right: price box + QR code
  const rightX = 360;
  const rightW = W - rightX - M;

  // Price box
  fillRect(doc, rightX, contentY + 10, rightW, 90, GRAY);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10);
  doc.text("YOUR INVESTMENT", rightX + 8, contentY + 20, { width: rightW - 16 });
  doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(30);
  doc.text(`$${customer.estimatePrice.toLocaleString()}`, rightX + 8, contentY + 34, { width: rightW - 16 });
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9);
  doc.text("AS LOW AS $127/MO", rightX + 8, contentY + 72, { width: rightW - 16 });

  // QR code
  const qrBuf = await generateQRBuffer(company.website || `https://${company.companyName.toLowerCase().replace(/\s+/g, "")}.com`);
  doc.image(qrBuf, rightX + 8, contentY + 108, { width: 70, height: 70 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8);
  doc.text("Scan to watch us in\naction, you'll see just\nhow good we are!", rightX + 84, contentY + 118, { width: rightW - 90 });

  // ── Trust badges bar ─────────────────────────────────────────────────────
  const badgeY = contentY + 190;
  const badgeH = 40;
  fillRect(doc, 0, badgeY, W, badgeH, NAVY);

  const badges = [
    { icon: "✓", label: "Lifetime\nWarranties" },
    { icon: "📅", label: "1-2 day\ninstallations" },
    { icon: "★", label: "5 Star Rated\nLocal Company" },
  ];
  const bw = W / badges.length;
  badges.forEach((b, i) => {
    const bx = i * bw;
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(14);
    doc.text(b.icon, bx + 16, badgeY + 8, { width: 20 });
    doc.font("Helvetica-Bold").fontSize(8);
    doc.text(b.label, bx + 40, badgeY + 8, { width: bw - 56 });
    if (i < badges.length - 1) {
      doc.save().moveTo(bx + bw, badgeY + 6).lineTo(bx + bw, badgeY + badgeH - 6)
        .strokeColor("#FFFFFF").lineWidth(0.5).stroke().restore();
    }
  });

  // ── Measurement note ─────────────────────────────────────────────────────
  const noteY = badgeY + badgeH + 12;
  doc.fillColor(TEXT).font("Helvetica").fontSize(9);
  const sqFtStr = customer.roofSqFt > 0 ? customer.roofSqFt.toLocaleString() : "______";
  const pitchStr = customer.pitch || "______";
  doc.text(
    `WE MEASURED YOUR ROOF AT ${sqFtStr} SQ/FT   ROOF PITCH: ${pitchStr}`,
    M, noteY, { width: W - M * 2, align: "center" }
  );
  doc.fillColor(MUTED).font("Helvetica").fontSize(8);
  doc.text(
    "Note: The roof measurement provided is an estimate conducted using satellite imagery. While we strive for accuracy, we often over-measure the size of your roof. We aim to ensure you receive the best price possible, typically lower than the estimate above.",
    M, noteY + 14, { width: W - M * 2, align: "center" }
  );

  // ── Company logo + contact ────────────────────────────────────────────────
  const logoY = noteY + 56;
  // Company name as large text (logo placeholder)
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(20);
  centeredText(doc, company.companyName, logoY);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(22);
  centeredText(doc, company.phone, logoY + 26);
  doc.fillColor(NAVY).font("Helvetica").fontSize(12);
  centeredText(doc, company.website, logoY + 52);

  footer(doc, company);
}

// ─── Page 2: Personal Letter ──────────────────────────────────────────────────

function page2(doc: PDFKit.PDFDocument, company: CompanyData, customer: CustomerData) {
  // Header accent line
  fillRect(doc, 0, 0, W, 4, NAVY);

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(16);
  doc.text("Dear Homeowner,", M, 20, { width: W - M * 2 });

  doc.fillColor(TEXT).font("Helvetica").fontSize(11).lineGap(4);
  doc.text(
    `Most homeowners are getting fed up with door-knockers, pushy salespeople, and high prices when it comes to getting a new roof. We won't bother you by knocking on the door, instead, we skip the hassle and lead with our price.`,
    M, 52, { width: W - M * 2 }
  );

  // Why Did You Receive This Bid?
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(16);
  centeredText(doc, "Why Did You Receive This Bid?", 120);

  doc.fillColor(TEXT).font("Helvetica").fontSize(11).lineGap(4);
  doc.text(
    `We have taken the initiative to send a roofing estimate to you because your home meets the criteria for a roof replacement. We look for things like missing shingles, moss, algae, buckling, curling, granule loss, fiberglass exposure, and more.`,
    M, 148, { width: W - M * 2, align: "center" }
  );

  doc.moveDown(0.5);
  doc.text(
    `Many homeowners wait until leaks or visible damage occur before evaluating their roof. At ${company.companyName}, we believe homeowners should have the opportunity to understand their roof replacement options before problems arise.`,
    M, 220, { width: W - M * 2, align: "center" }
  );

  doc.moveDown(0.5);
  doc.text(
    `That's why we proactively provide pricing and education to homeowners in your area.`,
    M, 292, { width: W - M * 2, align: "center" }
  );

  doc.moveDown(0.5);
  doc.text(
    `So when the time comes—\nYou already know your options, your pricing, and who you can trust.`,
    M, 322, { width: W - M * 2, align: "center" }
  );

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12);
  doc.text(
    `No pressure. No obligation. Just helpful information to assist with one of your home's most important investments.`,
    M, 368, { width: W - M * 2, align: "center" }
  );

  // ── House photo / badge section ───────────────────────────────────────────
  const imgY = 410;
  const imgH = 200;
  fillRect(doc, 0, imgY, W, imgH, "#2D4A7A");

  // Badge overlays
  const badges2 = [
    { top: "20", label: "YEARS OF\nEXPERIENCE" },
    { top: "10 Year", label: "WARRANTY" },
    { top: "SATISFACTION", label: "GUARANTEED" },
    { top: "Designer", label: "Work" },
    { top: "LOCAL", label: "COMPANY" },
  ];
  const bw2 = W / badges2.length;
  badges2.forEach((b, i) => {
    const bx = i * bw2 + bw2 / 2 - 30;
    fillRect(doc, bx, imgY + 60, 60, 60, "rgba(255,255,255,0.15)");
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(10);
    doc.text(b.top, bx, imgY + 72, { width: 60, align: "center" });
    doc.font("Helvetica").fontSize(7);
    doc.text(b.label, bx, imgY + 90, { width: 60, align: "center" });
  });

  // Company name circle badge
  const cx = W / 2;
  const cy = imgY + imgH / 2;
  doc.save()
    .circle(cx, cy, 50)
    .fill(NAVY2)
    .restore();
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(10);
  doc.text(company.companyName.toUpperCase(), cx - 40, cy - 12, { width: 80, align: "center" });

  footer(doc, company);
}

// ─── Page 3: What's Included ──────────────────────────────────────────────────

function page3(doc: PDFKit.PDFDocument, company: CompanyData) {
  fillRect(doc, 0, 0, W, 40, NAVY);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18);
  doc.text(`What's Included In Every ${company.companyName} Roof Replacement`, M, 10, { width: W - M * 2 });

  doc.fillColor(TEXT).font("Helvetica").fontSize(11);
  centeredText(doc, `When you choose ${company.companyName}, you're choosing a contractor committed to professionalism, efficiency, and homeowner satisfaction.`, 56);

  const items = [
    { title: "Complete Tear-Off to Deck", desc: "Removal of all roofing materials and felt down to decking for proper inspection and installation." },
    { title: "Ice & Water Shield Protection", desc: "Installed in valleys and around penetrations for enhanced leak protection." },
    { title: "Premium Synthetic Underlayment", desc: "Superior moisture barrier compared to traditional felt paper." },
    { title: "Impact Resistant Shingles", desc: "Hail-resistant shingles that may qualify for homeowner insurance discounts." },
    { title: "True Starter Shingles", desc: "Proper manufacturer starter installed for improved wind resistance." },
    { title: "True Hip & Ridge Cap", desc: "Dedicated ridge cap shingles for better performance and appearance." },
    { title: "Full Brand-Matched Roofing System", desc: "All components manufacturer matched to qualify for highest warranty eligibility." },
    { title: "Ultimate Pipe Boots", desc: "Premium maintenance-free pipe boots for long-term durability." },
    { title: "Algae Resistant Shingles", desc: "Designed to resist streaking and retain granules where they belong—on your roof." },
    { title: "Magnetic Nail Sweep & Full Cleanup", desc: "We thoroughly sweep and clean your property so no roofing nails are left behind." },
  ];

  let y = 110;
  items.forEach((item) => {
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11);
    doc.text(item.title, M, y, { width: W - M * 2 });
    doc.fillColor(TEXT).font("Helvetica").fontSize(10);
    doc.text(item.desc, M, y + 14, { width: W - M * 2 });
    y += 46;
  });

  // Manufacturer logos section
  const logoBarY = y + 8;
  fillRect(doc, 0, logoBarY, W, 28, GRAY);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9);
  const brands = ["Malarkey", "Atlas", "TAMKO", "Owens Corning", "CertainTeed", "GAF Timberline HDZ RS"];
  const bw3 = (W - M * 2) / brands.length;
  brands.forEach((b, i) => {
    doc.text(b, M + i * bw3, logoBarY + 9, { width: bw3, align: "center" });
  });

  footer(doc, company);
}

// ─── Page 4: Storm Damage / Insurance ────────────────────────────────────────

function page4(doc: PDFKit.PDFDocument, company: CompanyData) {
  fillRect(doc, 0, 0, W, 40, NAVY);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18);
  doc.text("Think Your Roof May Have Storm Damage?", M, 10, { width: W - M * 2 });

  // Divider
  fillRect(doc, M, 48, W - M * 2, 2, NAVY);

  doc.fillColor(TEXT).font("Helvetica-Oblique").fontSize(11).lineGap(4);
  doc.text(
    "If you believe your home may have been affected by recent hail or wind storms, your roof could qualify for an insurance-funded replacement. For many homeowners, that means paying as little as their deductible—sometimes as low as $1,000 out of pocket—while their insurance covers the remaining eligible cost.",
    M, 60, { width: W - M * 2, align: "center" }
  );

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(15);
  centeredText(doc, "Here's How It Works", 148);

  const steps = [
    {
      num: "1.",
      title: "Free Measurement Review & Roof Inspection",
      body: `We'll verify your roof measurements and perform a professional inspection to look for qualifying hail or wind damage.`,
    },
    {
      num: "2.",
      title: "Damage Found?",
      body: `If qualifying storm damage is present and you'd like to file a claim, we'll guide you through the entire process—from documentation and meeting with your adjuster to reviewing the insurance estimate and completing your roof replacement.`,
    },
  ];

  let y = 176;
  steps.forEach((s) => {
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12);
    doc.text(`${s.num} ${s.title}`, M, y, { width: W - M * 2 });
    doc.fillColor(TEXT).font("Helvetica").fontSize(11).lineGap(3);
    doc.text(s.body, M, y + 18, { width: W - M * 2 });
    y += 80;
  });

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(15);
  centeredText(doc, "Already Been Denied?", y + 10);

  doc.fillColor(TEXT).font("Helvetica").fontSize(11).lineGap(3);
  doc.text(
    "A denied claim doesn't always mean the process is over. If your claim was denied, let us perform a second inspection. We've helped many homeowners obtain coverage after providing additional documentation and evidence for the insurance company to review. While approval can never be guaranteed, a second opinion may be worthwhile if you believe your roof has storm damage.",
    M, y + 34, { width: W - M * 2, align: "center" }
  );
  doc.text(
    `If you think your roof may have been damaged by hail or wind, ask us about a complimentary storm damage inspection.`,
    M, y + 120, { width: W - M * 2, align: "center" }
  );

  footer(doc, company);
}

// ─── Page 5: Why Choose Us + CTA ─────────────────────────────────────────────

async function page5(doc: PDFKit.PDFDocument, company: CompanyData) {
  fillRect(doc, 0, 0, W, 40, NAVY);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18);
  doc.text(`Why Homeowners Choose ${company.companyName}`, M, 10, { width: W - M * 2 });

  doc.fillColor(TEXT).font("Helvetica").fontSize(11);
  centeredText(doc, `When you choose ${company.companyName}, you're choosing a contractor committed to professionalism, efficiency, and homeowner satisfaction.`, 52);

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(14);
  centeredText(doc, `The ${company.companyName} Difference`, 90);

  const diffs = [
    { title: "1-Day Roof", desc: "Most residential roof replacements completed in just one day." },
    { title: "No Flat Tire Guarantee", desc: "We thoroughly magnet sweep and clean your property to help ensure no roofing nails are left behind." },
    { title: "1000's of Happy Customers", desc: `${company.companyName} has been in business for more than 10 years with thousands of quality jobs completed.` },
    { title: "10-Year Workmanship Warranty", desc: "Your installation is backed by our workmanship guarantee." },
    { title: "Complete Premium Roofing Systems", desc: "No shortcuts. No corner cutting. Premium materials every time." },
  ];

  let y = 116;
  diffs.forEach((d) => {
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11);
    centeredText(doc, d.title, y);
    doc.fillColor(TEXT).font("Helvetica").fontSize(10);
    centeredText(doc, d.desc, y + 14);
    y += 42;
  });

  // CTA section
  const ctaY = y + 10;
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(22);
  centeredText(doc, "Ready To Move Forward?", ctaY);

  doc.fillColor(TEXT).font("Helvetica").fontSize(11);
  centeredText(doc, "Schedule your final roof verification inspection today.", ctaY + 30);
  centeredText(doc, "Our inspector will verify your roof specifics, confirm measurements,", ctaY + 44);
  centeredText(doc, "and finalize your installation scope. You just pick the color!", ctaY + 58);

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11);
  centeredText(doc, "No Sales Meeting Required. No Pressure. No Obligation.", ctaY + 78);

  // QR + CALL section
  const qrY = ctaY + 104;
  const qrBuf = await generateQRBuffer(company.website || `https://${company.companyName.toLowerCase().replace(/\s+/g, "")}.com`);

  // Left: QR code
  doc.image(qrBuf, M, qrY, { width: 80, height: 80 });
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(24);
  doc.text("SCAN", M + 90, qrY + 4, { width: 100 });
  doc.fillColor(TEXT).font("Helvetica").fontSize(10);
  doc.text("to finish the last\ntwo steps before\nwe install your\nnew roof!", M + 90, qrY + 32, { width: 120 });

  // OR divider
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(14);
  doc.text("OR", W / 2 - 16, qrY + 28, { width: 40, align: "center" });

  // Right: phone number
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(24);
  doc.text("CALL", W / 2 + 20, qrY + 4, { width: 200 });
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(22);
  doc.text(company.phone, W / 2 + 20, qrY + 32, { width: 200 });
  doc.fillColor(TEXT).font("Helvetica").fontSize(9);
  doc.text("to finish the last two steps before\nwe install your new roof!", W / 2 + 20, qrY + 60, { width: 200 });

  footer(doc, company);
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export async function generateMailerPdf(
  company: CompanyData,
  customer: CustomerData
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 0, autoFirstPage: false });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Page 1
    doc.addPage();
    await page1(doc, company, customer);

    // Page 2
    doc.addPage();
    page2(doc, company, customer);

    // Page 3
    doc.addPage();
    page3(doc, company);

    // Page 4
    doc.addPage();
    page4(doc, company);

    // Page 5
    doc.addPage();
    await page5(doc, company);

    doc.end();
  });
}
