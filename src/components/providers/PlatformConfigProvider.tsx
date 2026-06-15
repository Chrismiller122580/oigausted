'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { PublicPlatformConfig } from '@/types/platform-config'
import {
  fetchPublicPlatformConfig,
  invalidatePublicPlatformConfigCache,
} from '@/lib/public-platform-config-client'

type PlatformConfigContextValue = {
  config: PublicPlatformConfig | null
  loaded: boolean
  refresh: () => Promise<void>
}

const PlatformConfigContext = createContext<PlatformConfigContextValue>({
  config: null,
  loaded: false,
  refresh: async () => {},
})

const MAINTENANCE_POLL_MS = 120_000

export function PlatformConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PublicPlatformConfig | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async (fresh = false) => {
    try {
      const data = await fetchPublicPlatformConfig({ fresh })
      setConfig(data)
    } catch {
      // Keep any previously loaded config on transient failures.
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(), MAINTENANCE_POLL_MS)
    return () => clearInterval(interval)
  }, [load])

  const refresh = useCallback(async () => {
    invalidatePublicPlatformConfigCache()
    await load(true)
  }, [load])

  return (
    <PlatformConfigContext.Provider value={{ config, loaded, refresh }}>
      {children}
    </PlatformConfigContext.Provider>
  )
}

export function usePlatformConfig() {
  return useContext(PlatformConfigContext)
}