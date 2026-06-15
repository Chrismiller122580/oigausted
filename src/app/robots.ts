import type { MetadataRoute } from 'next';
import { PUBLIC_SITE_URL } from '@/lib/public-site';

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
    host: PUBLIC_SITE_URL,
  };
}