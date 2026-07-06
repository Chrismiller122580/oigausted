'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { initNativePushNotifications } from '@/lib/native-push'
import { isCapacitorNative } from '@/lib/capacitor-native'

/**
 * Auto-registers native push (FCM/APNs) when a user is signed in inside the mobile app.
 * No UI.
 */
export default function NativePushInit() {
  const { status } = useSession()
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (!isCapacitorNative() || status !== 'authenticated' || attemptedRef.current) return
    attemptedRef.current = true
    void initNativePushNotifications()
  }, [status])

  return null
}