import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'OigaGIG <support@oigagig.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'
const MAX_ATTACH_BYTES = 8 * 1024 * 1024

function isImageName(name?: string | null, url?: string | null) {
  return /\.(png|jpe?g|gif|webp|heic|heif)(\?|$)/i.test(`${name || ''} ${url || ''}`)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Email a paid-order chat attachment to the other party.
 * Reply-To is support only. The sender email is never included.
 */
export async function emailOrderAttachment({
  recipientId,
  orderId,
  gigTitle,
  fileUrl,
  fileName,
  note,
  fromBuyer,
}: {
  recipientId: string
  orderId: string
  gigTitle: string
  fileUrl: string
  fileName: string
  note?: string
  fromBuyer: boolean
}) {
  if (!resend || !fileUrl) return { sent: false, reason: 'email disabled' }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { email: true, name: true },
  })
  if (!recipient?.email) return { sent: false, reason: 'no recipient email' }

  const senderRole = fromBuyer ? 'El comprador' : 'El vendedor'
  const safeName = escapeHtml(fileName || 'archivo')
  const safeTitle = escapeHtml(gigTitle || 'tu pedido')
  const safeNote = note && !note.startsWith('📎') ? escapeHtml(note).slice(0, 500) : ''
  const image = isImageName(fileName, fileUrl)
  const orderUrl = `${APP_URL}/orders/${orderId}#order-chat`

  let attachment: { filename: string; content: string } | null = null
  try {
    const fileRes = await fetch(fileUrl)
    if (fileRes.ok) {
      const bytes = Buffer.from(await fileRes.arrayBuffer())
      if (bytes.length > 0 && bytes.length <= MAX_ATTACH_BYTES) {
        attachment = { filename: fileName || 'adjunto', content: bytes.toString('base64') }
      }
    }
  } catch {
    attachment = null
  }

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #111;">
      <h2 style="margin: 0 0 12px;">Archivo en el pedido</h2>
      <p>Hola <strong>${escapeHtml(recipient.name || 'Usuario')}</strong>,</p>
      <p>${senderRole} envió un archivo sobre <strong>${safeTitle}</strong>.</p>
      ${safeNote ? `<p style="background:#f8fafc;border-radius:8px;padding:12px;">${safeNote}</p>` : ''}
      ${image ? `<p><img src="${fileUrl}" alt="${safeName}" style="max-width:100%;border-radius:12px;" /></p>` : ''}
      <p><a href="${fileUrl}" style="color:#ea580c;">Descargar ${safeName}</a></p>
      <a href="${orderUrl}" style="background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;margin-top:8px;">Abrir el chat del pedido</a>
      <p style="margin-top:28px;font-size:12px;color:#888;">Este correo sale de OigaGIG. No responde al comprador ni al vendedor. Responda en el chat del pedido.</p>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipient.email,
    replyTo: process.env.RESEND_REPLY_TO || 'support@oigagig.com',
    subject: `Archivo recibido: ${fileName || 'adjunto'} — ${gigTitle || 'pedido'}`,
    html,
    ...(attachment ? { attachments: [attachment] } : {}),
  })

  return { sent: true, attached: Boolean(attachment) }
}
