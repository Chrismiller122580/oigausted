'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { HEARTBEAT_INTERVAL_MS } from '@/lib/presence'

function sendHeartbeat() {
  fetch('/api/presence/heartbeat', { method: 'POST' }).catch(() => {})
}

export default function PresenceHeartbeat() {
  const { status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return

    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status])

  return null
}