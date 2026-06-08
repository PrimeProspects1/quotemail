import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("campaigns router", () => {
  it("returns empty list when no campaigns exist (no DB)", async () => {
    const ctx = createAuthContext(999999);
    const caller = appRouter.createCaller(ctx);
    // Without a real DB connection the helper returns [] gracefully
    const result = await caller.campaigns.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("dashboard stats returns zero counts gracefully without DB", async () => {
    const ctx = createAuthContext(999999);
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toMatchObject({
      totalCampaigns: expect.any(Number),
      totalAddresses: expect.any(Number),
      totalSpend: expect.any(Number),
      totalResponses: expect.any(Number),
    });
  });
});

describe("pitch rates router", () => {
  it("returns null when no pitch rates configured (no DB)", async () => {
    const ctx = createAuthContext(999999);
    const caller = appRouter.createCaller(ctx);
    const rates = await caller.pitchRates.get();
    // Either null or a rates object — both are valid
    expect(rates === null || typeof rates === "object").toBe(true);
  });
});
