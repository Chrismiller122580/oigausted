import { prisma } from './prisma';
import { parseJsonArrayField } from './utils';
import { gigCategories as staticGigCategories } from './gig-categories'; // fallback / seed source
import type { DynamicFieldDef } from '@/types/gig-fields';
import type { Category } from '@prisma/client';

export interface GigCategory {
  name: string;
  icon: string;
  fields: DynamicFieldDef[];
  description?: string;
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
      return dbCats.map((c: Category) => ({
        name: c.name,
        icon: c.icon || '🛠️',
        description: c.description || undefined,
        fields: parseJsonArrayField<DynamicFieldDef>(c.fields),
      }));
    }
  } catch (e) {
    // During initial setup or migration, fall back silently
  }
  // Fallback to the (now legacy) static definitions
  return staticGigCategories.map((c) => ({
    name: c.name,
    icon: c.icon,
    fields: parseJsonArrayField<DynamicFieldDef>(c.fields),
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

