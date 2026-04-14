import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const messages = await prisma.orderMessage.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json({ messages })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.error("❌ No session found when sending message")
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const message = await prisma.orderMessage.create({
      data: {
        orderId: id,
        content: content.trim(),
        isFromBuyer: session.user.role === 'buyer'
      }
    })

    console.log(`✅ Message sent by ${session.user.role}`)
    return NextResponse.json({ message })
  } catch (error) {
    console.error("Message send error:", error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
