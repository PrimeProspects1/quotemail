# QuoteMail TODO

## Marketing Site
- [x] Full homepage: Nav, Hero, Stats bar, How It Works, Q Mail Anatomy, Features, Pricing, CTA, Footer
- [x] Hero images generated and stored in Manus CDN
- [x] Responsive design with Space Grotesk + Inter + JetBrains Mono fonts
- [x] Electric blue + deep navy brand palette

## Full-Stack Upgrade
- [x] MySQL schema with 6 tables: users, contractor_profiles, pitch_rates, campaigns, addresses, estimates
- [x] tRPC routers: auth, profile, pitchRates, campaigns, addresses, dashboard
- [x] Drizzle ORM + TiDB database integration
- [x] Manus OAuth authentication

## Contractor App (AppPage.tsx)
- [x] Satellite map with pin-drop (saves to DB)
- [x] Address search input (saves to DB)
- [x] CSV bulk import (saves to DB)
- [x] Auto roof measurement from satellite (saves to DB)
- [x] Pitch-based pricing calculator (updates DB)
- [x] Delete address from list (removes from DB)
- [x] Batch order modal with campaign creation
- [x] Auth gate — redirects to login if not authenticated
- [x] Pricing rates modal (local state, per-session)
- [x] Q Mail packet PDF preview modal (5-page interactive preview before ordering)

## Dashboard (Dashboard.tsx)
- [x] KPI stats (total campaigns, addresses, response rate, revenue)
- [x] Campaign history table
- [x] Response feed
- [x] Quick action cards: Storm Data, Fulfillment, Settings
- [x] Nav links: Storm Data, Fulfillment, Settings

## Settings (Settings.tsx)
- [x] Company profile form
- [x] Pitch rate configuration via tRPC mutations

## Storm Data (StormData.tsx)
- [x] NOAA NWS active alerts by state
- [x] Filter by event type (hail, wind, tornado, etc.)
- [x] Import affected area addresses to new campaign
- [x] Alert detail modal with affected zones

## Onboarding Wizard (Onboarding.tsx)
- [x] Step 1: Company profile setup
- [x] Step 2: Pitch rate configuration
- [x] Step 3: Launch options (map, CSV, storm data)
- [x] Route: /onboarding

## Fulfillment (Fulfillment.tsx)
- [x] Overview tab: timeline, packet specs, pricing callout
- [x] My Batches tab: ordered/printing/delivered campaigns
- [x] Vendor tab: The Addressers details, integration status
- [x] Route: /fulfillment

## Bug Fixes
- [x] Google Maps duplicate-load bug fixed (singleton promise in Map.tsx)
- [x] dotenv ERR_MODULE_NOT_FOUND resolved (pnpm install)
- [x] Settings.tsx Vite import error resolved (server restart)
- [x] AppPage rewritten to wire all interactions to real tRPC backend

## Tests
- [x] 4 vitest tests passing (campaigns + dashboard procedures)

## Remaining
- [x] Stripe payments — charge $3.50/piece at batch approval (Stripe Checkout, webhook, payment success/cancel redirect)

## New Features (Jun 22)
- [ ] Template Library — create, edit, preview, manage branded mailer templates per contractor
- [ ] Google Solar API — auto-pull roof squares + pitch when pin is dropped on map
- [ ] Connect template selection to order flow and QMailPreview

## Dynamic PDF Mailer Generator (Jun 30)
- [x] 5-page PDF mailer replicating Ridgecap GC template layout
- [x] Auto-fill company name, phone, website, address, license number from contractor profile
- [x] Auto-fill customer name, address, estimate price, roof sq/ft, pitch from address record
- [x] Custom QR code generated per-mailer pointing to company website
- [x] Express routes: GET /api/mailer/preview/:addressId (inline) and /api/mailer/download/:addressId (attachment)
- [x] Eye (preview) and Download buttons added to each measured address row in AppPage
- [x] Vitest tests: 4 tests covering PDF generation, magic bytes, edge cases

## Google Solar API Integration (Jul 6)
- [x] Replace fake estimateSqft() with real Google Solar API calls via trpc.solar.getRoofMeasurements
- [x] measureWithSolar() helper: calls Solar API, falls back to seeded estimate if no data
- [x] Pin drop: uses real Solar sq ft + pitch instead of random estimate
- [x] Address search: uses real Solar sq ft + pitch instead of random estimate
- [x] Measure button (single): uses real Solar sq ft + pitch, shows "Google Solar" in toast
- [x] Measure All: uses real Solar for each address, reports Solar vs estimated count in toast
- [x] TypeScript compiles cleanly with no errors
