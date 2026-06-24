import { prisma } from './prisma';
import { normalizeGigCategoryFields, toPrismaJson } from './utils';
import { gigCategories as staticGigCategories } from './gig-categories'; // fallback / seed source
import type { DynamicFieldDef } from '@/types/gig-fields';
import type { Category } from '@prisma/client';

export interface GigCategory {
  name: string;
  icon: string;
  fields: DynamicFieldDef[];
  description?: string;
}

function mapDbCategory(c: Category): GigCategory {
  return {
    name: c.name,
    icon: c.icon || '🛠️',
    description: c.description || undefined,
    fields: normalizeGigCategoryFields(c.fields),
  };
}

function mapStaticCategories(): GigCategory[] {
  return staticGigCategories.map((c) => ({
    name: c.name,
    icon: c.icon,
    fields: normalizeGigCategoryFields(c.fields),
  }));
}

/** Merge any static seed categories missing from the DB (e.g. newly added Turismo on prod). */
function mergeMissingStaticCategories(dbCategories: GigCategory[]): GigCategory[] {
  const dbNames = new Set(dbCategories.map((c) => c.name));
  const missing = mapStaticCategories().filter((c) => !dbNames.has(c.name));
  return missing.length > 0 ? [...dbCategories, ...missing] : dbCategories;
}

/**
 * Upsert static categories that are not yet in the DB so new seed entries appear everywhere
 * without a manual re-seed (create-gig dropdown, filters, admin, etc.).
 */
export async function syncMissingStaticCategories(): Promise<void> {
  try {
    const existing = await prisma.category.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((c: Pick<Category, 'name'>) => c.name));
    const missing = staticGigCategories.filter((c) => !existingNames.has(c.name));
    if (missing.length === 0) return;

    await Promise.all(
      missing.map((cat) => {
        const order = staticGigCategories.findIndex((c) => c.name === cat.name);
        return prisma.category.upsert({
          where: { name: cat.name },
          update: {
            icon: cat.icon,
            fields: toPrismaJson(cat.fields || []),
            order,
            isActive: true,
          },
          create: {
            name: cat.name,
            icon: cat.icon,
            fields: toPrismaJson(cat.fields || []),
            description: null,
            order,
            isActive: true,
          },
        });
      })
    );
  } catch {
    // Non-fatal: callers still merge static definitions for the response.
  }
}

/**
 * Server-side: load active categories from DB (preferred after admin creates them).
 * Auto-syncs missing static seed entries, then falls back to static merge if DB is empty/errors.
 */
export async function getGigCategories(): Promise<GigCategory[]> {
  try {
    await syncMissingStaticCategories();

    const dbCats = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    if (dbCats.length > 0) {
      return mergeMissingStaticCategories(dbCats.map(mapDbCategory));
    }
  } catch {
    // During initial setup or migration, fall back silently
  }
  return mapStaticCategories();
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

