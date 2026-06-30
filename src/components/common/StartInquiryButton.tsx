'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getAuthCallbackUrl } from '@/lib/getAuthCallbackUrl'

type Props = {
  gigId: string
  className?: string
  variant?: 'default' | 'outline' | 'brand' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  label?: string
  fullWidth?: boolean
}

export default function StartInquiryButton({
  gigId,
  className,
  variant = 'outline',
  size = 'default',
  label = 'Chatear en OigaGIG',
  fullWidth = false,
}: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(getAuthCallbackUrl(`/gigs/${gigId}`))}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'No se pudo abrir el chat')
        return
      }
      router.push(`/messages/${data.thread.id}`)
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`${fullWidth ? 'w-full' : ''} ${className || ''}`.trim()}
      onClick={handleClick}
      disabled={loading}
    >
      <MessageCircle className="h-4 w-4 mr-1.5" />
      {loading ? 'Abriendo…' : label}
    </Button>
  )
}