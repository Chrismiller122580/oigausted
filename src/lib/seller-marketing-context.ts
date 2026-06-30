import { prisma } from '@/lib/prisma';
import { getAppBaseUrl } from '@/lib/app-url';
import { ensureSellerPublicSlug } from '@/lib/seller-profile';
import type { NextRequest } from 'next/server';

export type SellerMarketingGig = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  isActive: boolean;
};

export type SellerMarketingContext = {
  sellerId: string;
  businessName: string;
  name: string | null;
  bio: string | null;
  city: string | null;
  slug: string | null;
  rating: number;
  reviewCount: number;
  storePath: string;
  storeUrl: string;
  gigs: SellerMarketingGig[];
  selectedGig: SellerMarketingGig | null;
};

export async function loadSellerMarketingContext(
  sellerId: string,
  gigId?: string | null,
  req?: NextRequest,
): Promise<SellerMarketingContext | null> {
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      name: true,
      businessName: true,
      bio: true,
      city: true,
      slug: true,
      rating: true,
      reviewCount: true,
    },
  });

  if (!seller) return null;

  let gigs: SellerMarketingGig[] = [];
  try {
    const rows = await prisma.gig.findMany({
      where: { sellerId, deletedAt: null, isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    gigs = rows;
  } catch {
    const rows = await prisma.gig.findMany({
      where: { sellerId, isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    gigs = rows;
  }

  let selectedGig: SellerMarketingGig | null = null;
  if (gigId) {
    selectedGig = gigs.find((g) => g.id === gigId) ?? null;
    if (!selectedGig) {
      const row = await prisma.gig.findFirst({
        where: { id: gigId, sellerId },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          isActive: true,
        },
      });
      if (row) selectedGig = row;
    }
  } else if (gigs.length > 0) {
    selectedGig = gigs[0];
  }

  const publicSegment = await ensureSellerPublicSlug(seller);
  const storePath = `/sellers/${publicSegment}`;
  const baseUrl = getAppBaseUrl(req);
  const storeUrl = `${baseUrl}${storePath}`;

  return {
    sellerId: seller.id,
    businessName: seller.businessName || seller.name || 'Mi negocio',
    name: seller.name,
    bio: seller.bio,
    city: seller.city,
    slug: seller.slug ?? publicSegment,
    rating: seller.rating ?? 0,
    reviewCount: seller.reviewCount ?? 0,
    storePath,
    storeUrl,
    gigs,
    selectedGig,
  };
}

export function buildGigUrl(baseUrl: string, gigId: string): string {
  return `${baseUrl}/gigs/${gigId}`;
}