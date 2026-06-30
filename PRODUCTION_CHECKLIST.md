# 🚀 Production Deployment Checklist - Oiga Usted

This checklist ensures a safe and complete production deployment on Vercel.

## Preferred Workflow: Production over Previews

To avoid issues with dynamic preview deployments (especially with Google OAuth `redirect_uri_mismatch`):

- **For testing production-like behavior** (auth, Google login, payments, etc.): Push to `main`. This updates the stable production deployment on `https://oigagig.com` (and the main `oigausted.vercel.app`).
- Use local development (`npm run dev` or `npm run dev:codespaces`) for rapid iteration.
- Only use Vercel preview deployments when necessary, and be aware that each new preview gets a unique URL that must be manually added to Google Console for OAuth testing.
- Treat previews as temporary — do not rely on them for stable auth or integration testing.

## Pre-Deployment

- [ ] All sensitive data removed from code (no hardcoded secrets, demo accounts only in dev)
- [ ] All dev-only testing UI is gated behind `process.env.NODE_ENV === 'development'`
- [ ] `prisma/schema.prisma` uses PostgreSQL via `env("DATABASE_URL")`
- [ ] `vercel.json` build command includes `prisma migrate deploy`
- [ ] Google OAuth configured in Google Cloud Console with production redirect URI
- [ ] Wompi keys are **Live** (not Sandbox) — or you are aware you're deploying in test mode
- [ ] `NEXTAUTH_SECRET` is strong and different from development
- [ ] `NEXTAUTH_URL` points to production domain (https://oigagig.com)

## Environment Variables in Vercel (Production)

Set these in Vercel Dashboard → Settings → Environment Variables (apply to Production and Build):

| Variable | Example / Notes |
|----------|-----------------|
| `DATABASE_URL` | **Accelerate connection string** from Prisma Data Platform: `prisma+postgres://accelerate.prisma-data.net/...` (this is the one that works from Vercel serverless). Do **not** use the raw postgresql:// direct URL here — it produces "Can't reach database server at `db.prisma.io:5432`". |
| `DIRECT_DATABASE_URL` | The **Direct connection** string from Prisma (for `prisma migrate deploy` only during builds). The safe-migrate script uses this. |
| `NEXTAUTH_URL` | `https://oigagig.com` |
| `NEXTAUTH_SECRET` | Strong random string (32+ chars) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `ADMIN_EMAILS` | Optional: real Gmail(s) that should become admin automatically (comma separated) |
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | `pub_prod_...` (from Wompi Comercios dashboard) |
| `WOMPI_INTEGRITY_KEY` | `prod_integrity_...` (Secretos para integración técnica → Integridad) |
| `WOMPI_EVENTS_KEY` | `prod_events_...` (Secretos para integración técnica → Eventos) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (for image uploads) |
| `NEXT_PUBLIC_APP_URL` | `https://oigagig.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API key (enable Maps JavaScript API + Places API) |

**Google Maps API key — HTTP referrer restrictions** (fixes `RefererNotAllowedMapError` on `/mapa`):

In [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials), edit the browser key and under **Application restrictions → HTTP referrers** add:

- `https://oigagig.com/*`
- `https://www.oigagig.com/*`
- `http://localhost:*/*` (dev)
- `https://*.vercel.app/*` (preview deploys, optional)

Use the `/*` suffix so paths like `/mapa` and `/gigs` are allowed. Saving can take a few minutes to propagate.
| `CRON_SECRET` | Strong secret for protecting digest cron endpoint (used by Vercel scheduled functions or admin) |

## Google Maps (for gig location autocomplete in Create Gig + near-me filters)
- [ ] Create a Google Cloud project and enable **Maps JavaScript API** + **Places API**
- [ ] Create an API key and restrict it (HTTP referrers) to your production domain: `https://oigagig.com/*`
- [ ] Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to Vercel Production env vars
- [ ] (Optional but recommended) Also add it to your local `.env` / `.env.development.local` for dev

## Google OAuth (Recommended for Admin)

- [ ] Create OAuth 2.0 Client ID in Google Cloud Console (Web application)
- [ ] Add these in Google Console (production only):
  - Authorized JavaScript origins: `https://oigagig.com`
  - Authorized redirect URIs: `https://oigagig.com/api/auth/callback/google`
- [ ] (Optional) Also add the main stable Vercel deployment: `https://oigausted.vercel.app/api/auth/callback/google`
- [ ] **Note on Previews**: Each new Vercel preview deployment gets a unique random URL. These must be manually added to Google Console if you need to test Google login on a preview. For stable auth testing, push to `main` and test on `https://oigagig.com`.
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel
- [ ] Add `ADMIN_EMAILS=oigaustedcolombia@gmail.com` in Vercel (this Gmail will auto-become admin on Google login)

## Database

- [ ] Using real PostgreSQL (not SQLite)
- [ ] `DATABASE_URL` points to production database
- [ ] Run `prisma migrate deploy` (handled automatically by Vercel build). New in 2026: the `Notification.resendEmailId` column (for email tracking) requires the migration `add_resend_email_id_to_notification` to be in your migrations folder and deployed.

## After First Successful Deploy

- [ ] Set up Admin via Google (recommended):
  - Add `ADMIN_EMAILS=oigaustedcolombia@gmail.com` in Vercel
  - After deploy, go to `/login` and click "Continue with Google" using `oigaustedcolombia@gmail.com`
  - The user will automatically be created with admin role.

  Alternative (manual):
  ```bash
  # Promote any Gmail to admin
  (set -a; source .env.development.local; npx tsx scripts/promote-to-admin.ts oigaustedcolombia@gmail.com)
  ```
- [ ] Test critical flows:
  - Login (credentials + Google)
  - Signup
  - Create gig (as seller)
  - Checkout + Wompi (test mode if using sandbox keys)
  - Profile updates + image upload
  - Order management
- [ ] Verify Google OAuth works with the production domain
- [ ] Add custom domain `oigagig.com` in Vercel (if not done yet)
- [ ] Update Google Console with final custom domain if different from Vercel URL

## Post-Launch

- [ ] Switch Wompi to **Live** keys when ready to accept real payments
- [ ] Monitor logs for any issues
- [ ] Set up proper monitoring / error tracking (optional but recommended)
- [ ] Remove or further restrict any remaining dev testing tools if desired

### Deployment Log

- **2026-05-26**: First production deploy attempt on Vercel (branch: `fix/post-review-blockers`).
  - Using temporary `prisma db push --accept-data-loss` due to SQLite → Postgres migration history incompatibility.
  - Target domain: https://oigagig.com (and Vercel preview)

- **2026-05-28**: Switched to proper migrations.
  - Updated `vercel.json` to use `prisma migrate deploy` instead of `db push --accept-data-loss`.
  - All future deploys will now run real migrations safely.

- **2026-06-13**: Merged `feat/oiga-gig-1.0-facelift` into `main` and deployed to prod (https://oigagig.com).
  - Landing page no longer starts in dark mode (ThemeProvider default "light", no enableSystem for new visitors; toggle preserved).
  - Committed the 22 custom AI-generated category icons (public/icons/*.jpg) + Oiga-GiG-1.0-Facelift-Design-Plan.md.
  - Cleaned up temporary implementation review artifact .md files.
  - Note: core facelift visual/landing redesign and icon-registry wiring from the plan are available in the design doc and assets for follow-up; current committed landing still uses emoji category grid + pre-redesign structure. Dark mode default + prep commits are live.

### Developing locally against Production DB (Codespaces)

When testing against the real production database from GitHub Codespaces:

1. Pull production environment variables:
   ```bash
   vercel env pull .env.development.local
   ```

2. Start the dev server with the safe script:
   ```bash
   npm run dev:codespaces
   ```

This automatically sets the correct `NEXTAUTH_URL` for your current Codespace, avoiding redirect loops after login caused by stale values from Vercel.

### Switching from `db push` back to proper migrations (recommended after first deploy)

After the first successful deploy:

1. In `vercel.json`, change the build command back to:
   ```json
   "buildCommand": "prisma generate && prisma migrate deploy && next build"
   ```

2. Commit and push the change (or redeploy manually from Vercel).

3. Future deploys will use real migrations.

### Resolving a failed migration (e.g. P3009 or P3018)

The build command now uses `./scripts/prisma-safe-migrate.sh`, which **automatically detects** a failed migration (P3009) for the known `20260604015327_enhance_audit_for_all_system_changes` migration and runs `prisma migrate resolve --rolled-back` before retrying.

This means future deploys should recover automatically.

If you ever need to do it manually:

1. Pull production env:
   ```bash
   vercel env pull .env.production.local
   ```

2. Resolve using direct URL:
   ```bash
   DATABASE_URL="$DIRECT_DATABASE_URL" npx prisma migrate resolve --rolled-back 20260604015327_enhance_audit_for_all_system_changes
   ```

3. Redeploy.

See the script for details and https://www.prisma.io/docs/concepts/components/prisma-migrate/resolve-migration-issues .

## Useful Commands

```bash
npm run build                 # Test production build locally
npm run create-admin          # Create admin user (pass DATABASE_URL)
npx prisma studio             # Inspect database
npm run dev:codespaces        # Recommended when developing in GitHub Codespaces (auto-sets NEXTAUTH_URL)
```

> **Tip for Codespaces + Production DB**: When you run `vercel env pull .env.development.local` to test against real production data, `NEXTAUTH_URL` may be stale. Use `npm run dev:codespaces` or manually set `NEXTAUTH_URL=https://your-codespace-url npm run dev`.

---

**Current Known State (as of last update):**
- Wompi is using **Sandbox** keys (payments are simulated).
- Dev testing tools (quick demo logins) are available only in development.
- Real admin accounts are created with `npm run create-admin` and work across all environments against the same production database.
