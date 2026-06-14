import { NextRequest } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Server-Sent Events endpoint for real-time notifications
// 2027-grade: Instant updates instead of 45s polling

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastChecked = new Date();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ message: 'connected' })}\n\n`));

      req.signal.addEventListener('abort', () => {
        closed = true;
        controller.close();
      });

      // Use a while loop with await to keep the async start() promise pending.
      // This helps keep the streaming response alive in serverless runtimes (Vercel).
      while (!closed) {
        try {
          const newNotifications = await prisma.notification.findMany({
            where: {
              userId,
              createdAt: { gt: lastChecked },
              read: false,
            },
            orderBy: { createdAt: 'asc' },
            take: 10,
          });

          if (newNotifications.length > 0) {
            for (const notif of newNotifications) {
              controller.enqueue(
                encoder.encode(
                  `event: notification\ndata: ${JSON.stringify({
                    id: notif.id,
                    title: notif.title,
                    message: notif.message,
                    link: notif.link,
                    category: notif.category,
                    createdAt: notif.createdAt,
                  })}\n\n`
                )
              );
            }
            lastChecked = new Date();
          }

          // Heartbeat to keep connection alive
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`));

          // Wait before next check (keeps the promise pending)
          await new Promise(resolve => setTimeout(resolve, 4000));
        } catch (err) {
          console.error('SSE error:', err);
          closed = true;
          controller.error(err);
          break;
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Important for Nginx/Vercel
    },
  });
}
