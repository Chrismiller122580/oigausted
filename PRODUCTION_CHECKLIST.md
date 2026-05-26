# 🚀 Production Deployment Checklist - Oiga Usted

This checklist ensures a safe and complete production deployment on Vercel.

## Pre-Deployment

- [ ] All sensitive data removed from code (no hardcoded secrets, demo accounts only in dev)
- [ ] All dev-only testing UI is gated behind `process.env.NODE_ENV === 'development'`
- [ ] `prisma/schema.prisma` uses PostgreSQL via `env("DATABASE_URL")`
- [ ] `vercel.json` build command includes `prisma migrate deploy`
- [ ] Google OAuth configured in Google Cloud Console with production redirect URI
- [ ] Wompi keys are **Live** (not Sandbox) — or you are aware you're deploying in test mode
- [ ] `NEXTAUTH_SECRET` is strong and different from development
- [ ] `NEXTAUTH_URL` points to production domain (https://oigagig.co.com)

## Environment Variables in Vercel (Production)

Set these in Vercel Dashboard → Settings → Environment Variables (apply to Production):

| Variable | Example / Notes |
|----------|-----------------|
| `DATABASE_URL` | Your production Postgres connection string (with `?sslmode=require`) |
| `NEXTAUTH_URL` | `https://oigagig.co.com` |
| `NEXTAUTH_SECRET` | Strong random string (32+ chars) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Live key (or sandbox if still testing) |
| `WOMPI_INTEGRITY_KEY` | Live key |
| `WOMPI_EVENTS_KEY` | Live key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (for image uploads) |
| `NEXT_PUBLIC_APP_URL` | `https://oigagig.co.com` |

## Google OAuth

- [ ] Added production redirect URI in Google Cloud Console:
  `https://oigagig.co.com/api/auth/callback/google`
- [ ] Added production domain under Authorized JavaScript origins

## Database

- [ ] Using real PostgreSQL (not SQLite)
- [ ] `DATABASE_URL` points to production database
- [ ] Run `prisma migrate deploy` (handled automatically by Vercel build)

## After First Successful Deploy

- [ ] Create first Admin user:
  ```bash
  DATABASE_URL="your-production-db-url" npm run create-admin admin@oigagig.co.com StrongPassword123!
  ```
- [ ] Test critical flows:
  - Login (credentials + Google)
  - Signup
  - Create gig (as seller)
  - Checkout + Wompi (test mode if using sandbox keys)
  - Profile updates + image upload
  - Order management
- [ ] Verify Google OAuth works with the production domain
- [ ] Add custom domain `oigagig.co.com` in Vercel (if not done yet)
- [ ] Update Google Console with final custom domain if different from Vercel URL

## Post-Launch

- [ ] Switch Wompi to **Live** keys when ready to accept real payments
- [ ] Monitor logs for any issues
- [ ] Set up proper monitoring / error tracking (optional but recommended)
- [ ] Remove or further restrict any remaining dev testing tools if desired

## Useful Commands

```bash
npm run build                 # Test production build locally
npm run create-admin          # Create admin user (pass DATABASE_URL)
npx prisma studio             # Inspect database
```

---

**Current Known State (as of last update):**
- Wompi is using **Sandbox** keys (payments are simulated).
- Dev testing tools are available only in development.
- First admin must be created manually after deployment.
