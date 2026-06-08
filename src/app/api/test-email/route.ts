import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifications, resend as rawResend } from '@/lib/notifications';

// Simple protected test endpoint to send a test email
// Usage: POST /api/test-email with { "emailType": "welcome" | "order" | "review" | "password-reset", "to?": "someone@example.com" }
// Admins can pass "to" to send to any address directly.

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admins or the logged in user to test their own email
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailType = 'welcome', to } = await req.json();

    const isAdmin = (session.user as any)?.role === 'admin';

    // Direct send when admin provides a "to" address (bypasses user lookup)
    if (to && isAdmin && rawResend) {
      try {
        const subject = emailType === 'welcome' ? '¡Bienvenido a OigaUsted! (TEST)' :
                        emailType === 'order' ? 'Nuevo pedido recibido (TEST)' :
                        emailType === 'review' ? 'Nueva reseña recibida (TEST)' : 'Test email from OigaUsted';
        const html = `<div style="font-family:system-ui;padding:24px;max-width:600px;margin:0 auto;">
          <h2>Test email: ${emailType}</h2>
          <p>This was sent via /api/test-email with direct recipient override.</p>
          <p>App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'}</p>
        </div>`;

        const sendResult = await rawResend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'OigaUsted <support@oigagig.com>',
          to,
          subject,
          html,
        });
        return NextResponse.json({ success: true, message: `Direct test email sent to ${to}`, sendResult });
      } catch (e: any) {
        return NextResponse.json({ error: 'Direct send failed', details: e.message }, { status: 500 });
      }
    }

    let result;

    if (emailType === 'welcome') {
      result = await notifications.sendEmail(
        userId,
        '¡Bienvenido a OigaUsted!',
        'Gracias por registrarte. Ya puedes explorar y publicar servicios.'
      );
    } else if (emailType === 'order') {
      result = await notifications.sendEmail(
        userId,
        'Nuevo pedido recibido',
        'Un comprador ha solicitado uno de tus servicios.',
        undefined,
        { gigTitle: 'Limpieza Profunda', amount: 185000, orderId: 'test-123', buyerName: 'Cliente de Prueba' }
      );
    } else if (emailType === 'review') {
      result = await notifications.sendEmail(
        userId,
        'Nueva reseña recibida',
        'Has recibido una nueva reseña de 5 estrellas.',
        undefined,
        { gigTitle: 'Diseño de Logos', rating: 5, reviewerName: 'Cliente Satisfecho' }
      );
    } else if (emailType === 'password-reset') {
      result = await notifications.sendEmail(
        userId,
        'Restablece tu contraseña en OigaUsted',
        'Haz clic en el enlace del correo para crear una nueva contraseña. (Este es un correo de prueba)'
      );
    } else {
      return NextResponse.json({ error: 'Invalid emailType' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test email (${emailType}) sent`,
      result 
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email', 
      details: error.message 
    }, { status: 500 });
  }
}
