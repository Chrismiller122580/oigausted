'use client'

import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  title: string
  price: number
  confirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function BuyGigConfirmDialog({
  open,
  title,
  price,
  confirming = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={confirming ? undefined : onCancel}
      role="presentation"
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-gig-confirm-title"
      >
        <h3 id="buy-gig-confirm-title" className="text-xl font-semibold mb-2">
          ¿Confirmar compra?
        </h3>
        <p className="text-muted-foreground mb-6">
          Vas a iniciar la compra de{' '}
          <span className="font-medium text-foreground">{title}</span> por{' '}
          <span className="font-medium text-foreground">
            ${price.toLocaleString('es-CO')}
          </span>
          . Se creará un pedido pendiente de pago.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={confirming}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={confirming}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {confirming ? 'Creando pedido...' : 'Sí, continuar'}
          </Button>
        </div>
      </div>
    </div>
  )
}