'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Briefcase } from 'lucide-react'
import { getStaffPortalPath, isStaffRole } from '@/lib/session'

type StaffPortalLinkProps = {
  className?: string
  compact?: boolean
}

export function StaffPortalLink({ className = '', compact = false }: StaffPortalLinkProps) {
  const { data: session } = useSession()
  const staffRole = session?.user?.staffRole
  if (!isStaffRole(staffRole)) return null

  const href = getStaffPortalPath(staffRole)
  const label =
    staffRole === 'accountant'
      ? 'Portal Finanzas'
      : staffRole === 'analytics'
        ? 'Portal Analytics'
        : 'Portal Staff'

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 text-muted-foreground hover:text-foreground transition ${className}`}
      title={label}
    >
      <Briefcase size={18} />
      {!compact && <span className="text-xs font-medium">{label}</span>}
    </Link>
  )
}