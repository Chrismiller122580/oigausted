import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Maintenance mode + IP bypass (configured in Admin > Settings).
  // - Normal users (non-bypassed IPs) on non-exempt page routes get a clean 503 maintenance page.
  // - Bypassed IPs (e.g. your office/home) + login/admin flows get full access (plus the red banner for testing).
  // - The banner (client fetch to /api/admin/config) shows for everyone when active.
  // - Lightweight: we fetch config with short revalidate; fail-open on error.
  // - Additional IPs can be set via MAINTENANCE_BYPASS_IPS env var (comma-separated) — merged with DB list.

  const pathname = request.nextUrl.pathname;

  // Exempt paths that must always work (login flow, admin management to disable mode, static, etc.)
  const isExempt =
    pathname.startsWith('/login') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/admin/config') || // banner + public config need this
    pathname === '/manifest.webmanifest' ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webmanifest');

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/config`, {
      next: { revalidate: 15 },
    } as any);

    if (res.ok) {
      const cfg = await res.json();
      if (cfg.maintenanceMode) {
        const dbBypass = (cfg.maintenanceBypassIps || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        const envBypass = (process.env.MAINTENANCE_BYPASS_IPS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        const bypassIps = Array.from(new Set([...dbBypass, ...envBypass]));

        // TEMP: ensure the currently reported dev/test IP (from the maintenance screen) is bypassed
        // so the full site + banner is visible without needing an immediate DB/env update.
        // Remove this block once 73.23.141.95 (or your current IP) is permanently in the bypass list.
        if (!bypassIps.includes('73.23.141.95')) {
          bypassIps.push('73.23.141.95');
        }
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   '';

        const isBypassed = bypassIps.some((b: string) => ip === b || ip.includes(b) || b.includes(ip));

        if (!isBypassed && !isExempt) {
          // Non-bypassed normal user hitting a regular page → serve maintenance page (real restriction).
          const message = cfg.maintenanceMessage || 'Estamos realizando mejoras. Volveremos pronto.';
          const ipNote = ip ? `<p style="margin-top:1.5rem;font-size:0.85rem;opacity:0.75">Tu IP detectada: <code style="background:#222;padding:2px 6px;border-radius:3px">${ip}</code><br>Añádela en Admin → Settings → Maintenance Bypass IPs para ver el sitio completo + banner mientras pruebas.</p>` : '';
          const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mantenimiento | Oigagig</title>
<style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0a0a0a;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
.box{max-width:620px}.h1{font-size:2.25rem;margin-bottom:1rem;color:#f87171}.msg{font-size:1.1rem;opacity:.95;line-height:1.5}</style>
</head><body><div class="box"><div class="h1">🛠️ Modo Mantenimiento</div><div class="msg">${message.replace(/</g,'&lt;')}</div><p style="margin-top:2rem;opacity:.6;font-size:.9rem">Disculpe las molestias.<br>Solo el personal autorizado puede acceder durante este período.</p>${ipNote}<p style="margin-top:1rem;font-size:0.8rem;opacity:0.6">Admins: accede a /admin para gestionar.</p></div></body></html>`;
          const response = new NextResponse(html, {
            status: 503,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Retry-After': '1800',
              'x-maintenance-active': 'true',
            },
          });
          if (ip) response.headers.set('x-client-ip', ip);
          return response;
        }

        // Maintenance active but user is bypassed or on exempt path → proceed with header (banner will show).
        const response = NextResponse.next();
        response.headers.set('x-maintenance-active', 'true');
        if (ip) response.headers.set('x-client-ip', ip);
        return response;
      }
    }
  } catch {
    // fail open — no maintenance enforcement this request
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
