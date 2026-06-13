# Grok Code Review Notes: OigaUsted Next.js App
**Review Date:** 2026-06-02
**Scope:** Full app review (src/app/**, components/**, lib/**, APIs, theme, flows)
**Focus Areas:** 1. Dark/Light mode (priority), 2. Gigs (buyer/seller/admin), 3. Users/Roles/Auth, 4. PC/Mac/cross-platform, 5. General health (recent changes, errors, edges)

## Summary

Overall assessment: The app has solid foundational architecture (Next.js 16 App Router, Prisma, next-auth roles, Vercel Blob, geo features, dynamic gig categories, Wompi integration, audit logging, notifications, PWA). Many flows for gigs (create with dynamic fields/geo/images/pricing, seller management with toggle/stats, buyer search/geo/remote/sort, admin moderation) and roles (buyer/seller upgrade, Google+creds auth with demo, role-based nav/dashboards) are functional and thoughtful. Recent changes (Apple PWA manifest, audit auto-refresh, extra logging, Google SVG icon) integrate without obvious breakage.

Dominant risks (correctness > style): 
- **Dark/Light mode is severely broken in Admin section** (and scattered elsewhere): most /admin/* pages and AdminNavbar use hardcoded `bg-zinc-950/900`, `text-white`, `border-zinc-800`, `text-zinc-400/500` without `dark:` variants or semantic `bg-card`/`text-muted-foreground`/`bg-background`. Toggling theme (ModeToggle works via next-themes) leaves admin tiles/cards/tables/modals/nav in forced dark or invisible/low-contrast in light. Dupe ModeToggle and `text-white` on name in navbar. Other pages (gig detail, orders chat, some create/checkout, GigCard) have white/zinc hardcodes breaking theme.
- **Critical permission/authz gaps in core APIs**: /api/orders/[id] PATCH (no buyer/seller ownership check -- any logged user can mutate any order status/price), /api/orders/[id]/messages POST (no check -- spam on any order), /api/user/become-seller (no session/authz -- promote any userId), /api/gigs create allows non-sellers. Admin impersonate/audit ok but surface risks.
- **Missing toast infrastructure**: 21+ files import `toast` from 'react-hot-toast' but root layout only mounts Sonner `<Toaster>`. No react-hot-toast Toaster mounted -- toasts silently fail in many flows (admin, seller, checkout, profile, etc.).
- Gigs edges: inactive gigs detail/checkout possible (no isActive gate in buyer detail/checkout/api), price calc client-only in create (tamperable but server stores), JSON fields/addons parsing, geo only on client filter (no server geo query), no image validation beyond type in upload for create. Seller can delete gigs with no orders but edge on concurrent.
- Cross-platform: `scripts/dev-codespaces.sh` + `fs` in (unused) orderStorage use Linux/FS assumptions; no major case-sens or Safari breaks found but hardcoded colors/fonts and client geolocation/speechSynthesis have graceful fails. Mobile safe areas present but admin lacks bottom nav consistency.
- Health: Good loading/optimistic in places, audit auto 15s/30s, PWA ok, but no root ErrorBoundary, duplicate order creation paths (/api/checkout vs /api/orders), some loading states weak, potential hydration from complex mapsGuardScript, Wompi polling fragile. Referrals/payouts calc in lib/payout good.

Positives: Role JWT/session refresh + demo stable, seller stats aggregate correctly, geo Haversine + permission prompt, dynamic fields per category, Vercel Blob + admin audit + notifications integration clean, theme provider/mode-toggle solid base (just not applied), responsive with bottom nav/mobile menus.

**Verdict:** Not production ready due to theme (admin unusable in light), authz holes (data integrity attacks), toast breakage (silent UX fail), and edges in gigs/orders. Fix theme + permissions first. ~40+ specific issues below.

## Issues

### Issue 1 -- Severity: bug
- File: src/components/layout/AdminNavbar.tsx:76
- Description: Hardcoded `text-white` on admin name display (`<p className="font-semibold text-white">`). Does not respect light mode (invisible or low contrast on light bg). Also `text-zinc-500` on role label.
- Suggestion: Use `text-foreground` and `text-muted-foreground`. Remove forced colors.
- Status: open

### Issue 2 -- Severity: bug
- File: src/components/layout/AdminNavbar.tsx:85
- Description: Logout button uses `className="text-zinc-400 hover:text-red-500 hover:bg-zinc-800"` -- zinc hardcodes, no dark: , will be wrong in light.
- Suggestion: `text-muted-foreground hover:text-red-600 hover:bg-muted`.
- Status: open

### Issue 3 -- Severity: bug
- File: src/components/layout/AdminNavbar.tsx:9 (import), 80, 94
- Description: ModeToggle rendered twice (desktop div at 80, mobile at 94) for admin. Duplication wastes space and potential state issues.
- Suggestion: Render ModeToggle only once (e.g., always in user area, conditional visibility).
- Status: open

### Issue 4 -- Severity: bug
- File: src/app/admin/page.tsx:61
- Description: `text-zinc-400` on subtitle and all stat labels (69,78,87,96,108,110,122,132,142). Also `hover:border-zinc-600` on action cards (118,128,138) without dark: or semantic.
- Suggestion: Replace all `text-zinc-400` with `text-muted-foreground`, `text-zinc-500` with `text-muted-foreground`, borders with `border-border`.
- Status: open

### Issue 5 -- Severity: bug
- File: src/app/admin/users/page.tsx:268
- Description: Loading state fully hardcoded dark: `min-h-screen bg-zinc-950 flex ... text-white`, `text-zinc-400`. Inputs (291,297,308), Card (321 `bg-zinc-900 border-zinc-800`), table thead/tbody/hover (324-346 `bg-zinc-950 border-zinc-800 text-zinc-*`), selects, modal (463 `bg-black/70`, 464 `bg-zinc-900 border-zinc-700`), all text-zinc, examples in 528 etc. No theme support at all.
- Suggestion: Use `bg-background text-foreground`, `bg-card border-border`, `text-muted-foreground`, shadcn Input/Select/Card classes, add dark: only where accent needed.
- Status: open

### Issue 6 -- Severity: bug
- File: src/app/admin/gigs/page.tsx:102 (wrapper ok), but 107,113,121,128,134 (`bg-zinc-900 border-zinc-800`), 139,143 etc all zinc hardcoded, inputs, status spans.
- Description: Similar full dark force in gigs moderation list and cards.
- Suggestion: Standardize to semantic + Card from ui.
- Status: open

### Issue 7 -- Severity: bug
- File: src/app/admin/payouts/page.tsx:57
- Description: Entire page `bg-zinc-950 text-white`, cards `bg-zinc-900 border-zinc-800`, labels zinc-400/500. Ignores theme completely (unlike overview).
- Suggestion: Change root to `bg-background text-foreground`, use Card + muted.
- Status: open

### Issue 8 -- Severity: bug
- File: src/app/admin/earnings/page.tsx:13
- Description: `bg-zinc-950 text-white`, divs `bg-zinc-900 border-zinc-800`, text-zinc-400/500 everywhere.
- Suggestion: Semantic classes.
- Status: open

### Issue 9 -- Severity: bug
- File: src/app/admin/support/page.tsx:15
- Description: Fully `bg-zinc-950 text-white`, cards zinc-900/800.
- Suggestion: Fix to theme.
- Status: open

### Issue 10 -- Severity: bug
- File: src/app/admin/reports/page.tsx:8
- Description: Uses bg-background wrapper but inner `bg-zinc-900 border-zinc-800 text-zinc-400/500`.
- Suggestion: `bg-card border-border text-muted-foreground`.
- Status: open

### Issue 11 -- Severity: bug
- File: src/app/admin/settings/page.tsx:16 (Switch), 296,319 (examples `bg-zinc-950`), 388 (maintenance `bg-zinc-900 border-zinc-800`), some red-900/40 without dark.
- Description: Inconsistent; some sections good (bg-card etc), but zinc hardcodes + custom Switch not theme aware.
- Suggestion: Use shadcn Switch if avail, bg-muted etc, make examples use bg-muted.
- Status: open

### Issue 12 -- Severity: bug
- File: src/app/admin/grok-build/page.tsx:694 (`bg-zinc-700`), 720 (`bg-black/10`), 724 (`bg-black text-green-400`)
- Description: User avatar and code diff pre use forced dark colors (zinc/black) inside chat that otherwise uses card/muted.
- Suggestion: `bg-muted text-foreground` or appropriate semantic for pre/code.
- Status: open

### Issue 13 -- Severity: bug
- File: src/app/admin/overview (page.tsx) and others: many zinc used even when wrapper uses background (e.g. hover borders).
- Description: Inconsistent application of theme tokens across admin subpages; some pages updated, most not. Toggles do not "update admin sections properly".
- Suggestion: Audit all admin/* replace zinc/white with card/foreground/muted + add dark: only for specific (e.g. tags).
- Status: open

### Issue 14 -- Severity: bug
- File: src/app/gigs/[id]/page.tsx:99 (`bg-white`), 120 (`bg-white`), 149 (`bg-white`), 192 (`bg-white`), 212 (`bg-white`), 227 etc.
- Description: Gig detail uses multiple hardcoded white containers, emerald accents without dark variants. Breaks entirely in dark (white boxes on dark).
- Suggestion: `bg-card border-border`, use semantic text, `dark:` for any needed.
- Status: open

### Issue 15 -- Severity: bug
- File: src/components/common/GigCard.tsx:84 (`border-zinc-200 dark:border-zinc-700` okish), 93 (`text-gray-500`), 97 (`text-gray-500`), 117 (`text-gray-600`)
- Description: Hardcoded grays for seller name/desc; not using muted-foreground. Some zinc borders.
- Suggestion: `text-muted-foreground`.
- Status: open

### Issue 16 -- Severity: bug
- File: src/app/checkout/[gigId]/page.tsx:439 (`bg-white`), 525 (`bg-white`)
- Description: Form inputs and summary use bg-white hardcoded.
- Suggestion: Remove or `bg-background`.
- Status: open

### Issue 17 -- Severity: bug
- File: src/components/DynamicCheckoutFields.tsx:26 (`text-gray-500`)
- Description: Hardcoded gray in checkout fields header.
- Suggestion: `text-muted-foreground`.
- Status: open

### Issue 18 -- Severity: bug
- File: src/app/seller/gigs/page.tsx:187 (Search icon `text-gray-400`), 236 (`text-gray-300`), 246 (`bg-gray-700 text-white`)
- Description: Status toggle and fallbacks use gray-*/white without dark:.
- Suggestion: Use `text-muted-foreground`, conditional classes with dark: or semantic.
- Status: open

### Issue 19 -- Severity: bug
- File: src/app/orders/[id]/page.tsx:207,254,408 (multiple `bg-white`)
- Description: Order detail/chat UI forces white panels -- theme breakage in chat/files section.
- Suggestion: `bg-card`.
- Status: open

### Issue 20 -- Severity: bug
- File: src/app/admin/users/page.tsx:169 (reset uses /api/user/change-password but comment notes admin support incomplete); similar in settings.
- Description: Admin password reset and impersonate rely on incomplete or side-effect APIs.
- Suggestion: Add proper admin endpoints or guards for password ops.
- Status: open

### Issue 21 -- Severity: bug
- File: src/app/api/user/become-seller/route.ts:4 (entire file)
- Description: No getServerSession, no ownership check. Accepts arbitrary `userId` from body and promotes to seller. Any authenticated user can escalate any account (incl. self or others) or set business fields.
- Suggestion: Auth session, verify session.user.id === userId (or admin override), rate limit, audit.
- Status: open

### Issue 22 -- Severity: bug
- File: src/app/api/orders/[id]/route.ts:40 (PATCH, no check after session)
- Description: Any logged-in user (buyer/seller/any) can PATCH arbitrary orderId to change status/price/customFields/service loc. No `if (order.buyerId !== user.id && order.sellerId !== user.id)` guard. Bypasses buyer/seller dashboards.
- Suggestion: Fetch order first, enforce buyer or seller only (or admin), validate state transitions server-side.
- Status: open

### Issue 23 -- Severity: bug
- File: src/app/api/orders/[id]/route.ts:7 (GET)
- Description: GET order by id returns full details (incl buyer/seller PII) to any authenticated user who guesses the id. No ownership.
- Suggestion: Add ownership check or 404 for non-participants.
- Status: open

### Issue 24 -- Severity: bug
- File: src/app/api/orders/[id]/messages/route.ts:51 (POST), 20 (GET)
- Description: POST allows any session user to create message on any orderId (no buyer/seller check before create/notify). GET returns messages for any orderId. isFromBuyer only best-effort after.
- Suggestion: Fetch order, verify caller is buyerId or sellerId, else 403.
- Status: open

### Issue 25 -- Severity: bug
- File: src/app/api/gigs/route.ts:52 (POST)
- Description: Any authenticated user (incl buyer) can POST to create gig (sellerId = their id). No role==='seller' check. Relies on client UI.
- Suggestion: In route: `const role=...; if(role !== 'seller') return 403;`
- Status: open

### Issue 26 -- Severity: bug
- File: src/app/api/checkout/route.ts:13 and src/app/api/orders/route.ts:52 (duplicate order creation logic)
- Description: Two paths to create orders (/checkout and /orders POST). Inconsistent fields (checkout omits some). Risk of race/dupes if frontend calls both or errors midway.
- Suggestion: Consolidate to single canonical create-order API with full validation (incl isActive, price match).
- Status: open

### Issue 27 -- Severity: bug
- File: (multiple) e.g. src/app/gigs/[id]/page.tsx:48 (handleBuyNow), src/app/checkout/... no isActive check
- Description: Inactive/paused gigs are fetchable in detail, linkable to checkout, and creatable in /api/checkout (only sellerId self-check, no gig.isActive). Buyers can "buy" deactivated services. Admin deactivate doesn't prevent.
- Suggestion: In GET gig detail, buyer pages, checkout: if(!gig.isActive) show "paused" + block buy. In checkout API: check gig.isActive.
- Status: open

### Issue 28 -- Severity: bug
- File: (toast usages) 21 files e.g. src/app/create-gig/page.tsx:14, admin/*, seller/*, profile, checkout, GigCard etc.
- Description: `import { toast } from 'react-hot-toast'` everywhere, but no `<Toaster />` from react-hot-toast in layout (only Sonner). Toasts from these calls do not appear (or error silently).
- Suggestion: Either mount `<Toaster />` from 'react-hot-toast' (position etc), or migrate all calls to sonner `toast` (from 'sonner') which is already mounted.
- Status: open

### Issue 29 -- Severity: bug
- File: src/lib/orderStorage.ts:1-34 (and root tmp-order-files.json)
- Description: Server fs + process.cwd() for temp JSON order files. Unused in current code (chat uses Blob), but if re-enabled: ephemeral on Vercel (data loss), Linux path assumptions, potential case-sens issues on Mac FS, no cleanup, race on concurrent writes.
- Suggestion: Remove dead code or replace with DB (e.g. order.files JSON) or proper Blob.
- Status: open

### Issue 30 -- Severity: bug
- File: scripts/dev-codespaces.sh:1
- Description: Bash script with /bin/bash shebang, exec npm etc. Assumes Unix env; on pure Windows/Mac without gitbash may fail. Also dev:codespaces in package.
- Suggestion: Make cross-platform (node script or cross-env) or document.
- Status: open

### Issue 31 -- Severity: suggestion
- File: src/app/admin/audit/page.tsx:58 (and overview)
- Description: Auto-refresh uses setInterval + fetch without abort or visibility check; may continue in bg tabs, no error boundary on component.
- Suggestion: Use useEffect cleanup, visibility API pause, or React Query/SWR.
- Status: open

### Issue 32 -- Severity: suggestion
- File: src/app/create-gig/page.tsx:192 (payload price = totalPrice client calc), 54 (calculateTotal)
- Description: Total price (incl dynamic fields/addons) computed only client-side then sent. No server re-calc/validation against category fields. Tamperable price.
- Suggestion: On server in /api/gigs POST/PUT, re-compute total from base + fields/addons using category registry, or store base + selected and compute on read.
- Status: open

### Issue 33 -- Severity: suggestion
- File: src/app/gigs/page.tsx:116 (gigsWithDistance memo in render), useEffect deps
- Description: Heavy client-side filtering + distance calc on every render for all gigs (no server-side pagination/search/geo). Scales poorly; location in localStorage but no persist filter.
- Suggestion: Server-side query with filters (Prisma + geo index later), cursor pagination.
- Status: open

### Issue 34 -- Severity: nit
- File: src/app/layout.tsx:54 (long mapsGuardScript inline), 157
- Description: Complex DOM-mutating script injected early for Google legacy. Works but brittle, console spam, may interfere Safari/Mac hydration timing.
- Suggestion: Extract to component or lib, make less aggressive.
- Status: open

### Issue 35 -- Severity: suggestion
- File: src/app/admin/users/page.tsx:163 (reset password shows temp in toast, no email), 169 comment.
- Description: Admin reset shows plaintext temp pw client; insecure for real use, relies on future email.
- Suggestion: Generate, hash, email via notifications, never expose.
- Status: open

### Issue 36 -- Severity: bug
- File: src/app/api/admin/gigs/route.ts:18 (GET search), admin UI.
- Description: Admin search uses Prisma contains (case-sens? SQLite vs PG diff), no isActive filter exposed.
- Suggestion: Case-insens, add filters.
- Status: open

### Issue 37 -- Severity: nit
- File: src/components/layout/Providers.tsx and SessionProviderWrapper, ThemeProvider nesting.
- Description: ThemeProvider wrapped in Session etc; multiple provider files. Potential order issues if any.
- Suggestion: Consolidate providers.
- Status: open

### Issue 38 -- Severity: bug
- File: src/app/gigs/page.tsx:333 (Suspense fallback text-gray-500), empty state 307 (text-gray-400)
- Description: Hardcoded grays in public gigs list.
- Suggestion: muted-foreground.
- Status: open

### Issue 39 -- Severity: suggestion
- File: src/app/checkout/[gigId]/page.tsx:42 (Wompi loader polling 60*200ms + dynamic inject)
- Description: Fragile Wompi script load with long polling; no timeout clean on unmount, race if multiple checkouts.
- Suggestion: Better script loader hook, once() global.
- Status: open

### Issue 40 -- Severity: suggestion
- File: src/lib/auth.ts:110 (ADMIN_EMAILS), Google signIn.
- Description: Admin promotion only on Google OAuth; credentials demo/admin must be pre-seeded in DB. No UI to promote.
- Suggestion: Document seeding, or admin-only promote UI.
- Status: open

### Issue 41 -- Severity: bug
- File: (various cards in admin non-overview, gig detail, etc) e.g. src/app/admin/settings:388 maintenance box.
- Description: Some Card usage mixed with raw divs using zinc; theme not uniform.
- Suggestion: Always prefer <Card className="bg-card border-border">.
- Status: open

### Issue 42 -- Severity: nit
- File: src/app/globals.css:172 (button min-height 44/48), safe-area.
- Description: Global tap targets good for mobile, but may affect desktop admin buttons unintentionally.
- Suggestion: Scope to .mobile or use better media.
- Status: open

(Additional minor nits: duplicate order create paths, some console.logs left in prod paths, missing aria on some selects in admin, no loading in some fetches like seller dashboard initial, potential key collisions in lists without stable ids, category-registry import at bottom of DynamicCheckoutFields.)

## End of Issues

**File path of this review:** /tmp/grok-review-35040d4d.md

**Final verdict summary:** Theme failure dominant in admin (priority #1 broken); authz holes in orders/gigs/messages/become-seller are correctness/security risks; toast system mismatch will frustrate users. Gigs flows mostly work but with edges around inactive/price/permissions. Cross-platform mostly fine (minor script/FS). Fix the listed bugs before release; positives in architecture give good base once polished. Review complete via exhaustive file reads/greps on listed paths.