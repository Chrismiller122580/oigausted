import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notifications } from '@/lib/notifications';

// Simple protected test endpoint to send a test email
// Usage: POST /api/test-email with { "emailType": "welcome" | "order" | "review" }

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admins or the logged in user to test their own email
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailType = 'welcome' } = await req.json();
    const userId = session.user.id;

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
        { gigTitle: 'Limpieza Profunda', amount: 185000, orderId: 'test-123', buyerName: 'Cliente de Prueba' }
      );
    } else if (emailType === 'review') {
      result = await notifications.sendEmail(
        userId,
        'Nueva reseña recibida',
        'Has recibido una nueva reseña de 5 estrellas.',
        { gigTitle: 'Diseño de Logos', rating: 5, reviewerName: 'Cliente Satisfecho' }
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
