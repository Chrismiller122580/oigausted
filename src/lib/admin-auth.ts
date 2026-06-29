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

/** Verify active admin_assistant staff (DB-verified). */
export async function verifyAdminAssistantFromDb(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { staffRole: true, isActive: true },
    })
    return user?.staffRole === 'admin_assistant' && user.isActive !== false
  } catch {
    return false
  }
}

export type AdminPanelAccess = {
  session: Session
  isFullAdmin: boolean
}

/** Admin or admin_assistant with DB verification (for support/ops panel). */
export async function verifyAdminPanelAccess(
  userId: string,
  session: Session
): Promise<boolean> {
  if (session.user?.role === 'admin') {
    return verifyAdminFromDb(userId)
  }
  if (session.user?.staffRole === 'admin_assistant') {
    return verifyAdminAssistantFromDb(userId)
  }
  return false
}

/** Returns session for admin or admin_assistant panel access (DB-verified). */
export async function requireAdminPanelFromDb(): Promise<AdminPanelAccess | null> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId || !session) return null

  if (session.user?.role === 'admin' && (await verifyAdminFromDb(userId))) {
    return { session, isFullAdmin: true }
  }
  if (session.user?.staffRole === 'admin_assistant' && (await verifyAdminAssistantFromDb(userId))) {
    return { session, isFullAdmin: false }
  }
  return null
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

/** Session for admin or admin_assistant panel (DB-verified). */
export async function requireAdminPanelSession(): Promise<Session | null> {
  const access = await requireAdminPanelFromDb()
  return access?.session ?? null
}

/** @deprecated Use requireAdminFromDb — kept for import compatibility */
export const requireAdminSession = requireAdminFromDb