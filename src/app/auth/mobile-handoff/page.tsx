import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createMobileAuthToken } from '@/lib/mobile-auth-token'
import MobileHandoffClient from './MobileHandoffClient'

type SearchParams = Promise<{ next?: string }>

function sanitizeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

export default async function MobileHandoffPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { next } = await searchParams
  const nextPath = sanitizeNextPath(next)

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const loginUrl = new URL('/login', process.env.NEXTAUTH_URL ?? 'https://oigagig.com')
    loginUrl.searchParams.set('callbackUrl', nextPath)
    loginUrl.searchParams.set('error', 'SessionRequired')
    redirect(loginUrl.pathname + loginUrl.search)
  }

  const token = createMobileAuthToken(session.user.id)
  if (!token) {
    redirect('/login?error=Configuration')
  }

  return <MobileHandoffClient token={token} nextPath={nextPath} />
}