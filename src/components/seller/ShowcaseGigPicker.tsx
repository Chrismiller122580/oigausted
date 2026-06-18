'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, ChevronDown, ChevronUp, Eye, LayoutGrid, Plus, Save } from 'lucide-react'
import { toast } from 'sonner'

type ShowcaseGig = {
  id: string
  title: string
  price: number
  category: string | null
  imageUrl: string | null
  isActive: boolean
  showOnProfile: boolean
  profileShowcaseOrder: number | null
}

const MAX_SHOWCASE = 12

export default function ShowcaseGigPicker({ publicProfileHref }: { publicProfileHref: string }) {
  const [gigs, setGigs] = useState<ShowcaseGig[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [supported, setSupported] = useState(true)

  const loadGigs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/showcase')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      const list: ShowcaseGig[] = data.gigs || []
      setGigs(list)
      setSupported(data.showcaseSupported !== false)
      const showcased = list
        .filter((g) => g.showOnProfile && g.isActive)
        .sort((a, b) => (a.profileShowcaseOrder ?? 999) - (b.profileShowcaseOrder ?? 999))
        .map((g) => g.id)
      setSelectedIds(
        showcased.length > 0 ? showcased : list.filter((g) => g.isActive).map((g) => g.id)
      )
    } catch {
      toast.error('No se pudieron cargar tus servicios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGigs()
  }, [loadGigs])

  const activeGigs = useMemo(() => gigs.filter((g) => g.isActive), [gigs])
  const selectedCount = selectedIds.length
  const isDirty = useMemo(() => {
    const current = gigs
      .filter((g) => g.showOnProfile && g.isActive)
      .sort((a, b) => (a.profileShowcaseOrder ?? 999) - (b.profileShowcaseOrder ?? 999))
      .map((g) => g.id)
    return JSON.stringify(current) !== JSON.stringify(selectedIds)
  }, [gigs, selectedIds])

  const toggleGig = (gigId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(gigId)) {
        return prev.filter((id) => id !== gigId)
      }
      if (prev.length >= MAX_SHOWCASE) {
        toast.error(`Máximo ${MAX_SHOWCASE} servicios en tu perfil público`)
        return prev
      }
      return [...prev, gigId]
    })
  }

  const moveGig = (gigId: string, direction: -1 | 1) => {
    setSelectedIds((prev) => {
      const index = prev.indexOf(gigId)
      if (index < 0) return prev
      const next = index + direction
      if (next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      ;[copy[index], copy[next]] = [copy[next], copy[index]]
      return copy
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/seller/showcase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigIds: selectedIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      const list: ShowcaseGig[] = data.gigs || []
      setGigs(list)
      setSelectedIds(
        list
          .filter((g) => g.showOnProfile)
          .sort((a, b) => (a.profileShowcaseOrder ?? 999) - (b.profileShowcaseOrder ?? 999))
          .map((g) => g.id)
      )
      toast.success('Servicios destacados guardados')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-orange-200 dark:border-orange-900/50">
        <CardContent className="p-6 text-sm text-muted-foreground">Cargando tus servicios…</CardContent>
      </Card>
    )
  }

  if (gigs.length === 0) {
    return (
      <Card className="border-orange-200 dark:border-orange-900/50">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center shrink-0">
              <LayoutGrid size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Servicios en tu perfil público</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Publica al menos un servicio para elegir qué mostrar en tu página pública.
              </p>
              <Link href="/create-gig" className="inline-block mt-4">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 gap-1.5">
                  <Plus size={16} /> Publicar mi primer servicio
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-orange-200 dark:border-orange-900/50 shadow-sm">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center shrink-0">
              <LayoutGrid size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-xl text-orange-900 dark:text-orange-100">
                Servicios en tu perfil público
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Elige qué servicios verán los clientes en tu página. Puedes destacar hasta {MAX_SHOWCASE}.
              </p>
              <p className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-2">
                {selectedCount} de {activeGigs.length} activos seleccionados
                {gigs.length > activeGigs.length && ` · ${gigs.length - activeGigs.length} pausados no aparecen en el perfil`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href={publicProfileHref} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye size={16} /> Vista previa
              </Button>
            </Link>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 gap-1.5"
              onClick={handleSave}
              disabled={saving || !isDirty || !supported}
            >
              <Save size={16} />
              {saving ? 'Guardando…' : 'Guardar selección'}
            </Button>
          </div>
        </div>

        {!supported && (
          <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3 mb-4">
            La selección de destacados se activará automáticamente tras el próximo despliegue. Por ahora se muestran todos tus servicios activos.
          </p>
        )}

        <div className="space-y-2">
          {gigs.map((gig) => {
            const isSelected = selectedIds.includes(gig.id)
            const orderIndex = selectedIds.indexOf(gig.id)
            const canMoveUp = isSelected && orderIndex > 0
            const canMoveDown = isSelected && orderIndex >= 0 && orderIndex < selectedIds.length - 1

            return (
              <div
                key={gig.id}
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-colors ${
                  isSelected
                    ? 'border-orange-300 dark:border-orange-800 bg-orange-50/80 dark:bg-orange-950/30'
                    : 'border-border bg-card hover:bg-muted/40'
                } ${!gig.isActive ? 'opacity-60' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => gig.isActive && toggleGig(gig.id)}
                  disabled={!gig.isActive || !supported}
                  aria-pressed={isSelected}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'border-muted-foreground/40 bg-background'
                  } disabled:cursor-not-allowed`}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </button>

                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                  {gig.imageUrl ? (
                    <img src={gig.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛠️</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{gig.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {gig.category || 'Sin categoría'} · ${gig.price.toLocaleString('es-CO')}
                    {!gig.isActive && ' · Pausado'}
                  </p>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-full mr-1 hidden sm:inline">
                      #{orderIndex + 1}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={!canMoveUp}
                      onClick={() => moveGig(gig.id, -1)}
                      aria-label="Subir en el orden"
                    >
                      <ChevronUp size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={!canMoveDown}
                      onClick={() => moveGig(gig.id, 1)}
                      aria-label="Bajar en el orden"
                    >
                      <ChevronDown size={16} />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {isDirty && supported && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-4">
            Tienes cambios sin guardar. Haz clic en &quot;Guardar selección&quot; para actualizar tu perfil público.
          </p>
        )}
      </CardContent>
    </Card>
  )
}