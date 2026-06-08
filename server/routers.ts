import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
});

export type AppRouter = typeof appRouter;
