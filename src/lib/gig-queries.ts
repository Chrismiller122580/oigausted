import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getGigImages, parseGigImagesField } from '@/lib/gig-images'
import {
  isMissingDeletedAtColumn,
  publicGigWhere,
  publicGigWhereFallback,
} from '@/lib/public-gigs'
import { parseJsonArrayField } from '@/lib/utils'

const publicGigSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  category: true,
  completionTime: true,
  imageUrl: true,
  images: true,
  fields: true,
  addons: true,
  isActive: true,
  createdAt: true,
  sellerId: true,
  city: true,
  latitude: true,
  longitude: true,
  isRemote: true,
  seller: {
    select: {
      id: true,
      name: true,
      businessName: true,
      profilePicture: true,
      rating: true,
      reviewCount: true,
      slug: true,
      city: true,
    },
  },
} as const

const sellerListSelect = {
  id: true,
  name: true,
  businessName: true,
  profilePicture: true,
  rating: true,
  reviewCount: true,
  slug: true,
  latitude: true,
  longitude: true,
  serviceRadiusKm: true,
  city: true,
} as const

export type PublicGigDetail = {
  id: string
  title: string
  description: string | null
  price: number
  category: string | null
  completionTime: string | null
  imageUrl: string | null
  images: string[]
  fields: ReturnType<typeof parseJsonArrayField>
  addons: ReturnType<typeof parseJsonArrayField>
  isActive: boolean
  sellerId: string
  city: string | null
  isRemote: boolean | null
  seller: {
    id: string
    name: string | null
    businessName: string | null
    profilePicture: string | null
    rating: number | null
    reviewCount: number
    slug: string | null
    city: string | null
  } | null
}

export type PublicGigListItem = {
  id: string
  title: string
  description: string | null
  price: number
  category: string | null
  imageUrl: string | null
  isActive: boolean
  createdAt: Date
  city: string | null
  latitude: number | null
  longitude: number | null
  isRemote: boolean | null
  sellerId: string
  seller: {
    id: string
    name: string | null
    businessName: string | null
    profilePicture: string | null
    rating: number | null
    reviewCount: number
    slug: string | null
    latitude: number | null
    longitude: number | null
    serviceRadiusKm: number | null
    city: string | null
  } | null
}

function formatGigDetail(
  gig: {
    id: string
    title: string
    description: string | null
    price: number
    category: string | null
    completionTime: string | null
    imageUrl: string | null
    images?: string | null
    fields: unknown
    addons: unknown
    isActive: boolean
    sellerId: string
    city?: string | null
    isRemote?: boolean | null
    seller: PublicGigDetail['seller']
  }
): PublicGigDetail {
  const imageList = getGigImages(gig)
  return {
    id: gig.id,
    title: gig.title,
    description: gig.description,
    price: gig.price,
    category: gig.category,
    completionTime: gig.completionTime,
    imageUrl: imageList[0] ?? gig.imageUrl ?? null,
    images: imageList,
    fields: parseJsonArrayField(gig.fields),
    addons: parseJsonArrayField(gig.addons),
    isActive: gig.isActive,
    sellerId: gig.sellerId,
    city: gig.city ?? null,
    isRemote: gig.isRemote ?? null,
    seller: gig.seller,
  }
}

export async function getPublicGigById(id: string): Promise<PublicGigDetail | null> {
  let gig: Awaited<ReturnType<typeof prisma.gig.findFirst>> | null = null

  try {
    gig = await prisma.gig.findFirst({
      where: { id, ...publicGigWhere() },
      select: publicGigSelect,
    })
  } catch (dbErr: unknown) {
    if (isMissingDeletedAtColumn(dbErr)) {
      gig = await prisma.gig.findFirst({
        where: { id, ...publicGigWhereFallback() },
        select: publicGigSelect,
      })
    } else {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      if (errMsg.includes('images') && errMsg.includes('does not exist')) {
        const { images: _omit, ...selectWithoutImages } = publicGigSelect
        gig = await prisma.gig.findFirst({
          where: { id, ...publicGigWhereFallback() },
          select: selectWithoutImages,
        })
      } else {
        throw dbErr
      }
    }
  }

  if (!gig) return null
  return formatGigDetail(gig)
}

const listGigSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  category: true,
  imageUrl: true,
  isActive: true,
  createdAt: true,
  city: true,
  latitude: true,
  longitude: true,
  isRemote: true,
  sellerId: true,
} satisfies Prisma.GigSelect

type ListedGig = Prisma.GigGetPayload<{ select: typeof listGigSelect }>

export type ListPublicGigsFilters = {
  page?: number
  limit?: number
  /** Free-text query (title / description / category) */
  q?: string | null
  category?: string | null
  city?: string | null
  /** When true, only remote gigs */
  remoteOnly?: boolean
}

function buildPublicGigFilters(filters: ListPublicGigsFilters = {}): Prisma.GigWhereInput {
  const and: Prisma.GigWhereInput[] = []
  const q = (filters.q || '').trim()
  if (q) {
    and.push({
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { category: { contains: q } },
        { city: { contains: q } },
      ],
    })
  }
  const category = (filters.category || '').trim()
  if (category && category !== 'Todas') {
    and.push({ category })
  }
  const city = (filters.city || '').trim()
  if (city && !/cerca/i.test(city)) {
    and.push({
      OR: [{ city: { contains: city } }],
    })
  }
  if (filters.remoteOnly) {
    and.push({ isRemote: true })
  }
  return and.length ? { AND: and } : {}
}

export async function listPublicGigs({
  page = 1,
  limit = 100,
  q,
  category,
  city,
  remoteOnly,
}: ListPublicGigsFilters = {}): Promise<{ gigs: PublicGigListItem[]; total: number }> {
  const skip = (page - 1) * limit
  const filterWhere = buildPublicGigFilters({ q, category, city, remoteOnly })
  let where: Prisma.GigWhereInput = { ...publicGigWhere(), ...filterWhere }
  let gigs: ListedGig[] = []
  let total = 0

  try {
    total = await prisma.gig.count({ where })
    gigs = await prisma.gig.findMany({
      where,
      select: listGigSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })
  } catch (dbErr: unknown) {
    if (isMissingDeletedAtColumn(dbErr)) {
      where = { ...publicGigWhereFallback(), ...filterWhere }
      total = await prisma.gig.count({ where })
      gigs = await prisma.gig.findMany({
        where,
        select: listGigSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
    } else {
      throw dbErr
    }
  }

  const sellerIds = [
    ...new Set(gigs.map((g) => g.sellerId).filter((id): id is string => !!id)),
  ]
  const sellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: sellerListSelect,
  })
  const sellerMap = Object.fromEntries(
    sellers.map((s: (typeof sellers)[number]) => [s.id, s]),
  )

  const gigsWithSeller: PublicGigListItem[] = gigs.map((gig) => ({
    id: gig.id,
    title: gig.title,
    description: gig.description,
    price: gig.price,
    category: gig.category,
    imageUrl: gig.imageUrl,
    isActive: gig.isActive,
    createdAt: gig.createdAt,
    city: gig.city,
    latitude: gig.latitude,
    longitude: gig.longitude,
    isRemote: gig.isRemote,
    sellerId: gig.sellerId,
    seller: sellerMap[gig.sellerId] ?? null,
  }))

  return { gigs: gigsWithSeller, total }
}

const gigPageReviewInclude = {
  reviewer: { select: { name: true, profilePicture: true } },
} satisfies Prisma.ReviewInclude

export type GigPageReview = Prisma.ReviewGetPayload<{ include: typeof gigPageReviewInclude }>

export async function getSellerReviewsForGigPage(sellerId: string, limit = 4) {
  return prisma.review.findMany({
    where: { sellerId },
    include: gigPageReviewInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}