# Review Summary

- **Mode**: full app codebase review (post recent Mac/Apple + audit changes)
- **Target**: OigaUsted gig platform (all src, focus specified areas)
- **Files reviewed**: 80+ (admin/*, gigs/*, seller/*, create/checkout, layout/nav/theme, apis for gigs/orders/users/auth, lib/, css)
- **Diff stats**: N/A (full review, not incremental; last commit 2ba98f4 touched 17 files)
- **Issue counts**: ~42 total (many bugs in theme + authz, suggestions, nits); see /tmp/grok-review-35040d4d.md for full

## Top issues

[bug] src/components/layout/AdminNavbar.tsx:76 -- Hardcoded `text-white` (and other zincs) on admin name; invisible/broken in light mode
[bug] src/app/admin/users/page.tsx:268 (and 5+ other admin pages: gigs, payouts, earnings, support, settings, grok-build) -- Pages and tiles use forced `bg-zinc-950 text-white border-zinc-800` etc without semantic vars or dark:; theme toggle does nothing for admin sections
[bug] src/app/api/user/become-seller/route.ts:4 -- No auth/session check; any user can promote arbitrary userId to seller
[bug] src/app/api/orders/[id]/route.ts:40 -- PATCH allows any logged user to mutate any order (no buyer/seller check)
[bug] src/app/api/orders/[id]/messages/route.ts:51 -- Messages POST/GET on any orderId, no ownership
[bug] (toast) 20+ files e.g. src/app/create-gig/page.tsx:14 -- Import react-hot-toast but only Sonner mounted in layout; toasts fail silently
[bug] src/app/gigs/[id]/page.tsx + checkout -- Inactive gigs reachable in buyer detail/checkout (no isActive enforcement)
[bug] src/app/admin/page.tsx + nav -- Some zinc hardcodes in overview too; multiple ModeToggle renders in admin
[suggestion] src/app/create-gig/page.tsx:192 -- Client-only price calc sent to server (tamper risk)
[suggestion] scripts/dev-codespaces.sh + src/lib/orderStorage.ts -- Unix/FS assumptions (minor for Mac/PC)
[nit] src/app/layout.tsx:54 -- Long inline mapsGuard script may affect Safari/Mac timing

See the full review at: /tmp/grok-review-35040d4d.md
