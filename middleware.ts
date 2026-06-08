import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Basic maintenance mode + IP bypass support (powered by /admin/settings)
  // We only do lightweight enforcement here to avoid breaking auth flows.
  // The client-side MaintenanceBanner + admin layout do the heavy lifting.

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/config`, {
      // Use a short cache to not hammer on every request
      next: { revalidate: 15 },
    } as any);

    if (res.ok) {
      const cfg = await res.json();
      if (cfg.maintenanceMode) {
        const bypassIps = (cfg.maintenanceBypassIps || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   '';

        const isBypassed = bypassIps.some((b: string) => ip.includes(b) || b.includes(ip));

        if (!isBypassed) {
          // Non-bypassed request during maintenance.
          // We still let the request through (so login/admin work for admins),
          // but set a header that pages/banners can use if they want stronger UX blocks.
          const response = NextResponse.next();
          response.headers.set('x-maintenance-active', 'true');
          if (ip) response.headers.set('x-client-ip', ip);
          return response;
        }
        // Bypassed IP — proceed normally (no header)
      }
    }
  } catch {
    // If config fetch fails we fail open (no maintenance enforcement this request)
  }

  // Legacy no-op behavior preserved
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
