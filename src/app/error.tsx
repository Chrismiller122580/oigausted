'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App route error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Algo salió mal</h1>
        <p className="text-muted-foreground mb-6">
          No se pudo abrir esta página. Si llegaste desde un correo, inicia sesión e inténtalo de nuevo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/messages"
            className="px-6 py-3 border rounded-xl hover:bg-muted transition"
          >
            Ir a mensajes
          </Link>
        </div>
      </div>
    </div>
  )
}
