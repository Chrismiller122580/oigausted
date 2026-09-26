'use client'

import { useEffect, useRef } from 'react'
import { MessageCircle, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type ChatMessage = {
  id?: string
  content: string
  isFromBuyer: boolean
  createdAt?: string
  fileUrl?: string | null
  fileName?: string | null
}

type Props = {
  messages: ChatMessage[]
  isBuyer: boolean
  newMessage: string
  onNewMessageChange: (value: string) => void
  onSend: () => void
  sending?: boolean
  subtitle?: string
  allowAttachments?: boolean
  selectedFile?: File | null
  onSelectedFileChange?: (file: File | null) => void
}

function isImageFile(name?: string | null, url?: string | null) {
  const value = `${name || ''} ${url || ''}`.toLowerCase()
  return /\.(png|jpe?g|gif|webp|heic|heif)(\?|$)/.test(value)
}

export default function ChatPanel({
  messages,
  isBuyer,
  newMessage,
  onNewMessageChange,
  onSend,
  sending = false,
  subtitle,
  allowAttachments = false,
  selectedFile = null,
  onSelectedFileChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  const canSend = Boolean(newMessage.trim() || selectedFile) && !sending

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
          const fileUrl = msg.fileUrl || null
          const fileName = msg.fileName || 'Archivo adjunto'
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
                {fileUrl && isImageFile(fileName, fileUrl) && (
                  <a href={fileUrl} target="_blank" rel="noreferrer" className="block mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fileUrl}
                      alt={fileName}
                      className="max-h-48 rounded-xl object-cover"
                    />
                  </a>
                )}
                {fileUrl && !isImageFile(fileName, fileUrl) && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 underline mb-1 ${
                      isMine ? 'text-white' : 'text-orange-700'
                    }`}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {fileName}
                  </a>
                )}
                {msg.content && !msg.content.startsWith('📎') && <div>{msg.content}</div>}
                {msg.content && msg.content.startsWith('📎') && !fileUrl && <div>{msg.content}</div>}
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

      <CardContent className="p-3 border-t space-y-2">
        {allowAttachments && selectedFile && (
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
            <span className="truncate">
              <Paperclip className="inline h-3.5 w-3.5 mr-1" />
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={() => onSelectedFileChange?.(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Quitar archivo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          {allowAttachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  onSelectedFileChange?.(file)
                  e.target.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="h-[44px] w-[44px] px-0 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                aria-label="Adjuntar archivo"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </>
          )}
          <Textarea
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            placeholder={allowAttachments ? 'Escribe un mensaje o adjunta un archivo...' : 'Escribe un mensaje...'}
            className="flex-1 resize-y min-h-[44px] max-h-[120px] text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (canSend) onSend()
              }
            }}
          />
          <Button onClick={onSend} disabled={!canSend} className="px-6 h-[44px]">
            {sending ? '…' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
