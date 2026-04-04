import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/profile' || pathname.startsWith('/profile/')) {
    return NextResponse.redirect(new URL('/buyer', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/profile/:path*'
}
