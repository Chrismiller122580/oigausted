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

type ThreadDetail = {
  id: string
  buyerId: string
  sellerId: string
  gig: { id: string; title: string; price?: number }
  buyer: { id: string; name?: string | null }
  seller: { id: string; name?: string | null; businessName?: string | null }
}

export default function MessageThreadPage() {
  const params = useParams()
  const router = useRouter()
  const threadId = params.id as string
  const { data: session, status } = useSession()

  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const userId = session?.user?.id
  const isBuyer = thread ? thread.buyerId === userId : false
  const { open, pending, requestBuy, confirm, cancel } = useBuyGigConfirm()

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/inquiries/${threadId}/messages`)
    if (res.status === 403 || res.status === 401) {
      router.push('/messages')
      return
    }
    const data = await res.json()
    setMessages(data.messages || [])
  }, [threadId, router])

  useEffect(() => {
    if (status === 'loading' || !userId) return

    Promise.all([
      fetch('/api/inquiries').then((r) => r.json()),
      fetch(`/api/inquiries/${threadId}/messages`).then((r) => r.json()),
    ])
      .then(([inbox, msgData]) => {
        const found = (inbox.threads || []).find((t: ThreadDetail) => t.id === threadId)
        if (!found) {
          router.push('/messages')
          return
        }
        setThread(found)
        setMessages(msgData.messages || [])
      })
      .catch(() => router.push('/messages'))
      .finally(() => setLoading(false))
  }, [status, userId, threadId, router])

  useEffect(() => {
    if (!threadId || loading) return
    const interval = setInterval(loadMessages, 8000)
    return () => clearInterval(interval)
  }, [threadId, loading, loadMessages])

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
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'No se pudo enviar el mensaje')
        return
      }
      setNewMessage('')
      setMessages((prev) => [...prev, data.message])
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando chat…</p>
      </div>
    )
  }

  if (!thread) return null

  const otherName = isBuyer
    ? thread.seller.businessName || thread.seller.name || 'Vendedor'
    : thread.buyer.name || 'Comprador'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft size={18} /> Mensajes
        </Link>
        <Link href={`/gigs/${thread.gig.id}`}>
          <Button variant="outline" size="sm">
            Ver servicio
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold truncate">{thread.gig.title}</h1>
        <p className="text-sm text-muted-foreground">Conversación con {otherName}</p>
      </div>

      <ChatPanel
        messages={messages}
        isBuyer={isBuyer}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        onSend={sendMessage}
        sending={sending}
        subtitle={`Coordinación previa a la compra · ${thread.gig.title}`}
      />

      {isBuyer && (
        <div className="mt-4 text-center">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() =>
              requestBuy({
                gigId: thread.gig.id,
                title: thread.gig.title,
                price: thread.gig.price ?? 0,
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