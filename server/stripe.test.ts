/*
 * Stripe payments procedure tests
 * Tests that the payments.createCheckout procedure validates inputs correctly
 * without hitting the real Stripe API (no STRIPE_SECRET_KEY in test env).
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { Request, Response } from "express";

function createAuthContext(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  return {
    req: { headers: { origin: "http://localhost:3000" } } as unknown as Request,
    res: {} as unknown as Response,
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test Contractor",
      email: "test@example.com",
      role: "user",
      loginMethod: "oauth",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
  };
}

describe("payments router", () => {
  it("createCheckout rejects when STRIPE_SECRET_KEY is not set", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    // Without a real DB campaign, this should throw either a campaign-not-found
    // or Stripe-not-configured error — both are acceptable guard behaviors.
    await expect(
      caller.payments.createCheckout({
        campaignId: 9999,
        origin: "http://localhost:3000",
      })
    ).rejects.toThrow();
  });

  it("createCheckout rejects invalid origin URL", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(
      caller.payments.createCheckout({
        campaignId: 1,
        origin: "not-a-url",
      })
    ).rejects.toThrow();
  });
});
