'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { isMobileBrowser } from '@/lib/pwa-install'

export default function AppToaster() {
  const [position, setPosition] = useState<'top-center' | 'bottom-center'>('top-center')

  useEffect(() => {
    setPosition(isMobileBrowser() ? 'bottom-center' : 'top-center')
  }, [])

  return (
    <Toaster
      position={position}
      richColors
      closeButton
      expand
      visibleToasts={3}
      toastOptions={{
        className: 'font-medium',
      }}
    />
  )
}