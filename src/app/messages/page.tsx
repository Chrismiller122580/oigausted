'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Card, CardContent } from '@/components/ui/card'

type ThreadPreview = {
  id: string
  updatedAt: string
  gig: { id: string; title: string; imageUrl?: string | null }
  buyer: { id: string; name?: string | null; profilePicture?: string | null }
  seller: {
    id: string
    name?: string | null
    businessName?: string | null
    profilePicture?: string | null
    slug?: string | null
  }
  messages: Array<{ content: string; createdAt: string }>
}

export default function MessagesInboxPage() {
  const { data: session, status } = useSession()
  const [threads, setThreads] = useState<ThreadPreview[]>([])
  const [loading, setLoading] = useState(true)

  const userId = session?.user?.id
  const isSeller = session?.user?.role === 'seller'

  useEffect(() => {
    if (status === 'loading') return
    if (!userId) {
      setLoading(false)
      return
    }

    fetch('/api/inquiries')
      .then((res) => res.json())
      .then((data) => setThreads(data.threads || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status, userId])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando mensajes…</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground text-center">Inicia sesión para ver tus conversaciones.</p>
        <Link href="/login" className="text-orange-600 hover:underline">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href={isSeller ? '/seller' : '/buyer'} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-orange-600" />
          Mensajes
        </h1>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>No tienes conversaciones aún.</p>
            <p className="text-sm mt-2">
              Abre un chat desde un{' '}
              <Link href="/gigs" className="text-orange-600 hover:underline">
                servicio
              </Link>{' '}
              con &quot;Chatear en Oigagig&quot;.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {threads.map((thread) => {
            const isBuyer = thread.buyer.id === userId
            const other = isBuyer ? thread.seller : thread.buyer
            const otherName =
              (isBuyer ? thread.seller.businessName || thread.seller.name : thread.buyer.name) ||
              'Usuario'
            const last = thread.messages[0]

            return (
              <li key={thread.id}>
                <Link
                  href={`/messages/${thread.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:bg-muted/40 transition"
                >
                  <UserAvatar
                    src={other.profilePicture}
                    name={otherName}
                    size="md"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{otherName}</p>
                    <p className="text-sm text-muted-foreground truncate">{thread.gig.title}</p>
                    {last && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{last.content}</p>
                    )}
                  </div>
                  {last && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(last.createdAt).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}