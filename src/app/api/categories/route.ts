import { NextResponse } from 'next/server';
import { getGigCategories } from '@/lib/categories';
import { gigCategories as staticGigCategories } from '@/lib/gig-categories';
import { devLog } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint: list active categories (for create-gig, /gigs filters, checkout, etc.)
 * Returns objects with name, icon, fields (always array).
 */
export async function GET() {
  try {
    const categories = (await getGigCategories()).map((cat) => ({
      name: cat.name,
      icon: cat.icon || '🛠️',
      description: cat.description || '',
      fields: cat.fields || [],
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    devLog('GET /api/categories error:', error);
    const fallback = staticGigCategories.map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      description: '',
      fields: cat.fields || [],
    }));
    return NextResponse.json({ categories: fallback });
  }
}
