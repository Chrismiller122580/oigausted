import type { PublicPlatformConfig } from '@/types/platform-config'

let cached: PublicPlatformConfig | null = null
let cacheTimestamp = 0
let inflight: Promise<PublicPlatformConfig> | null = null

const CLIENT_TTL_MS = 60_000

export function invalidatePublicPlatformConfigCache(): void {
  cached = null
  cacheTimestamp = 0
}

export async function fetchPublicPlatformConfig(
  options?: { fresh?: boolean }
): Promise<PublicPlatformConfig> {
  const now = Date.now()
  if (!options?.fresh && cached && now - cacheTimestamp < CLIENT_TTL_MS) {
    return cached
  }

  if (inflight && !options?.fresh) {
    return inflight
  }

  const url = options?.fresh ? '/api/admin/config?fresh=1' : '/api/admin/config'

  inflight = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`config fetch failed: ${res.status}`)
      const data = (await res.json()) as PublicPlatformConfig
      cached = data
      cacheTimestamp = Date.now()
      return data
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}