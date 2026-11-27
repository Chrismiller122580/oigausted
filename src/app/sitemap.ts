import type { MetadataRoute } from 'next';
import { PUBLIC_PAGE_PATHS, PUBLIC_SITE_URL } from '@/lib/public-site';
import { listPublicGigs } from '@/lib/gig-queries';
import { getGigCategories } from '@/lib/categories';
import { categoryToSlug, allCategorySlugs } from '@/lib/category-slug';
import { gigCategories as staticGigCategories } from '@/lib/gig-categories';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = PUBLIC_PAGE_PATHS.map((path) => ({
    url: `${PUBLIC_SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' || path === '/gigs' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/gigs' || path === '/faq' ? 0.9 : 0.7,
  }));

  let gigPages: MetadataRoute.Sitemap = [];
  try {
    const { gigs } = await listPublicGigs({ limit: 500 });
    gigPages = gigs.map((gig) => ({
      url: `${PUBLIC_SITE_URL}/gigs/${gig.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    gigPages = [];
  }

  // Category landing pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    let catNames: string[] = [];
    try {
      const cats = await getGigCategories();
      catNames = cats.map((c) => c.name);
    } catch {
      catNames = staticGigCategories.map((c) => c.name);
    }
    const slugs = allCategorySlugs(catNames);
    categoryPages = slugs.map((slug) => ({
      url: `${PUBLIC_SITE_URL}/categorias/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    }));

    // Category + city combinations from actual gig data
    try {
      const { gigs } = await listPublicGigs({ limit: 500 });
      const seen = new Set<string>();
      for (const gig of gigs) {
        if (!gig.category || !gig.city) continue;
        const catSlug = categoryToSlug(gig.category);
        const citySlug = categoryToSlug(gig.city);
        const key = `${catSlug}|${citySlug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        categoryPages.push({
          url: `${PUBLIC_SITE_URL}/categorias/${catSlug}/${citySlug}`,
          lastModified: now,
          changeFrequency: 'daily' as const,
          priority: 0.8,
        });
      }
    } catch {
      // ignore
    }
  } catch {
    categoryPages = [];
  }

  return [...staticPages, ...categoryPages, ...gigPages];
}
