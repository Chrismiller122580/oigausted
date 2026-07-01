'use client'

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
}

export default function GigDetailActions({
  gigId,
  gigTitle,
  gigPrice,
  sellerId,
  isActive,
}: Props) {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const isOwnGig = userId === sellerId
  const { open, pending, requestBuy, confirm, cancel } = useBuyGigConfirm()

  const handleBuyNow = () => {
    requestBuy({
      gigId,
      title: gigTitle,
      price: gigPrice,
      isActive,
      sellerId,
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
          onConfirm={confirm}
          onCancel={cancel}
        />
      )}
    </div>
  )
}