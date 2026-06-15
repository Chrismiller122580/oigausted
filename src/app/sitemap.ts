import type { MetadataRoute } from 'next';
import { PUBLIC_PAGE_PATHS, PUBLIC_SITE_URL } from '@/lib/public-site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PAGE_PATHS.map((path) => ({
    url: `${PUBLIC_SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' || path === '/gigs' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/gigs' || path === '/faq' ? 0.9 : 0.7,
  }));
}