'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import ChatPanel, { type ChatMessage } from '@/components/chat/ChatPanel'
import { Button } from '@/components/ui/button'
import BuyGigConfirmDialog from '@/components/gigs/BuyGigConfirmDialog'
import { useBuyGigConfirm } from '@/hooks/useBuyGigConfirm'
import { getAuthCallbackUrl } from '@/lib/getAuthCallbackUrl'

type ThreadDetail = {
  id: string
  buyerId: string
  sellerId: string
  gig?: { id: string; title: string; price?: number } | null
  buyer?: { id: string; name?: string | null } | null
  seller?: { id: string; name?: string | null; businessName?: string | null } | null
}

export default function MessageThreadPage() {
  const params = useParams()
  const router = useRouter()
  const threadId = String(params.id || '')
  const { data: session, status } = useSession()

  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  const userId = session?.user?.id
  const isBuyer = thread ? thread.buyerId === userId : false
  const { open, pending, requestBuy, confirm, cancel } = useBuyGigConfirm()

  const loadMessages = useCallback(async () => {
    if (!threadId) return
    const res = await fetch(`/api/inquiries/${threadId}/messages`)
    if (res.status === 403 || res.status === 401) return
    const data = await res.json().catch(() => ({}))
    setMessages(Array.isArray(data.messages) ? data.messages : [])
  }, [threadId])

  useEffect(() => {
    if (status === 'loading') return
    if (!userId) {
      const next = `/messages/${threadId}`
      router.replace(`/login?callbackUrl=${encodeURIComponent(getAuthCallbackUrl(next))}`)
      return
    }
    if (!threadId) {
      setMissing(true)
      setLoading(false)
      return
    }

    Promise.all([
      fetch('/api/inquiries').then((r) => r.json().catch(() => ({}))),
      fetch(`/api/inquiries/${threadId}/messages`).then((r) => r.json().catch(() => ({}))),
    ])
      .then(([inbox, msgData]) => {
        const found = (inbox.threads || []).find((t: ThreadDetail) => t.id === threadId)
        if (!found) {
          setMissing(true)
          return
        }
        setThread(found)
        setMessages(Array.isArray(msgData.messages) ? msgData.messages : [])
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false))
  }, [status, userId, threadId, router])

  useEffect(() => {
    if (!threadId || loading || !userId) return
    const interval = setInterval(loadMessages, 8000)
    return () => clearInterval(interval)
  }, [threadId, loading, loadMessages, userId])

  const sendMessage = async () => {
    const content = newMessage.trim()
    if (!content || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/inquiries/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'No se pudo enviar el mensaje')
        return
      }
      setNewMessage('')
      if (data.message) setMessages((prev) => [...prev, data.message])
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirigiendo a iniciar sesión…</p>
      </div>
    )
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando chat…</p>
      </div>
    )
  }

  if (missing || !thread) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-xl mb-4">No encontramos esta conversación.</p>
        <Link href="/messages" className="text-orange-600 hover:underline">
          Volver a mensajes →
        </Link>
      </div>
    )
  }

  const gigTitle = thread.gig?.title || 'Servicio'
  const gigId = thread.gig?.id
  const otherName = isBuyer
    ? thread.seller?.businessName || thread.seller?.name || 'Vendedor'
    : thread.buyer?.name || 'Comprador'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft size={18} /> Mensajes
        </Link>
        {gigId ? (
          <Link href={`/gigs/${gigId}`}>
            <Button variant="outline" size="sm">
              Ver servicio
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold truncate">{gigTitle}</h1>
        <p className="text-sm text-muted-foreground">Conversación con {otherName}</p>
      </div>

      <ChatPanel
        messages={messages}
        isBuyer={isBuyer}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        onSend={sendMessage}
        sending={sending}
        subtitle={`Coordinación previa a la compra · ${gigTitle}`}
      />

      {isBuyer && gigId && (
        <div className="mt-4 text-center">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() =>
              requestBuy({
                gigId,
                title: gigTitle,
                price: thread.gig?.price ?? 0,
                sellerId: thread.sellerId,
              })
            }
          >
            Comprar este servicio
          </Button>
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
      )}
    </div>
  )
}
