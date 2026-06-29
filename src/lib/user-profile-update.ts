import { prisma } from '@/lib/prisma'
import { slugify, devLog } from '@/lib/utils'
import type { Prisma, User } from '@prisma/client'

export type ProfilePatchInput = {
  name?: string
  tagline?: string | null
  imageUrl?: string
  coverImageUrl?: string
  bio?: string | null
  phone?: string | null
  whatsapp?: string | null
  instagram?: string | null
  facebook?: string | null
  city?: string
  businessName?: string
  latitude?: number | null
  longitude?: number | null
  serviceRadiusKm?: number | null
}

export function isMissingColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    msg.includes('coverImageUrl') ||
    msg.includes('serviceRadiusKm') ||
    msg.includes('latitude') ||
    msg.includes('longitude') ||
    (msg.toLowerCase().includes('column') && msg.includes('does not exist'))
  )
}

export function isSlugColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('slug')
}

function buildUpdateData(data: ProfilePatchInput): Prisma.UserUpdateInput {
  const updateData: Prisma.UserUpdateInput = {
    name: data.name || undefined,
    tagline: data.tagline !== undefined ? (data.tagline || null) : undefined,
    profilePicture: data.imageUrl || undefined,
    coverImageUrl: data.coverImageUrl || undefined,
    bio: data.bio !== undefined ? (data.bio || null) : undefined,
    phone: data.phone !== undefined ? (data.phone || null) : undefined,
    whatsapp: data.whatsapp !== undefined ? (data.whatsapp || null) : undefined,
    instagram: data.instagram !== undefined ? (data.instagram || null) : undefined,
    facebook: data.facebook !== undefined ? (data.facebook || null) : undefined,
    city: data.city !== undefined ? (data.city || null) : undefined,
    latitude: data.latitude !== undefined ? data.latitude : undefined,
    longitude: data.longitude !== undefined ? data.longitude : undefined,
    serviceRadiusKm: data.serviceRadiusKm !== undefined ? data.serviceRadiusKm : undefined,
  }

  if (data.businessName !== undefined) {
    updateData.businessName = (data.businessName || '').trim() || null
  }

  return updateData
}

async function resolveSlug(
  userId: string,
  businessName: string
): Promise<{ slug?: string | null; slugSafe: boolean }> {
  const trimmed = businessName.trim()
  if (!trimmed) return { slug: null, slugSafe: false }

  let slug = slugify(trimmed)
  if (!slug) return { slug: null, slugSafe: false }

  let candidate = slug
  let suffix = 1
  let slugSafe = false

  while (true) {
    let exists: { id: string } | null = null
    try {
      exists = await prisma.user.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
      slugSafe = true
    } catch {
      devLog('slug check skipped (possible missing column in prod DB)')
      return { slugSafe: false }
    }
    if (!exists || exists.id === userId) {
      return { slug: candidate, slugSafe }
    }
    candidate = `${slug}-${suffix++}`
    if (suffix > 50) {
      return { slug: `${slug}-${Date.now().toString(36)}`, slugSafe }
    }
  }
}

async function rawSqlProfileUpdate(
  userId: string,
  updateData: Prisma.UserUpdateInput
): Promise<User | null> {
  devLog('Applying raw SQL profile update (prod DB missing optional columns)')
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET 
      name = $1,
      tagline = $2,
      "profilePicture" = $3,
      "coverImageUrl" = $4,
      bio = $5,
      phone = $6,
      whatsapp = $7,
      instagram = $8,
      facebook = $9,
      city = $10,
      "businessName" = $11,
      "updatedAt" = NOW()
    WHERE id = $12`,
    updateData.name ?? null,
    updateData.tagline ?? null,
    updateData.profilePicture ?? null,
    updateData.coverImageUrl ?? null,
    updateData.bio ?? null,
    updateData.phone ?? null,
    updateData.whatsapp ?? null,
    updateData.instagram ?? null,
    updateData.facebook ?? null,
    updateData.city ?? null,
    updateData.businessName ?? null,
    userId
  )
  return prisma.user.findUnique({ where: { id: userId } })
}

function stripDriftedColumns(data: Prisma.UserUpdateInput): Prisma.UserUpdateInput {
  const safe = { ...data }
  delete safe.slug
  delete safe.latitude
  delete safe.longitude
  delete safe.serviceRadiusKm
  return safe
}

/** Safe profile update with fallbacks for drifted prod DB schemas. */
export async function applyUserProfileUpdate(
  userId: string,
  input: ProfilePatchInput
): Promise<User | null> {
  const updateData = buildUpdateData(input)

  // Saving business info from seller profile should persist seller role (not only in session)
  if (input.businessName !== undefined && String(input.businessName).trim()) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (current?.role === 'buyer') {
      updateData.role = 'seller'
    }
  }

  if (input.businessName !== undefined) {
    const { slug, slugSafe } = await resolveSlug(userId, input.businessName)
    if (slugSafe) {
      updateData.slug = slug ?? null
    }
  }

  try {
    return await prisma.user.update({ where: { id: userId }, data: updateData })
  } catch (firstErr: unknown) {
    if (isSlugColumnError(firstErr) && updateData.slug !== undefined) {
      delete updateData.slug
      try {
        return await prisma.user.update({ where: { id: userId }, data: updateData })
      } catch (secondErr: unknown) {
        if (isMissingColumnError(secondErr)) {
          return rawSqlProfileUpdate(userId, stripDriftedColumns(updateData))
        }
        throw secondErr
      }
    }

    if (isMissingColumnError(firstErr)) {
      return rawSqlProfileUpdate(userId, stripDriftedColumns(updateData))
    }

    throw firstErr
  }
}

const profileSelectFull = {
  id: true,
  name: true,
  email: true,
  role: true,
  tagline: true,
  bio: true,
  businessName: true,
  nit: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  facebook: true,
  city: true,
  profilePicture: true,
  coverImageUrl: true,
  latitude: true,
  longitude: true,
  serviceRadiusKm: true,
  rating: true,
  reviewCount: true,
  slug: true,
} satisfies Prisma.UserSelect

const profileSelectCore = {
  id: true,
  name: true,
  email: true,
  role: true,
  tagline: true,
  bio: true,
  businessName: true,
  nit: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  facebook: true,
  city: true,
  profilePicture: true,
  rating: true,
  reviewCount: true,
} satisfies Prisma.UserSelect

/** Safe read of seller/buyer profile fields (falls back if optional columns missing). */
export async function getUserProfile(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: profileSelectFull,
    })
  } catch {
    return prisma.user.findUnique({
      where: { id: userId },
      select: profileSelectCore,
    })
  }
}