import { prisma } from '@/lib/prisma'

const threadInclude = {
  gig: { select: { id: true, title: true, imageUrl: true, price: true } },
  buyer: { select: { id: true, name: true, profilePicture: true, email: true } },
  seller: {
    select: {
      id: true,
      name: true,
      businessName: true,
      profilePicture: true,
      slug: true,
      email: true,
    },
  },
} as const

export class InquiryThreadError extends Error {
  constructor(
    message: string,
    public code: 'GIG_NOT_FOUND' | 'CANNOT_INQUIRE_OWN_GIG' | 'GIG_UNAVAILABLE'
  ) {
    super(message)
    this.name = 'InquiryThreadError'
  }
}

export async function getOrCreateInquiryThread(buyerId: string, gigId: string) {
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    select: { id: true, sellerId: true, isActive: true, deletedAt: true },
  })

  if (!gig) {
    throw new InquiryThreadError('Servicio no encontrado', 'GIG_NOT_FOUND')
  }
  if (gig.deletedAt || !gig.isActive) {
    throw new InquiryThreadError('Este servicio no está disponible', 'GIG_UNAVAILABLE')
  }
  if (gig.sellerId === buyerId) {
    throw new InquiryThreadError('No puedes enviar consultas a tu propio servicio', 'CANNOT_INQUIRE_OWN_GIG')
  }

  return prisma.inquiryThread.upsert({
    where: { buyerId_gigId: { buyerId, gigId } },
    create: {
      buyerId,
      sellerId: gig.sellerId,
      gigId,
      status: 'open',
    },
    update: {},
    include: threadInclude,
  })
}

export async function listInquiryThreadsForUser(userId: string) {
  return prisma.inquiryThread.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      ...threadInclude,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          content: true,
          isFromBuyer: true,
          createdAt: true,
        },
      },
    },
  })
}

export async function getInquiryThreadForParticipant(threadId: string, userId: string) {
  return prisma.inquiryThread.findFirst({
    where: {
      id: threadId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: threadInclude,
  })
}