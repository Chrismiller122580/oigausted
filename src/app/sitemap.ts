import type { MetadataRoute } from 'next';
import { PUBLIC_PAGE_PATHS, PUBLIC_SITE_URL } from '@/lib/public-site';
import { listPublicGigs } from '@/lib/gig-queries';

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
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    gigPages = [];
  }

  return [...staticPages, ...gigPages];
}
