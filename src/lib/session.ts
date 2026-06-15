import type { Session } from 'next-auth'

export type UserRole = 'buyer' | 'seller' | 'admin'

export function getUserId(session: Session | null | undefined): string | undefined {
  return session?.user?.id
}

export function getUserRole(session: Session | null | undefined): UserRole {
  const role = session?.user?.role
  if (role === 'admin' || role === 'seller' || role === 'buyer') return role
  return 'buyer'
}

export function isSessionExpired(session: Session | null | undefined): boolean {
  return !!(session as Session & { expired?: boolean })?.expired
}