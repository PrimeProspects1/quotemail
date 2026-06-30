/**
 * mailerRoute.ts
 * Express route: GET /api/mailer/preview/:addressId
 * Generates and streams a personalized 5-page roofing mailer PDF for the given address.
 * Requires a valid session cookie (same auth as tRPC).
 */

import { Router, Request, Response } from "express";
import { getContractorProfile, getAddressById } from "./db";
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
      const [profile, address] = await Promise.all([
        getContractorProfile(user.id),
        getAddressById(addressId, user.id),
      ]);

      if (!address) {
        res.status(404).json({ error: "Address not found" });
        return;
      }

      // ── Build company data ──────────────────────────────────────────────────
      const company: CompanyData = {
        companyName: profile?.companyName || user.name || "Your Roofing Company",
        phone:        profile?.phone        || "(000) 000-0000",
        website:      profile?.website      || "www.yourroofingcompany.com",
        address:      `${profile?.companyName || "Your Company"} — Licensed & Insured`,
        licenseNumber: profile?.licenseNumber || "#000000",
        logoUrl:      profile?.logoUrl,
        tagline:      profile?.tagline,
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

      const [profile, address] = await Promise.all([
        getContractorProfile(user.id),
        getAddressById(addressId, user.id),
      ]);

      if (!address) { res.status(404).json({ error: "Address not found" }); return; }

      const company: CompanyData = {
        companyName:   profile?.companyName  || user.name || "Your Roofing Company",
        phone:         profile?.phone        || "(000) 000-0000",
        website:       profile?.website      || "www.yourroofingcompany.com",
        address:       `${profile?.companyName || "Your Company"} — Licensed & Insured`,
        licenseNumber: profile?.licenseNumber || "#000000",
        logoUrl:       profile?.logoUrl,
        tagline:       profile?.tagline,
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
