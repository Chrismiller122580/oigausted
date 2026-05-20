# Oiga Usted - Final Pre-Release Code Review
**Target:** Uncommitted local changes (~49 files, ~4700 LOC diff)  
**Date:** 2026-05-20  
**Reviewer:** Grok (meticulous code review mode)  
**Project:** Colombian gig marketplace (Next.js 16 + NextAuth + Prisma + Wompi)  
**Focus areas:** Wompi payment reliability (priority), auth, data integrity, order/gig lifecycle, security, error handling, schema alignment

---

## Summary

This large diff represents a major refactor from localStorage/demo mocks to a real Prisma-backed database (switched to SQLite), NextAuth integration, full seller/buyer/admin dashboards, gig CRUD with pause/resume, interactive checkout with dynamic fields/addons, reviews system with rating recalculation, order chat/files, and Wompi widget + webhook flows. Significant polish on UX (toasts, empty states, optimistic updates, stats) and features (custom fields, seller gig management, admin moderation).

**Overall quality:** Functional in happy paths for demo accounts on local dev, but **riddled with correctness, consistency, and security issues** that make it unsuitable for production or even reliable pre-release testing. Dominant risk areas:
- **Payment flow (Wompi):** Unverified webhooks (critical), schema drift, race conditions in checkout, no transaction persistence.
- **Authentication:** Completely broken for real users (hardcoded credentials only, no DB integration, ID mismatches).
- **Data model/code sync:** Multiple Prisma schema vs. runtime mismatches (customFields, Message vs OrderMessage, fields/addons as String vs array).
- **Error handling & crashes:** Undefined variables, type mismatches causing immediate runtime failures.
- **Security:** Missing webhook sig validation, role checks relying on fragile casting, potential for fake orders/payments/reviews.

Many debug artifacts, console.logs, and incomplete migrations from prior iterations remain. The changes introduce far more bugs than they resolve in core flows. **Verdict: NOT READY for pre-release or production.** Blocking issues must be fixed before any live deployment or user testing beyond isolated demos. Recommend reverting DB to Postgres + full integration test of auth + payments + reviews before re-review.

---

## Issues

### Issue 1 -- Severity: bug
- File: /workspaces/oigausted/src/app/checkout/[gigId]/page.tsx:188
- Description: `isOwnGig` is referenced in a conditional render block but is never declared or computed anywhere in the component (no `const isOwnGig = ...`, no import, no prior definition). This causes a runtime `ReferenceError: isOwnGig is not defined` on every render of the checkout page after loading succeeds, breaking the "cannot buy own gig" protection and the entire flow.
- Suggestion: Compute `const isOwnGig = session?.user?.id && gig?.sellerId === session.user.id;` (after session/gig load) or remove the dead block. Align logic with GigCard.tsx which correctly computes it.
- Status: open

### Issue 2 -- Severity: bug
- File: /workspaces/oigausted/src/app/checkout/[gigId]/page.tsx:9
- Description: Duplicate `import { useRouter } from 'next/navigation';` (second one after the combined import on line 4). While JS may tolerate it, this is sloppy, can cause TS/linting issues, and the comment indicates incomplete cleanup.
- Suggestion: Remove the duplicate import line.
- Status: open

### Issue 3 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/checkout/route.ts:30
- Description: `customFields: {}` is passed to `prisma.order.create()`. The current Prisma schema (`/workspaces/oigausted/prisma/schema.prisma:84-101`) has no `customFields` field on the Order model (it was apparently dropped during the Json->String refactor or schema cleanup). This will throw a Prisma validation error at runtime on every checkout attempt.
- Suggestion: Either add `customFields String?` (or `Json?` if reverting) to the Order model in schema.prisma, regenerate client + migrate, or remove all references to customFields from create/PATCH paths. Update the PATCH in orders/[id] and the duplicate POST in /api/orders/route.ts consistently.
- Status: open

### Issue 4 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/orders/[id]/route.ts:64
- Description: PATCH handler unconditionally sets `updateData.customFields = customFields` (and accepts it in body at line 47) and passes to `prisma.order.update()`. Same schema mismatch as above; will fail for the pre-payment PATCH from checkout page (lines 71-78).
- Suggestion: See Issue 3. Also validate/serialize the value safely.
- Status: open

### Issue 5 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/orders/route.ts:52 (and 14)
- Description: The legacy order creation POST (used by some seller dashboard fetches?) also passes `customFields` to prisma.order.create. Schema does not define the field.
- Suggestion: Align schema or remove field usage. Consolidate order creation logic (avoid duplication between /api/checkout and /api/orders).
- Status: open

### Issue 6 -- Severity: bug
- File: /workspaces/oigausted/src/lib/auth.ts:12-16
- Description: `CredentialsProvider.authorize()` performs only hardcoded email checks for three demo accounts and returns static objects with ids "1", "2", "3". It never queries Prisma, never validates passwords, and ignores all real users created via signup. "any password works" per login UI. This makes the entire real-user auth flow non-functional.
- Suggestion: Implement proper DB lookup + password hashing (bcrypt/argon2) in authorize. Remove hardcoded demos or make them optional. Integrate with existing User.password field (currently dead).
- Status: open

### Issue 7 -- Severity: bug
- File: /workspaces/oigausted/src/lib/auth.ts:13-15 (and jwt/session callbacks)
- Description: Credentials return `id: "1"|"2"|"3"` (strings), but Prisma seed and real signups use UUIDs (e.g., '22222222-2222-...'). Session tokens carry these non-UUID ids. Any Prisma query using `session.user.id` (seller gigs, orders, reviews, etc.) will return empty results for demo logins, breaking seller dashboards, order ownership, etc.
- Suggestion: Either make credentials query real DB users (preferred) or update seed/auth to use consistent IDs. Add proper user upsert on Google signin too.
- Status: open

### Issue 8 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/auth/signup/route.ts:22-28
- Description: Creates User with name/email/role but **never stores the submitted password** (form collects it, but omitted from data). No hashing. Combined with auth.ts ignoring passwords/DB, signups are useless for login.
- Suggestion: Hash password (e.g., bcrypt) and store it. Update authOptions to validate against stored hash.
- Status: open

### Issue 9 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/webhooks/wompi/route.ts:10-34
- Description: Webhook receives `x-wompi-signature` header and loads `WOMPI_EVENTS_KEY` but performs **zero signature validation or integrity check** on the payload before trusting `transaction.status === 'APPROVED'` and unconditionally setting `order.status = "Paid"`. Anyone can POST fake events to complete arbitrary orders. No amount/reference verification, no transaction ID stored.
- Suggestion: Implement proper Wompi signature verification (HMAC with events key or integrity secret per their docs) before processing. Store `transaction.id`, `amount`, status history on Order. Handle DECLINED/ERROR. This is the #1 production blocker per project priorities.
- Status: open

### Issue 10 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/orders/[id]/messages/route.ts:18
- Description: Queries `prisma.message.findMany(...)` (and create at line 47). The Prisma schema defines only `OrderMessage` (and relation on Order), not a top-level `Message` model (old model was removed in the refactor per diff). This causes Prisma "model not found" errors; chat in order detail is completely broken.
- Suggestion: Rename queries to `prisma.orderMessage`, update include/relations, fix sender logic (current route doesn't check order membership or isFromBuyer). Align with OrderMessage model (id, content, isFromBuyer, orderId).
- Status: open

### Issue 11 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/orders/[id]/messages/route.ts:45 (POST)
- Description: Always does `await request.json()` for text messages. But order detail page (uploadFile) sends `FormData` for files to the same endpoint. This will throw on file uploads.
- Suggestion: Detect content-type; handle FormData for files (use existing /api/upload or save to OrderFile). Or split endpoints.
- Status: open

### Issue 12 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/gigs/route.ts:73 (POST) and /workspaces/oigausted/src/app/api/gigs/[id]/route.ts:88 (PUT)
- Description: `fields` and `addons` are stored directly from request body (arrays/objects from create-gig/page.tsx:161-162). Schema defines them as `String?` (lines 75-76). Prisma will reject with type error on gig creation or edit.
- Suggestion: Either change schema back to `Json?` (recommended for structured data) + update client, **or** `JSON.stringify()` before save + parse on read (as checkout page attempts inconsistently). Update GigCard, seller pages, etc.
- Status: open

### Issue 13 -- Severity: bug
- File: /workspaces/oigausted/src/app/create-gig/page.tsx:161
- Description: Payload sends `fields: selectedCategory?.fields || []` and addons as array of objects (never stringified). Matches the type mismatch above and will fail API calls.
- Suggestion: See Issue 12. Also, create-gig has incomplete select field support vs. checkout calc (only number/checkbox handled for pricing).
- Status: open

### Issue 14 -- Severity: bug
- File: /workspaces/oigausted/src/app/checkout/[gigId]/page.tsx:48-52 (loadGigAndCreateOrder) + 188 block
- Description: Always creates a Pending order via /api/checkout even before checking ownership. The `isOwnGig` guard (broken) comes too late in render; own-gig orders can be persisted in DB. No prevention on API side either.
- Suggestion: Add sellerId check in /api/checkout and /api/orders before creating. Return 403 early and prevent widget.
- Status: open

### Issue 15 -- Severity: bug
- File: /workspaces/oigausted/src/app/page.tsx:10-49
- Description: Root route is a debug redirector that renders visible `debugInfo` state ("Status: loading | Session: true", role detection) in the UI for all users, plus multiple `console.log` statements. Not a marketing landing (that lives at /(marketing)).
- Suggestion: Remove all debug state/UI/console. Make this a clean server-side role redirect or remove if marketing handles unauth.
- Status: open

### Issue 16 -- Severity: bug
- File: /workspaces/oigausted/src/app/checkout/[gigId]/page.tsx:102 (and openWompiWidget)
- Description: Widget is instantiated with `amountInCents: finalPrice * 100` (client-computed after dynamic fields), but the preceding PATCH + /api/checkout/wompi uses server order.price (updated in PATCH). Race possible if concurrent calls or failures; no re-fetch of final order amount before widget. Also, no handling of Wompi widget events (success/error) beyond redirect.
- Suggestion: After PATCH, re-fetch order and use its price for widget + reference. Store chosen customFields on order reliably. Listen to Wompi callbacks.
- Status: open

### Issue 17 -- Severity: suggestion
- File: /workspaces/oigausted/prisma/schema.prisma:6-7 (and entire file)
- Description: Datasource switched to `provider = "sqlite"` with local `file:./dev.db`. SQLite is unsuitable for production (no concurrent writes, file-based, poor Vercel/Heroku support). Original was Postgres.
- Suggestion: Revert to PostgreSQL + proper `DATABASE_URL`. Keep SQLite only for local dev with instructions. Ensure migration aligns (current migration.sql reflects the big model changes).
- Status: open

### Issue 18 -- Severity: suggestion
- File: /workspaces/oigausted/src/app/api/checkout/wompi/route.ts:6-7 + 43-53
- Description: Loads `WOMPI_INTEGRITY_KEY` but never uses it for signature generation (comment says "for the future"). Widget data lacks `signature` or `redirectUrl` with proper encoding that Wompi recommends for security.
- Suggestion: Implement integrity signature for the widget payload per Wompi docs before production.
- Status: open

### Issue 19 -- Severity: suggestion
- File: /workspaces/oigausted/src/lib/auth.ts:19-22 (GoogleProvider) + callbacks:30-43
- Description: Google sign-in works at OAuth level but user from provider has no `role`; callback defaults to "buyer". No upsert into Prisma User table (no adapter configured). Resulting sessions may have incomplete data vs. DB users.
- Suggestion: Add PrismaAdapter + proper Google profile mapping + role handling (e.g., via separate admin promotion flow).
- Status: open

### Issue 20 -- Severity: nit
- File: Multiple (e.g., src/app/api/gigs/[id]/route.ts:95, src/app/api/gigs/route.ts:26, src/app/api/checkout/route.ts:34, etc.)
- Description: Numerous `console.log("✅ ...")` and `console.error` statements left in production code paths. Some expose internal IDs or success details.
- Suggestion: Remove or gate behind `process.env.NODE_ENV === 'development'`. Use structured logging.
- Status: open

### Issue 21 -- Severity: suggestion
- File: /workspaces/oigausted/src/app/orders/[id]/page.tsx:28-29 + 34-60 (and similar in other dashboards)
- Description: `isBuyer`/`isSeller`/`isCompleted` computed from `order` state at module level (initially null, so always false on first render). Relies on re-render after fetch; no useMemo and potential flash of wrong UI. Permission checks are client-only (server APIs do check, but still).
- Suggestion: Use useMemo or derive inside effects. Ensure all sensitive actions have server enforcement (already partially done).
- Status: open

### Issue 22 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/admin/gigs/route.ts:17-24 (GET search) + similar in other admin routes
- Description: Admin role check uses `(session?.user as any)?.role !== 'admin'`. Works for credentials but fragile casting; fails silently or grants access incorrectly if session shape changes. No rate limiting or additional hardening.
- Suggestion: Create a typed helper `isAdmin(session)` in lib/auth or middleware. Consider JWT claims validation.
- Status: open

### Issue 23 -- Severity: suggestion
- File: /workspaces/oigausted/src/app/checkout/[gigId]/page.tsx:120-133 (getFields) + 138-154 (calculateExtra)
- Description: Dynamic field pricing only supports `number` and `checkbox` types for extras. `select` fields (supported in create-gig and category defs) are parsed but ignored for `finalPrice`. Summary section also skips them.
- Suggestion: Extend pricing logic to handle `select` (with `extraPrice` on options) for consistency.
- Status: open

### Issue 24 -- Severity: nit
- File: /workspaces/oigausted/src/app/(marketing)/page.tsx:333-380 (and other server components)
- Description: Marketing homepage performs multiple heavy Prisma queries (groupBy + findMany with take 200) on every request with no caching, ISR, or limits. Will scale poorly.
- Suggestion: Add `unstable_cache` or move stats to a precomputed API with revalidation.
- Status: open

### Issue 25 -- Severity: bug
- File: /workspaces/oigausted/src/app/api/orders/[id]/review/route.ts:62-68 + schema Review model
- Description: Review creation correctly restricts to buyer + Completed status. However, the Review model relations (`ReviewToBuyer`/`ReviewToSeller`) and fields assume reviewer is always buyer; no support for seller reviews of buyers yet (though schema has both). Also, GET review uses reviewerId filter which may not match seller viewing.
- Suggestion: Clarify review direction in UI/API; ensure seller can see reviews received.
- Status: open

---

## Additional Observations (Non-Blocking but Worth Noting)

- **Environment & secrets:** Wompi keys and Google OAuth are properly env-gated. No hardcoded secrets found. However, no `.env.example` updates visible for new keys (WOMPI_INTEGRITY_KEY, EVENTS_KEY).
- **Accessibility/UX:** Good use of toasts over alerts in most places (per prior polish), improved empty states, star ratings. Some forms lack proper labels or ARIA. Long pages (admin, seller gigs) could use better loading skeletons.
- **TypeScript:** Heavy use of `any` for gig/order/user (e.g., dozens in dashboards and pages). Improves velocity but hides bugs. Recommend stricter types or Prisma-generated types + Zod validation on APIs.
- **Testing/Edge cases:** No evidence of unit/integration tests for payment success/failure, concurrent orders, review races, or invalid gig field payloads. Order status machine has no state machine enforcement beyond string checks.
- **Performance:** Seller stats compute aggregates in JS after fetching all gigs; acceptable for small scale but N+1 risk.
- **Docs:** README (if present) should document the current demo-only auth and SQLite limitations explicitly.
- **Migration state:** `prisma/migrations/20260514223435_init/migration.sql` is a full reset; applying on existing Postgres would be destructive. Dev.db binary also changed.

---

**Final Verdict:** The changes deliver impressive feature breadth but the implementation has too many fundamental breaks (auth, payments, data persistence, runtime crashes) to be considered pre-release ready. Prioritize:
1. Fix auth (real DB + hash) + consistent IDs.
2. Restore schema alignment (add missing fields or change types) + migrations.
3. Secure Wompi webhook + make checkout robust.
4. Fix chat (OrderMessage) and remove debug.
5. End-to-end test of buyer → pay → review flow with real (non-demo) accounts.

Re-run this review after targeted fixes. The platform has strong potential once these core integrity issues are resolved.