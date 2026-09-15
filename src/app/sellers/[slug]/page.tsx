import { notFound, redirect } from 'next/navigation';
import { BRAND_LOGO_PATH } from '@/lib/brand';
import Link from 'next/link';
import { headers } from 'next/headers';
import GigCard from '@/components/common/GigCard';
import { fetchPublicProfileGigs } from '@/lib/gig-showcase';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import {
  canonicalSellerPath,
  findSellerBySlugOrId,
} from '@/lib/seller-profile';
import { buildLocalServiceMetadata } from '@/lib/seo-metadata';
import ProfileShare from './ProfileShare';
import SellerProfileMobileBar from './SellerProfileMobileBar';
import { StarRating } from '@/components/ui/star-rating';
import { UserAvatar } from '@/components/ui/user-avatar';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await findSellerBySlugOrId(slug);

  if (!user) {
    return { title: 'Vendedor no encontrado', robots: { index: false, follow: false } };
  }

  const displayName = user.businessName || user.name || 'Vendedor';
  const city = user.city?.trim();
  const title = city ? `${displayName} en ${city} | OigaGIG` : `${displayName} | OigaGIG`;
  const description = user.bio?.trim()
    ? user.bio
    : `Servicios de ${displayName}${city ? ` en ${city}` : ' en Colombia'}. Profesionales locales en OigaGIG.`

  return buildLocalServiceMetadata({
    title,
    description,
    path: `/sellers/${user.slug || user.id}`,
    image: user.profilePicture || BRAND_LOGO_PATH,
    keywords: [displayName, city || '', 'servicios locales', 'oigagig'].filter(Boolean),
  });
}
