'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PresentedByOigaBadge } from '@/components/documents/PresentedByOigaBadge'

export default function DocumentSuccessPage() {
  const params = useParams()
  const id = params.id as string
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('loading')

  useEffect(() => {
    let attempts = 0
    const poll = async () => {
      const res = await fetch(`/api/documents/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setStatus(data.status)
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl)
        return
      }
      if (data.status !== 'Completed' && attempts < 12) {
        attempts++
        await fetch(`/api/documents/${id}/check-wompi`, { method: 'POST', body: '{}' })
        setTimeout(poll, 2000)
      }
    }
    poll()
  }, [id])

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto" />
      <h1 className="text-2xl font-bold mt-4">¡Pago recibido!</h1>
      <PresentedByOigaBadge className="mt-3" />
      <p className="text-muted-foreground mt-4">
        Tu documento se está generando y enviando por correo a ti y a la imprenta.
      </p>

      {status === 'Completed' && pdfUrl ? (
        <Button asChild className="mt-6" size="lg">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </a>
        </Button>
      ) : (
        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Preparando documento…
        </div>
      )}

      <Button variant="link" asChild className="mt-8 block">
        <Link href="/documentos">Crear otro documento</Link>
      </Button>
    </main>
  )
}