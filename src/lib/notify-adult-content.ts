import { prisma } from '@/lib/prisma'
import { notifications } from '@/lib/notifications'
import { sendAdminEmail } from '@/lib/admin-notifications'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
}

export async function notifyAdminsAdultContent({
  targetType,
  targetId,
  title,
  matches,
  snippet,
  sellerName,
  sellerEmail,
}: {
  targetType: string
  targetId: string
  title: string
  matches: string[]
  snippet: string
  sellerName?: string | null
  sellerEmail?: string | null
}) {
  const who = sellerName || sellerEmail || 'Usuario'
  const link = '/admin/content-review'
  const message = `${who}: "${title}" marcado por contenido para adultos (${matches.join(', ')}).`

  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  })
  await Promise.allSettled(
    admins.map((admin: { id: string }) =>
      notifications.sendInApp(admin.id, 'system', 'Contenido para adultos', message, link, {
        targetType,
        targetId,
      })
    )
  )

  await sendAdminEmail({
    subject: `Revision adultos: ${title}`,
    html: `
      <p><strong>${escapeHtml(who)}</strong> tiene contenido marcado para revision.</p>
      <p><strong>Tipo:</strong> ${escapeHtml(targetType)}<br>
         <strong>Titulo:</strong> ${escapeHtml(title)}<br>
         <strong>ID:</strong> ${escapeHtml(targetId)}<br>
         <strong>Coincidencias:</strong> ${escapeHtml(matches.join(', '))}</p>
      <p style="background:#f8f8f8;padding:16px;border-radius:8px;white-space:pre-wrap;">${escapeHtml(snippet)}</p>
    `,
  })
}
