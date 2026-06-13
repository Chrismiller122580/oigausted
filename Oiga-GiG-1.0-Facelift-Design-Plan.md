# Oiga GiG 1.0 Facelift: Modernized Landing Page + Premium Custom Icons & Visual Identity

**Design Document**  
**Date:** 2026-06-13  
**Author:** Systems Architect (Grok)  
**Branch proposal:** `feature/oiga-gig-1.0-facelift` (from `landing-page-and-icon-upgrade` worktree)  
**Status:** Ready for review & incremental implementation

---

## Overview

This design document outlines a premium "facelift" for the public-facing first impression of **Oiga GiG 1.0** (the OigaUsted / Oiga Gig two-sided Colombian local services & gigs marketplace). The focus is:

- A modernized, vibrant, trustworthy marketing landing page at the public root (for logged-out users).
- Replacement/upgrade of cute Unicode emoji category icons (currently ~22 categories) with a cohesive set of **premium, custom, AI-generated branded icons**.
- Delightful frontend polish (micro-animations, better visual hierarchy, social proof).
- Full respect for existing dynamic branding (admin-configurable `siteName`, `siteTagline`, `logoUrl`).
- Updates to PWA manifest, OG images, favicons, metadata, and cross-cutting first-impression surfaces.
- All changes are incremental, mobile-first, dark/light compatible, and non-breaking for logged-in flows, admin tools, checkout, GigCard, seller profiles, etc.

**Key files referenced throughout (verified via exploration):**
- Primary landing: `src/app/(marketing)/page.tsx`
- Root router: `src/app/page.tsx` (anon → `<MarketingHomePage />`)
- Categories (static + dynamic): `src/lib/gig-categories.ts` (exactly 22 entries with icons like `🧹`, `🎧`, `⚖️`, `🖼️`, `🍲`, `📸`, `🚚`, `📦`, `💄`, `📚`, `🧶`, `🧘`, `📱`, `💻`, `🎥`, `📋`, `✍️`, `🔧`, `🚰`, `🗣️`, `🏠`, `🎉`), `src/lib/categories.ts` (exports `getGigCategories()`, `categoryEmojis`), `src/lib/category-registry.ts`, `src/lib/useGigCategories.ts`
- Prisma: `prisma/schema.prisma` (`model Category { icon String @default("🛠️") ... }`, `model PlatformConfig { siteName, siteTagline, logoUrl ... }`)
- Logo + nav: `src/components/common/Logo.tsx` (fetches `/api/admin/config`, renders admin `logoUrl` or hardcoded orange "OU" rounded-xl), `src/components/layout/NavbarWrapper.tsx` (public nav case), `src/components/layout/BuyerNavbar.tsx`, `SellerNavbar.tsx`, `AdminNavbar.tsx`
- Assets: `public/icon.png` (current app icon: "OU" yellow/blue rounded square + phone glyph), `public/logo.png` (full "Oiga Usted" megaphone + Colombian flag colors + tagline), `public/apple-icon.png`, `src/app/favicon.ico`, `src/app/manifest.ts`, `src/app/layout.tsx` (generateMetadata + icons)
- Theme: `src/app/globals.css` (Tailwind 4 + oklch tokens + modern radius, `tw-animate-css`; marketing uses explicit `from-orange-600 via-red-600 to-rose-600` + radial dots)
- Other first-impression surfaces: `src/components/common/GigCard.tsx` (orange accents, category text badges using exact `text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full`), `src/app/gigs/page.tsx` (dynamic emoji map from API + filter pills), `src/app/sellers/[slug]/page.tsx` (public seller profiles using GigCards), `src/app/login/page.tsx` (custom gradient "O" + "OigaUsted" text), `src/app/signup/page.tsx` (gradient hero with direct `/logo.png` + dynamic siteName text), admin category manager `src/app/admin/categories/page.tsx` (contains stale "20 categories" literals in empty-state prose despite dynamic header using `staticGigCategories.length`) + API `src/app/api/admin/categories/route.ts` + public `src/app/api/categories/route.ts`, seed `prisma/seed.ts`
- Existing power: `/admin/marketing` AI studio (see `AI_MARKETING_STUDIO.md`) + Grok integration.
- Docs: `README.md`, `WHATS_NEW.md`, `PRODUCTION_CHECKLIST.md`

Current landing (verified):
- Hero: bold Colombian-flag-badge + gradient + simple CTAs + trust line with emojis.
- Categories: 6-col responsive grid (first 12 from DB or static), large emoji (text-5xl), name, partial hardcoded short desc map (14/22 entries in `categoryDescriptions`; falls back to generic), rating badge or "Disponible ahora". (Note: DB `Category.description` + getGigCategories already support rich per-category text but are not yet used here.)
- Cómo funciona: 3 static numbered orange-circle steps.
- Final CTA + minimal "OigaUsted" footer.
- Hardcoded strings mixed with dynamic branding.

**~22 categories impacted.** PWA/SEO/OG impact: high (manifest, layout metadata, social images).

The "newest hottest tool" leveraged: **AI image generation** (available `image_gen` tool + visualPrompts from existing marketing AI studio) for a bespoke, consistent premium icon set (and optionally hero visual/updated mark).

---

## Background & Motivation

OigaUsted (Oiga GiG) is a solid Next.js 16 + TS + Tailwind 4 + shadcn + Prisma + Wompi + real-reviews + chat-in-orders + dynamic-category-fields platform focused on **local trust in Colombia** (Bucaramanga initial, expanding). Backend and admin tools (especially the sophisticated Grok-powered AI Marketing Studio at `/admin/marketing`) are strong. Post full-app reviews and referral/notification overhauls (see `WHATS_NEW.md`), the "front door" — the logged-out marketing experience and category visual language — still feels functional but not yet *premium*.

**Current pain points (verified):**
- Emojis (`🧹 Limpieza`, `🎧 Musica`, etc.) are friendly/cute but inconsistent in visual weight, not brand-cohesive, and read as "consumer app v0.5" rather than "professional local services marketplace 1.0".
- No per-category custom assets; everything falls back to Unicode in `Category.icon` (DB string) + static map.
- Landing is minimal: good gradient but basic trust signals, no stats, no real testimonials/social proof, static how-it-works, limited motion (only Tailwind transitions + `tw-animate-css`; **no framer-motion**). Note also stale "20 categories" prose literals in `src/app/admin/categories/page.tsx` empty-state (despite gig-categories.ts having exactly 22 and runtime header using `staticGigCategories.length`).
- Hardcoded "OigaUsted" (and direct assets) in `src/app/(marketing)/page.tsx`, login, signup, etc., despite strong dynamic branding support in `PlatformConfig` + `Logo.tsx` + layout `generateMetadata`.
- Assets are basic PNGs (no vector per-category set, no optimized hero illustration).
- First impressions elsewhere (`/gigs` category pills, GigCard using `text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full` text-only pills, public seller pages, login/signup) inherit the emoji + orange text-badge treatment.
- Marketing page uses a partial hardcoded `categoryDescriptions` Record (only 14 of 22 entries; falls back to generic) even though `getGigCategories()` already surfaces `Category.description` from DB/admin.
- Motivation aligns with "Oiga GiG 1.0" push: after core reliability (payments, reviews, chat, admin AI tools), polish the buyer/seller acquisition surface for higher trust and conversion in a competitive Colombian services market.

Existing strengths to preserve/enhance: vibrant orange-red-rose Colombian energy, dynamic everything (categories load from DB with static fallback), dark/light via oklch, mobile-first (44px+ taps), no breakage to admin/user flows or existing gig creation/checkout.

---

## Goals & Non-Goals

**Goals (measurable):**
- Deliver a premium, trustworthy, modern Colombian-vibrant landing that feels "1.0".
- Replace emoji icons with a consistent, high-quality custom icon set (AI-generated, ~22 icons) that works in light/dark, at multiple sizes (category cards, filters, GigCard badges, admin table, PWA).
- Add delightful, performant motion (framer-motion) for category hovers/entrances, hero, steps — without perf cost or accessibility regression.
- Add credible social proof: real(ish) stats (gigs count, cities, reviews via Prisma queries on landing), 3-4 rotating or seeded testimonials, trust badges (reviews, Wompi, local).
- Improve visual hierarchy, copy, CTAs, and how-it-works (icon + motion enhanced steps).
- Keep 100% dynamic branding support (Logo.tsx, metadata, public nav via NavbarWrapper).
- Update PWA/OG/manifest/favicons for the new identity (new icon set + possibly refined logo mark).
- Provide clean migration path for icons (backward compat with emoji in `Category.icon`).
- Quantified impact: 22 categories upgraded, improved first-load perception on `/`, `/gigs?categoria=...`, public seller pages, login.
- Incremental: ship value in small PRs; each independently improves the front door.

**Non-Goals:**
- Do not redesign logged-in dashboards, full admin, checkout flows, or gig creation (beyond consistent icon usage).
- Do not replace all lucide-react icons across the app (keep for UI affordances; new icons are category/brand-specific).
- No heavy paid icon library purchase (leverage AI gen + lucide fallbacks).
- No breaking changes to Prisma Category model or seed if avoidable (additive fields preferred).
- No new major backend (icon storage can be public/ SVGs + optional DB iconKey).
- Do not introduce A/B testing or complex feature flags for v1 of the facelift (simple rollout via merge order).
- Do not overhaul global color tokens (preserve oklch + orange brand in marketing).

---

## Proposed Design

### 1. Hero Redesign (`src/app/(marketing)/page.tsx`)
- Keep the powerful gradient (`from-orange-600 via-red-600 to-rose-600`) + radial dot pattern + Colombian 🇨🇴 badge — this is on-brand and energetic.
- Enhance: subtle parallax or motion on badge/illustration (framer-motion), refined headline/sub (keep core "El servicio que necesitas, con gente de confianza." but tighten sub for clarity + local cities).
- Add a small live stat strip (e.g. "2,847 gigs publicados • 1,203 reseñas reales • Bucaramanga + 12 ciudades").
- Right side or background: premium hero visual (AI-generated illustration: diverse Colombian professionals + map elements + warm tones, or refined megaphone mark from `public/logo.png`).
- CTAs unchanged in destination but upgraded with better hover/active states + motion (scale + shadow).
- Trust line upgraded: icons + text ("⭐ Reseñas reales • 💬 Chat directo en órdenes • 💳 Wompi seguro") or lucide equivalents.

**Mermaid before/after (simplified):**
```
Before: [Badge] → H1 → p(sub) → [2 CTAs] → emoji trust
After:  [Badge + subtle motion] → H1 → p(sub + stats) → [Premium CTAs] → [Visual/Illustration] → polished trust row
```

### 2. Categories Presentation Upgrade (Core of Facelift)
- **From:** Large emoji (`text-5xl`) + name + desc + optional rating pill. Grid 2-6 cols. Pure emoji from `categoryEmojis[name]` or `cat.icon`. Descriptions pulled from incomplete local `categoryDescriptions` Record in the marketing page (only 14/22 entries; others fall to generic "Profesionales locales disponibles").
- **To:** Premium custom icon (consistent style: line + subtle fill, Colombian warmth, orange accents on active/hover, sized nicely ~64-80px or SVG 1em scalable). Card upgrade: better padding, hover lift + border-orange + soft shadow, micro scale on icon (framer), rating pill refined.
- **Descriptions strategy (explicit decision):** Leverage and extend the existing `Category.description` field (already present in `prisma/schema.prisma`, populated/editable in admin categories form, and surfaced by `getGigCategories()` / `useGigCategories()` as `description?: string`) as the source of truth for card descriptions on the redesigned landing and related surfaces. In PR4, update `src/app/(marketing)/page.tsx` popularCategories construction (and any parallel in `/gigs`) to prefer the `description` from the fetched category objects (via `getGigCategories()`) and merge/extend or fully deprecate the partial client-side `categoryDescriptions` map. Backfill missing descriptions for the 22 via seed or admin "Sync initials" (or direct admin edits). This unifies with the dynamic category system instead of maintaining a separate stale map.
- Icons sourced from new **icon registry** (see API/Interface). DB `Category.icon` remains emoji for backward compat (used in admin table, seed, fallback everywhere). New optional `iconKey?: string` (e.g. "limpieza-hogar") or `iconUrl?: string` on Category (additive migration).
- Render path (landing + `/gigs` + GigCard category badge + admin):
  - Prefer registry component / `<img src="/icons/limpieza-hogar.svg" />` or inline SVG by key.
  - Fallback: existing emoji (or lucide icon mapped by key).
- Display top N (12 or all 22) with "Ver todas" linking to `/gigs`.
- Filterable/searchable on landing? Optional nice-to-have (client-side).
- In `src/app/gigs/page.tsx` and filters: replace emoji map with registry icons where possible (text badge can stay or become icon+text pill).
- GigCard: keep category as small pill (current exact classes on the name-only span: `text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full`); optionally prefix with tiny icon from registry for visual consistency (e.g. wrap as `<span className="... flex items-center gap-1"><TinyRegistryIcon />{gig.category}</span>` while preserving the orange badge styling).

**Quantified:** 22 categories (full list from `src/lib/gig-categories.ts`); all surfaces using `getGigCategories()` + `categoryEmojis` or direct `icon` will benefit. The description unification impacts the landing category grid directly.

### 3. Added Sections for Trust & Polish
- **Stats / Social Proof** (after categories or in hero): Query on server (in marketing page): active gigs count, total reviews, distinct cities from users/gigs, active sellers. Display as 4 clean stat cards (framer entrance).
- **Testimonials** (new section before Cómo funciona): 3-4 static or lightly dynamic cards (pull recent positive reviews via prisma, or seeded Colombian-local trust quotes with names/avatars). Use GigCard-style cards or simple quote + rating.
- **Enhanced Cómo funciona:** Keep 3 steps but upgrade visuals — numbered orange circles become illustrated step icons (custom or lucide + brand color), add connecting lines or subtle motion on scroll/hover, more concrete copy.
- **Final CTA:** Stronger, with secondary social proof line.

### 4. How-it-Works Visual Upgrade + Footer
- Icon-enhanced steps + better typography.
- Footer: keep minimal but add links to support, perhaps subtle "Hecho en Colombia" + updated with dynamic siteName where possible. Respect NavbarWrapper public nav.

### 5. Animations & Motion
- Add `framer-motion` (tiny, standard, tree-shakeable; justified for 1.0 polish).
- Category cards: hover scale on icon + lift.
- Section entrances: stagger children on viewport.
- Hero elements: gentle fade + slide.
- Preserve accessibility (reduced-motion respects, no autoplay).
- Existing `tw-animate-css` + Tailwind transitions remain for non-framer cases.

### 6. PWA, Metadata, OG, Favicon, Brand Assets Pipeline
- `src/app/manifest.ts`: Update name/short_name/description; add new icons from generated set (maskable support).
- `src/app/layout.tsx` + `generateMetadata`: Continue dynamic siteName/tagline; update default icons to new premium set (`/icon.png` etc. regenerated or versioned).
- Generate new `public/icon.png`, `apple-icon.png`, and optionally OG-friendly hero crop from `public/logo.png` or AI.
- Add dedicated icon directory: `public/icons/` (or `public/category-icons/`) with SVG/PNG for each of 22 (named by slug: `limpieza-de-hogar-y-oficinas.svg`).
- Update OG images in marketing page + layout to leverage new assets.
- Login page (`src/app/login/page.tsx`) and signup page (`src/app/signup/page.tsx` — major first-impression public auth surface with its own yellow-orange-red gradient hero containing direct `<Image src="/logo.png" alt="Oiga Usted" />` plus dynamic `siteName` state for heading text): swap/replace the direct logo image + hardcoded alt with `<Logo size={56} showText />` (or equivalent wrapper) for full dynamic `logoUrl` + siteName support in alt/text while preserving the custom gradient hero treatment and using the fetched siteName for alt where possible. Extend "other public surfaces" hardcode sweep to cover signup explicitly.

### 7. Consistency Across First-Impression Surfaces
- `/gigs` category filters and pills.
- Public `/sellers/[slug]` (inherits GigCard).
- Admin categories table (show new icons alongside emoji fallback).
- Mobile bottom nav / menus (secondary).

### 8. Dark/Light + Mobile-First + Dynamic Branding
- All new icons must have good contrast in both modes (test with oklch bg-card etc.).
- Logo.tsx already handles dynamic perfectly; extend registry to respect siteName in alt texts.
- Marketing page server component continues to use `getGigCategories()` + Prisma for ratings.

**Mermaid icon resolution flow (proposed):**
```
Component (Marketing / Gigs / GigCard)
  ↓
getCategoryIcon(name) from new @/lib/icon-registry
  ├─ if category.iconKey or DB iconUrl → <img src=...> or registry SVG
  ├─ else if emoji-only → legacy text (cat.icon || '🛠️')
  └─ else lucide fallback
Admin edit still accepts emoji string (backward) + optional new key field
```

---

## API / Interface

### Icon Registry (`src/lib/icon-registry.ts` — new)
```ts
export const categoryIconKeys: Record<string, string> = {
  "Limpieza de Hogar y Oficinas": "limpieza-hogar",
  "Música y DJ para Eventos": "musica-dj",
  // ... all 22
};

export function getCategoryIcon(name: string): React.ReactNode | string {
  const key = categoryIconKeys[name];
  if (key) {
    // Return img, SVG component, or path. Support both server/client.
    return `/icons/${key}.svg`; // or import a map of components
  }
  return categoryEmojis[name] || '🛠️';
}
```

- Client and server friendly (strings for img src or pre-bundled SVGs).
- Export `Icon` component wrapper for motion/ sizing.
- Update `src/lib/categories.ts` and `useGigCategories` to include `iconKey?: string`.

### Admin Category API / UI (`src/app/api/admin/categories/route.ts`, `src/app/admin/categories/page.tsx`)
- Extend form + model writes to accept `iconKey` (or `iconUrl`) alongside current `icon` (emoji).
- Table shows both (premium preview + emoji fallback).
- "Sync initials" continues to seed emoji + (future) default iconKey.

### Public APIs
- `/api/categories` and landing already return `icon`; augment response with `iconKey` when present (additive).

### Other
- Update `src/lib/category-registry.ts` and `getCategoryRegistry` if needed for buyer/seller fields (no icon impact).
- Marketing AI studio visualPrompts can reference the new icon style guide for future campaigns.

---

## Data Model

**Minimal additive changes (preferred for safe rollout):**

In `prisma/schema.prisma`:
```prisma
model Category {
  ...
  icon        String   @default("🛠️")   // Keep for emoji + display name fallback
  iconKey     String?                    // New: e.g. "limpieza-hogar" → maps to registry/SVG
  iconUrl     String?                    // Optional: external or /public path override
  // description (existing field) becomes primary source for landing card descriptions (unify from partial client map in PR4)
  ...
}
```

- Migration: add nullable columns (safe). No change needed for existing `description`.
- Seed (`prisma/seed.ts`) + admin seed actions: populate `iconKey` for the 22; optionally seed rich initial `description` values.
- Admin form: keep emoji input; add "Icon Key" (select or text) + preview. (description already editable.)
- Backward: all existing code paths using `icon` continue to work. New paths prefer key → asset. Landing will prefer DB description (already returned by getGigCategories).

Alternative (no schema change): Central registry only + convention (slugify name → file). Simpler but less admin-flexible for future custom categories.

PlatformConfig already sufficient for branding.

---

## Alternatives Considered

1. **Pure lucide-react custom icons / extended set** (components.json already "lucide"): Fast, consistent, zero assets, tree-shaken. *Rejected for "premium custom" goal* — lucide is generic; we want bespoke Colombian-vibrant identity per category (e.g. unique megaphone for events, mop+sparkle for limpieza).

2. **Emoji + lucide mix only** (current + polish): Minimal change, no new deps/assets. *Good fallback but insufficient for 1.0 premium feel.*

3. **Paid icon set** (e.g. Heroicons Pro, Tabler, custom from Streamline): Cost + licensing + still generic. *Avoided.*

4. **AI-generated + hand-tuned SVGs/PNGs** (chosen): Leverages "newest hottest tool" (image_gen + existing AI marketing visualPrompts). Produces unique, on-brand set. Note: image_gen produces raster (PNG) outputs; plan post-gen hand-optimization or tracing to SVG where practical, or commit optimized multi-res PNGs (2x/3x) with svgo/sharp steps if adopted in the asset pipeline. Default to reliable PNGs for the registry + PWA/cards. Registry makes it maintainable. Future admin can upload overrides. (See PR3 for concrete execution notes and Open Questions for style prompt timing.)

5. **Full component map in code** (no files): JS objects returning `<svg>...</svg>`. Works but bloats bundle + hard to iterate with designers/AI.

Hybrid recommended: AI-gen base assets in `public/icons/` + registry + emoji fallback forever.

---

## Security

No material changes. New assets are static public files (served by Next). Icon registry is pure lookup (no user input execution). Admin category writes already authenticated. Dynamic logoUrl in Logo.tsx is just `<img src={...}>` (existing trust model; admin-controlled).

---

## Observability

- Landing page server fetches (categories + gigs for ratings + new stats) are cheap; add simple `console.debug` or devLog around category icon resolution if needed.
- No new external analytics required (existing Vercel + any platform tools).
- Monitor icon 404s in prod (simple).
- Admin category changes already audited via existing AuditLog path.
- For rollout: track via marketing campaigns (the AI studio can promote the facelift).

---

## Rollout

- Incremental via ordered PRs (see PR Plan). Each PR delivers standalone value (e.g. add framer + basic polish before icons).
- No DB migration on first PRs (emoji continues).
- Add framer-motion early (small dep).
- Generate assets in a dedicated PR using tools (image_gen for each category + hero/logo variants — raster/PNG first, with hand-optimize/trace to SVG or optimized 2x/3x PNGs + potential svgo/sharp); finalize style prompt first; commit optimized files. (See PR3 practicality notes.)
- Update landing + registry in one focused PR.
- Feature is always-on for public (no flag needed).
- Post-merge: run seed or admin "Sync initials" to populate iconKeys.
- Test matrix: anon landing (light/dark, mobile), /gigs filters, GigCard, public seller, login (Logo swap), admin categories CRUD, PWA install, OG preview.
- Colombian Spanish copy + local tone preserved.
- Performance: SVGs + framer (motion.div with will-change) are lightweight.

---

## Open Questions

1. Exact icon style guide for AI gen prompts (e.g. "clean flat illustration with subtle Colombian warmth, orange #f97316 accents, line weight 2, rounded, white or transparent bg, 256x256 base") — finalize the prompt BEFORE PR3 batch generation. Account for image_gen producing rasters (PNG outputs by default); plan post-processing (hand trace to SVG for key icons where practical for crisp/perf, or commit optimized PNGs at 2x/3x; svgo for SVGs / sharp for PNGs if adding a build step).
2. Whether to also generate a refined app icon / logo mark variant (beyond current `public/icon.png` + `public/logo.png` megaphone) or strictly category set.
3. Store full inline SVGs in registry vs file refs (files win for cache + designer handoff). Default to PNGs for reliability if vectorization is manual.
4. Should marketing page stats be cached (e.g. 60s revalidate) or live? (Recommend ISR-friendly).
5. Testimonials: static curated vs dynamic from recent 5-star reviews (privacy + quality).
6. Post-facelift: extend icon system to seller profile "specialties" badges?

---

## References (Code & Docs)

- Landing & categories: `src/app/(marketing)/page.tsx` (including partial `categoryDescriptions` map + usage of `getGigCategories()` for names/ratings but not yet descriptions), `src/lib/gig-categories.ts` (full 22 + emojis), `src/lib/categories.ts` (getGigCategories already returns `description?: string` from DB), `src/lib/useGigCategories.ts`
- Branding: `src/components/common/Logo.tsx`, `src/app/layout.tsx` (generateMetadata), `src/app/manifest.ts`, `prisma/schema.prisma` (PlatformConfig + Category with existing description field), `src/app/api/admin/config/route.ts`
- Nav & components: `src/components/layout/NavbarWrapper.tsx` (public case), `src/components/common/GigCard.tsx` (category pill: `text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full`), `src/app/gigs/page.tsx`, `src/app/sellers/[slug]/page.tsx`, `src/app/login/page.tsx`, `src/app/signup/page.tsx` (gradient hero + direct Image /logo.png + dynamic siteName)
- Admin: `src/app/admin/categories/page.tsx` (stale "20 categories" literals at empty-state ~475 and import button ~498; dynamic length in header), `src/app/api/admin/categories/route.ts`, `src/app/admin/settings/page.tsx` (branding form)
- Assets: `public/logo.png` (megaphone + flag), `public/icon.png` ("OU" square), `public/apple-icon.png`
- Theme/Deps: `src/app/globals.css` (oklch + orange marketing gradients), `package.json` (lucide-react, react-icons present but underused, no framer-motion), `components.json` ("lucide")
- Existing AI power: `AI_MARKETING_STUDIO.md`, `/admin/marketing` (visualPrompts usable for icon gen)
- Ops: `README.md`, `WHATS_NEW.md`, `PRODUCTION_CHECKLIST.md`, `prisma/seed.ts`
- Other: `src/lib/category-registry.ts`, `src/app/page.tsx` (root anon marketing), `src/app/api/categories/route.ts`

---

## Key Decisions

1. **Use AI image generation (image_gen tool) for bespoke 22-icon set + optional hero/logo variants** instead of lucide or emoji-only. Rationale: Directly satisfies "newest hottest tool" + "premium custom icons" request while producing on-brand Colombian-vibrant assets that generic libraries cannot match. Registry + emoji fallback guarantees zero breakage.

2. **Additive data model (iconKey + iconUrl nullable on Category) + keep emoji in .icon forever.** Rationale: Safe migrations, full backward compat for seed/admin/gigs everywhere; gives admins future flexibility without forcing immediate changes.

3. **Introduce framer-motion (small, justified dep).** Rationale: Required for delightful 1.0 motion on categories/hero/steps that Tailwind alone cannot deliver at this quality level. Already using tw-animate-css; framer is the standard complement.

4. **Preserve and extend dynamic branding everywhere (no more hardcodes in landing/login).** Rationale: Logo.tsx + config API + PlatformConfig already work beautifully; landing page + login are the last major offenders. Facelift is the perfect time to finish unification.

5. **Central icon registry (`src/lib/icon-registry.ts`) as single source of truth for resolution.** Rationale: Handles server/client, fallbacks, and motion wrappers cleanly. Used by marketing, gigs, GigCard, admin. Mirrors the smart pattern already in `category-registry.ts`.

6. **Stats + testimonials + upgraded how-it-works as new proof sections.** Rationale: Current landing lacks credibility signals despite real reviews existing in DB. Lightweight server queries + 3-4 curated quotes close the trust gap for a two-sided marketplace.

7. **Keep hero gradient + Colombian energy intact; enhance rather than replace.** Rationale: The orange-red-rose + flag badge is a strong, recognized brand element. Polish (motion, stats, visual) amplifies it.

8. **Incremental PR plan (4-8 small, independently valuable) with asset generation as a dedicated step.** Rationale: Matches the "Create a plan and a branch" request; allows shipping polish early, icons when assets ready, reduces risk, and enables parallel review.

---

## PR Plan

**Ordered, mergeable, small PRs.** Each can be reviewed/shipped independently and delivers front-door value. Branch base: `landing-page-and-icon-upgrade` or `main`. All touch only public/landing/icon surfaces + minimal shared libs (no core auth/checkout breakage).

1. **PR 1: Setup branch + foundational landing polish + add framer-motion**  
   Files: `package.json` (add `"framer-motion": "^11.x"` + types if needed), `src/app/(marketing)/page.tsx` (minor copy/CTA/hover polish, add basic motion.div where safe), `src/app/globals.css` (a few premium utility classes), `src/app/login/page.tsx` (swap custom O for `<Logo showText size={56}>` + minor polish), `src/app/signup/page.tsx` (unify logo hero: replace direct `<Image src="/logo.png" alt="Oiga Usted" />` + hardcoded alt with Logo component usage or dynamic alt using existing siteName state from /api/admin/config for future logoUrl support while keeping the gradient), `src/components/common/Logo.tsx` (minor if needed).  
   Desc: Creates the feature branch. Introduces motion lib. Cleans some hardcodes + improves existing landing/login/signup without new assets (explicit first-impression public auth surface unification). Independently valuable (better hovers + branding consistency today). Deps: none.

2. **PR 2: Icon registry + fallback infrastructure + admin surface prep**  
   Files: `src/lib/icon-registry.ts` (new — keys + getCategoryIcon + types), updates to `src/lib/categories.ts` (export iconKey support; also ensure `description` from DB is reliably passed through in interface + fallbacks), `src/lib/useGigCategories.ts` (pass through), `src/app/admin/categories/page.tsx` + form (add iconKey input + preview using registry; also audit/fix stale "20 categories" prose literals in empty-state text and import button label — e.g. change to "Import the initial categories from static definitions (recommended)" or use runtime `staticGigCategories.length` interpolation; header already dynamic), `src/app/api/admin/categories/route.ts` + PUT/POST (accept + persist iconKey), small updates in `src/app/(marketing)/page.tsx` and `src/app/gigs/page.tsx` (use registry for display, keep emoji fallback).  
   Desc: Zero visual change yet (falls back to emoji), but wires the entire system. Admin can now set keys. Fixes stale numeric UI copy as part of admin prep. Prepares for asset PR and description unification. Deps: PR 1 (for any motion in previews).

3. **PR 3: Generate + integrate premium custom icon assets (AI-powered)**  
   Files: New `public/icons/*.svg` (or optimized .png) for all 22 (names from registry keys; generate via image_gen tool calls — note image_gen produces raster/PNG outputs — using a finalized consistent style prompt before batch: e.g. "clean flat illustration with subtle Colombian warmth, orange #f97316 accents, line weight 2, rounded, white/transparent bg, suitable for light+dark cards, 256x256 base"; reference current `public/logo.png` + `public/icon.png` colors + AI studio visualPrompts for cohesion + brand match. Hand-optimize or vector-trace key icons to clean SVG where practical for perf/crisp scaling (using tools like manual tracing or conversion); otherwise commit optimized PNGs at 2x/3x resolutions with proper sizing in the registry + CSS `object-contain`. Consider svgo (SVG) or sharp (PNG resize/optimize) in the asset PR or a lightweight build step if adopted. Default reliably to PNGs for cross-browser/PWA reliability if SVG export not straightforward. Update `src/lib/icon-registry.ts` (map keys to `/icons/...` paths or import SVGs/PNGs), `public/icon.png` / `apple-icon.png` / `public/logo.png` variants if refined, update `src/app/manifest.ts`, `src/app/layout.tsx` icons. Optional: new hero illustration asset.  
   Desc: The "hottest tool" step. Produces the actual premium assets (with documented raster-to-SVG/PNG practicality). Uses existing AI marketing visualPrompts style for cohesion. Finalize style prompt in design/Open Questions before execution; commit only final optimized files (PNG primary + selective SVG). Deps: PR 2 (registry must exist to reference). **Can be done in parallel with design iteration.**

4. **PR 4: Hero + categories grid redesign + new proof sections**  
   Files: `src/app/(marketing)/page.tsx` (full hero upgrade with stats query, category cards using registry icons + framer hovers/entrance + descriptions now preferring `getGigCategories()` DB `description` field merged over or replacing the partial hardcoded `categoryDescriptions` map, new Stats/Testimonials sections, enhanced Cómo funciona with icons, final CTA), `src/app/(marketing)/page.tsx` metadata tweaks. Small supporting: `src/lib/prisma.ts` or direct prisma calls for stats (gigs count, review aggregates, cities); optionally extend `src/lib/categories.ts` surface if any client-side description merge helper needed.  
   Desc: Delivers the visual facelift users will see immediately. Now icons look premium + descriptions are unified with the DB-backed Category.description (source of truth, already returned by getGigCategories and editable in admin). Deps: PR 1 (framer), PR 2+3 (registry + assets).

5. **PR 5: Cross-surface consistency + GigCard / gigs / seller polish**  
   Files: `src/components/common/GigCard.tsx` (tiny icon prefix on the category pill which currently uses exact classes `text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full`; preserve the on-brand orange styling while adding `<TinyRegistryIcon />` prefix for consistency with upgraded landing/gigs), `src/app/gigs/page.tsx` (upgrade filter pills + header to use registry icons), `src/app/sellers/[slug]/page.tsx` (inherit), any remaining emoji hard references in orders/chat (minimal). Update admin categories table to render nice icon previews + ensure any stale "20" prose is fully cleaned if not already in PR2.  
   Desc: Makes the facelift feel system-wide, not just landing. Explicitly quotes and respects current GigCard badge classes for precise icon prefixing. Deps: PR 3-4.

6. **PR 6: PWA / metadata / OG / favicon full pipeline + dynamic branding hardcode sweep**  
   Files: `src/app/manifest.ts`, `src/app/layout.tsx` (full generateMetadata + icons), `src/app/(marketing)/page.tsx` (remove all remaining hardcoded "OigaUsted"), `src/app/login/page.tsx` + `src/app/signup/page.tsx` (complete Logo unification + dynamic siteName in alts/text + asset handling, even if retaining `/logo.png` reference for the hero mark) / other public pages (unify on Logo + dynamic), possibly new `public/og-hero.png` or update references. Test PWA install.  
   Desc: Completes the brand identity refresh end-to-end. Explicitly includes the signup page (gradient hero + direct logo + siteName state) for full dynamic Logo + alt unification alongside login. Deps: PR 4 (so marketing is updated).

7. **PR 7: (Optional but recommended) Animation & accessibility pass + docs**  
   Files: Polish motion in marketing (staggers, prefers-reduced-motion), `README.md` / `WHATS_NEW.md` entries, any perf notes, `src/app/globals.css` tweaks. Verify mobile tap targets + contrast on new icons.  
   Desc: Production hardening for the facelift. Deps: PR 4.

8. **PR 8: Final verification + seed/admin sync update + production checklist note**  
   Files: `prisma/seed.ts` (add iconKey population for the 22; optionally backfill initial `description` values for categories that have rich static ones), `src/app/admin/categories/page.tsx` (seed buttons mention new icons; verify no remaining stale "20 categories" copy), `PRODUCTION_CHECKLIST.md` (note on re-running seed or admin sync post-deploy), minor tests if any.  
   Desc: Closes the loop. Ensures new deploys get beautiful icons + consistent descriptions + clean admin UI prose. Deps: all prior.

**Merge strategy:** Merge 1-3 early (infra + assets = low risk, high prep value). 4 is the "wow" PR. 5-8 follow quickly. All small enough for focused review. Total changed surface stays public + shared icon/branding libs.

After all PRs: run `npm run seed` or admin "Sync initials" (will be extended), regenerate any OG via tools if needed, deploy, then use `/admin/marketing` AI studio to announce the facelift.

---

**End of Design Document.** Ready to create branch and begin PR 1.
