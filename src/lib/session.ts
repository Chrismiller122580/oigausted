import type { Session } from 'next-auth'

export const USER_ROLES = [
  'buyer',
  'seller',
  'admin',
  'accountant',
  'admin_assistant',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(role: string | undefined | null): role is UserRole {
  return !!role && (USER_ROLES as readonly string[]).includes(role)
}

export function getUserId(session: Session | null | undefined): string | undefined {
  return session?.user?.id
}

export function getUserRole(session: Session | null | undefined): UserRole {
  const role = session?.user?.role
  if (isUserRole(role)) return role
  return 'buyer'
}