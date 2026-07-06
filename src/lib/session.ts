import type { Session } from 'next-auth'

/** Marketplace identity */
export const USER_ROLES = ['buyer', 'seller', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

/** Optional additive staff tools */
export const STAFF_ROLES = ['accountant', 'admin_assistant'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export function isUserRole(role: string | undefined | null): role is UserRole {
  return !!role && (USER_ROLES as readonly string[]).includes(role)
}

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

export function getUserId(session: Session | null | undefined): string | undefined {
  return session?.user?.id
}

export function getUserRole(session: Session | null | undefined): UserRole {
  const role = session?.user?.role
  if (isUserRole(role)) return role
  return 'buyer'
}

export function getStaffRole(session: Session | null | undefined): StaffRole | null {
  const staffRole = session?.user?.staffRole
  return isStaffRole(staffRole) ? staffRole : null
}

export function getStaffPortalPath(staffRole: StaffRole): string {
  return staffRole === 'accountant' ? '/accountant' : '/admin-assistant'
}

export function getMarketplaceDashboardPath(role: string | undefined | null): string | null {
  if (role === 'seller') return '/seller'
  if (role === 'buyer') return '/buyer'
  return null
}

export function getMarketplaceRoleLabel(role: string | undefined | null): string | null {
  if (role === 'seller') return 'Vendedor'
  if (role === 'buyer') return 'Comprador'
  return null
}

export function isSessionExpired(session: Session | null | undefined): boolean {
  return !!(session as Session & { expired?: boolean })?.expired
}