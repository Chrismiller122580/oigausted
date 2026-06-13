# Migration Runbook – Referral Accounting + Notification System Overhaul

**Target Release:** Accounting + Notifications 2027 improvements

**Date:** [Fill in when running]

**Owner:** [Your name]

---

## 1. Overview of Changes

This migration introduces:
- Per-user custom referral commission rates (`User.customReferralRate`)
- Proper net payout calculations across the platform (12% platform fee + 5% referral)
- Full notification delivery tracking
- Rich actionable toasts + real-time updates (SSE)
- Quiet hours + advanced admin notification logs

**Critical files changed:**
- `prisma/schema.prisma` (new fields on `User` and `Notification`)
- `src/lib/payout.ts` (new source of truth)
- Multiple order completion paths
- Admin users, referrals, payouts, and notifications pages
- New webhooks and tracking endpoints

---

## 2. Pre-Migration Checklist

- [ ] All code is merged into the target branch (`main` or release branch)
- [ ] `npm run build` passes cleanly
- [ ] You have a recent backup of the production database
- [ ] You have access to:
  - Production database
  - Vercel (or your hosting platform)
  - Resend dashboard (for webhook)
- [ ] Team has been notified of the upcoming change

---

## 3. Migration Steps (Strict Order)

### Step 1: Deploy Code First (Important)

1. Merge the branch containing these changes.
2. Deploy to production **before** running the database migration.
   - This ensures the new code that understands the new schema is already live.

**Why?** Some new code paths (especially in `getEffectiveReferralRate`) are called during normal order flows. Having the code live first is safer.

### Step 2: Run Database Migration

```bash
# On your local machine or a secure bastion (never run directly on prod if possible)
npx prisma migrate deploy
```

Or if using Vercel + Prisma:
- Trigger the migration via your CI/CD or manually on a machine with production `DATABASE_URL`.

**Monitor** the migration. It should be fast (mostly `ALTER TABLE ADD COLUMN`).

### Step 3: Regenerate Prisma Client

After migration succeeds:

```bash
npx prisma generate
```

Redeploy if your hosting requires it after `prisma generate`.

### Step 4: Configure Environment Variables

Ensure these exist in production:

```env
# For real Web Push (optional but recommended)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# For secure digest cron triggers (recommended)
CRON_SECRET=your-long-random-secret-here
```

### Step 5: Configure Resend Webhook (for email tracking)

1. Go to Resend Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/resend`
3. Subscribe to these events:
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.failed`

### Step 6: Verify Vercel Cron Jobs

- Go to Vercel Project → Settings → Cron Jobs
- Confirm the two jobs from `vercel.json` are registered:
  - Daily digest at 08:00
  - Weekly digest (Mondays) at 08:00

---

## 4. Post-Migration Verification

Run through this checklist in **production**:

### Accounting & Referrals
- [ ] Create a test order with a referred seller
- [ ] Complete the order
- [ ] Verify a `ReferralEarning` was created with the correct `rateUsed`
- [ ] Check the referrer’s dashboard shows the correct rate
- [ ] Check seller earnings shows net amount (not full gross)
- [ ] In Admin → Payouts, confirm net amounts + platform revenue + referral liability are displayed correctly

### Custom Referral Rates
- [ ] In Admin → Users, edit a referrer and set a custom rate (e.g. 0.07)
- [ ] Create a new order from one of their referred sellers
- [ ] Confirm the new `ReferralEarning` uses 7% (not 5%)

### Notifications
- [ ] Trigger several notifications and verify they appear in real-time (SSE)
- [ ] Test actionable toasts (e.g. "Iniciar Pedido")
- [ ] Test Quiet Hours (set a window that includes now)
- [ ] Check Admin → Notifications → Logs shows delivery status

### General
- [ ] Run `npx prisma studio` (or equivalent) and spot-check new fields
- [ ] Check Admin Stats page for updated numbers

---

## 5. Rollback Plan

### If something breaks after deployment:

1. **Immediate code rollback**
   - Revert the merge on GitHub → Vercel will redeploy the previous version automatically.

2. **Database rollback** (only if necessary)
   - The migration is mostly additive columns.
   - You can usually leave the columns (they are nullable).
   - If you must fully revert:
     ```sql
     -- Example (adjust as needed)
     ALTER TABLE "User" DROP COLUMN IF EXISTS "customReferralRate";
     -- Repeat for Notification fields if causing issues
     ```

3. **Data safety**
   - All `ReferralEarning` records store `rateUsed` at creation time. Historical data is protected even if you roll back code.

---

## 6. Known Limitations (Still in Beta)

- Actual seller payouts are still manual / semi-manual
- Admin Payouts page is improved but not a full accounting system yet
- Real Web Push requires VAPID keys to be configured
- Some notification actions are still limited in scope

---

## 7. Contacts & Escalation

- **Technical Owner:** [Your name]
- **Database issues:** [DB admin]
- **Vercel / Deployment:** [DevOps / You]
- **Resend issues:** Check Resend status page

---

**Last Updated:** [Date]

**Run this checklist in order.** Do not skip the "Deploy Code First" rule.