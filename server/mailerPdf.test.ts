/**
 * mailerPdf.test.ts
 * Unit tests for the dynamic mailer PDF generator.
 */

import { describe, it, expect } from "vitest";
import { generateMailerPdf, CompanyData, CustomerData } from "./mailerPdf";

const sampleCompany: CompanyData = {
  companyName: "Peak Performance Roofing",
  phone: "(479) 555-1234",
  website: "www.peakperformanceroofing.com",
  address: "5001 W Founders Way, Rogers AR 72758",
  licenseNumber: "#0414400422",
  logoUrl: null,
  tagline: "Class 4 Impact Resistant Specialists",
};

const sampleCustomer: CustomerData = {
  firstName: "John",
  lastName: "Test",
  streetAddress: "123 Easy St",
  city: "Nowhere",
  state: "IN",
  zip: "72764",
  estimatePrice: 17325,
  roofSqFt: 2640,
  pitch: "6/12",
  satelliteImageUrl: null,
};

describe("generateMailerPdf", () => {
  it("returns a non-empty Buffer", async () => {
    const buf = await generateMailerPdf(sampleCompany, sampleCustomer);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
  }, 30_000);

  it("PDF starts with the PDF magic bytes %PDF", async () => {
    const buf = await generateMailerPdf(sampleCompany, sampleCustomer);
    const header = buf.slice(0, 4).toString("ascii");
    expect(header).toBe("%PDF");
  }, 30_000);

  it("generates a PDF even when price is 0 and sqft is 0", async () => {
    const customer: CustomerData = {
      ...sampleCustomer,
      estimatePrice: 0,
      roofSqFt: 0,
      pitch: "",
    };
    const buf = await generateMailerPdf(sampleCompany, customer);
    expect(buf.length).toBeGreaterThan(1000);
  }, 30_000);

  it("generates a PDF with minimal company data", async () => {
    const company: CompanyData = {
      companyName: "My Roofing Co",
      phone: "",
      website: "",
      address: "",
      licenseNumber: "",
    };
    const buf = await generateMailerPdf(company, sampleCustomer);
    expect(buf.length).toBeGreaterThan(1000);
  }, 30_000);
});
