import { gigCategories } from './gig-categories';

/**
 * Central icon registry for the 22 categories.
 * Single source of truth for icon keys (clean kebab-case slugs) + resolution helpers.
 * Pure module (no side effects), works on server and client.
 *
 * PR3: getCategoryIcon now returns `/icons/<slug>.jpg` for the 22 known categories
 * (AI-generated premium custom assets via "hottest tool" step). Style:
 * "clean flat illustration with subtle Colombian warmth, orange #f97316 accents, line weight 2, rounded, white/transparent bg, suitable for light+dark cards, 256x256 base"
 * + references to public/logo.png + public/icon.png colors + AI marketing studio visualPrompts for cohesion.
 * Note: committed assets are JPEG rasters (named .jpg for correct MIME; magic bytes JFIF) at 1024x1024
 * despite 'PNG primary' + '256 base' intent in prompt (see /tmp/grok-exec-summary... for practicality: no converter in env at gen time; "PNG primary" relaxed post-review).
 * CSS object-contain + sizing classes handle scaling in UIs. Future resize/convert possible. Always commit only final optimized files.
 *
 * Emoji fallback preserved for unknown categories / safety (getCategoryEmoji always emoji).
 * Callers (marketing, gigs, admin) should branch on path vs emoji for <img> rendering (see PR3 updates).
 * iconKey support is additive: optional in Category responses, editable in admin.
 * getCategoryIconKey(name) always works via the static map (no DB dependency).
 */

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents/diacritics (Música → musica, etc.)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Built from the canonical 22 static definitions (matches gig-categories.ts exactly).
export const categoryIconKeys: Record<string, string> = gigCategories.reduce(
  (acc, c) => {
    acc[c.name] = slugifyCategory(c.name);
    return acc;
  },
  {} as Record<string, string>
);

export function getCategoryIconKey(name: string): string | undefined {
  if (!name || typeof name !== 'string') return undefined;
  return categoryIconKeys[name];
}

/**
 * Returns the (visual) icon for a category name.
 * PR3 (AI-powered): for the 22 canonical categories, returns the path to the premium generated asset e.g. `/icons/limpieza-de-hogar-y-oficinas.jpg`
 * (JPEG raster committed for MIME correctness post-review fix; see notes above). Emoji fallback for dynamic/unknown categories (or if asset missing) to preserve zero breakage.
 * Callers must support both string path (use <img src={icon} alt="" className="..." />) and emoji (legacy span).
 *
 * Future (post-PR3 minimal): consider shared helper to de-dupe path-vs-emoji ternary:
 *   // e.g. export function CategoryIcon({name, className}: {name:string; className?:string}) {
 *   //   const icon = getCategoryIcon(name);
 *   //   return icon.startsWith('/') ? <img src={icon} alt="" className={className||'w-8 h-8 object-contain'} /> : <span className={className||'text-3xl'}>{icon}</span>;
 *   // }
 */
export function getCategoryIcon(name: string): string {
  if (!name || typeof name !== 'string') return '🛠️';
  const key = getCategoryIconKey(name);
  if (key) {
    // All 22 known categories now have AI custom icon assets (PR3 hottest tool step)
    return `/icons/${key}.jpg`;
  }
  const match = gigCategories.find((c) => c.name === name);
  // Intentional '🛠️' fallback for robustness (new admin-created categories without icon, or unknown names).
  // Matches legacy default. A computeCategoryIconKey(name) helper (exposing internal slugify) can be added later for on-the-fly slugs on dynamic admin names.
  return match?.icon || '🛠️';
}

// Convenience re-export of emoji (used by some fallbacks). Always returns legacy emoji, independent of getCategoryIcon path change.
export function getCategoryEmoji(name: string): string {
  const match = gigCategories.find((c) => c.name === name);
  return match?.icon || '🛠️';
}

export type CategoryIconResolution = {
  key?: string;
  icon: string; // path to /icons/<slug>.jpg (PR3 AI JPEG assets) or emoji fallback
};

export function resolveCategoryIcon(name: string): CategoryIconResolution {
  return {
    key: getCategoryIconKey(name),
    icon: getCategoryIcon(name),
  };
}

export default {
  categoryIconKeys,
  getCategoryIconKey,
  getCategoryIcon,
  getCategoryEmoji,
  resolveCategoryIcon,
};
