/** Edge-safe maintenance config fetch + path helpers (no Prisma). */

export type MaintenanceState = {
  active: boolean
  message: string
  bypassIps: string[]
  fetchedAt: number
}

let cache: MaintenanceState | null = null
const CACHE_TTL_MS = 15_000

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || ''
}

export function isIpBypassed(ip: string, bypassIps: string[]): boolean {
  return ip.length > 0 && bypassIps.includes(ip)
}

/** Paths that stay reachable during maintenance (auth, admin, webhooks, static assets). */
export function isMaintenanceExempt(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/_next') ||
    pathname === '/manifest.webmanifest' ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webmanifest')
  )
}

export function maintenanceHtml(message: string, ip: string): string {
  const ipNote = ip
    ? `<p style="margin-top:1.5rem;font-size:0.85rem;opacity:0.75">Tu IP detectada: <code style="background:#222;padding:2px 6px;border-radius:3px">${ip}</code><br>Añádela en Admin → Settings → Maintenance Bypass IPs para ver el sitio completo + banner mientras pruebas.</p>`
    : ''
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mantenimiento | OigaGIG</title>
<style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0a0a0a;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
.box{max-width:620px}.h1{font-size:2.25rem;margin-bottom:1rem;color:#f87171}.msg{font-size:1.1rem;opacity:.95;line-height:1.5}</style>
</head><body><div class="box"><div class="h1">🛠️ Modo Mantenimiento</div><div class="msg">${message.replace(/</g, '&lt;')}</div><p style="margin-top:2rem;opacity:.6;font-size:.9rem">Disculpe las molestias.<br>Solo el personal autorizado puede acceder durante este período.</p>${ipNote}<p style="margin-top:1rem;font-size:0.8rem;opacity:0.6">Admins: accede a /admin para gestionar.</p></div></body></html>`
}

export async function fetchMaintenanceState(appUrl: string): Promise<MaintenanceState> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache
  }

  try {
    const res = await fetch(`${appUrl}/api/admin/config`, {
      next: { revalidate: 15 },
    } as RequestInit)

    if (res.ok) {
      const cfg = await res.json()
      const dbBypass = String(cfg.maintenanceBypassIps || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      const envBypass = (process.env.MAINTENANCE_BYPASS_IPS || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)

      cache = {
        active: !!cfg.maintenanceMode,
        message: cfg.maintenanceMessage || 'Estamos realizando mejoras. Volveremos pronto.',
        bypassIps: Array.from(new Set([...dbBypass, ...envBypass])),
        fetchedAt: now,
      }
      return cache
    }
  } catch {
    // fall through to sticky / fail-closed handling
  }

  // Sticky: keep enforcing maintenance if it was active before a config fetch blip
  if (cache?.active) {
    return { ...cache, fetchedAt: now }
  }

  if (process.env.MAINTENANCE_FAIL_CLOSED === 'true') {
    const envBypass = (process.env.MAINTENANCE_BYPASS_IPS || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
    cache = {
      active: true,
      message: 'Estamos realizando mejoras. Volveremos pronto.',
      bypassIps: envBypass,
      fetchedAt: now,
    }
    return cache
  }

  cache = { active: false, message: '', bypassIps: [], fetchedAt: now }
  return cache
}