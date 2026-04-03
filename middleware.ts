import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl

  // Force redirect any /profile request to /buyer
  if (url.pathname === '/profile' || url.pathname.startsWith('/profile/')) {
    return NextResponse.redirect(new URL('/buyer', request.url))
  }

  return NextResponse.next()
}

// Only run middleware on /profile routes
export const config = {
  matcher: '/profile/:path*'
}
