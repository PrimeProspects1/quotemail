/**
 * templates.test.ts
 * Unit tests for the mailer templates tRPC router.
 * Tests use in-memory mocks — no real database required.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock db helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getMailerTemplates: vi.fn(),
    getMailerTemplateById: vi.fn(),
    getDefaultMailerTemplate: vi.fn(),
    createMailerTemplate: vi.fn(),
    updateMailerTemplate: vi.fn(),
    deleteMailerTemplate: vi.fn(),
    setDefaultMailerTemplate: vi.fn(),
    // Keep other helpers as-is (they're not called in these tests)
    getContractorProfile: vi.fn().mockResolvedValue(null),
    upsertContractorProfile: vi.fn(),
    getPitchRates: vi.fn().mockResolvedValue(null),
    upsertPitchRates: vi.fn(),
    getCampaigns: vi.fn().mockResolvedValue([]),
    getCampaignById: vi.fn().mockResolvedValue(null),
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    recalcCampaignTotals: vi.fn(),
    getAddressesByCampaign: vi.fn().mockResolvedValue([]),
    getAddressById: vi.fn().mockResolvedValue(null),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
    createResponseEvent: vi.fn(),
    getDashboardStats: vi.fn().mockResolvedValue({ totalCampaigns: 0, totalAddresses: 0, totalSpend: 0, totalResponses: 0 }),
    getUserByOpenId: vi.fn().mockResolvedValue(null),
    upsertUser: vi.fn(),
  };
});

import {
  getMailerTemplates,
  getMailerTemplateById,
  getDefaultMailerTemplate,
  createMailerTemplate,
  updateMailerTemplate,
  deleteMailerTemplate,
  setDefaultMailerTemplate,
} from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "test-open-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const SAMPLE_TEMPLATE = {
  id: 1,
  userId: 42,
  name: "Storm Season 2025",
  isDefault: false,
  companyName: "Peak Roofing",
  tagline: "Quality Since 2005",
  logoUrl: null,
  logoKey: null,
  primaryColor: "#0EA875",
  phone: "(555) 123-4567",
  licenseNumber: "ROC-999",
  website: "www.peakroofing.com",
  coverHeadline: "Your Free Roof Estimate",
  coverSubheadline: "Prepared just for you",
  letterOpening: "Dear Homeowner,",
  letterBody: "We noticed your roof may need attention.",
  letterClosing: "We look forward to hearing from you.",
  signatureName: "John Smith",
  signatureTitle: "Owner",
  signatureImageUrl: null,
  offerHeadline: "Free Inspection",
  offerDetails: "No obligation.",
  ctaText: "Call Today",
  warrantyYears: 10,
  warrantyDetails: "Lifetime workmanship warranty.",
  referralBonus: "$250",
  referralDetails: "Refer a neighbor, earn $250.",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("templates.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all templates for the authenticated user", async () => {
    vi.mocked(getMailerTemplates).mockResolvedValue([SAMPLE_TEMPLATE]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.list();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Storm Season 2025");
    expect(getMailerTemplates).toHaveBeenCalledWith(42);
  });
});

describe("templates.get", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a template by id", async () => {
    vi.mocked(getMailerTemplateById).mockResolvedValue(SAMPLE_TEMPLATE);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.get({ id: 1 });
    expect(result?.name).toBe("Storm Season 2025");
    expect(getMailerTemplateById).toHaveBeenCalledWith(1, 42);
  });

  it("returns null when template does not exist", async () => {
    vi.mocked(getMailerTemplateById).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.get({ id: 999 });
    expect(result).toBeNull();
  });
});

describe("templates.getDefault", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the default template", async () => {
    vi.mocked(getDefaultMailerTemplate).mockResolvedValue({ ...SAMPLE_TEMPLATE, isDefault: true });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.getDefault();
    expect(result?.isDefault).toBe(true);
    expect(getDefaultMailerTemplate).toHaveBeenCalledWith(42);
  });

  it("returns null when no default template is set", async () => {
    vi.mocked(getDefaultMailerTemplate).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.getDefault();
    expect(result).toBeNull();
  });
});

describe("templates.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a template and returns its id", async () => {
    vi.mocked(createMailerTemplate).mockResolvedValue({ id: 7 });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.create({
      name: "New Template",
      companyName: "Peak Roofing",
      primaryColor: "#0EA875",
    });
    expect(result).toEqual({ success: true, id: 7 });
    expect(createMailerTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42, name: "New Template" })
    );
  });

  it("sets the template as default when isDefault is true", async () => {
    vi.mocked(createMailerTemplate).mockResolvedValue({ id: 8 });
    const caller = appRouter.createCaller(makeCtx());
    await caller.templates.create({ name: "Default Template", isDefault: true });
    expect(setDefaultMailerTemplate).toHaveBeenCalledWith(8, 42);
  });

  it("does not call setDefault when isDefault is false", async () => {
    vi.mocked(createMailerTemplate).mockResolvedValue({ id: 9 });
    const caller = appRouter.createCaller(makeCtx());
    await caller.templates.create({ name: "Non-Default Template", isDefault: false });
    expect(setDefaultMailerTemplate).not.toHaveBeenCalled();
  });

  it("rejects a template with an empty name", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.templates.create({ name: "" })
    ).rejects.toThrow();
  });
});

describe("templates.update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a template's fields", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.update({
      id: 1,
      name: "Updated Name",
      phone: "(555) 999-0000",
    });
    expect(result).toEqual({ success: true });
    expect(updateMailerTemplate).toHaveBeenCalledWith(
      1,
      42,
      expect.objectContaining({ name: "Updated Name", phone: "(555) 999-0000" })
    );
  });

  it("calls setDefault when isDefault is set to true on update", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await caller.templates.update({ id: 1, name: "My Template", isDefault: true });
    expect(setDefaultMailerTemplate).toHaveBeenCalledWith(1, 42);
  });
});

describe("templates.delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a template by id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.delete({ id: 1 });
    expect(result).toEqual({ success: true });
    expect(deleteMailerTemplate).toHaveBeenCalledWith(1, 42);
  });
});

describe("templates.setDefault", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets a template as the default", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.templates.setDefault({ id: 3 });
    expect(result).toEqual({ success: true });
    expect(setDefaultMailerTemplate).toHaveBeenCalledWith(3, 42);
  });
});
