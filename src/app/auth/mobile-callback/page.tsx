import { Suspense } from 'react'
import MobileAuthCallbackClient from './MobileAuthCallbackClient'

export default function MobileAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-sm text-muted-foreground">
          Completando inicio de sesión…
        </div>
      }
    >
      <MobileAuthCallbackClient />
    </Suspense>
  )
}