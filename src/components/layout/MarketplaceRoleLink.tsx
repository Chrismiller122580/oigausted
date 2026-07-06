'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ShoppingBag, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getMarketplaceDashboardPath,
  getMarketplaceRoleLabel,
} from '@/lib/session'

type MarketplaceRoleLinkProps = {
  className?: string
  variant?: 'button' | 'menu'
  onNavigate?: () => void
}

export function MarketplaceRoleLink({
  className = '',
  variant = 'button',
  onNavigate,
}: MarketplaceRoleLinkProps) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const href = getMarketplaceDashboardPath(role)
  const label = getMarketplaceRoleLabel(role)
  if (!href || !label) return null

  const Icon = role === 'seller' ? Store : ShoppingBag
  const text = `Volver a ${label}`

  if (variant === 'menu') {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-3 py-4 border-b border-border font-medium text-orange-700 dark:text-orange-300 ${className}`}
      >
        <Icon size={22} />
        {text}
      </Link>
    )
  }

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={`h-8 gap-1.5 shrink-0 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/40 ${className}`}
    >
      <Link href={href} title={text}>
        <ArrowLeft size={14} className="shrink-0" />
        <Icon size={14} className="shrink-0 sm:hidden" />
        <span className="hidden sm:inline">{text}</span>
        <span className="sm:hidden">{label}</span>
      </Link>
    </Button>
  )
}