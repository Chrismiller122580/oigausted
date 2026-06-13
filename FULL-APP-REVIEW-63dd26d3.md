# Full App Review: OigaUsted Colombian Gig Marketplace
**Review ID / Commit:** 63dd26d3 (based on clean main 5d3bcfc)
**Date:** 2026-06-03
**Type:** FULL APP review (not diff) — production readiness post-notifications-fix
**Persona:** Meticulous code reviewer (correctness first, style second; edge cases, error handling, race conditions, authz, data integrity, security)
**Explored:** src/app/** (admin/*, api/* all, gigs/*, orders/*, checkout/*, support/*, seller/*, layouts), src/lib/* (auth, notifications, audit, payout, prisma, etc.), components/* (layout, admin, common, ui, maps), prisma/schema.prisma + migrations, middleware.ts, next.config.ts, vercel.json, package.json, scripts/*, types/. Used list_dir, read_file (all key paths before flagging), grep (broad + targeted for authz/console/hardcode/TODO/bypass), run_terminal_command (tsc).

## Summary + Issue Counts + Top Issues

**Overall Assessment:** The app has matured significantly since prior reviews (June 2026): authz gaps in become-seller/gig create/orders/messages largely closed with server checks + isAdmin; notifications refactored to `notifications.sendInApp` (fixing the "expected 1 arg got 6" TS); Sonner toasts now consistently used (no more hot-toast import mismatches in src); inactive gig buyability mitigated at checkout API + detail page; admin UIs largely moved to semantic `bg-background`/`bg-card`/`text-foreground`/`text-muted-foreground` + `Card` components (big improvement). Wompi webhook has signature + replay protection; audit everywhere on mutates; referral/payout accounting centralized in lib/payout.ts + effective rate; notifications have prefs/quiet/rate (in-mem)/delivery tracking; Grok admin AI + tools; support tickets; geo; dynamic fields; PWA.

**Positives:** 
- Strong data model (User roles as string, Gig.isActive, Order status, Review unique-per-order, ReferralEarning unique-per-referrer-order, Notification + Preference + PushSubscription, AuditLog with performedBy+legacy, PlatformConfig).
- Security wins: session JWT + fresh DB role pulls, owner checks on orders/gigs/messages/reviews, admin-only for sensitive (users, gigs mod, send-notif, reports), webhook sigs, bypass markers stripped in parseCustomFields.
- UX: realtime SSE + bell, email via Resend+templates on notif, seller stats aggregates, client geo + maps nuke guards, role-based navs.
- Observability: audit + notif deliveryLog + crons.
- tsc clean.

**Dominant Risks (prioritized correctness/security > style/quality):**
- **Critical unauthenticated Grok API surface** (full DB read + select mutations via tool execution; AI is "for admins" only in UI).
- **Broken scheduled notifications** (Vercel crons invoke GET; handler is POST-only).
- **Unauthenticated/spoofable webhooks** (Resend webhook has zero signature validation).
- **Theme breakage remains** (buyer/gig/detail/checkout/orders/seller/marketing pages use raw `bg-white` / `bg-zinc-*` / `text-zinc-*` without `dark:` or semantic tokens; some admin subpages still leak).
- **Data integrity / state machine gaps** (order status PATCH allows any participant any transition; bypass/simulate paths skip webhook referral creation; duplicate referral create sites with only unique-constraint protection; no atomic tx for review avg recalc or referral on complete).
- **Serverless-unfriendly globals** (in-mem rate limits/caches in notifications + signup; no persistence).
- **Error handling / prod hygiene gaps** (swallowed errors, generic 5xx, dozens of console.* in hot paths, .bak files in tree, unused react-hot-toast dep, dev/beta bypasses left in prod code, no rate limits on public endpoints like grok/generate).
- **Authz / session surface** (client-only role guards on seller pages; admin layout protects but floating chat + API open; no last-admin protection on demote; impersonate is audit-only).
- **Payouts/referrals incomplete** (admin markAsPaid is pure UI filter + toast; referral payouts never set to 'Paid'; 'Requested' status not in schema comments; admin/referrals only aggregates).
- **Tech debt accumulation** (legacy demo resolve, MapsGuard scripts, schema patch hack in dev script, many TODOs, placeholder live data, direct prisma in Grok tool handler).

**Issue Counts (from this review):**
- Security / Authz / Integrity: 8
- Correctness / Bugs (flows, webhooks, crons, transitions): 9
- Error Handling / Resilience / Edge Cases: 7
- Theme / UX / Styling (hardcodes breaking dark/light): 6
- Code Quality / Tech Debt / Hygiene (consoles, legacy, dead deps, .bak): 12+
- Total flagged: ~45 (prioritized; many nits omitted)

**Top 10 Issues (must-fix for prod):**
1. (security) /api/grok has zero auth — unauth users can invoke Grok + execute mutating tools (update_support_ticket does real writes).
2. (correctness) /api/notifications/digest only exports POST; vercel.json crons + scheduled digests will 405 and never run.
3. (security) /api/webhooks/resend has no Svix/Resend signature verification — any POST can fake delivery/open/click/bounce status.
4. (integrity) Order PATCH has no transition rules/role restrictions; bypass and dev-simulate mark Paid without creating ReferralEarning (unlike webhook path).
5. (theme) Widespread `bg-white` (no dark variant) + zinc hardcodes in non-admin flows (gigs/[id], checkout, orders/[id], seller/*, marketing, maps prompts) break dark mode.
6. (resilience) In-memory only rate limiting + recentNotificationCache (notifications.ts, signup rate, checkRateLimit) ineffective on Vercel serverless (per-instance, restarts).
7. (debt) .bak files committed (orders/[id]/page.tsx.bak), react-hot-toast still in package.json+lock (unused in src), dozens of console.log/warn/error in prod paths.
8. (integrity) ReferralEarning 'Requested' status written but never transitioned to Paid; admin payouts page is stub (no DB writes, no audit); two creation sites for earnings.
9. (authz) Grok generate + public endpoints lack rate limiting/abuse protection; some seller APIs only check uid not role.
10. (error) Many paths swallow errors (audit, notifs, referral create, review recalc) or return generic messages; no transactions for compound ops (review+user rating update).

**Verdict at bottom.**

## Issues (structured: severity, file:line, description, suggestion, status)

### Issue 1 — Severity: security
- File: src/app/api/grok/route.ts:4 (POST handler, entire file)
- Description: No authentication or admin role check at entry. Any caller (even unauthenticated) can POST prompts in "admin_build" mode, get full history/context, and trigger server-side tool execution including DB reads (get_platform_overview, search_users, list/get_support_tickets) and writes (update_support_ticket performs prisma.supportTicket.update + sendInApp notification). update_referral_rate is deferred but others mutate. Exposes GROK_API_KEY usage. FloatingGrokChat and /admin/grok-build are client-gated by admin layout, but API is fully public. Also called from non-admin pages (/create-gig, /profile) via /generate variant.
- Suggestion: Add at top of POST: `const session = await getServerSession(authOptions); if ((session?.user as any)?.role !== 'admin') return Response.json({error:'Unauthorized'}, {status:403});`. Gate tool execution behind same. Consider separate public /api/grok/generate for description helper (which already has no DB side effects). Add rate limiting.
- Status: open

### Issue 2 — Severity: bug (correctness)
- File: src/app/api/notifications/digest/route.ts:15 (only POST), vercel.json:5-11
- Description: Vercel Cron Jobs invoke the path with GET (per Vercel docs + common behavior). Route only exports POST (used manually from admin/notifications UI via fetch POST). Crons for daily/weekly will receive 405 Method Not Allowed; digests never sent automatically. Comment claims "Vercel Cron + ...", but handler doesn't support GET (no fallback or shared logic).
- Suggestion: Add `export async function GET(req) { return POST(req as any); }` (or extract handler) and support the cron auth headers in GET too. Test with actual cron trigger or `curl -X GET`.
- Status: open

### Issue 3 — Severity: security
- File: src/app/api/webhooks/resend/route.ts:7 (entire POST, no sig check)
- Description: Processes any JSON POST as Resend event (delivered/opened/clicked/bounced/failed) and blindly searches recent notifications by email_id in deliveryLog then mutates emailStatus/OpenedAt etc. No verification of `svix-id`, `svix-timestamp`, `svix-signature` headers using Resend webhook secret (standard Svix). Attacker can spoof events to corrupt notification delivery tracking / observability.
- Suggestion: Implement signature verification per https://resend.com/docs/webhooks (use crypto timingSafeEqual on signed payload). Reject invalid early (401). Add replay protection similar to Wompi webhook.
- Status: open

### Issue 4 — Severity: security / integrity
- File: src/app/api/grok/route.ts:407 (update_support_ticket tool), 413-430 (direct prisma + notify); also 324+ for other tools
- Description: Tool handlers execute privileged DB mutations and reads with zero caller identity check (inside the unauthed route). update_support_ticket can set status/adminReply/resolvedAt on any ticket and notify owner. Other tools expose all user/ticket/order data.
- Suggestion: Same as Issue 1 — auth guard the route. For tools that mutate, require explicit confirmation flow + re-check admin in the Grok handler before executing (even after route guard). Remove or noop dangerous tools.
- Status: open

### Issue 5 — Severity: bug (data integrity / payments)
- File: src/app/checkout/[gigId]/page.tsx:296 (bypass), 704 (dev simulate); src/app/api/orders/[id]/route.ts:134 (Completed referral); src/app/api/webhooks/wompi/route.ts:150 (Paid referral)
- Description: Real Wompi flow creates ReferralEarning on APPROVED (Paid) via webhook (and again on Completed PATCH). But beta bypass (`wompiLoadFailed`) and dev simulate both PATCH status='Paid' directly (after saving customFields with __bypass) — bypassing webhook entirely, so no referral created at pay time. Referral only created later if/when seller PATCHes to Completed. If order stays "Paid" forever or seller never completes, referrer loses earnings. Also duplicate creation attempts (rely on @@unique only; second fails silently in catch). No atomicity.
- Suggestion: Centralize referral creation in one place (e.g. a lib function called from both webhook and any Paid setter, or always on first transition to Paid or Completed). Make bypass also call the same logic (or trigger a synthetic webhook event). Add transaction for create + notify. Update bypass UI to warn about delayed referral.
- Status: open

### Issue 6 — Severity: bug (state machine / authz)
- File: src/app/api/orders/[id]/route.ts:64-67 (PATCH authz only checks buyer/seller/admin), 71-77 (any status), 130 (status updates), 174 (notify logic)
- Description: Any authenticated participant (buyer or seller) or admin can PATCH any valid status ("Pending"->"Completed" etc.) with no transition rules, no "only seller can mark In Progress/Completed", no "only after Paid". Buyer can force Completed (triggers review prompt + referral creation in some paths). UI restricts via isSeller checks + dev-only all-status panel, but API does not. Concurrent updates race (last writer wins, no version/updatedAt guard beyond Prisma).
- Suggestion: Add role-aware transition validation in PATCH (e.g. seller-only for progress/complete; buyer can cancel only while Pending). Use enum or state machine. Consider optimistic locking or check current status in where clause. Document allowed transitions.
- Status: open

### Issue 7 — Severity: bug (theme / UX regression)
- File: src/app/gigs/[id]/page.tsx:109,130,159,202,222 (bg-white, no dark:); similar patterns in src/app/checkout/[gigId]/page.tsx, src/app/orders/[id]/page.tsx, src/app/seller/*, src/app/(marketing)/page.tsx (some have dark: some don't), src/components/maps/LocationPermissionPrompt.tsx:20, src/components/common/GigCard.tsx (borders)
- Description: Explicit `bg-white` / `rounded-3xl bg-white border` / `bg-white px-...` (and zinc-200/900 without dark variants) in buyer flows, gig detail sidebar/cards/reviews/fields, checkout panels, order chat/progress, seller earnings. These paint white backgrounds (or wrong contrast) in dark mode regardless of .dark vars or next-themes. Admin mostly uses semantic now (bg-background + Card), but not everywhere (e.g. some modals, badges). Contradicts "semantic bg-background/text-foreground" guideline from prior reviews. Some dark: present but incomplete.
- Suggestion: Replace raw bg-white with `bg-card` or `bg-background`, text-zinc-* with `text-foreground`/`text-muted-foreground`, borders with `border-border`. Add `dark:` only for intentional accents. Audit all non-admin pages + components. Use <Card> more.
- Status: open

### Issue 8 — Severity: bug (resilience)
- File: src/lib/notifications.ts:369 (recentNotificationCache = new Map), 371 (checkRateLimit), 52 (call), also signup rate in api/auth/signup/route.ts:8
- Description: Rate limiting + grouping is pure in-memory Map (keyed by user:category, 1h window). On Vercel (serverless, multiple instances, cold starts, deploys) this is per-container and resets constantly — ineffective against abuse/spam. Quiet hours and prefs are DB but rate is not. Same pattern in signup (15m IP+email map).
- Suggestion: Persist rate limits (e.g. Redis/Upstash, or DB table with TTL, or use DB count in last hour for critical categories). For now, document as "best effort per instance".
- Status: open

### Issue 9 — Severity: bug (webhook / payments)
- File: src/app/api/webhooks/wompi/route.ts:112 (update), 134 (audit), 150 (referral create on Paid)
- Description: On transaction.updated + APPROVED sets order.status='Paid' and creates referral (if referred). But order may have been manually set or other status; no check if already Paid/Completed. No storing of wompi transaction.id/amount on Order (only in audit JSON). If webhook replays or multiple events, may duplicate referral (caught by unique). Timestamp check uses 10min but comment says "Wompi recommends timestamp + body".
- Suggestion: Idempotency: check current status before update; store wompi ref on order for audit. Use DB transaction for Paid + referral create + notif. Consider a payments table.
- Status: open

### Issue 10 — Severity: correctness (cron + admin UX)
- File: src/app/admin/payouts/page.tsx:42 (markAsPaid), 46 (TODO comment); src/app/api/admin/referrals/route.ts (only GET aggregate); src/app/api/referrals/request-payout/route.ts:36 (sets 'Requested' — not in schema enum comments)
- Description: Seller payout "mark as paid" and referral request-payout are stubs: UI only (filter + toast), no DB update to ReferralEarning.status='Paid', no Payout record, no audit, no actual transfer. Admin/referrals GET only. Earnings can be Requested/Pending/Paid/Cancelled but 'Requested' undocumented. Inconsistent with "single source of truth" payout.ts claims.
- Suggestion: Implement real mark-paid flow (PATCH or dedicated endpoint that updates status + audit + notify referrer). Add DB model for actual payouts or reuse earnings. Update schema comments.
- Status: open

### Issue 11 — Severity: bug (dead code / hygiene)
- File: src/app/orders/[id]/page.tsx.bak (entire), root: tmp-order-files.json (from list_dir), package.json:36 (react-hot-toast still listed + in lock, 0 src imports)
- Description: .bak file committed in source tree (will be served/bundled or at least pollute). Leftover tmp json. react-hot-toast dep is pure dead weight post-migration to Sonner (previous review item was "21+ files import hot-toast").
- Suggestion: `git rm` the .bak and tmp; `npm uninstall react-hot-toast`. Scan for any other .bak in src/.
- Status: open

### Issue 12 — Severity: bug (error handling / prod)
- File: src/lib/audit.ts:44 (catch + console.error only, "never break flow"); src/lib/notifications.ts:90 (in-app create), 204 (tracking), 229 (push), many apis (generic catch return 500)
- Description: Audit, notif creation, referral create on complete/paid, review recalc, email tracking all swallow errors with only console. No retry, no DLQ, no user-visible partial failure. In prod, silent loss of audit trail or notifs on transient Prisma/Resend issues. Many apis: `catch(e) { console.error(...); return NextResponse.json({error: 'generic'}, {status:500}) }`.
- Suggestion: At minimum, surface critical failures (e.g. payment confirmed but notif failed). Add structured logging. For compound ops use Prisma transactions ($transaction).
- Status: open

### Issue 13 — Severity: security / authz (partial)
- File: src/app/api/gigs/[id]/route.ts:64 (PUT/DELETE only check sellerId === userId, no role), 143 (same); src/app/api/seller/gigs/route.ts:9 (only uid, any role can list if they guess)
- Description: Gig owner mutation checks id match but not that actor still has seller role (role could have been revoked). Seller-specific GETs don't re-validate role==='seller'. Relies on upstream creation guards + JWT.
- Suggestion: Add `const role = ...; if (role !== 'seller' && role !== 'admin') return 403;` in seller APIs and owner checks (or isSeller helper). Re-fetch user role fresh.
- Status: open

### Issue 14 — Severity: bug (edge case)
- File: src/app/api/orders/[id]/review/route.ts:108 (recalc), 117 (user update rating/reviewCount); similar in grok support update
- Description: After create review, fetches ALL reviews for seller then avg + count + update. No transaction; concurrent reviews can race (lost updates to rating/reviewCount). Also recalcs on every review (O(n) over time).
- Suggestion: Use $transaction for create + update, or better: use Prisma aggregate in update, or maintain incrementally (or trigger). Add unique constraint enforcement already there.
- Status: open

### Issue 15 — Severity: bug (theme + admin)
- File: src/app/admin/users/page.tsx:365 (role badges `bg-purple-600 text-white` etc, ok for color), but 463 (modal `bg-black/50`), earlier greps showed some; src/app/admin/settings/page.tsx:18 (switch thumb bg-white), 427 (red banner)
- Description: Some admin still has forced dark (black/50 overlays, white switch parts without dark consideration) or non-semantic. Not as bad as before but leaks.
- Suggestion: Use `bg-black/50 dark:bg-black/70` or better `bg-background/80` + backdrop; make switch use bg-primary etc or radix component.
- Status: open

### Issue 16 — Severity: bug (edge / UX)
- File: src/app/gigs/[id]/page.tsx:36 (if inactive setError), 56 (handleBuyNow blocks), 80 (if(error) show error UI even if gig loaded)
- Description: For inactive gig, fetch succeeds, sets gig + error, then error UI hides the (paused) detail entirely. User can't see why or seller info. Checkout API correctly 400s. But list /api/gigs filters isActive.
- Suggestion: Show gig detail in read-only "paused" state (grayed buy button, banner) instead of full error page. Or return 410 from api/gigs/[id] for inactive and let client decide.
- Status: open

### Issue 17 — Severity: correctness
- File: src/app/api/checkout/route.ts:28 (checks isActive), src/app/api/orders/route.ts: (POST legacy path has no isActive check at 36)
- Description: Duplicate order creation path /api/orders (POST) lacks the gig.isActive guard present in /api/checkout. Though not called from current UI (grep found 0 POST /api/orders calls), it's live API surface that can create orders for inactive gigs. Also no role enforcement (any logged user).
- Suggestion: Add the same `if (gig.isActive === false) ...` + perhaps buyer role check. Or delete the endpoint if dead.
- Status: open

### Issue 18 — Severity: bug (prod hygiene)
- File: src/app/layout.tsx:65 (huge inline mapsGuardScript with console.warn/debug), src/app/admin/page.tsx:39 (console.error on fetch fail), many apis (console on every error path)
- Description: Production code has debug consoles, long inline scripts, emoji logs. Will pollute logs in Vercel. Maps guard is necessary but noisy.
- Suggestion: Guard consoles behind process.env.NODE_ENV !== 'production' or use a logger lib. Clean emoji from prod paths. Minify the guard script comment.
- Status: open

### Issue 19 — Severity: bug (incomplete feature)
- File: src/app/api/admin/live/route.ts:3 (placeholder return static), src/app/admin/payouts (markAsPaid stub)
- Description: /admin/live is static fake numbers ("Live admin data (placeholder)"). Payouts and referral flows have multiple TODOs and no-ops.
- Suggestion: Either implement or remove/hide placeholders. For live, use SSE/polling from real counts or mark "beta".
- Status: open

### Issue 20 — Severity: bug (auth / session)
- File: src/lib/auth.ts:23 (isAdmin), 153 (jwt callback refetch role), many places cast (session?.user as any).role
- Description: isAdmin helper used in some admin apis (good) but many still do inline `(session?.user as any)?.role !== 'admin'`. Session type (next-auth.d.ts) incomplete (missing profilePicture, rating, etc. that callback adds). Heavy any casting.
- Suggestion: Extend types fully, export typed getSession helper or use `auth()` from next-auth in server, centralize role checks.
- Status: open

### Issue 21 — Severity: bug (edge)
- File: src/app/api/user/become-seller/route.ts:28 (update role), src/app/api/admin/users/route.ts:85 (PATCH can set role)
- Description: No guard against demoting the last admin, or self-demote (could lock out). No validation on role values (any string accepted). Signup prevents admin but admin UI allows.
- Suggestion: In role change PATCH, count current admins before allowing demote to non-admin; prevent if would be 0. Validate role in ['buyer','seller','admin'].
- Status: open

### Issue 22 — Severity: bug (data)
- File: src/app/api/referrals/request-payout/route.ts:36 (updateMany to 'Requested'), schema.prisma:329 (status default "Pending" // Pending, Paid, Cancelled — no Requested)
- Description: Code writes 'Requested' status (and checks Pending) but schema comment/docs don't list it. Later payout processing never consumes 'Requested' to 'Paid'. Inconsistent with ReferralEarning model.
- Suggestion: Add 'Requested' to comment or better, use a separate requestedAt field + keep status in {Pending,Paid,Cancelled}.
- Status: open

### Issue 23 — Severity: bug (UX / notifications)
- File: src/lib/notifications.ts:215 (shouldAlsoEmail), 225 (push), 73 (in-app for all), 183 (findFirst recentNotif by category to update tracking — racy)
- Description: Email tracking update does findFirst({where: {userId, category}, orderBy desc}) then update — if multiple in flight, may tag wrong notif. In-app creation for email type always happens before email. Push always attempted if enabled.
- Suggestion: When creating the in-app, capture its id and pass to sendEmailIfEnabled for precise tracking update instead of recent lookup. Make delivery updates more robust.
- Status: open

### Issue 24 — Severity: quality (debt)
- File: src/app/api/gigs/route.ts:33,105 (console.log success), src/app/api/seller/gigs/route.ts:87, src/app/api/checkout/route.ts:43, many others throughout apis and lib (emoji logs, "📦", "✅")
- Description: >50 console.* statements across prod code paths (success, every error, rate, webpush). Includes in hot paths (gigs list, order create, notif send). Pollutes platform logs.
- Suggestion: Remove or conditionalize all non-error consoles. Use a pino/winston or Vercel log drain with levels.
- Status: open

### Issue 25 — Severity: bug (client/server)
- File: src/components/layout/NavbarWrapper.tsx:25 (role = String((session?.user as any)?.role ... )), similar casts everywhere; src/app/admin/layout.tsx:14 (server getServerSession check)
- Description: Role checks duplicated and cast-y in client wrappers + server layouts/APIs. Navbar decides which sub-navbar to render based on client session. If session desync, wrong nav. No server redirect for seller pages (unlike admin).
- Suggestion: Centralize isAdmin/isSeller helpers (typed), add server-side guards (layout or middleware) for /seller/* and /create-gig etc. Use middleware for cheap redirects.
- Status: open

## Additional Tech Debt / Observations (not full issues)
- Legacy demo: resolveDemoUserId + DEMO_IDS still in auth + seller/gig paths (harmless for real UUIDs but confusing).
- Schema hack in scripts/with-local-sqlite.sh patches Json->String + @db.Text removal on the fly for dev; trap restores but brittle.
- MapsGuard huge inline script + CSS + component nuke for legacy places (necessary defense but complexity).
- No ErrorBoundary at root or per-page; many fetches lack loading skeletons beyond basic.
- CustomFields parse strips __ but bypasses still stored and visible in admin/raw.
- PlatformConfig has minPayout etc but some flows hardcode 50000.
- No tests visible (no __tests__, no jest in package).
- vercel.json build runs prisma-safe-migrate every deploy (good) + crons defined.
- Unused: components/layout/Providers.tsx, ClientLayout.tsx (dupe of wrapper), orderStorage.ts?, some scripts.
- In grok/route.ts: many tools defined but only few executed server-side; client executeTool duplicates some fetches.
- Support tickets: no admin email blast on new (only console.log + user confirmation); TODO noted.

## Build / Static Analysis
- `npx tsc --noEmit`: exit 0, clean (post prior notification arg fix).
- `npm run lint`: ran but reported "Invalid project directory ... /lint" (eslint config / next lint quirk; no blocking errors surfaced in output).
- No obvious import cycles or missing modules from reads/greps.

## Files Read (representative, not exhaustive)
prisma/schema.prisma, middleware.ts, next.config.ts, vercel.json, package.json, src/lib/{auth.ts,notifications.ts,audit.ts,payout.ts,prisma.ts,utils.ts,emails/templates.ts}, src/app/layout.tsx, src/components/layout/{Providers.tsx,ThemeProvider.tsx,NavbarWrapper.tsx,ClientLayout.tsx}, src/app/api/* (all listed routes, especially orders/*, gigs/*, webhooks/*, admin/*, grok/*, checkout/*, support/*, notifications/*), src/app/{admin/* all pages, gigs/[id], checkout/[gigId], orders/[id], support, create-gig, seller/*, profile, etc.}, components/{admin/FloatingGrokChat.tsx, common/*, ui/*, maps/*}, scripts/*, etc. + greps across.

The review notes have been written to: FULL-APP-REVIEW-63dd26d3.md

**Short Verdict Summary:** App is much improved (authz closed, toasts fixed, inactive-gig blocks added, admin theming largely semantic) and build-clean, but **not yet production-ready**. Critical blockers: unauthed Grok API (security + mutation risk), broken digest crons (feature dead), unverified Resend webhook (integrity), theme hardcodes in user flows (UX regression), order state + referral bypass races (data integrity), pervasive in-mem + console + stubs + .bak debt. Prioritize auth on Grok, fix cron/handler, add webhook sigs, finish theme audit, harden order transitions + centralize side effects, replace in-mem limits, remove dead code/bypasses. ~45 issues; ~10 top severity. Re-review after these.

(End of structured review notes.)

## Fixes Applied (post-review)
- Grok admin API now requires admin role (src/app/api/grok/route.ts).
- Notifications digest supports GET for Vercel crons (src/app/api/notifications/digest/route.ts).
- Resend webhook now verifies Svix signature + replay (src/app/api/webhooks/resend/route.ts).
- Order PATCH: added role-aware status transition enforcement + referral earning now triggers on 'Paid' (fixes bypass paths); src/app/api/orders/[id]/route.ts + bypass markers respected.
- Last-admin protection added in admin users PATCH and become-seller (prevents lockout).
- Debt: removed committed .bak and tmp-order-files.json; uninstalled unused react-hot-toast.
- Theme: replaced many `bg-white` with `bg-card` in key buyer/gig/checkout/orders/profile flows (more remain for full audit).
- In-mem rate limit: added serverless caveat comment.
- Legacy /api/orders POST now has isActive + role guards + deprecation note (safer even if unused).
- Prod hygiene: introduced devLog helper in lib/utils, replaced noisy success logs in hot paths (gigs, seller, checkout, wompi) with dev-only.
- Auth types extended (next-auth.d.ts), helpers added in lib/auth (getSessionRole, isSeller).
- Referral status comment fixed in schema; basic mark-paid PATCH added to /api/admin/referrals.
- Seller API guards added (/api/seller/gigs).
- More theme: updated bg-card in marketing + sellers/[id] pages.
- Payouts: wired mark-as-paid to call /api/admin/referrals PATCH from admin/payouts UI.
- Notifications: fixed racy email tracking by capturing in-app id (lib/notifications.ts).
- Hygiene: more devLog replacements, added root global-error.tsx for ErrorBoundary.
- Debt: deprecation notes on demo IDs, dev sqlite script, unused Providers/ClientLayout.
- tsc clean + full `npm run build` succeeded after changes.

Re-run full review or `grep -r "Severity: security" FULL-APP-REVIEW-63dd26d3.md` for remaining open items. (See also PRODUCTION_CHECKLIST.md for deploy items like live Wompi keys.)

## Continued Enhancements (auto-continue batch)
- Theme: additional fixes in marketing page (cards, buttons, sections, footer) and sellers/[id] (reviews, badges, CTAs, overlays) using bg-card, border-border, etc.
- Payouts: significantly tackled - enhanced /api/admin/referrals GET with pending/requested/paid per referrer + "Mark Paid" buttons in admin/referrals/page.tsx; integrated pending summary + mark buttons also in admin/payouts/page.tsx (now handles both seller nets and referrals); fixed Requested inclusion in seller referral stats (/api/referrals); PATCH updated to handle Requested; seller earnings UI reflects requested as pending.
- Notifications: fixed racy email tracking by capturing created notif id and passing to email helper (no more findFirst race).
- Hygiene: more devLog in notifications (rate, resend success, sms, tracking warn kept), auth etc.
- Added global-error.tsx for root ErrorBoundary with reset and digest.
- Legacy: added deprecation/TODO comments to demo IDs in auth.ts, dev sqlite script, marked unused Providers/ClientLayout.
- Auth types and seller guards already in prior.
- Final tsc + build verified clean.
- Aligned with PRODUCTION_CHECKLIST (Wompi warning code helps the "live keys" item; dev bypasses gated; admin promote via Google noted).

Many issues from original ~45 now addressed or mitigated. Remaining lower priority: full theme audit, persistent rate limits, more payout UI, remove more consoles, add tests, etc. App is significantly enhanced for production readiness.