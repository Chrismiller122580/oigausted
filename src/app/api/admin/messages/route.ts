import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { listTicketMessages, isMissingSupportMessageTable } from '@/lib/support-tickets';
import { staffMessageDisplayName } from '@/lib/brand';
import { devLog } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export type AdminChatKind = 'order' | 'inquiry' | 'support';

/**
 * Admin/CS inbox over all platform conversations.
 *
 * GET ?view=threads&kind=order|inquiry|support|all&search=&limit=
 * GET ?view=thread&kind=order|inquiry|support&id=
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminPanelSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'threads';
    const kind = (searchParams.get('kind') || 'all') as AdminChatKind | 'all';
    const search = (searchParams.get('search') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '40', 10) || 40, 100);
    const id = searchParams.get('id') || '';

    if (view === 'thread') {
      if (!id || (kind !== 'order' && kind !== 'inquiry' && kind !== 'support')) {
        return NextResponse.json(
          { error: 'id and kind (order|inquiry|support) required' },
          { status: 400 }
        );
      }
      const detail = await loadThreadDetail(kind, id);
      if (!detail) {
        return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
      }
      return NextResponse.json(detail);
    }

    // List threads across kinds
    const kinds: AdminChatKind[] =
      kind === 'all' ? ['order', 'inquiry', 'support'] : [kind as AdminChatKind];

    const perKind = Math.max(10, Math.ceil(limit / kinds.length));
    const batches = await Promise.all(
      kinds.map(async (k) => {
        try {
          return await listThreads(k, search, perKind);
        } catch (e) {
          devLog(`Admin messages list ${k} failed:`, e);
          return [];
        }
      })
    );

    const threads = batches
      .flat()
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )
      .slice(0, limit);

    const countByKind = Object.fromEntries(
      kinds.map((k, i) => [k, batches[i]?.length ?? 0])
    ) as Partial<Record<AdminChatKind, number>>;

    return NextResponse.json({
      threads,
      counts: {
        order: countByKind.order ?? 0,
        inquiry: countByKind.inquiry ?? 0,
        support: countByKind.support ?? 0,
        total: threads.length,
      },
    });
  } catch (error) {
    devLog('Admin messages error:', error);
    return NextResponse.json({ error: 'Error cargando mensajes' }, { status: 500 });
  }
}

type ThreadSummary = {
  id: string;
  kind: AdminChatKind;
  title: string;
  subtitle: string;
  status: string;
  messageCount: number;
  lastMessageAt: string;
  lastPreview: string;
  lastDirection: 'inbound' | 'outbound' | 'staff' | 'user' | 'unknown';
  participants: {
    buyer?: { id: string; name: string | null; email: string | null };
    seller?: { id: string; name: string | null; email: string | null };
    user?: { id: string; name: string | null; email: string | null };
  };
};

async function listThreads(
  kind: AdminChatKind,
  search: string,
  take: number
): Promise<ThreadSummary[]> {
  if (kind === 'order') {
    const where: Prisma.OrderWhereInput = {
      messages: { some: {} },
    };
    if (search) {
      where.OR = [
        { id: search },
        { buyer: { email: { contains: search } } },
        { buyer: { name: { contains: search } } },
        { seller: { email: { contains: search } } },
        { seller: { name: { contains: search } } },
        { gig: { title: { contains: search } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        gig: { select: { title: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            isFromBuyer: true,
            createdAt: true,
            fileName: true,
          },
        },
        _count: { select: { messages: true } },
      },
    });

    return orders.map((o: (typeof orders)[number]) => {
      const last = o.messages[0];
      return {
        id: o.id,
        kind: 'order' as const,
        title: o.gig?.title || `Pedido ${o.id.slice(0, 8)}`,
        subtitle: `${o.buyer?.email || 'buyer'} ↔ ${o.seller?.email || 'seller'}`,
        status: o.status,
        messageCount: o._count.messages,
        lastMessageAt: (last?.createdAt || o.updatedAt).toISOString(),
        lastPreview: last
          ? last.fileName
            ? `📎 ${last.fileName}${last.content ? `: ${last.content}` : ''}`
            : last.content
          : '(sin mensajes)',
        lastDirection: last
          ? last.isFromBuyer
            ? 'inbound'
            : 'outbound'
          : 'unknown',
        participants: {
          buyer: o.buyer,
          seller: o.seller,
        },
      };
    });
  }

  if (kind === 'inquiry') {
    const where: Prisma.InquiryThreadWhereInput = {
      messages: { some: {} },
    };
    if (search) {
      where.OR = [
        { id: search },
        { buyer: { email: { contains: search } } },
        { buyer: { name: { contains: search } } },
        { seller: { email: { contains: search } } },
        { seller: { name: { contains: search } } },
        { gig: { title: { contains: search } } },
      ];
    }

    const threads = await prisma.inquiryThread.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        gig: { select: { title: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, isFromBuyer: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return threads.map((t: (typeof threads)[number]) => {
      const last = t.messages[0];
      return {
        id: t.id,
        kind: 'inquiry' as const,
        title: t.gig?.title ? `Consulta: ${t.gig.title}` : `Consulta ${t.id.slice(0, 8)}`,
        subtitle: `${t.buyer?.email || 'buyer'} ↔ ${t.seller?.email || 'seller'}`,
        status: t.status,
        messageCount: t._count.messages,
        lastMessageAt: (last?.createdAt || t.updatedAt).toISOString(),
        lastPreview: last?.content || '(sin mensajes)',
        lastDirection: last
          ? last.isFromBuyer
            ? 'inbound'
            : 'outbound'
          : 'unknown',
        participants: {
          buyer: t.buyer,
          seller: t.seller,
        },
      };
    });
  }

  // support
  const where: Prisma.SupportTicketWhereInput = {};
  if (search) {
    where.OR = [
      { id: search },
      { subject: { contains: search } },
      { user: { email: { contains: search } } },
      { user: { name: { contains: search } } },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take,
    select: {
      id: true,
      subject: true,
      status: true,
      message: true,
      adminReply: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const withCounts = await Promise.all(
    tickets.map(async (t: (typeof tickets)[number]) => {
      let messageCount = 1 + (t.adminReply ? 1 : 0);
      let lastPreview = t.adminReply || t.message;
      let lastAt = t.updatedAt;
      let lastDirection: ThreadSummary['lastDirection'] = t.adminReply ? 'staff' : 'user';

      try {
        const msgs = await listTicketMessages(t.id, { includeInternal: true });
        if (msgs.length > 0) {
          messageCount = msgs.length;
          const last = msgs[msgs.length - 1];
          lastPreview = last.isInternal ? `[interno] ${last.body}` : last.body;
          lastAt = new Date(last.createdAt);
          lastDirection = last.isInternal
            ? 'staff'
            : last.isStaff
              ? 'staff'
              : 'user';
        }
      } catch (e) {
        if (!isMissingSupportMessageTable(e)) throw e;
      }

      return {
        id: t.id,
        kind: 'support' as const,
        title: t.subject,
        subtitle: t.user?.email || 'usuario',
        status: t.status,
        messageCount,
        lastMessageAt: lastAt.toISOString(),
        lastPreview,
        lastDirection,
        participants: { user: t.user },
      };
    })
  );

  return withCounts;
}

async function loadThreadDetail(kind: AdminChatKind, id: string) {
  if (kind === 'order') {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        gig: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            isFromBuyer: true,
            createdAt: true,
            fileUrl: true,
            fileName: true,
          },
        },
      },
    });
    if (!order) return null;

    return {
      kind: 'order' as const,
      id: order.id,
      status: order.status,
      title: order.gig?.title || `Pedido ${order.id.slice(0, 8)}`,
      link: `/orders/${order.id}`,
      participants: {
        buyer: order.buyer,
        seller: order.seller,
      },
      messages: order.messages.map((m: (typeof order.messages)[number]) => ({
        id: m.id,
        body: m.content,
        createdAt: m.createdAt,
        direction: m.isFromBuyer ? ('buyer' as const) : ('seller' as const),
        label: m.isFromBuyer
          ? `Comprador · ${order.buyer?.name || order.buyer?.email || 'buyer'}`
          : `Vendedor · ${order.seller?.name || order.seller?.email || 'seller'}`,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        isInternal: false,
      })),
    };
  }

  if (kind === 'inquiry') {
    const thread = await prisma.inquiryThread.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        gig: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            isFromBuyer: true,
            createdAt: true,
          },
        },
      },
    });
    if (!thread) return null;

    return {
      kind: 'inquiry' as const,
      id: thread.id,
      status: thread.status,
      title: thread.gig?.title
        ? `Consulta: ${thread.gig.title}`
        : `Consulta ${thread.id.slice(0, 8)}`,
      link: `/messages/${thread.id}`,
      participants: {
        buyer: thread.buyer,
        seller: thread.seller,
      },
      messages: thread.messages.map((m: (typeof thread.messages)[number]) => ({
        id: m.id,
        body: m.content,
        createdAt: m.createdAt,
        direction: m.isFromBuyer ? ('buyer' as const) : ('seller' as const),
        label: m.isFromBuyer
          ? `Comprador · ${thread.buyer?.name || thread.buyer?.email || 'buyer'}`
          : `Vendedor · ${thread.seller?.name || thread.seller?.email || 'seller'}`,
        isInternal: false,
      })),
    };
  }

  // support
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      status: true,
      message: true,
      adminReply: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  if (!ticket) return null;

  let messages = await listTicketMessages(ticket.id, { includeInternal: true });

  // Ensure original + legacy reply always visible even if thread table empty/backfill incomplete
  if (messages.length === 0) {
    messages = [
      {
        id: `${ticket.id}-origin`,
        ticketId: ticket.id,
        authorId: ticket.user?.id || null,
        body: ticket.message,
        isInternal: false,
        isStaff: false,
        createdAt: ticket.createdAt,
        author: ticket.user,
      },
    ];
    if (ticket.adminReply?.trim()) {
      messages.push({
        id: `${ticket.id}-admin`,
        ticketId: ticket.id,
        authorId: null,
        body: ticket.adminReply,
        isInternal: false,
        isStaff: true,
        createdAt: ticket.updatedAt,
        author: null,
      });
    }
  } else {
    // Prepend origin if thread was created before opening-message write
    const hasUserOrigin = messages.some((m) => !m.isStaff && !m.isInternal);
    if (!hasUserOrigin && ticket.message) {
      messages = [
        {
          id: `${ticket.id}-origin`,
          ticketId: ticket.id,
          authorId: ticket.user?.id || null,
          body: ticket.message,
          isInternal: false,
          isStaff: false,
          createdAt: ticket.createdAt,
          author: ticket.user,
        },
        ...messages,
      ];
    }
  }

  return {
    kind: 'support' as const,
    id: ticket.id,
    status: ticket.status,
    title: ticket.subject,
    link: `/admin/support?id=${ticket.id}`,
    participants: { user: ticket.user },
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      direction: m.isInternal
        ? ('internal' as const)
        : m.isStaff
          ? ('staff' as const)
          : ('user' as const),
      // Public staff → OigaGIG only; internal notes may show author for ops
      label: m.isInternal
        ? staffMessageDisplayName({
            internal: true,
            authorName: m.author?.name,
            authorEmail: m.author?.email,
          })
        : m.isStaff
          ? staffMessageDisplayName()
          : `Usuario · ${ticket.user?.name || ticket.user?.email || 'user'}`,
      isInternal: m.isInternal,
    })),
  };
}
