'use client'

import { useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type ChatMessage = {
  id?: string
  content: string
  isFromBuyer: boolean
  createdAt?: string
}

type Props = {
  messages: ChatMessage[]
  isBuyer: boolean
  newMessage: string
  onNewMessageChange: (value: string) => void
  onSend: () => void
  sending?: boolean
  subtitle?: string
}

export default function ChatPanel({
  messages,
  isBuyer,
  newMessage,
  onNewMessageChange,
  onSend,
  sending = false,
  subtitle,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <Card className="flex flex-col shadow-lg overflow-hidden min-h-[420px] max-h-[calc(100dvh-180px)] md:max-h-[620px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          Chat en OigaGIG
        </CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <p className="text-xs text-muted-foreground">
          No compartas teléfonos, correos ni redes sociales. OigaGIG bloquea ese tipo de mensajes.
        </p>
      </CardHeader>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/30">
        {messages.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p>No hay mensajes aún.</p>
            <p className="text-sm mt-1">¡Envía el primero para coordinar!</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMine = !!msg.isFromBuyer === isBuyer
          return (
            <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] ${
                  isMine ? 'bg-orange-600 text-white' : 'bg-background border shadow-sm'
                }`}
              >
                {!isMine && (
                  <div className="text-[12px] opacity-70 mb-0.5 font-medium text-muted-foreground">
                    {isBuyer ? 'Vendedor' : 'Comprador'}
                  </div>
                )}
                <div>{msg.content}</div>
                <div className={`text-[10px] mt-1.5 opacity-70 ${isMine ? 'text-right' : ''}`}>
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <CardContent className="p-3 border-t flex gap-2 items-end">
        <Textarea
          value={newMessage}
          onChange={(e) => onNewMessageChange(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 resize-y min-h-[44px] max-h-[120px] text-base"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
        />
        <Button
          onClick={onSend}
          disabled={!newMessage.trim() || sending}
          className="px-6 h-[44px]"
        >
          {sending ? '…' : 'Enviar'}
        </Button>
      </CardContent>
    </Card>
  )
}