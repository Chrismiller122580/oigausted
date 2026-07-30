// Email Templates for OigaGIG using Resend
// These return HTML strings ready to be sent

interface BaseEmailProps {
  userName?: string | null;
  appUrl?: string;
}

export function welcomeEmail({ userName = 'Usuario' }: BaseEmailProps) {
  return {
    subject: '¡Bienvenido a OigaGIG!',
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fff;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f97316, #dc2626); border-radius: 16px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 900;">
            O
          </div>
          <h1 style="color: #111; margin-top: 24px; font-size: 28px;">¡Bienvenido a OigaGIG!</h1>
        </div>

        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          Hola <strong>${userName}</strong>,<br><br>
          Gracias por registrarte en <strong>OigaGIG</strong>, la plataforma que conecta personas con servicios locales de confianza en Colombia.
        </p>

        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          Ya puedes explorar cientos de gigs o publicar tus propios servicios.
        </p>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'}/gigs" 
             style="background: #f97316; color: white; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">
            Explorar servicios
          </a>
        </div>

        <p style="color: #666; font-size: 14px; text-align: center;">
          ¿Tienes preguntas? Escríbenos a <a href="mailto:support@oigagig.com" style="color: #f97316;">support@oigagig.com</a>
        </p>
      </div>
    `
  };
}

interface OrderEmailProps extends BaseEmailProps {
  orderId: string;
  gigTitle: string;
  amount: number;
  otherPartyName: string;
}

export function newOrderEmail({ userName, gigTitle, amount, otherPartyName, orderId }: OrderEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  return {
    subject: `Nuevo pedido: ${gigTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">¡Tienes un nuevo pedido!</h2>
        
        <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
        
        <p><strong>${otherPartyName}</strong> ha realizado un pedido por tu servicio <strong>"${gigTitle}"</strong>.</p>
        
        <div style="background: #f8f8f8; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Monto:</strong> $${amount.toLocaleString('es-CO')}</p>
          <p style="margin: 0;"><strong>Pedido ID:</strong> ${orderId}</p>
        </div>

        <a href="${appUrl}/orders/${orderId}" 
           style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Ver pedido
        </a>

        <p style="margin-top: 32px; color: #666; font-size: 14px;">
          Recuerda actualizar el estado del pedido para mantener informado al comprador.
        </p>
      </div>
    `
  };
}

/** Buyer confirmation when they place an order (before/after checkout). */
export function buyerOrderCreatedEmail({
  userName,
  gigTitle,
  amount,
  otherPartyName,
  orderId,
}: OrderEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  return {
    subject: `Pedido registrado: ${gigTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">Tu pedido fue registrado</h2>
        
        <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
        
        <p>Tu pedido de <strong>"${gigTitle}"</strong> con <strong>${otherPartyName}</strong> quedó registrado en OigaGIG.</p>
        
        <div style="background: #f8f8f8; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Monto:</strong> $${amount.toLocaleString('es-CO')}</p>
          <p style="margin: 0;"><strong>Pedido ID:</strong> ${orderId}</p>
        </div>

        <p style="color: #444; font-size: 15px; line-height: 1.5;">
          Completa el pago si aún no lo has hecho para que el vendedor pueda iniciar el trabajo.
        </p>

        <a href="${appUrl}/orders/${orderId}" 
           style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 8px;">
          Ver mi pedido
        </a>

        <p style="margin-top: 32px; font-size: 12px; color: #888;">OigaGIG • Servicios locales de confianza en Colombia</p>
      </div>
    `,
  };
}

/** Buyer (or payer) confirmation that Wompi / payment succeeded. */
export function paymentConfirmedEmail({
  userName,
  gigTitle,
  amount,
  orderId,
}: BaseEmailProps & { gigTitle: string; amount: number; orderId: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  return {
    subject: `Pago confirmado: ${gigTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">¡Pago confirmado!</h2>
        
        <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
        
        <p>Tu pago por <strong>"${gigTitle}"</strong> fue exitoso.</p>
        
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Monto pagado:</strong> $${amount.toLocaleString('es-CO')}</p>
          <p style="margin: 0;"><strong>Pedido ID:</strong> ${orderId}</p>
        </div>

        <p style="color: #444; font-size: 15px; line-height: 1.5;">
          El vendedor ya puede iniciar el trabajo. Te avisaremos cuando el estado del pedido cambie.
        </p>

        <a href="${appUrl}/orders/${orderId}" 
           style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 8px;">
          Ver pedido
        </a>

        <p style="margin-top: 32px; font-size: 12px; color: #888;">OigaGIG • Servicios locales de confianza en Colombia</p>
      </div>
    `,
  };
}

export function orderStatusUpdatedEmail({ userName, gigTitle, newStatus, orderId }: OrderEmailProps & { newStatus: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  return {
    subject: `Actualización de tu pedido: ${gigTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">Estado de tu pedido actualizado</h2>
        
        <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
        
        <p>El estado de tu pedido para <strong>"${gigTitle}"</strong> ha cambiado a:</p>
        
        <p style="font-size: 20px; font-weight: 700; color: #f97316; margin: 16px 0;">${newStatus}</p>

        <a href="${appUrl}/orders/${orderId}" 
           style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Ver detalles del pedido
        </a>
      </div>
    `
  };
}

export function reviewReceivedEmail({ 
  userName, 
  gigTitle, 
  rating, 
  reviewerName, 
  orderId 
}: OrderEmailProps & { rating: number; reviewerName: string; orderId?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  // Prefer linking to the specific order (where the review lives) if we have the id.
  // Fallback to seller earnings/reviews area.
  const reviewLink = orderId ? `${appUrl}/orders/${orderId}` : `${appUrl}/seller/earnings`;
  return {
    subject: `Nueva reseña en tu servicio`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">¡Recibiste una nueva reseña!</h2>
        
        <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
        
        <p><strong>${reviewerName}</strong> dejó una reseña de <strong>${rating} estrellas</strong> en tu servicio <strong>"${gigTitle}"</strong>.</p>

        <a href="${reviewLink}" 
           style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Ver reseña
        </a>
      </div>
    `
  };
}

interface PasswordResetProps {
  userName?: string | null;
  resetLink: string;
}

export function passwordResetEmail({ userName = 'Usuario', resetLink }: PasswordResetProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  return {
    subject: 'Restablece tu contraseña en OigaGIG',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">Restablece tu contraseña</h2>
        
        <p>Hola <strong>${userName}</strong>,</p>
        
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en OigaGIG.</p>
        
        <p>Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expirará en 1 hora.</p>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetLink}" 
             style="background: #f97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Restablecer contraseña
          </a>
        </div>

        <p style="font-size: 14px; color: #666;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>

        <p style="margin-top: 32px; font-size: 12px; color: #888;">OigaGIG • Servicios locales de confianza en Colombia</p>
      </div>
    `
  };
}

export function gigPublishedEmail({ userName = 'Usuario', gigTitle, gigId }: BaseEmailProps & { gigTitle: string; gigId?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  const link = gigId ? `${appUrl}/seller/gigs` : `${appUrl}/gigs`;
  return {
    subject: `¡Tu gig "${gigTitle}" ha sido publicado!`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">¡Gig publicado exitosamente!</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tu servicio <strong>"${gigTitle}"</strong> ya está visible para compradores en OigaGIG.</p>
        <a href="${link}" 
           style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px;">
          Ver mis gigs
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #888;">OigaGIG • Servicios locales de confianza en Colombia</p>
      </div>
    `
  };
}

function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type SupportTicketEmailKind = 'received' | 'update' | 'resolved';

/**
 * Support ticket emails for users and admin alerts.
 * kind:
 *  - received: new ticket confirmation / admin alert
 *  - update: staff replied or changed status
 *  - resolved: ticket resolved or closed
 */
export function supportTicketEmail({
  userName = 'Usuario',
  subject,
  isAdmin = false,
  ticketId,
  kind = 'received',
  adminReply,
  status,
}: BaseEmailProps & {
  subject: string;
  isAdmin?: boolean;
  ticketId?: string;
  kind?: SupportTicketEmailKind;
  adminReply?: string | null;
  status?: string | null;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  const safeName = escapeEmailHtml(userName || 'Usuario');
  const safeSubject = escapeEmailHtml(subject || 'Soporte');
  const safeStatus = status ? escapeEmailHtml(status) : null;
  const safeReply = adminReply?.trim()
    ? escapeEmailHtml(adminReply.trim()).replace(/\n/g, '<br>')
    : null;

  const link = ticketId
    ? `${appUrl}/${isAdmin ? 'admin/support' : 'support'}?id=${encodeURIComponent(ticketId)}`
    : `${appUrl}/support`;

  let title: string;
  let bodyHtml: string;
  let ctaLabel: string;

  if (isAdmin) {
    title = 'Nuevo ticket de soporte';
    bodyHtml = `<p>Se ha recibido un nuevo ticket de soporte: &quot;${safeSubject}&quot;.</p>`;
    ctaLabel = 'Ver en admin';
  } else if (kind === 'resolved') {
    title = 'Tu ticket de soporte ha sido resuelto';
    bodyHtml = `
      <p>Hemos actualizado tu ticket <strong>&quot;${safeSubject}&quot;</strong>.</p>
      <p>Estado: <strong>${safeStatus || 'resolved'}</strong>.</p>
      ${
        safeReply
          ? `<p style="margin-top:16px;"><strong>Respuesta de OigaGIG:</strong></p>
             <p style="background:#f8f8f8;padding:16px;border-radius:8px;color:#333;line-height:1.6;">${safeReply}</p>`
          : `<p>Puedes ver los detalles en tu página de soporte.</p>`
      }`;
    ctaLabel = 'Ver mi ticket';
  } else if (kind === 'update') {
    title = 'Actualización en tu ticket de soporte';
    bodyHtml = `
      <p>Hay una actualización en tu ticket <strong>&quot;${safeSubject}&quot;</strong>.</p>
      ${safeStatus ? `<p>Estado: <strong>${safeStatus}</strong>.</p>` : ''}
      ${
        safeReply
          ? `<p style="margin-top:16px;"><strong>Respuesta de OigaGIG:</strong></p>
             <p style="background:#f8f8f8;padding:16px;border-radius:8px;color:#333;line-height:1.6;">${safeReply}</p>`
          : `<p>Revisa el detalle en tu página de soporte.</p>`
      }`;
    ctaLabel = 'Ver mi ticket';
  } else {
    title = 'Ticket de soporte recibido';
    bodyHtml = `<p>Tu ticket &quot;${safeSubject}&quot; ha sido recibido. Te responderemos pronto.</p>`;
    ctaLabel = 'Ver mi ticket';
  }

  return {
    subject: title,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">${title}</h2>
        <p>Hola <strong>${safeName}</strong>,</p>
        ${bodyHtml}
        <a href="${link}" 
           style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px;">
          ${ctaLabel}
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #888;">OigaGIG • Servicios locales de confianza en Colombia</p>
      </div>
    `,
  };
}

export function referralPayoutRequestEmail({ userName = 'Usuario', amount, requesterName }: BaseEmailProps & { amount: number; requesterName?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  return {
    subject: `Solicitud de pago por referidos: $${amount.toLocaleString('es-CO')}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">Solicitud de pago por referidos</h2>
        <p><strong>${requesterName || 'Un usuario'}</strong> ha solicitado el pago de comisiones por referidos por <strong>$${amount.toLocaleString('es-CO')}</strong>.</p>
        <a href="${appUrl}/admin/referrals" 
           style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px;">
          Revisar en admin
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #888;">OigaGIG • Servicios locales de confianza en Colombia</p>
      </div>
    `
  };
}

interface LifecycleNudgeProps extends BaseEmailProps {
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      const inner = lines
        .map((line) => {
          const numbered = line.match(/^(\d+)\.\s+(.+)$/);
          if (numbered) {
            return `<li style="margin-bottom: 8px;">${numbered[2]}</li>`;
          }
          return line;
        })
        .join('');
      const isList = lines.some((l) => /^\d+\.\s+/.test(l));
      if (isList) {
        return `<ol style="margin: 16px 0; padding-left: 20px; color: #444;">${inner}</ol>`;
      }
      return `<p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('');
}

/** Educational lifecycle nudge for marketing playbooks (seller no gig, buyer no order, etc.). */
export function lifecycleNudgeEmail({
  userName = 'Usuario',
  subject,
  body,
  ctaLabel,
  ctaUrl,
}: LifecycleNudgeProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  const href = ctaUrl?.startsWith('http') ? ctaUrl : `${appUrl}${ctaUrl || '/gigs'}`;
  const bodyHtml = plainTextToHtml(body);

  return {
    subject,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #f97316, #dc2626); border-radius: 14px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 900;">
            O
          </div>
        </div>
        <h1 style="color: #111; font-size: 22px; margin: 0 0 20px 0; line-height: 1.3;">${subject}</h1>
        ${bodyHtml}
        ${ctaLabel ? `
          <div style="margin: 28px 0; text-align: center;">
            <a href="${href}"
               style="background: #f97316; color: white; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">
              ${ctaLabel} →
            </a>
          </div>
        ` : ''}
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 32px;">
          ¿Necesitas ayuda? <a href="mailto:support@oigagig.com" style="color: #f97316;">support@oigagig.com</a>
        </p>
        <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 16px;">
          OigaGIG • Servicios locales de confianza en Colombia
        </p>
      </div>
    `,
  };
}

interface AdminAlertProps {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  eventLabel?: string;
}

/** Branded wrapper for operational alerts sent to support@oigagig.com and admins. */
export function adminAlertEmail({ title, bodyHtml, ctaLabel, ctaHref, eventLabel }: AdminAlertProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';
  return {
    subject: `[OigaGIG Admin] ${title}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #fff;">
        <div style="border-bottom: 3px solid #f97316; padding-bottom: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">
            ${eventLabel || 'Alerta de plataforma'}
          </p>
          <h2 style="color: #111; margin: 0; font-size: 22px;">${title}</h2>
        </div>
        <div style="color: #333; font-size: 15px; line-height: 1.6;">${bodyHtml}</div>
        ${ctaLabel && ctaHref ? `
          <div style="margin: 28px 0 8px 0;">
            <a href="${ctaHref.startsWith('http') ? ctaHref : `${appUrl}${ctaHref}`}"
               style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              ${ctaLabel}
            </a>
          </div>
        ` : ''}
        <p style="margin-top: 32px; font-size: 12px; color: #888;">
          OigaGIG Admin • Este correo se envía a <a href="mailto:support@oigagig.com" style="color: #f97316;">support@oigagig.com</a>
        </p>
      </div>
    `,
  };
}
