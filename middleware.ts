import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  fetchMaintenanceState,
  getClientIp,
  isIpBypassed,
  isMaintenanceExempt,
  maintenanceHtml,
} from './src/lib/maintenance-config'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // NextAuth sometimes sends users to /api/auth/error — redirect to our friendly page
  if (pathname === '/api/auth/error') {
    const error = request.nextUrl.searchParams.get('error') || 'Default'
    const url = request.nextUrl.clone()
    url.pathname = '/login/error'
    url.search = `error=${encodeURIComponent(error)}`
    return NextResponse.redirect(url)
  }

  try {
    const state = await fetchMaintenanceState(appUrl)

    if (state.active) {
      const ip = getClientIp(request.headers)
      const isBypassed = isIpBypassed(ip, state.bypassIps)
      const isExempt = isMaintenanceExempt(pathname)

      if (!isBypassed && !isExempt) {
        const message = state.message

        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Service unavailable', maintenance: true, message },
            {
              status: 503,
              headers: {
                'Retry-After': '1800',
                'x-maintenance-active': 'true',
                ...(ip ? { 'x-client-ip': ip } : {}),
              },
            }
          )
        }

        const response = new NextResponse(maintenanceHtml(message, ip), {
          status: 503,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Retry-After': '1800',
            'x-maintenance-active': 'true',
            ...(ip ? { 'x-client-ip': ip } : {}),
          },
        })
        return response
      }

      const response = NextResponse.next()
      response.headers.set('x-maintenance-active', 'true')
      if (ip) response.headers.set('x-client-ip', ip)
      return response
    }
  } catch {
    // fetchMaintenanceState handles sticky/fail-closed internally
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}