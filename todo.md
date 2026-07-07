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
- [x] Template Library — create, edit, preview, manage branded mailer templates per contractor
- [x] Google Solar API — auto-pull roof squares + pitch when pin is dropped on map
- [x] Connect template selection to order flow and QMailPreview

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

## Roof Segment Map Overlay (Jul 6)
- [x] Extend Solar API tRPC procedure to return full segment polygon data (boundingBox + center + pitchDegrees + areaMeters2)
- [x] Build RoofSegmentOverlay component: draws colored polygons on satellite map per segment
- [x] Color-code segments by pitch (flat=gray, 4/12=blue, 6/12=green, 8/12=orange, 10/12+=red)
- [x] Show pitch label and sq ft on hover/click per segment
- [x] Wire overlay to appear after a successful Solar measurement on any address pin
- [x] Add toggle button to show/hide the overlay

## Mobile Map Redesign — Drive & Mark (Jul 6)
- [x] Full-screen satellite map on mobile (100dvh, map fills entire screen)
- [x] GPS Follow Me mode — locks map to current location, auto-pans as you drive
- [x] Large floating GPS button (bottom-right) to toggle follow mode
- [x] Tap-to-pin: single tap on map drops pin + auto-measures roof
- [x] Floating bottom drawer for address list (slides up/down, doesn't block map)
- [x] Thumb-friendly controls: large buttons, bottom-anchored toolbar
- [x] Speed/heading indicator when GPS follow is active
- [x] Desktop layout preserved (side panel stays on wide screens)

## Template Library Feature (Jul 6)
- [x] Extend QMailPreview props to accept template copy fields (coverHeadline, letterBody, offerHeadline, warrantyYears, referralBonus, etc.)
- [x] Render template-specific copy in all 5 pages of QMailPreview
- [x] Extend CompanyData in mailerPdf.ts to include template copy fields
- [x] Update all 5 page generators in mailerPdf.ts to use template copy when provided
- [x] Extend mailerRoute.ts to fetch default template and merge into CompanyData for PDF generation
- [x] Add template selector to AppPage order flow (uses default template automatically)
- [x] Wire selected template into QMailPreview in AppPage
- [x] Add logo upload button in TemplateLibrary editor (uses same /api/profile/logo endpoint)
- [x] Link Template Library from Dashboard quick actions and Settings nav
- [x] Mark todo items: Template Library, Google Solar API, Connect template to order flow
- [x] Write vitest tests for template CRUD procedures (13 tests, all passing)
