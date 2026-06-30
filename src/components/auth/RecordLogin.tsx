'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { recordMeaningfulPwaAction } from '@/lib/pwa-install'

const STORAGE_KEY = 'oiga_login_recorded'

export default function RecordLogin() {
  const { status } = useSession()
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      sessionStorage.removeItem(STORAGE_KEY)
      attemptedRef.current = false
      return
    }

    if (status !== 'authenticated' || attemptedRef.current) return
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return

    attemptedRef.current = true
    recordMeaningfulPwaAction()
    fetch('/api/auth/record-login', { method: 'POST' })
      .then((res) => {
        if (res.ok) sessionStorage.setItem(STORAGE_KEY, '1')
      })
      .catch(() => {
        attemptedRef.current = false
      })
  }, [status])

  return null
}