import { NextResponse } from 'next/server';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(`data: ${JSON.stringify({
        users: 1284,
        gigs: 342,
        orders: 156,
        revenue: 12400000,
        pendingSupport: 47,
        activeChats: 23
      })}\n\n`);

      const interval = setInterval(() => {
        const update = {
          users: 1284 + Math.floor(Math.random() * 35),
          gigs: 342 + Math.floor(Math.random() * 12),
          orders: 156 + Math.floor(Math.random() * 8),
          revenue: 12400000 + Math.floor(Math.random() * 2800000),
          pendingSupport: Math.max(35, 47 - Math.floor(Math.random() * 15)),
          activeChats: 23 + Math.floor(Math.random() * 15)
        };
        controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
      }, 5000);

      return () => clearInterval(interval);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}