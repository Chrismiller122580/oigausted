import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getInquiryThreadForParticipant } from '@/lib/inquiry-queries'
import {
  CONTACT_BLOCKED_MESSAGE,
  detectContactInfo,
} from '@/lib/contact-moderation'
import { recordContactViolation } from '@/lib/contact-violation'
import { notifications } from '@/lib/notifications'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const participantThread = await getInquiryThreadForParticipant(threadId, userId)
    let staffView = false
    let thread = participantThread

    if (!thread) {
      // Admin / CS can read any inquiry thread
      const { requireAdminPanelSession } = await import('@/lib/admin-auth')
      const staffSession = await requireAdminPanelSession()
      if (!staffSession?.user?.id) {
        return NextResponse.json({ error: 'No autorizado para esta consulta' }, { status: 403 })
      }
      staffView = true
      const staffThread = await prisma.inquiryThread.findUnique({
        where: { id: threadId },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          seller: { select: { id: true, name: true, email: true } },
          gig: { select: { id: true, title: true } },
        },
      })
      if (!staffThread) {
        return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 })
      }
      thread = staffThread as typeof participantThread & typeof staffThread
    }

    const messages = await prisma.inquiryMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        isFromBuyer: true,
        createdAt: true,
        threadId: true,
      },
    })

    return NextResponse.json({ messages, thread, staffView })
  } catch (error) {
    console.error('Inquiry messages GET error:', error)
    return NextResponse.json({ error: 'Error cargando mensajes' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const thread = await getInquiryThreadForParticipant(threadId, userId)
    if (!thread) {
      return NextResponse.json({ error: 'No autorizado para esta consulta' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const content = (body.content || body.text || '').trim()
    if (!content) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
    }

    const detection = detectContactInfo(content)
    if (detection.blocked) {
      await recordContactViolation(userId, 'inquiry', threadId, detection.types, content)
      return NextResponse.json(
        { error: CONTACT_BLOCKED_MESSAGE, blocked: true, types: detection.types },
        { status: 422 }
      )
    }

    const isFromBuyer = userId === thread.buyerId
    const message = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.inquiryMessage.create({
        data: {
          threadId,
          content,
          isFromBuyer,
        },
      })
      await tx.inquiryThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      })
      return created
    })

    try {
      const recipientId = isFromBuyer ? thread.sellerId : thread.buyerId
      const senderRole = isFromBuyer ? 'comprador' : 'vendedor'
      const gigTitle = thread.gig.title

      await notifications.sendInApp(
        recipientId,
        'message',
        'Nueva consulta sobre un servicio',
        `${senderRole} te escribió sobre "${gigTitle}".`,
        `/messages/${threadId}`,
        {
          threadId,
          gigId: thread.gigId,
          gigTitle,
          orderId: threadId,
        }
      )
      // Email via message category template (respects messageAlerts + email prefs)
      await notifications.sendNotification({
        userId: recipientId,
        category: 'message',
        type: 'email',
        title: `Nueva consulta: ${gigTitle}`,
        message: `${senderRole} te escribió sobre "${gigTitle}".`,
        link: `/messages/${threadId}`,
        data: { gigTitle, threadId },
      })
    } catch (notifErr) {
      console.error('Failed to send inquiry message notification', notifErr)
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Inquiry messages POST error:', error)
    return NextResponse.json({ error: 'Error enviando mensaje' }, { status: 500 })
  }
}