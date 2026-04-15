import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const orderId = resolvedParams.id

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial messages
      const initialMessages = await prisma.orderMessage.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' }
      })
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ messages: initialMessages })}\n\n`))

      // Poll for new messages (lightweight)
      let lastMessageTime = new Date()

      const interval = setInterval(async () => {
        try {
          const newMessages = await prisma.orderMessage.findMany({
            where: { 
              orderId,
              createdAt: { gt: lastMessageTime }
            },
            orderBy: { createdAt: 'asc' }
          })

          if (newMessages.length > 0) {
            lastMessageTime = newMessages[newMessages.length - 1].createdAt
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ messages: newMessages })}\n\n`))
          }
        } catch (err) {
          console.error(err)
        }
      }, 1500) // Check every 1.5s for new messages

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const message = await prisma.orderMessage.create({
      data: {
        orderId,
        content: content.trim(),
        isFromBuyer: session.user.role === 'buyer'
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
