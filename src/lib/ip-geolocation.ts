const LOOKUP_TIMEOUT_MS = 3000

function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return true
  if (ip === '::1' || ip.startsWith('127.')) return true
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) return true
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true
  return false
}

type IpApiResponse = {
  status?: string
  city?: string
  regionName?: string
  country?: string
}

/** Best-effort city/region/country from IP via ip-api.com (no API key). */
export async function lookupCityFromIp(ip: string): Promise<string | null> {
  if (isPrivateOrLocalIp(ip)) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`,
      { signal: controller.signal, next: { revalidate: 0 } }
    )
    clearTimeout(timeout)

    if (!res.ok) return null

    const data = (await res.json()) as IpApiResponse
    if (data.status !== 'success') return null

    const parts = [data.city, data.regionName, data.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  } catch {
    return null
  }
}