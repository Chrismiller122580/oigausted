import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { BRAND_NAME, BRAND_LOGO_PATH } from '@/lib/brand'
import { isSqliteDatabase, slugify } from '@/lib/utils'

export const PLATFORM_SELLER_SLUG = 'oigagig'
export const PLATFORM_SELLER_EMAIL = 'documentos@oigagig.com'

const PLATFORM_BIO =
  'Buro de Documentos de OigaGIG — redacción de cartas, contratos y trámites para Colombia. Presentado por OigaGIG.'

const SELLER_SELECT = { id: true, slug: true } as const

async function findPlatformSeller() {
  return prisma.user.findFirst({
    where: { OR: [{ slug: PLATFORM_SELLER_SLUG }, { email: PLATFORM_SELLER_EMAIL }] },
    select: SELLER_SELECT,
  })
}

/** Raw upsert for local SQLite DBs that lag behind schema (missing contactViolationCount, etc.) */
async function ensurePlatformSellerSqlite(): Promise<{ id: string; slug: string }> {
  const existing = await findPlatformSeller()
  if (existing) {
    if (existing.slug !== PLATFORM_SELLER_SLUG) {
      await prisma.$executeRaw`
        UPDATE "User"
        SET slug = ${PLATFORM_SELLER_SLUG},
            role = 'seller',
            "businessName" = ${BRAND_NAME},
            bio = ${PLATFORM_BIO},
            "profilePicture" = ${BRAND_LOGO_PATH},
            city = 'Colombia',
            "isActive" = 1,
            "updatedAt" = datetime('now')
        WHERE id = ${existing.id}
      `
    }
    return { id: existing.id, slug: PLATFORM_SELLER_SLUG }
  }

  const id = randomUUID()
  const now = new Date().toISOString()
  await prisma.$executeRaw`
    INSERT INTO "User" (
      id, email, name, "businessName", slug, role, bio, "profilePicture", city,
      "isActive", "createdAt", "updatedAt", "reviewCount", rating
    ) VALUES (
      ${id}, ${PLATFORM_SELLER_EMAIL}, ${BRAND_NAME}, ${BRAND_NAME}, ${PLATFORM_SELLER_SLUG},
      'seller', ${PLATFORM_BIO}, ${BRAND_LOGO_PATH}, 'Colombia',
      1, ${now}, ${now}, 0, 0
    )
  `

  return { id, slug: PLATFORM_SELLER_SLUG }
}

/** Ensures the platform OigaGIG seller profile exists for public /sellers/oigagig */
export async function ensurePlatformSeller(): Promise<{ id: string; slug: string }> {
  const existing = await findPlatformSeller()
  if (existing?.slug === PLATFORM_SELLER_SLUG) {
    return { id: existing.id, slug: existing.slug }
  }

  if (isSqliteDatabase()) {
    return ensurePlatformSellerSqlite()
  }

  const created = await prisma.user.upsert({
    where: { email: PLATFORM_SELLER_EMAIL },
    create: {
      email: PLATFORM_SELLER_EMAIL,
      name: BRAND_NAME,
      businessName: BRAND_NAME,
      slug: PLATFORM_SELLER_SLUG,
      role: 'seller',
      bio: PLATFORM_BIO,
      profilePicture: BRAND_LOGO_PATH,
      city: 'Colombia',
      isActive: true,
    },
    update: {
      businessName: BRAND_NAME,
      slug: PLATFORM_SELLER_SLUG,
      role: 'seller',
      bio: PLATFORM_BIO,
      profilePicture: BRAND_LOGO_PATH,
      isActive: true,
    },
    select: SELLER_SELECT,
  })

  return { id: created.id, slug: created.slug || PLATFORM_SELLER_SLUG }
}

export async function getPlatformSeller() {
  return prisma.user.findFirst({
    where: { slug: PLATFORM_SELLER_SLUG, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      businessName: true,
      bio: true,
      profilePicture: true,
      city: true,
      rating: true,
      reviewCount: true,
    },
  })
}

export function platformSellerDisplayName(user?: { businessName?: string | null; name?: string | null }) {
  return user?.businessName || user?.name || BRAND_NAME
}

export function isPlatformSellerSlug(slug: string): boolean {
  return slugify(slug) === PLATFORM_SELLER_SLUG
}