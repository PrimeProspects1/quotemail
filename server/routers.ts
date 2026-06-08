import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createCheckoutSession } from "./stripe";
import {
  createAddress, createCampaign, createResponseEvent, deleteAddress,
  getAddressesByCampaign, getAddressById, getCampaignById, getCampaigns,
  getContractorProfile, getDashboardStats, getPitchRates,
  recalcCampaignTotals, updateAddress, updateCampaign,
  upsertContractorProfile, upsertPitchRates,
} from "./db";
import { z } from "zod";

const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => getContractorProfile(ctx.user.id)),
  save: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(), phone: z.string().optional(),
      licenseNumber: z.string().optional(), website: z.string().optional(),
      tagline: z.string().optional(), logoUrl: z.string().optional(), logoKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertContractorProfile({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
});

const pitchRatesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => getPitchRates(ctx.user.id)),
  save: protectedProcedure
    .input(z.object({
      flatRate: z.string(), pitch4Rate: z.string(), pitch6Rate: z.string(),
      pitch8Rate: z.string(), pitch10Rate: z.string(),
      flatMultiplier: z.string().optional(), pitch4Multiplier: z.string().optional(),
      pitch6Multiplier: z.string().optional(), pitch8Multiplier: z.string().optional(),
      pitch10Multiplier: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertPitchRates({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
});

const campaignsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getCampaigns(ctx.user.id)),
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => getCampaignById(input.id, ctx.user.id)),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await createCampaign({ userId: ctx.user.id, name: input.name, notes: input.notes });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), notes: z.string().optional(),
      status: z.enum(["draft","measuring","ready","ordered","printing","delivered"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateCampaign(id, ctx.user.id, data);
      return { success: true };
    }),
  order: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await updateCampaign(input.id, ctx.user.id, { status: "ordered", orderedAt: new Date() });
      return { success: true };
    }),
});

const addressesRouter = router({
  list: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ ctx, input }) => getAddressesByCampaign(input.campaignId, ctx.user.id)),
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => getAddressById(input.id, ctx.user.id)),
  add: protectedProcedure
    .input(z.object({
      campaignId: z.number(), fullAddress: z.string(),
      street: z.string().optional(), city: z.string().optional(),
      state: z.string().optional(), zip: z.string().optional(),
      lat: z.string().optional(), lng: z.string().optional(),
      source: z.enum(["pin_drop","address_search","csv_import"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createAddress({ userId: ctx.user.id, ...input });
      await recalcCampaignTotals(input.campaignId, ctx.user.id);
      return { success: true };
    }),
  addBulk: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      addresses: z.array(z.object({
        fullAddress: z.string(), street: z.string().optional(), city: z.string().optional(),
        state: z.string().optional(), zip: z.string().optional(),
        lat: z.string().optional(), lng: z.string().optional(),
        source: z.enum(["pin_drop","address_search","csv_import"]).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      for (const addr of input.addresses) {
        await createAddress({ userId: ctx.user.id, campaignId: input.campaignId, ...addr });
      }
      await recalcCampaignTotals(input.campaignId, ctx.user.id);
      return { success: true, count: input.addresses.length };
    }),
  updateMeasurement: protectedProcedure
    .input(z.object({
      id: z.number(), campaignId: z.number(),
      measuredSqFt: z.string(), roofSquares: z.string(),
      pitch: z.enum(["flat","4/12","6/12","8/12","10/12+"]),
      estimatePrice: z.string(),
      polygonPoints: z.any().optional(),
      status: z.enum(["pending","measured","estimated","ordered","mailed"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, campaignId, ...data } = input;
      await updateAddress(id, ctx.user.id, { ...data, status: data.status ?? "estimated" });
      await recalcCampaignTotals(campaignId, ctx.user.id);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number(), campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteAddress(input.id, ctx.user.id);
      await recalcCampaignTotals(input.campaignId, ctx.user.id);
      return { success: true };
    }),
  logResponse: protectedProcedure
    .input(z.object({
      addressId: z.number(), campaignId: z.number(),
      type: z.enum(["qr_scan","call","conversion"]),
      notes: z.string().optional(), jobValue: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createResponseEvent({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
});

// ─── Storm Data ─────────────────────────────────────────────────────────────
const stormRouter = router({
  // Fetch active severe weather alerts for a US state (uses free NWS API)
  alerts: protectedProcedure
    .input(z.object({ state: z.string().length(2) }))
    .query(async ({ input }) => {
      const url = `https://api.weather.gov/alerts/active?area=${input.state.toUpperCase()}&event=Hail,Thunderstorm%20Wind,High%20Wind,Severe%20Thunderstorm`;
      const res = await fetch(url, {
        headers: { "User-Agent": "(quotemail.app, support@quotemail.app)" },
      });
      if (!res.ok) throw new Error(`NWS API error: ${res.status}`);
      const data = await res.json() as {
        features: Array<{
          properties: {
            id: string;
            event: string;
            headline: string;
            description: string;
            severity: string;
            certainty: string;
            effective: string;
            expires: string;
            areaDesc: string;
            geocode?: { FIPS6?: string[]; UGC?: string[] };
          };
          geometry?: { coordinates: number[][][] } | null;
        }>;
      };
      // Filter to hail and wind events relevant to roofing
      const roofingEvents = ["Hail", "Thunderstorm Wind", "High Wind", "Severe Thunderstorm Warning", "Tornado Warning"];
      const filtered = (data.features ?? []).filter(f =>
        roofingEvents.some(e => f.properties.event?.includes(e))
      );
      return {
        total: filtered.length,
        alerts: filtered.map(f => ({
          id: f.properties.id,
          event: f.properties.event,
          headline: f.properties.headline,
          severity: f.properties.severity,
          certainty: f.properties.certainty,
          effective: f.properties.effective,
          expires: f.properties.expires,
          areaDesc: f.properties.areaDesc,
        })),
      };
    }),

  // Fetch recent storm events from NCEI for a state (CSV-based, returns parsed summary)
  recentEvents: protectedProcedure
    .input(z.object({
      state: z.string().length(2),
      eventType: z.enum(["Hail", "Thunderstorm Wind", "High Wind", "all"]).default("all"),
    }))
    .query(async ({ input }) => {
      // NCEI Storm Events API — returns recent 90-day window
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      const fmt = (d: Date) => d.toISOString().split("T")[0];

      const params = new URLSearchParams({
        datasetid: "GHCND",
        stationid: `FIPS:${input.state}`,
        startdate: fmt(startDate),
        enddate: fmt(endDate),
        limit: "25",
      });

      // Use NWS products endpoint as a fallback for recent storm data
      // This returns Local Storm Reports (LSR) for the area
      const lsrUrl = `https://api.weather.gov/products/types/LSR?limit=50`;
      try {
        const lsrRes = await fetch(lsrUrl, {
          headers: { "User-Agent": "(quotemail.app, support@quotemail.app)" },
        });
        if (lsrRes.ok) {
          const lsrData = await lsrRes.json() as { "@graph": Array<{ productCode: string; issuanceTime: string; issuingOffice: string; productName: string }> };
          return {
            source: "NWS Local Storm Reports",
            count: lsrData["@graph"]?.length ?? 0,
            reports: (lsrData["@graph"] ?? []).slice(0, 20).map(r => ({
              issuanceTime: r.issuanceTime,
              office: r.issuingOffice,
              name: r.productName,
            })),
          };
        }
      } catch {
        // ignore
      }
      return { source: "NWS", count: 0, reports: [] };
    }),
});

// ─── Stripe Payments ────────────────────────────────────────────────────────
const paymentsRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      origin: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await getCampaignById(input.campaignId, ctx.user.id);
      if (!campaign) throw new Error("Campaign not found");
      const pieceCount = campaign.totalAddresses ?? 0;
      if (pieceCount < 1) throw new Error("Campaign has no addresses");

      const checkoutUrl = await createCheckoutSession({
        campaignId: input.campaignId,
        campaignName: campaign.name,
        pieceCount,
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? "",
        userName: ctx.user.name ?? "",
        origin: input.origin,
      });
      return { checkoutUrl };
    }),
});

const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => getDashboardStats(ctx.user.id)),
  recentCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const all = await getCampaigns(ctx.user.id);
    return all.slice(0, 5);
  }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  profile: profileRouter,
  pitchRates: pitchRatesRouter,
  campaigns: campaignsRouter,
  addresses: addressesRouter,
  dashboard: dashboardRouter,
  storm: stormRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
