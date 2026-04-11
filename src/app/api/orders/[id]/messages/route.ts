import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const orderId = resolvedParams.id

    const body = await request.json()
    const { content, isFromBuyer = true } = body

    const message = await prisma.orderMessage.create({
      data: {
        content,
        isFromBuyer: Boolean(isFromBuyer),
        orderId: orderId,
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
