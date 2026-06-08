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

## Dashboard (Dashboard.tsx)
- [x] KPI stats (total campaigns, addresses, response rate, revenue)
- [x] Campaign history table
- [x] Response feed

## Settings (Settings.tsx)
- [x] Company profile form
- [x] Pitch rate configuration via tRPC mutations

## Bug Fixes
- [x] Google Maps duplicate-load bug fixed (singleton promise in Map.tsx)
- [x] dotenv ERR_MODULE_NOT_FOUND resolved (pnpm install)
- [x] Settings.tsx Vite import error resolved (server restart)
- [x] AppPage rewritten to wire all interactions to real tRPC backend

## Tests
- [x] 4 vitest tests passing (campaigns + dashboard procedures)

## Upcoming Features
- [ ] Stripe payments — charge $3.50/piece at batch approval
- [ ] Q Mail packet PDF preview before ordering
- [ ] Storm data integration (NOAA hail/wind events)
- [ ] Contractor onboarding wizard (3-step setup)
- [ ] Fulfillment vendor API integration (The Addressers)
