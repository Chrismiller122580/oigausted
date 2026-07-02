import { Resend } from 'resend'
import type { GeneratedDocumentContent } from '@/lib/documents/generate'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'OigaGIG <support@oigagig.com>'

export async function sendDocumentDeliveryEmails(opts: {
  buyerEmail: string
  printShopEmail?: string | null
  templateName: string
  pdfUrl: string
  content: GeneratedDocumentContent
}): Promise<void> {
  if (!resend) {
    console.warn('[DocumentEmail] Resend not configured — skipping email delivery')
    return
  }

  const { buyerEmail, printShopEmail, templateName, pdfUrl, content } = opts
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'

  const buyerHtml = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #111;">Tu documento está listo</h2>
      <p>Hola,</p>
      <p>Tu <strong>${templateName}</strong> fue generado por el Buro de Documentos de OigaGIG.</p>
      <p><a href="${pdfUrl}" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Descargar documento</a></p>
      <p style="font-size: 12px; color: #666;">${content.disclaimer}</p>
      <p style="font-size: 12px; color: #999;">Presentado por OigaGIG — <a href="${appUrl}/documentos">${appUrl}/documentos</a></p>
    </div>`

  await resend.emails.send({
    from: FROM_EMAIL,
    to: buyerEmail,
    subject: `Tu documento: ${content.title}`,
    html: buyerHtml,
  })

  if (printShopEmail && printShopEmail !== buyerEmail) {
    const printHtml = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">Pedido de impresión — OigaGIG</h2>
        <p>Documento: <strong>${templateName}</strong></p>
        <p>Cliente: ${buyerEmail}</p>
        <p><a href="${pdfUrl}" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Descargar para imprimir</a></p>
        <p style="font-size: 12px; color: #666;">Enviado automáticamente por OigaGIG Buro de Documentos.</p>
      </div>`

    await resend.emails.send({
      from: FROM_EMAIL,
      to: printShopEmail,
      subject: `[OigaGIG] Impresión: ${content.title}`,
      html: printHtml,
    })
  }
}