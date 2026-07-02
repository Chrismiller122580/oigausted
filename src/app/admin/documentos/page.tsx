'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type LearnedRow = {
  id: string
  slug: string
  displayName: string
  rawDescription: string
  requestCount: number
  status: string
  lastRequestedAt: string
}

export default function AdminDocumentosPage() {
  const [rows, setRows] = useState<LearnedRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/documents/learned')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.learned || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/documents/learned', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!res.ok) {
      toast.error('No se pudo actualizar')
      return
    }
    toast.success('Actualizado')
    load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Buro de Documentos — Aprendizaje</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Documentos que usuarios pidieron fuera del catálogo. Promueve los populares al catálogo
          comunitario o descarta ruido.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay solicitudes personalizadas registradas.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  {row.displayName}
                  <span className="text-xs font-normal rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                    {row.requestCount} solicitudes
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{row.status}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{row.rawDescription}</p>
                <p className="text-xs text-muted-foreground">slug: {row.slug}</p>
                <div className="flex flex-wrap gap-2">
                  {row.status !== 'suggested' && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(row.id, 'suggested')}>
                      Sugerir en catálogo
                    </Button>
                  )}
                  {row.status !== 'promoted' && (
                    <Button size="sm" onClick={() => setStatus(row.id, 'promoted')}>
                      Promover
                    </Button>
                  )}
                  {row.status !== 'dismissed' && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(row.id, 'dismissed')}>
                      Descartar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}