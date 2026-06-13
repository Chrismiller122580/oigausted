import { prisma } from './prisma';
import { parseJsonArrayField } from './utils';
import { gigCategories as staticGigCategories } from './gig-categories'; // fallback / seed source
import {
  categoryIconKeys,
  getCategoryIcon,
  getCategoryIconKey,
  getCategoryEmoji,
} from './icon-registry'; // central source for icon keys + resolution (PR3 PNG paths with emoji fallback)

export interface GigCategory {
  name: string;
  icon: string;
  fields: any[];
  description?: string;
  iconKey?: string; // additive: slug from icon registry (e.g. "limpieza-de-hogar-y-oficinas"); optional for backward compat
}

/**
 * Server-side: load active categories from DB (preferred after admin creates them).
 * Falls back to the static list if DB is empty or errors (e.g. before first seed/migration).
 */
export async function getGigCategories(): Promise<GigCategory[]> {
  try {
    const dbCats = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    if (dbCats.length > 0) {
      return dbCats.map((c: any) => ({
        name: c.name,
        icon: c.icon || '🛠️',
        description: c.description || undefined,
        fields: parseJsonArrayField(c.fields),
        // iconKey may come from DB (additive column) or computed from registry by name
        iconKey: c.iconKey ?? getCategoryIconKey(c.name),
      }));
    }
  } catch (e) {
    // During initial setup or migration, fall back silently
  }
  // Fallback to the (now legacy) static definitions
  // Note: description surfaces reliably (undefined here; DB populates when present).
  // iconKey always provided via registry for prep + future admin overrides.
  return staticGigCategories.map((c) => ({
    name: c.name,
    icon: c.icon,
    description: undefined,
    fields: c.fields || [],
    iconKey: getCategoryIconKey(c.name),
  }));
}

/** Convenience: just the names (for filters, etc.) */
export async function getCategoryNames(): Promise<string[]> {
  const cats = await getGigCategories();
  return cats.map((c) => c.name);
}

// For backward compat in a few places that still do static import of the list.
// These will be the initial values; dynamic pages should use getGigCategories() or the client hook.
export const categories: readonly string[] = staticGigCategories.map((c) => c.name);

export const categoryEmojis: Record<string, string> = staticGigCategories.reduce(
  (acc, c) => {
    acc[c.name] = c.icon;
    return acc;
  },
  {} as Record<string, string>
);

// Re-export icon registry as the central authority (additive, no breakage).
// getCategoryIcon now serves PR3 AI PNG icons (with emoji hard fallback).
// Prefer these over direct categoryEmojis access for new icon-related code.
export { categoryIconKeys, getCategoryIcon, getCategoryIconKey, getCategoryEmoji };

