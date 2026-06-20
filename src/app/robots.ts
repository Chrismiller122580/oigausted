import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/public-site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/buyer/',
          '/seller/',
          '/dashboard/',
          '/orders/',
          '/checkout/',
          '/settings/',
          '/notifications/',
          '/profile/',
          '/referrals/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}