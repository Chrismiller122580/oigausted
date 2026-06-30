'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Copy, MessageCircle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  buildWhatsAppLink,
  bundleTotal,
  formatProjectQuote,
  groupBundleBySeller,
  sellerPublicPath,
  type ProjectBundleItem,
} from '@/lib/seller-network'

type Props = {
  items: ProjectBundleItem[]
  onRemove: (gigId: string) => void
  onClear: () => void
  onClose?: () => void
  mobileSheet?: boolean
}

export default function ProjectBuilder({
  items,
  onRemove,
  onClear,
  onClose,
  mobileSheet = false,
}: Props) {
  const total = useMemo(() => bundleTotal(items), [items])
  const grouped = useMemo(() => groupBundleBySeller(items), [items])

  const handleCopyQuote = async () => {
    const text = formatProjectQuote(items)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Resumen copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar el resumen')
    }
  }

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-lg text-orange-900 dark:text-orange-100">
            Mi proyecto combinado
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {items.length} servicio{items.length !== 1 ? 's' : ''} · Total estimado{' '}
            <span className="font-semibold text-orange-600">${total.toLocaleString('es-CO')}</span>
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center px-4 py-8">
          <p className="text-sm text-muted-foreground">
            Agrega servicios de otros vendedores para armar un proyecto grande y cotizar con tu cliente.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
          {[...grouped.entries()].map(([sellerId, group]) => {
            const profilePath = sellerPublicPath({
              id: sellerId,
              slug: group.sellerSlug,
            })
            const contactMsg = `Hola ${group.sellerName}, vi tu servicio en la Red de Vendedores de OigaGIG y me gustaría coordinar un proyecto combinado. ¿Podemos hablar?`
            const waLink = buildWhatsAppLink(group.sellerWhatsapp, contactMsg)

            return (
              <div key={sellerId} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Link
                    href={profilePath}
                    className="font-medium text-sm hover:text-orange-600 hover:underline truncate"
                  >
                    {group.sellerName}
                  </Link>
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <MessageCircle size={12} /> WhatsApp
                      </Button>
                    </a>
                  ) : (
                    <Link href={profilePath} className="shrink-0">
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Ver perfil
                      </Button>
                    </Link>
                  )}
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item.gigId}
                      className="flex items-start justify-between gap-2 text-sm bg-muted/40 rounded-lg px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium line-clamp-2">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.gigId)}
                        className="p-1 text-muted-foreground hover:text-red-600 shrink-0"
                        aria-label={`Quitar ${item.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <div className="pt-4 mt-auto border-t border-border space-y-2 shrink-0">
        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 gap-1.5"
          disabled={items.length === 0}
          onClick={handleCopyQuote}
        >
          <Copy size={16} /> Copiar resumen para cliente
        </Button>
        {items.length > 0 && (
          <Button variant="outline" className="w-full" onClick={onClear}>
            Vaciar proyecto
          </Button>
        )}
      </div>
    </div>
  )

  if (mobileSheet) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-40 md:hidden">
        <div className="mx-3 mb-2 rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-background shadow-2xl max-h-[70vh] flex flex-col p-4">
          {content}
        </div>
      </div>
    )
  }

  return (
    <Card className="border-orange-200 dark:border-orange-900/50 shadow-sm sticky top-20 hidden lg:flex lg:flex-col max-h-[calc(100vh-6rem)]">
      <CardContent className="p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
        {content}
      </CardContent>
    </Card>
  )
}