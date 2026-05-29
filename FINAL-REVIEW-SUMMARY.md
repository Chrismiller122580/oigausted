# Review Summary

- **Mode**: local
- **Target**: uncommitted local changes (Oiga Usted gig platform)
- **Files reviewed**: 49 (38 tracked + 11 untracked)
- **Diff stats**: 38 files changed, 3323 insertions(+), 1422 deletions(-); 11 untracked files
- **Issue counts**: 18 bugs, 5 suggestions, 2 nits

## Top issues

[bug] /workspaces/oigausted/src/app/checkout/[gigId]/page.tsx:188 -- `isOwnGig` is referenced but never declared or computed (ReferenceError on every checkout render)
[bug] /workspaces/oigausted/src/app/api/webhooks/wompi/route.ts:10-34 -- No signature validation or integrity check on webhook; fake "Paid" events can complete any order
[bug] /workspaces/oigausted/src/lib/auth.ts:12-16 -- CredentialsProvider uses only hardcoded demo emails/IDs "1/2/3"; no DB lookup or password validation for real signups
[bug] /workspaces/oigausted/src/app/api/orders/[id]/messages/route.ts:18 -- Queries non-existent `prisma.message` model (should be `orderMessage` per current schema)
[bug] /workspaces/oigausted/src/app/api/gigs/route.ts:73 -- `fields`/`addons` sent as arrays but schema defines as `String?`; Prisma type errors on create/edit
[bug] /workspaces/oigausted/src/app/api/checkout/route.ts:30 -- `customFields: {}` passed to Order.create but field missing from current Prisma schema (runtime crash)

See the full review at: /tmp/grok-review-58054403.md
