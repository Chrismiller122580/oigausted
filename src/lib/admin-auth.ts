import type { Session } from 'next-auth'
import { getServerSession, authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Verify the user is still an active admin in the database.
 * JWT role alone is not trusted (demoted admins retain JWT until expiry).
 */
export async function verifyAdminFromDb(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    })
    return user?.role === 'admin' && user.isActive !== false
  } catch {
    return false
  }
}

/**
 * Returns the session only when the caller is a currently active admin (DB-verified).
 */
export async function requireAdminFromDb(): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId || session.user?.role !== 'admin') {
    return null
  }
  const ok = await verifyAdminFromDb(userId)
  return ok ? session : null
}

/** @deprecated Use requireAdminFromDb — kept for import compatibility */
export const requireAdminSession = requireAdminFromDb