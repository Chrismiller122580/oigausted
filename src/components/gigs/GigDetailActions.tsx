'use client'

import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import StartInquiryButton from '@/components/common/StartInquiryButton'
import BuyGigConfirmDialog from '@/components/gigs/BuyGigConfirmDialog'
import { useBuyGigConfirm } from '@/hooks/useBuyGigConfirm'

type Props = {
  gigId: string
  gigTitle: string
  gigPrice: number
  sellerId: string
  isActive: boolean
  quantityLabel?: string | null
}

export default function GigDetailActions({
  gigId,
  gigTitle,
  gigPrice,
  sellerId,
  isActive,
  quantityLabel,
}: Props) {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const isOwnGig = userId === sellerId
  const { open, pending, requestBuy, confirm, cancel } = useBuyGigConfirm()
  const hasQuantity = Boolean(quantityLabel)
  const [quantity, setQuantity] = useState(1)
  const units = hasQuantity ? Math.max(1, quantity) : 1
  const total = useMemo(() => Math.max(0, Math.round(Number(gigPrice) || 0) * units), [gigPrice, units])

  const handleBuyNow = () => {
    requestBuy({
      gigId,
      title: gigTitle,
      price: total,
      isActive,
      sellerId,
      quantity: hasQuantity ? units : undefined,
    })
  }

  if (isOwnGig) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-3xl mb-8 text-center font-medium">
        Este es tu propio gig • No puedes comprarlo
      </div>
    )
  }

  return (
    <div className="space-y-3 mb-8">
      {hasQuantity && (
        <div className="rounded-2xl border bg-muted/40 p-4">
          <p className="text-sm font-medium mb-3">{quantityLabel}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-11 w-11 rounded-xl border bg-background text-xl font-semibold"
                onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                aria-label="Quitar una unidad"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={units}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-11 w-16 rounded-xl border bg-background text-center text-lg font-semibold"
              />
              <button
                type="button"
                className="h-11 w-11 rounded-xl border bg-background text-xl font-semibold"
                onClick={() => setQuantity((n) => n + 1)}
                aria-label="Agregar una unidad"
              >
                +
              </button>
            </div>
            <p className="text-lg font-bold text-emerald-700 tabular-nums">
              ${total.toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={handleBuyNow}
        size="lg"
        className="w-full py-8 text-xl bg-emerald-600 hover:bg-emerald-700 rounded-3xl font-semibold"
        disabled={!isActive}
      >
        {!isActive ? 'Servicio pausado' : 'Comprar ahora'}
      </Button>
      {isActive && (
        <StartInquiryButton
          gigId={gigId}
          fullWidth
          size="lg"
          label="Chatear con vendedor"
          className="py-6 text-lg rounded-3xl"
        />
      )}

      {pending && (
        <BuyGigConfirmDialog
          open={open}
          title={pending.title}
          price={pending.price}
          quantity={pending.quantity}
          onConfirm={confirm}
          onCancel={cancel}
        />
      )}
    </div>
  )
}
