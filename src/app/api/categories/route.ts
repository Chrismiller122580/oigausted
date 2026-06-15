import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonArrayField, devLog } from '@/lib/utils';
import { gigCategories as staticGigCategories } from '@/lib/gig-categories';

/**
 * Public endpoint: list active categories (for create-gig, /gigs filters, checkout, etc.)
 * Returns objects with name, icon, fields (always array).
 */
export async function GET() {
  try {
    const dbCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        name: true,
        icon: true,
        description: true,
        fields: true,
      },
    });

    let categories = dbCategories.map((c: (typeof dbCategories)[number]) => ({
      name: c.name,
      icon: c.icon || '🛠️',
      description: c.description || '',
      fields: parseJsonArrayField(c.fields),
    }));

    // Fallback to static definitions (from seed source) if DB is empty.
    // This ensures create-gig, /gigs, etc. work immediately after the Category table
    // migration, even before running seed or populating via admin.
    if (categories.length === 0) {
      categories = staticGigCategories.map(cat => ({
        name: cat.name,
        icon: cat.icon,
        description: '',
        fields: cat.fields || [],
      }));
      devLog('GET /api/categories: using static fallback (DB empty)');
    }

    return NextResponse.json({ categories });
  } catch (error) {
    devLog('GET /api/categories error:', error);
    // On error (e.g. before migration), return static fallback so UIs don't break.
    const fallback = staticGigCategories.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      description: '',
      fields: cat.fields || [],
    }));
    return NextResponse.json({ categories: fallback });
  }
}
