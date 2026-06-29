import { prisma } from '@/lib/prisma'
import { notifications, resend } from '@/lib/notifications'
import { adminAlertEmail } from '@/lib/emails/templates'
import { devLog } from '@/lib/utils'
import type { JsonObject } from '@/types/json'

export const DEFAULT_ADMIN_EMAIL = 'support@oigagig.com'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Oigagig <support@oigagig.com>'

export async function getAdminNotificationRecipients(): Promise<string[]> {
  let supportEmail = DEFAULT_ADMIN_EMAIL
  try {
    const { getPlatformConfig } = await import('@/lib/prisma')
    const config = await getPlatformConfig()
    if (config?.supportEmail?.trim()) {
      supportEmail = config.supportEmail.trim()
    }
  } catch {
    // use default
  }

  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { email: true },
  })

  const adminEmails = admins
    .map((a: { email: string | null }) => a.email?.trim().toLowerCase())
    .filter((e: string | undefined): e is string => !!e)

  return Array.from(new Set([supportEmail.toLowerCase(), ...adminEmails]))
}

export async function sendAdminEmail({
  subject,
  html,
}: {
  subject: string
  html: string
}): Promise<{ sent: boolean }> {
  if (!resend) {
    devLog('[AdminEmail] Resend not configured — skipping admin email')
    return { sent: false }
  }

  try {
    const recipients = await getAdminNotificationRecipients()
    if (!recipients.length) {
      devLog('[AdminEmail] No recipients configured')
      return { sent: false }
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: subject.startsWith('[Oigagig') ? subject : `[Oigagig Admin] ${subject}`,
      html,
    })

    devLog(`[AdminEmail] Sent to ${recipients.join(', ')}`)
    return { sent: true }
  } catch (err) {
    devLog('[AdminEmail] Failed to send:', err)
    return { sent: false }
  }
}

async function notifyAdminsInApp(
  title: string,
  message: string,
  link?: string,
  data?: JsonObject
) {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  })

  await Promise.allSettled(
    admins.map((admin: { id: string }) =>
      notifications.sendInApp(admin.id, 'system', title, message, link, data)
    )
  )
}

async function notifyAdmins({
  title,
  message,
  link,
  emailSubject,
  emailBodyHtml,
  eventLabel,
  ctaLabel,
  ctaHref,
  data,
}: {
  title: string
  message: string
  link?: string
  emailSubject: string
  emailBodyHtml: string
  eventLabel: string
  ctaLabel?: string
  ctaHref?: string
  data?: JsonObject
}) {
  await notifyAdminsInApp(title, message, link, data)

  const email = adminAlertEmail({
    title: emailSubject,
    bodyHtml: emailBodyHtml,
    eventLabel,
    ctaLabel,
    ctaHref: ctaHref || link,
  })

  await sendAdminEmail({ subject: email.subject, html: email.html })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function notifyAdminsNewSignup({
  name,
  email,
  role,
  viaGoogle = false,
}: {
  name?: string | null
  email: string
  role: string
  viaGoogle?: boolean
}) {
  const displayName = name || email
  const source = viaGoogle ? 'Google' : 'registro directo'
  await notifyAdmins({
    title: 'Nuevo usuario registrado',
    message: `${displayName} (${email}) se registró como ${role}.`,
    link: '/admin/users',
    emailSubject: `Nuevo registro: ${displayName}`,
    eventLabel: 'Nuevo usuario',
    ctaLabel: 'Ver usuarios en admin',
    ctaHref: '/admin/users',
    emailBodyHtml: `
      <p><strong>${escapeHtml(displayName)}</strong> acaba de crear una cuenta.</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}<br>
         <strong>Rol:</strong> ${escapeHtml(role)}<br>
         <strong>Origen:</strong> ${escapeHtml(source)}</p>
    `,
    data: { email, role, viaGoogle },
  })
}

export async function notifyAdminsNewGig({
  gigId,
  title,
  category,
  price,
  sellerName,
  sellerEmail,
}: {
  gigId: string
  title: string
  category?: string | null
  price: number
  sellerName?: string | null
  sellerEmail?: string | null
}) {
  const seller = sellerName || sellerEmail || 'Vendedor'
  await notifyAdmins({
    title: 'Nuevo gig publicado',
    message: `${seller} publicó "${title}" ($${price.toLocaleString('es-CO')}).`,
    link: `/admin/gigs`,
    emailSubject: `Nuevo gig: ${title}`,
    eventLabel: 'Nuevo servicio',
    ctaLabel: 'Revisar en admin',
    ctaHref: '/admin/gigs',
    emailBodyHtml: `
      <p><strong>${escapeHtml(seller)}</strong> publicó un nuevo servicio.</p>
      <p><strong>Título:</strong> ${escapeHtml(title)}<br>
         <strong>Categoría:</strong> ${escapeHtml(category || '—')}<br>
         <strong>Precio:</strong> $${price.toLocaleString('es-CO')}</p>
      <p><strong>ID:</strong> ${escapeHtml(gigId)}</p>
    `,
    data: { gigId, gigTitle: title },
  })
}

export async function notifyAdminsNewOrder({
  orderId,
  gigTitle,
  amount,
  buyerName,
  sellerName,
}: {
  orderId: string
  gigTitle: string
  amount: number
  buyerName?: string | null
  sellerName?: string | null
}) {
  await notifyAdmins({
    title: 'Nuevo pedido creado',
    message: `${buyerName || 'Comprador'} pidió "${gigTitle}" por $${amount.toLocaleString('es-CO')}.`,
    link: `/admin/orders`,
    emailSubject: `Nuevo pedido: ${gigTitle}`,
    eventLabel: 'Nuevo pedido',
    ctaLabel: 'Ver pedidos',
    ctaHref: '/admin/orders',
    emailBodyHtml: `
      <p>Se creó un nuevo pedido en la plataforma.</p>
      <p><strong>Servicio:</strong> ${escapeHtml(gigTitle)}<br>
         <strong>Comprador:</strong> ${escapeHtml(buyerName || '—')}<br>
         <strong>Vendedor:</strong> ${escapeHtml(sellerName || '—')}<br>
         <strong>Monto:</strong> $${amount.toLocaleString('es-CO')}<br>
         <strong>Pedido ID:</strong> ${escapeHtml(orderId)}</p>
    `,
    data: { orderId, gigTitle, amount },
  })
}

export async function notifyAdminsPaymentReceived({
  orderId,
  gigTitle,
  amount,
  buyerName,
  wompiTransactionId,
}: {
  orderId: string
  gigTitle: string
  amount: number
  buyerName?: string | null
  wompiTransactionId?: string | null
}) {
  await notifyAdmins({
    title: 'Pago confirmado',
    message: `Pago de $${amount.toLocaleString('es-CO')} por "${gigTitle}" (${buyerName || 'comprador'}).`,
    link: `/admin/orders`,
    emailSubject: `Pago recibido: $${amount.toLocaleString('es-CO')} — ${gigTitle}`,
    eventLabel: 'Pago confirmado',
    ctaLabel: 'Ver pedido',
    ctaHref: `/orders/${orderId}`,
    emailBodyHtml: `
      <p>Se confirmó un pago exitoso vía Wompi.</p>
      <p><strong>Servicio:</strong> ${escapeHtml(gigTitle)}<br>
         <strong>Comprador:</strong> ${escapeHtml(buyerName || '—')}<br>
         <strong>Monto:</strong> $${amount.toLocaleString('es-CO')}<br>
         <strong>Pedido ID:</strong> ${escapeHtml(orderId)}<br>
         ${wompiTransactionId ? `<strong>Transacción Wompi:</strong> ${escapeHtml(wompiTransactionId)}<br>` : ''}
      </p>
    `,
    data: { orderId, gigTitle, amount, wompiTransactionId: wompiTransactionId ?? null },
  })
}

export async function notifyAdminsSupportTicket({
  ticketId,
  subject,
  message,
  category,
  priority,
  userName,
  userEmail,
}: {
  ticketId: string
  subject: string
  message: string
  category: string
  priority: string
  userName?: string | null
  userEmail?: string | null
}) {
  const preview = message.length > 400 ? `${message.slice(0, 400)}…` : message
  await notifyAdmins({
    title: 'Nuevo ticket de soporte',
    message: `${userName || userEmail || 'Usuario'}: "${subject}"`,
    link: `/admin/support?id=${ticketId}`,
    emailSubject: `Soporte: ${subject}`,
    eventLabel: 'Ticket de soporte',
    ctaLabel: 'Responder en admin',
    ctaHref: `/admin/support?id=${ticketId}`,
    emailBodyHtml: `
      <p><strong>${escapeHtml(userName || userEmail || 'Usuario')}</strong> envió un ticket de soporte.</p>
      <p><strong>Asunto:</strong> ${escapeHtml(subject)}<br>
         <strong>Categoría:</strong> ${escapeHtml(category)} • <strong>Prioridad:</strong> ${escapeHtml(priority)}</p>
      <p style="background:#f8f8f8;padding:16px;border-radius:8px;white-space:pre-wrap;">${escapeHtml(preview)}</p>
    `,
    data: { ticketId, subject },
  })
}

export async function notifyAdminsBecomeSeller({
  userId,
  name,
  email,
  businessName,
}: {
  userId: string
  name?: string | null
  email?: string | null
  businessName: string
}) {
  await notifyAdmins({
    title: 'Nuevo vendedor',
    message: `${name || email || 'Usuario'} se convirtió en vendedor (${businessName}).`,
    link: '/admin/users',
    emailSubject: `Nuevo vendedor: ${businessName}`,
    eventLabel: 'Nuevo vendedor',
    ctaLabel: 'Ver usuarios',
    ctaHref: '/admin/users',
    emailBodyHtml: `
      <p>Un comprador se convirtió en vendedor.</p>
      <p><strong>Nombre:</strong> ${escapeHtml(name || '—')}<br>
         <strong>Email:</strong> ${escapeHtml(email || '—')}<br>
         <strong>Negocio:</strong> ${escapeHtml(businessName)}<br>
         <strong>Usuario ID:</strong> ${escapeHtml(userId)}</p>
    `,
    data: { userId, businessName },
  })
}

export async function notifyAdminsContactViolation({
  userId,
  userName,
  userEmail,
  contextType,
  contextId,
  violationTypes,
  snippet,
  violationCount,
  flagged,
}: {
  userId: string
  userName?: string | null
  userEmail?: string | null
  contextType: 'order' | 'inquiry'
  contextId: string
  violationTypes: string[]
  snippet: string
  violationCount: number
  flagged: boolean
}) {
  const displayName = userName || userEmail || 'Usuario'
  const contextLabel = contextType === 'order' ? 'pedido' : 'consulta'
  await notifyAdmins({
    title: 'Intento de compartir contacto',
    message: `${displayName} intentó compartir datos de contacto en un ${contextLabel} (${violationTypes.join(', ')}).`,
    link: '/admin/users',
    emailSubject: `Contacto bloqueado: ${displayName}`,
    eventLabel: 'Violación de contacto',
    ctaLabel: 'Ver usuarios',
    ctaHref: '/admin/users',
    emailBodyHtml: `
      <p><strong>${escapeHtml(displayName)}</strong> intentó compartir información de contacto fuera de la plataforma.</p>
      <p><strong>Contexto:</strong> ${escapeHtml(contextType)} (${escapeHtml(contextId)})<br>
         <strong>Tipos:</strong> ${escapeHtml(violationTypes.join(', '))}<br>
         <strong>Intentos:</strong> ${violationCount}${flagged ? ' — <span style="color:#b45309;">usuario marcado</span>' : ''}</p>
      <p style="background:#f8f8f8;padding:16px;border-radius:8px;white-space:pre-wrap;">${escapeHtml(snippet)}</p>
      <p><strong>Usuario ID:</strong> ${escapeHtml(userId)}</p>
    `,
    data: { userId, contextType, contextId, violationTypes, violationCount, flagged },
  })
}

export async function notifyAdminsReferralPayout({
  requesterName,
  requesterEmail,
  amount,
}: {
  requesterName?: string | null
  requesterEmail?: string | null
  amount: number
}) {
  await notifyAdmins({
    title: 'Solicitud de pago por referidos',
    message: `${requesterName || requesterEmail || 'Usuario'} solicitó $${amount.toLocaleString('es-CO')}.`,
    link: '/admin/referrals',
    emailSubject: `Pago referidos: $${amount.toLocaleString('es-CO')}`,
    eventLabel: 'Pago por referidos',
    ctaLabel: 'Revisar referidos',
    ctaHref: '/admin/referrals',
    emailBodyHtml: `
      <p><strong>${escapeHtml(requesterName || requesterEmail || 'Un usuario')}</strong> solicitó el pago de comisiones por referidos.</p>
      <p><strong>Monto pendiente:</strong> $${amount.toLocaleString('es-CO')}</p>
    `,
    data: { amount },
  })
}