# What's New – OigaUsted

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