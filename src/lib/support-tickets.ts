import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type SupportThreadMessage = {
  id: string
  ticketId: string
  authorId: string | null
  body: string
  isInternal: boolean
  isStaff: boolean
  createdAt: Date | string
  author?: { id: string; name: string | null; email: string | null } | null
}

export function isMissingSupportMessageTable(err: unknown): boolean {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : ''
  const msg = err instanceof Error ? err.message : String(err)
  return (
    code === 'P2021' ||
    code === 'P2022' ||
    (msg.includes('SupportTicketMessage') &&
      (msg.includes('does not exist') || msg.includes('P2021') || msg.includes('P2022')))
  )
}

const authorSelect = {
  id: true,
  name: true,
  email: true,
} as const

/** Load thread messages. Users never see isInternal rows. */
export async function listTicketMessages(
  ticketId: string,
  opts: { includeInternal: boolean },
): Promise<SupportThreadMessage[]> {
  try {
    const messages = await prisma.supportTicketMessage.findMany({
      where: {
        ticketId,
        ...(opts.includeInternal ? {} : { isInternal: false }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: authorSelect },
      },
    })
    return messages
  } catch (err) {
    if (isMissingSupportMessageTable(err)) return []
    throw err
  }
}

/** Create the opening user message when a ticket is opened. */
export async function createOpeningMessage(opts: {
  ticketId: string
  userId: string
  body: string
  createdAt?: Date
}): Promise<SupportThreadMessage | null> {
  try {
    return await prisma.supportTicketMessage.create({
      data: {
        ticketId: opts.ticketId,
        authorId: opts.userId,
        body: opts.body,
        isInternal: false,
        isStaff: false,
        ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
      },
      include: { author: { select: authorSelect } },
    })
  } catch (err) {
    if (isMissingSupportMessageTable(err)) {
      console.warn('SupportTicketMessage table missing; skipping opening message row.')
      return null
    }
    throw err
  }
}

/** Append a staff or user message to the thread. */
export async function appendTicketMessage(opts: {
  ticketId: string
  authorId: string
  body: string
  isStaff: boolean
  isInternal?: boolean
}): Promise<SupportThreadMessage | null> {
  const body = opts.body.trim()
  if (!body) return null

  try {
    return await prisma.supportTicketMessage.create({
      data: {
        ticketId: opts.ticketId,
        authorId: opts.authorId,
        body,
        isStaff: opts.isStaff,
        isInternal: opts.isStaff ? Boolean(opts.isInternal) : false,
      },
      include: { author: { select: authorSelect } },
    })
  } catch (err) {
    if (isMissingSupportMessageTable(err)) {
      console.warn('SupportTicketMessage table missing; message not persisted to thread.')
      return null
    }
    throw err
  }
}

/** Include messages on a ticket query; empty array if table missing. */
export async function withTicketMessages<T extends { id: string }>(
  ticket: T,
  opts: { includeInternal: boolean },
): Promise<T & { messages: SupportThreadMessage[] }> {
  const messages = await listTicketMessages(ticket.id, opts)
  return { ...ticket, messages }
}

export type TicketListInclude = Prisma.SupportTicketInclude
