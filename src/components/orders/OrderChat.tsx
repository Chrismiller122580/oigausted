'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import ChatPanel, { type ChatMessage } from '@/components/chat/ChatPanel'

type Props = {
  orderId: string
  isBuyer: boolean
  gigTitle?: string
}

export default function OrderChat({ orderId, isBuyer, gigTitle }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/messages`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return
    setMessages(Array.isArray(data.messages) ? data.messages : [])
  }, [orderId])

  useEffect(() => {
    loadMessages().catch(() => {})
    const interval = setInterval(() => {
      loadMessages().catch(() => {})
    }, 8000)
    return () => clearInterval(interval)
  }, [loadMessages])

  const sendMessage = async () => {
    const content = newMessage.trim()
    if ((!content && !selectedFile) || sending) return

    setSending(true)
    try {
      const res = selectedFile
        ? await fetch(`/api/orders/${orderId}/messages`, {
            method: 'POST',
            body: (() => {
              const form = new FormData()
              form.append('file', selectedFile)
              if (content) form.append('content', content)
              return form
            })(),
          })
        : await fetch(`/api/orders/${orderId}/messages`, {
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
      setSelectedFile(null)
      if (data.message) setMessages((prev) => [...prev, data.message])
      else await loadMessages()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSending(false)
    }
  }

  return (
    <div id="order-chat">
      <ChatPanel
        messages={messages}
        isBuyer={isBuyer}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        onSend={sendMessage}
        sending={sending}
        allowAttachments
        selectedFile={selectedFile}
        onSelectedFileChange={setSelectedFile}
        subtitle={`Chat del pedido${gigTitle ? ` · ${gigTitle}` : ''} · puedes adjuntar archivos`}
      />
    </div>
  )
}
