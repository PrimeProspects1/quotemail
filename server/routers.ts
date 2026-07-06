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
  getMailerTemplates, getMailerTemplateById, getDefaultMailerTemplate,
  createMailerTemplate, updateMailerTemplate, deleteMailerTemplate, setDefaultMailerTemplate,
} from "./db";
import { makeRequest } from "./_core/map";
import { ENV } from "./_core/env";
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

// ─── Mailer Templates ──────────────────────────────────────────────────────
const templateInputSchema = z.object({
  name: z.string().min(1).max(255),
  isDefault: z.boolean().optional(),
  companyName: z.string().optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().optional(),
  logoKey: z.string().optional(),
  primaryColor: z.string().optional(),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  website: z.string().optional(),
  coverHeadline: z.string().optional(),
  coverSubheadline: z.string().optional(),
  letterOpening: z.string().optional(),
  letterBody: z.string().optional(),
  letterClosing: z.string().optional(),
  signatureName: z.string().optional(),
  signatureTitle: z.string().optional(),
  signatureImageUrl: z.string().optional(),
  offerHeadline: z.string().optional(),
  offerDetails: z.string().optional(),
  ctaText: z.string().optional(),
  warrantyYears: z.number().optional(),
  warrantyDetails: z.string().optional(),
  referralBonus: z.string().optional(),
  referralDetails: z.string().optional(),
});

const templatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getMailerTemplates(ctx.user.id)),
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => getMailerTemplateById(input.id, ctx.user.id)),
  getDefault: protectedProcedure.query(async ({ ctx }) => getDefaultMailerTemplate(ctx.user.id)),
  create: protectedProcedure
    .input(templateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await createMailerTemplate({ userId: ctx.user.id, ...input });
      if (input.isDefault) await setDefaultMailerTemplate(result.id, ctx.user.id);
      return { success: true, id: result.id };
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(templateInputSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateMailerTemplate(id, ctx.user.id, data);
      if (data.isDefault) await setDefaultMailerTemplate(id, ctx.user.id);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteMailerTemplate(input.id, ctx.user.id);
      return { success: true };
    }),
  setDefault: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await setDefaultMailerTemplate(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Google Solar API ────────────────────────────────────────────────────────
type SolarBuildingInsights = {
  name: string;
  center: { latitude: number; longitude: number };
  roofSegmentStats: Array<{
    pitchDegrees: number;
    azimuthDegrees: number;
    stats: { areaMeters2: number; sunshineQuantiles: number[] };
    center: { latitude: number; longitude: number };
    boundingBox: { sw: { latitude: number; longitude: number }; ne: { latitude: number; longitude: number } };
    planeHeightAtCenterMeters: number;
  }>;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    wholeRoofStats: { areaMeters2: number; sunshineQuantiles: number[] };
    roofSegmentStats: Array<{
      pitchDegrees: number;
      azimuthDegrees: number;
      stats: { areaMeters2: number; sunshineQuantiles: number[] };
    }>;
  };
};

const solarRouter = router({
  getRoofMeasurements: protectedProcedure
    .input(z.object({ lat: z.number(), lng: z.number() }))
    .query(async ({ input }) => {
      try {
        const apiKey = ENV.googleSolarApiKey;
        if (!apiKey) throw new Error("GOOGLE_SOLAR_API_KEY not configured");

        // Call Google Solar API directly (not via Manus proxy — Solar API is a separate product)
        // Correct base URL: https://solar.googleapis.com/v1/buildingInsights:findClosest
        const url = new URL("https://solar.googleapis.com/v1/buildingInsights:findClosest");
        url.searchParams.set("key", apiKey);
        url.searchParams.set("location.latitude", input.lat.toString());
        url.searchParams.set("location.longitude", input.lng.toString());
        url.searchParams.set("requiredQuality", "LOW");

        const res = await fetch(url.toString());
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Solar API error ${res.status}: ${errText}`);
        }
        const data = await res.json() as SolarBuildingInsights;

        // Sum all roof segment areas (m²) → convert to roofing squares (1 sq = 100 sq ft)
        // wholeRoofStats gives total roof area including pitch factor (actual surface area)
        const totalAreaM2 = (data.solarPotential?.wholeRoofStats?.areaMeters2) ??
          (data.roofSegmentStats ?? []).reduce((sum, seg) => sum + (seg.stats?.areaMeters2 ?? 0), 0);
        const measuredSqFt = Math.round(totalAreaM2 * 10.7639);
        const roofSquares = parseFloat((measuredSqFt / 100).toFixed(2));

        // Determine dominant pitch from the largest PITCHED segment (skip flat/near-flat < 5°
        // which are often garages, porches, or flat dormers, not the main roof)
        const segments = data.solarPotential?.roofSegmentStats ?? data.roofSegmentStats ?? [];
        const pitchedSegments = segments.filter(seg => (seg.pitchDegrees ?? 0) >= 5);
        const candidateSegments = pitchedSegments.length > 0 ? pitchedSegments : segments;
        const dominantSegment = candidateSegments.reduce(
          (max, seg) => (seg.stats?.areaMeters2 ?? 0) > (max.stats?.areaMeters2 ?? 0) ? seg : max,
          candidateSegments[0] ?? { pitchDegrees: 0, stats: { areaMeters2: 0 } }
        );
        const pitchDeg = dominantSegment?.pitchDegrees ?? 0;

        // Convert pitch degrees → standard roofing pitch notation
        // 4/12 ≈ 18.4°, 6/12 ≈ 26.6°, 8/12 ≈ 33.7°, 10/12 ≈ 39.8°
        let pitch: "flat" | "4/12" | "6/12" | "8/12" | "10/12+";
        if (pitchDeg < 5) pitch = "flat";
        else if (pitchDeg < 22) pitch = "4/12";
        else if (pitchDeg < 30) pitch = "6/12";
        else if (pitchDeg < 38) pitch = "8/12";
        else pitch = "10/12+";

        return {
          success: true,
          roofSquares,
          measuredSqFt,
          pitch,
          pitchDegrees: parseFloat(pitchDeg.toFixed(1)),
          totalAreaM2: parseFloat(totalAreaM2.toFixed(2)),
          segmentCount: segments.length,
        };
      } catch (err) {
        // Solar API may not have data for all addresses — return graceful fallback
        console.error("[Solar API]", err);
        return { success: false, error: String(err), roofSquares: null, measuredSqFt: null, pitch: null };
      }
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
  templates: templatesRouter,
  solar: solarRouter,
});

export type AppRouter = typeof appRouter;
