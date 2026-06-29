import type { Session } from 'next-auth'
import { getServerSession, authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isStaffRole, type StaffRole } from '@/lib/session'

export type { StaffRole }

export async function verifyStaffRoleFromDb(
  userId: string,
  staffRole: StaffRole
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { staffRole: true, isActive: true },
    })
    return user?.staffRole === staffRole && user.isActive !== false
  } catch {
    return false
  }
}

/** Returns session only when caller has the given staff role (DB-verified). */
export async function requireStaffRoleFromDb(staffRole: StaffRole): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId || session.user?.staffRole !== staffRole) {
    return null
  }
  const ok = await verifyStaffRoleFromDb(userId, staffRole)
  return ok ? session : null
}

/** @deprecated Use requireStaffRoleFromDb */
export const requireRoleFromDb = requireStaffRoleFromDb