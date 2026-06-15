'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { isSessionExpired } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/signup', '/login/error', '/terms', '/privacy', '/about', '/faq']

export default function SessionExpiryHandler({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status !== 'authenticated' || !session) return
    if (!isSessionExpired(session)) return

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    const callback = encodeURIComponent(pathname || '/')

    signOut({ redirect: false }).finally(() => {
      if (!isPublic) {
        router.replace(`/login?reason=deactivated&callbackUrl=${callback}`)
      }
    })
  }, [session, status, pathname, router])

  return <>{children}</>
}