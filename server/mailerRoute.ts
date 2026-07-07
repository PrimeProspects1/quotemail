/**
 * mailerRoute.ts
 * Express route: GET /api/mailer/preview/:addressId
 * Generates and streams a personalized 5-page roofing mailer PDF for the given address.
 * Requires a valid session cookie (same auth as tRPC).
 */

import { Router, Request, Response } from "express";
import { getContractorProfile, getAddressById, getDefaultMailerTemplate } from "./db";
import { generateMailerPdf, CompanyData, CustomerData } from "./mailerPdf";
import { sdk } from "./_core/sdk";

export function registerMailerRoute(app: Router) {
  // GET /api/mailer/preview/:addressId
  app.get("/api/mailer/preview/:addressId", async (req: Request, res: Response) => {
    try {
      // ── Auth ────────────────────────────────────────────────────────────────
      let user;
      try { user = await sdk.authenticateRequest(req); } catch { user = null; }
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const addressId = parseInt(req.params.addressId, 10);
      if (isNaN(addressId)) {
        res.status(400).json({ error: "Invalid address ID" });
        return;
      }

      // ── Fetch data ──────────────────────────────────────────────────────────
      const [profile, address, defaultTemplate] = await Promise.all([
        getContractorProfile(user.id),
        getAddressById(addressId, user.id),
        getDefaultMailerTemplate(user.id),
      ]);

      if (!address) {
        res.status(404).json({ error: "Address not found" });
        return;
      }

      // ── Build company data (template overrides profile where set) ───────────
      const t = defaultTemplate;
      const company: CompanyData = {
        companyName:   t?.companyName   || profile?.companyName   || user.name || "Your Roofing Company",
        phone:         t?.phone         || profile?.phone         || "(000) 000-0000",
        website:       t?.website       || profile?.website       || "www.yourroofingcompany.com",
        address:       `${t?.companyName || profile?.companyName || "Your Company"} — Licensed & Insured`,
        licenseNumber: t?.licenseNumber || profile?.licenseNumber || "#000000",
        logoUrl:       t?.logoUrl       || profile?.logoUrl,
        tagline:       t?.tagline       || profile?.tagline,
        // Template copy fields
        primaryColor:      t?.primaryColor,
        coverHeadline:     t?.coverHeadline,
        coverSubheadline:  t?.coverSubheadline,
        letterOpening:     t?.letterOpening,
        letterBody:        t?.letterBody,
        letterClosing:     t?.letterClosing,
        signatureName:     t?.signatureName,
        signatureTitle:    t?.signatureTitle,
        offerHeadline:     t?.offerHeadline,
        offerDetails:      t?.offerDetails,
        ctaText:           t?.ctaText,
        warrantyYears:     t?.warrantyYears ?? undefined,
        warrantyDetails:   t?.warrantyDetails,
        referralBonus:     t?.referralBonus,
        referralDetails:   t?.referralDetails,
      };

      // ── Build customer data ─────────────────────────────────────────────────
      // Parse name from fullAddress or use generic
      const nameParts = (address.fullAddress || "").split(",")[0].trim().split(" ");
      const firstName = nameParts[0] || "Homeowner";
      const lastName  = nameParts.slice(1).join(" ") || "";

      const customer: CustomerData = {
        firstName,
        lastName,
        streetAddress: address.street || address.fullAddress || "",
        city:          address.city   || "",
        state:         address.state  || "",
        zip:           address.zip    || "",
        estimatePrice: parseFloat(address.estimatePrice || "0") || 0,
        roofSqFt:      parseFloat(address.measuredSqFt  || "0") || 0,
        pitch:         address.pitch  || "",
        satelliteImageUrl: address.satelliteImageUrl,
      };

      // ── Generate PDF ────────────────────────────────────────────────────────
      const pdfBuffer = await generateMailerPdf(company, customer);

      const safeName = `${customer.firstName}_${customer.lastName}_Mailer`.replace(/[^a-zA-Z0-9_-]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${safeName}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("[Mailer PDF] Error:", err);
      res.status(500).json({ error: "Failed to generate mailer PDF" });
    }
  });

  // POST /api/mailer/download/:addressId — same but forces download
  app.get("/api/mailer/download/:addressId", async (req: Request, res: Response) => {
    try {
      let user;
      try { user = await sdk.authenticateRequest(req); } catch { user = null; }
      if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

      const addressId = parseInt(req.params.addressId, 10);
      if (isNaN(addressId)) { res.status(400).json({ error: "Invalid address ID" }); return; }

      const [profile, address, defaultTemplate2] = await Promise.all([
        getContractorProfile(user.id),
        getAddressById(addressId, user.id),
        getDefaultMailerTemplate(user.id),
      ]);

      if (!address) { res.status(404).json({ error: "Address not found" }); return; }

      const t2 = defaultTemplate2;
      const company: CompanyData = {
        companyName:   t2?.companyName   || profile?.companyName   || user.name || "Your Roofing Company",
        phone:         t2?.phone         || profile?.phone         || "(000) 000-0000",
        website:       t2?.website       || profile?.website       || "www.yourroofingcompany.com",
        address:       `${t2?.companyName || profile?.companyName || "Your Company"} — Licensed & Insured`,
        licenseNumber: t2?.licenseNumber || profile?.licenseNumber || "#000000",
        logoUrl:       t2?.logoUrl       || profile?.logoUrl,
        tagline:       t2?.tagline       || profile?.tagline,
        primaryColor:      t2?.primaryColor,
        coverHeadline:     t2?.coverHeadline,
        coverSubheadline:  t2?.coverSubheadline,
        letterOpening:     t2?.letterOpening,
        letterBody:        t2?.letterBody,
        letterClosing:     t2?.letterClosing,
        signatureName:     t2?.signatureName,
        signatureTitle:    t2?.signatureTitle,
        offerHeadline:     t2?.offerHeadline,
        offerDetails:      t2?.offerDetails,
        ctaText:           t2?.ctaText,
        warrantyYears:     t2?.warrantyYears ?? undefined,
        warrantyDetails:   t2?.warrantyDetails,
        referralBonus:     t2?.referralBonus,
        referralDetails:   t2?.referralDetails,
      };

      const nameParts = (address.fullAddress || "").split(",")[0].trim().split(" ");
      const firstName = nameParts[0] || "Homeowner";
      const lastName  = nameParts.slice(1).join(" ") || "";

      const customer: CustomerData = {
        firstName,
        lastName,
        streetAddress: address.street || address.fullAddress || "",
        city:  address.city  || "",
        state: address.state || "",
        zip:   address.zip   || "",
        estimatePrice: parseFloat(address.estimatePrice || "0") || 0,
        roofSqFt:      parseFloat(address.measuredSqFt  || "0") || 0,
        pitch:         address.pitch || "",
        satelliteImageUrl: address.satelliteImageUrl,
      };

      const pdfBuffer = await generateMailerPdf(company, customer);
      const safeName = `${customer.firstName}_${customer.lastName}_Mailer`.replace(/[^a-zA-Z0-9_-]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("[Mailer PDF Download] Error:", err);
      res.status(500).json({ error: "Failed to generate mailer PDF" });
    }
  });
}
