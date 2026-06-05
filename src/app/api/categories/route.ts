import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonArrayField } from '@/lib/utils';

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

    const categories = dbCategories.map((c) => ({
      name: c.name,
      icon: c.icon || '🛠️',
      description: c.description || '',
      fields: parseJsonArrayField(c.fields),
    }));

    // Fallback: if DB has no categories yet (fresh deploy before seed), we could return static,
    // but for now return empty and let UIs handle gracefully. Seed should populate.
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    // On error, return empty so UIs don't crash. Admin can still create.
    return NextResponse.json({ categories: [] });
  }
}
