import type { Session } from 'next-auth'
import { getServerSession, authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type StaffRole = 'accountant' | 'admin_assistant'

export async function verifyStaffRoleFromDb(
  userId: string,
  role: StaffRole
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    })
    return user?.role === role && user.isActive !== false
  } catch {
    return false
  }
}

/** Returns session only when caller has the given staff role (DB-verified). */
export async function requireRoleFromDb(role: StaffRole): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId || session.user?.role !== role) {
    return null
  }
  const ok = await verifyStaffRoleFromDb(userId, role)
  return ok ? session : null
}