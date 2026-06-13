import { gigCategories } from './gig-categories';

/**
 * Central icon registry for the 22 categories.
 * Single source of truth for icon keys (clean kebab-case slugs) + resolution helpers.
 * Pure module (no side effects), works on server and client.
 *
 * Current behavior: getCategoryIcon() and friends always return the legacy emoji string.
 * This guarantees *zero visual change* in this PR while wiring the full system.
 *
 * Future (PR3+): update getCategoryIcon to return `/icons/${key}.png` (or .svg) path when
 * the custom assets land. Callers (marketing, gigs, admin, GigCard) will then branch:
 *   const icon = getCategoryIcon(name);
 *   {typeof icon === 'string' && icon.startsWith('/') ? <img src={icon} ... /> : <span className="text-5xl">{icon}</span>}
 *
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
 * Returns the icon for a category name.
 * In this PR: always returns emoji string (🧹, 🎧, etc.) for 100% backward compat + zero visual diff.
 * Ready for path return in future.
 */
export function getCategoryIcon(name: string): string {
  const match = gigCategories.find((c) => c.name === name);
  // Intentional '🛠️' fallback for robustness (new admin-created categories without icon, or unknown names).
  // Matches legacy default. A computeCategoryIconKey(name) helper (exposing internal slugify) can be added later for on-the-fly slugs on dynamic admin names.
  return match?.icon || '🛠️';
}

// Convenience re-export of emoji (used by some fallbacks).
export function getCategoryEmoji(name: string): string {
  return getCategoryIcon(name);
}

export type CategoryIconResolution = {
  key?: string;
  icon: string; // emoji today; path | emoji tomorrow
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
