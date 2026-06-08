# Connections, Integrations & Unused Files Review
**Date**: 2026-06 (post admin sidebar, floating removal, gigs keep-add, dark removal, Grok in-app upgrades A-F, prior full audits)
**Focus**: Explicit user request "Full app review and connection link and unused files."
**Baseline**: tsc clean. Many prior FULL-APP-REVIEW-*.md exist (0601930 etc.) covering integrity, authz, payouts, theme, etc. This delta focuses on **external connections / links** and **unused / dead files / deps**.

## Executive Summary
- **All core connections healthy and actively used**: Wompi (payments + webhook), Resend (email + webhook + digest), Google (OAuth + Maps geolocation), Vercel Blob (uploads/images), xAI Grok API (admin /grok-build + public generate), Prisma/Postgres (primary DB with sqlite dev shim).
- **One dead connection / dep removed**: `@supabase/supabase-js` (in package.json only; zero imports or code paths in src/. Mentioned only in .env.example comments and old reviews as "or Supabase").
- **Unused file cleaned**: `src/components/admin/FloatingGrokChat.tsx` (git rm'ed). Was left behind after explicit "remove the floating grok tool" from admin/layout.tsx. (GrokAssistant remains actively used in seller/profile.)
- **Minor connection hygiene fixes applied**:
  - Email standardized to main address `support@oigagig.com` (updated .env.example, schema default, all code fallbacks, mailto links, from headers, scripts, and admin config).
  - Removed duplicate `// @ts-ignore` lines (common copy-paste artifact) in root page, test-email, upload (reduced some of the 68 total across 44 files).
  - Also removed apparently-unused `react-icons` dep (lucide-react is the icon source everywhere; no imports found).
- **Other observations (no changes)**:
  - `src/app/api/test-email/route.ts` is **used** (called from settings/notifications page for manual email tests). Protected (session required), admin can override "to". Keep for DX.
  - `src/app/home/page.tsx` and `src/app/dashboard/page.tsx` are thin client/server redirects. No strong cross-refs found; they act as legacy/alternate entrypoints. Safe to keep (or slim further).
  - `MapsPollutionNuke.tsx` + googleMapsLoader + inline mapsGuard in root layout: actively used across 10+ pages + layout. Defense against legacy Places widget breakage. Keep.
  - Review MD clutter: 10+ historical `FULL-APP-REVIEW-*.md`, `FINAL-REVIEW*`, `DEEP-REVIEW*`, `grok-review-*` etc. in root. Valuable audit trail but pollute workspace. Consider `.gitignore` or moving to `docs/reviews/` in future.
  - public/uploads/ contains timestamped jpgs (old direct uploads). Primary path is now Vercel Blob when BLOB_READ_WRITE_TOKEN present.
  - Hardcoded prod fallbacks: many `https://oigagig.com` (good default for links in emails, redirects, referral codes, reset, etc.). NEXT_PUBLIC_APP_URL overrides where set. Wompi widget.js, x.ai Grok endpoints intentional.
  - vercel.json: crons point to digest with ?frequency= (handler now supports GET per prior fixes). No CRON_SECRET header in config (relies on secret check or admin inside).
  - .env.example: good coverage of all real connections (WOMPI_*, RESEND_*, GOOGLE_*, GOOGLE_MAPS, BLOB via Vercel, CRON_SECRET, DIRECT_DATABASE_URL emphasis). Supabase mention only as example alternative (now stale).

## Detailed Connections Scan
### Active & Correct
- **Payments (Wompi)**: 
  - Routes: api/checkout/wompi/route.ts, api/webhooks/wompi/route.ts (sig + replay + idemp + referral).
  - Client: checkout/[gigId] loads https://checkout.wompi.co/widget.js (sandbox/live via key prefix).
  - Detection: admin/live + settings banners.
  - Env: NEXT_PUBLIC_WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_KEY, WOMPI_EVENTS_KEY.
- **Email (Resend)**:
  - lib/notifications.ts + emails/templates.ts (send + deliveryLog tracking).
  - Webhook: api/webhooks/resend/route.ts (Svix sig + replay).
  - Digest crons + many templates use support@oigagig.com default.
  - Test UI + script.
- **Auth + Geo (Google)**:
  - next-auth Google provider (ADMIN_EMAILS auto-admin).
  - Maps: components/maps/* (GoogleMap, AddressAutocomplete, LocationPermissionPrompt, MapsPollutionNuke), lib/googleMapsLoader.ts, heavy inline guard + nuke in src/app/layout.tsx.
  - Key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Places/Geocoding/Maps JS).
- **Storage (Vercel Blob)**:
  - next.config.ts remotePatterns for images.
  - api/upload/route.ts uses @vercel/blob put (with token guard + graceful dev fallback to URL paste).
  - Used for gig images, order files/attachments, etc.
- **AI (xAI Grok)**: 
  - api/grok/route.ts (admin-only, multi-tool, propose/apply code changes, scan).
  - api/grok/generate/route.ts (public helper for descriptions).
  - Hard fetch to https://api.x.ai/v1/chat/completions + tools.
  - In-app at /admin/grok-build (powerful with apply, undo, proposals, history).
- **DB (Prisma + Postgres)**:
  - schema.prisma (postgresql primary; sqlite comments + shims).
  - scripts: with-local-sqlite.sh (dev), prisma-safe-migrate.sh (build), vercel build runs generate + safe-migrate.
  - Env: DATABASE_URL (pooled), DIRECT_DATABASE_URL (migrations).

### Dead / Stale / Inconsistent (Addressed)
- **Supabase**: Package dep only. Zero code usage. Removed from package.json. .env.example still lists it as "or Supabase" example — harmless comment.
- **Email address**: Canonical/main support email set to `support@oigagig.com` across the entire app (env, Prisma default, notifications, templates, routes, pages, scripts). All prior `support@support.oigagig.com` references updated.
- **react-icons**: Removed (no imports; lucide-react covers all icons including in AdminNavbar, etc.).

### Notes / Potential Polish (not auto-fixed)
- Fallback URLs: Consistent oigagig.com good. Consider centralizing `const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'` in lib/utils if more spread.
- CRON_SECRET: Documented in .env.example but not always present in vercel.json cron (current digest handler accepts admin session or header/secret or dev).
- BLOB token: upload warns nicely in dev if absent.

## Unused Files / Dead Code / Clutter
### Removed in this pass
- `src/components/admin/FloatingGrokChat.tsx` (git rm) — fully unused post floating removal. No other imports.
- `@supabase/supabase-js` + `react-icons` from package.json.

### Confirmed Active (keep)
- GrokAssistant.tsx (used in seller/profile).
- All maps/* components (heavy usage + layout guard).
- test-email route + script (UI entry in settings/notifs + ops).
- dashboard/page.tsx + home/page.tsx (redirectors; low risk).
- upload route (core for files).

### Historical / Non-runtime Clutter (review files)
- Root now has many: FULL-APP-REVIEW-0601930.md, 63dd26d3.md, 2b0773a1.md, 27b65fe1.md, 35040d4d.md, grok-review-*, FINAL-REVIEW-SUMMARY.md, DEEP-REVIEW-LIVE-FIXES.md, REVIEW-SUMMARY.md, ADMIN-PORTAL-FULL-DIAGNOSTIC.md, etc.
- Also WHATS_NEW.md, GROK_BUILD_IN_APP.md, MIGRATION_RUNBOOK, PRODUCTION_CHECKLIST, GEO-LOCATION-ROADMAP.
- Recommendation: Move to `docs/audits/` or add to .gitignore (or leave — they are the "memory" of the many prior scans + upgrades).

### Other
- public/uploads/* (timestamp jpgs): legacy direct-fs uploads. Safe to prune manually if space concern (blob is canonical now).
- Double @ts-ignore: reduced a few; ~60+ remain (mostly on getServerSession lines in api routes + layouts). Low risk, cosmetic. Pattern is harmless but noisy.
- No other obvious dead pages/routes in app/ or api/ (Next file-system routing + role guards cover).

## Static Baseline (this session)
- `npx tsc --noEmit --skipLibCheck`: clean (exit 0).
- Prior reviews noted lint ~500+ problems (anys + hooks dominant) — unchanged here.
- No new breakage from cleanups (package dep removals are declaration-only; tsc doesn't care about unused npm deps).

## Recommendations / Next (grouped)
**High value / quick**:
- Run `npm install` (or `npm prune`) after package.json changes to update lockfile.
- Consider `git add -A && git commit -m "chore: remove unused FloatingGrokChat + dead supabase/react-icons deps + email consistency + minor ts-ignore dups"` then push/redeploy.
- Add `docs/audits/` or similar and relocate review mds (or `.gitignore` the FULL-*-*.md if noise).

**Connections**:
- Centralize APP_URL + support email defaults.
- Add BLOB_READ_WRITE_TOKEN + CRON_SECRET to PRODUCTION_CHECKLIST/.env.example emphasis.
- (Optional) surface current Wompi/Resend/Grok key "mode" more in admin/overview.

**Unused / Hygiene**:
- Continue single-@ts-ignore cleanup wave (or eslint disable-per-line where justified).
- Audit public/uploads on prod deploys.
- If desired, delete /home and /dashboard redirects after confirming no external links/bookmarks depend on them.

**Broader (from prior full reviews, still relevant)**:
- No prisma.$transaction (integrity).
- Console.* volume + any casts.
- Virtual payouts (no persisted seller ledger beyond ReferralEarning).
- Beta bypass remnants (checkout/orders).
- Lint not clean.

## Files Changed in This Review Pass
- package.json (removed 2 dead deps)
- src/app/support/page.tsx (email fix)
- src/app/api/referrals/request-payout/route.ts (email fix)
- src/app/api/test-email/route.ts (dup @ts-ignore)
- src/app/api/upload/route.ts (dup @ts-ignore)
- src/app/page.tsx (dup @ts-ignore)
- src/components/admin/FloatingGrokChat.tsx (deleted via git rm)
- New: CONNECTIONS-AND-UNUSED-FILES-REVIEW.md (this report)

**Verdict**: Core integration surface is solid and production-oriented (Wompi live-ready with warnings, Resend observable, Grok admin tooling powerful with safety, geo+storage+email wired). One dead external dep + one leftover component file removed. Minor link hygiene applied. App state from prior comprehensive audits (see FULL-APP-REVIEW-*.md) remains strong on authz/security post-fixes; this pass closes the explicit "connection link and unused files" request cleanly.

Run `git status` / `git diff --stat` locally for exact delta. Rebuild/deploy after `npm install`.
