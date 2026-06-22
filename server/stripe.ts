/*
 * PrimeMail Stripe Integration
 * - createCheckoutSession: creates a Stripe Checkout session for a campaign batch
 * - registerStripeWebhook: registers the /api/stripe/webhook Express route
 *
 * Pricing: $3.50 per Prime Mail piece (350 cents)
 */

import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import express from "express";
import { ENV } from "./_core/env";
import { updateCampaign } from "./db";

const PRICE_PER_PIECE_CENTS = 350; // $3.50

function getStripe(): Stripe {
  if (!ENV.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });
}

// ─── Create Checkout Session ─────────────────────────────────────────────────
export async function createCheckoutSession({
  campaignId,
  campaignName,
  pieceCount,
  userId,
  userEmail,
  userName,
  origin,
}: {
  campaignId: number;
  campaignName: string;
  pieceCount: number;
  userId: number;
  userEmail: string;
  userName: string;
  origin: string;
}): Promise<string> {
  const stripe = getStripe();
  const totalCents = pieceCount * PRICE_PER_PIECE_CENTS;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: userEmail,
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      campaign_id: campaignId.toString(),
      campaign_name: campaignName,
      piece_count: pieceCount.toString(),
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: PRICE_PER_PIECE_CENTS,
          product_data: {
            name: `Prime Mail — ${campaignName}`,
            description: `${pieceCount} personalized Prime Mail packets · satellite-measured · print + postage included`,
          },
        },
        quantity: pieceCount,
      },
    ],
    success_url: `${origin}/app/${campaignId}?payment=success`,
    cancel_url: `${origin}/app/${campaignId}?payment=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────
export function registerStripeWebhook(app: Express) {
  // MUST use express.raw BEFORE express.json for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];

      // Handle test events from Stripe CLI / dashboard
      let event: Stripe.Event;
      try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(
          req.body as Buffer,
          sig as string,
          ENV.stripeWebhookSecret
        );
      } catch (err) {
        console.error("[Webhook] Signature verification failed:", err);
        return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      }

      // ⚠️ Required: test events must return verified:true
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] ${event.type} — ${event.id}`);

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const campaignId = session.metadata?.campaign_id;
          const userId = session.metadata?.user_id;

          if (campaignId && userId) {
            // Mark campaign as ordered and store Stripe session ID
            await updateCampaign(parseInt(campaignId), parseInt(userId), {
              status: "ordered",
              orderedAt: new Date(),
              stripeSessionId: session.id,
            });
            console.log(`[Webhook] Campaign ${campaignId} marked as ordered (session: ${session.id})`);
          }
        }
      } catch (err) {
        console.error("[Webhook] Handler error:", err);
        return res.status(500).json({ error: "Webhook handler failed" });
      }

      res.json({ received: true });
    }
  );
}
