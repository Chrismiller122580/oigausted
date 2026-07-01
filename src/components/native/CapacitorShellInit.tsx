'use client'

import { useEffect } from 'react'
import { initCapacitorShell, isCapacitorNative } from '@/lib/capacitor-native'

/**
 * Boots native-only plugins (splash, status bar, deep links).
 * No-op on web and mobile browsers.
 */
export default function CapacitorShellInit() {
  useEffect(() => {
    if (!isCapacitorNative()) return
    void initCapacitorShell()
  }, [])

  return null
}