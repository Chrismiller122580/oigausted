# What's New – OigaUsted

## Post full-app review fixes (2026-06 follow-ups from FULL-APP-REVIEW-2b0773a1 + delta)
- **Data integrity**: prisma.$transaction added to critical paths (wompi webhook for payment+referral earning; orders PATCH for status change + referral create + earnings cancel + audit).
- **Security**: Removed visible prod "BETA BYPASS" UI and handler in checkout; manual `Paid` transition now only via webhook or admin (dev simulate gated by NODE_ENV).
- **Json compat (schema + wrapper)**: Added `toPrismaJson()` helper in lib/utils; updated writes in audit.ts, notifications.ts (create + deliveryLog tracking), resend webhook to pass objects in pg (native Json) while stringify under sqlite-dev wrapper. Reads already defensive.
- **Dev wrapper**: Restored signal traps + explicit restore in with-local-sqlite.sh; updated stale comments; better generate error surfacing + git fallback restore.
- **Hygiene**: Replaced ~20+ non-fatal console.* (errors on expected paths, logs) with devLog in orders/*, gigs/*, webhooks/*, checkout page, layout mapsGuard (removed 3 consoles from always-on script). Count reduced.
- **Types/debt**: Extended next-auth.d.ts with referredById, whatsapp, isActive, customReferralRate, referralCode; cleaned repeated (as any) in lib/auth.ts jwt/session callbacks and helpers.
- **Config integrity**: PlatformConfig now uses fixed id="singleton" + upsert in admin/config (race-safe); other findFirst still work.
- **Theme**: Replaced legacy text-gray-*/bg-gray-*/bg-white in GigCard, DynamicCheckoutFields, GrokAssistant, orders timeline, admin support/settings, login, signup, maps prompts, seller pages etc with semantic tokens (text-muted-foreground, bg-card, border-border, bg-muted, bg-background).
- **Legacy**: Deleted unused ClientLayout.tsx + Providers.tsx (no imports).
- **Ops/docs**: Added CRON_SECRET to .env.example + PRODUCTION_CHECKLIST table.
- **Other**: Minor guard cleanups, tx in admin/referrals mark-paid + audit.

tsc clean; many review items mitigated (more tx, bypass removed from prod, compat exercised, consoles/anys reduced, theme+legacy improved). Remaining per review: more tx coverage, full any/lint cleanup, payout ledger model, resend efficiency, impersonate, pagin, tests.

## Major Release: Referral Accounting Overhaul + Notification System 2.0

This release focuses on two critical areas: **making the money flow correct** and **making notifications actually useful**.

### 1. Proper Accounting & Referral Program Fixes

**Before:** Sellers saw the full order price as earnings. The 12% platform commission and 5% referral fees were not reflected anywhere in the payout or earnings UI. The referral fee was created as a separate record but never properly accounted for.

**After:**
- Created a single source of truth in `src/lib/payout.ts` with `calculateOrderPayout()` and `aggregatePayouts()`.
- Seller earnings now correctly show **net amounts** after the 12% platform fee.
- Admin Payouts page now displays:
  - Net amount to pay sellers
  - Estimated platform revenue
  - Total referral liability
- Referral earnings now correctly record the rate that was actually used (`rateUsed`).
- Added support for **per-referrer custom commission rates** (editable in Admin → Users).

### 2. Per-User Custom Referral Rates

- New field: `User.customReferralRate`
- If set on a user, it overrides the global `PlatformConfig.referralCommissionRate` for any orders from sellers they referred.
- Fully integrated into:
  - Order completion flow
  - Wompi webhook
  - Admin Users page (editable per user)
  - Admin Referrals summary (shows "Effective Rate" + custom indicator)
  - User's own Referrals dashboard

Default remains 5% unless an admin explicitly changes it for a specific referrer.

### 3. Notification System – Major Upgrade

- **Real-time updates** via Server-Sent Events (SSE) – much faster than the old 45s polling.
- **Rich actionable toasts** using Sonner. Notifications can now include buttons that perform real actions (e.g., "Iniciar Pedido", "Marcar como Enviado", "Responder", "Dejar Reseña").
- **Delivery tracking**:
  - Email status (sent, delivered, opened, clicked, bounced, failed) via Resend webhooks.
  - Push delivery/click tracking from the Service Worker.
- **Quiet Hours** – users can now set periods where email and real push are suppressed (in-app still works). Live status indicator in settings.
- **Notification Logs** – new powerful admin tool at `/admin/notifications` with advanced filters (search, category, email status, push status, date range, read/unread).
- Many other improvements: better templates, rate limiting, grouping, etc.

### 4. Other Improvements

- Admin Referrals page now shows the effective commission rate per referrer.
- Seller earnings page includes a clear explanation of how commissions are calculated.
- Centralized payout logic makes future changes much safer and more consistent.

---

**Status:** These changes are currently in a development worktree. A full deployment + migration checklist has been prepared (`DEPLOYMENT_CHECKLIST.md` and `MIGRATION_RUNBOOK.md`).

This is one of the most important foundational improvements to the platform's financial integrity and user communication in a while.