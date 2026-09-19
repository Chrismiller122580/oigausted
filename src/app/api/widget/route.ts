import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStaffRole, getUserRole } from '@/lib/session'
import { guestWidget, WIDGET_DEEP_LINKS, type WidgetPayload } from '@/lib/widget-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ACTIVE_ORDER = ['Pending', 'Paid', 'In Progress']

type SellerRecentOrder = {
  id: string
  status: string
  gig: { title: string } | null
  buyer: { name: string | null } | null
}

type BuyerRecentOrder = {
  id: string
  status: string
  gig: { title: string } | null
  seller: { name: string | null; businessName: string | null } | null
}

function firstName(name?: string | null) {
  if (!name) return null
  return name.trim().split(/\s+/)[0] || null
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(guestWidget(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const userId = session.user.id
  const role = getUserRole(session)
  const staffRole = getStaffRole(session)
  const name = firstName(session.user.name)

  try {
    if (staffRole || role === 'admin') {
      const [gigs, sellers, pendingOrders] = await Promise.all([
        prisma.gig.count().catch(() => 0),
        prisma.user.count({ where: { role: 'seller' } }),
        prisma.order.count({ where: { status: { in: ACTIVE_ORDER } } }),
      ])
      const payload: WidgetPayload = {
        role: 'admin',
        staffRole,
        greeting: name ? `Panel, ${name}` : 'Panel OigaGIG',
        stats: [
          { label: 'Gigs', value: String(gigs), href: WIDGET_DEEP_LINKS.admin },
          { label: 'Vendedores', value: String(sellers), href: WIDGET_DEEP_LINKS.admin },
          { label: 'Activos', value: String(pendingOrders), href: WIDGET_DEEP_LINKS.admin },
        ],
        items: [
          { title: 'Ir al panel', subtitle: staffRole ? `Staff · ${staffRole}` : 'Administración', href: WIDGET_DEEP_LINKS.admin },
        ],
        primary: { label: 'Abrir admin', href: WIDGET_DEEP_LINKS.admin },
        secondary: { label: 'Ver gigs', href: WIDGET_DEEP_LINKS.gigs },
        updatedAt: new Date().toISOString(),
      }
      return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (role === 'seller') {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const [newOrders, inProgress, monthPaid, recent] = await Promise.all([
        prisma.order.count({ where: { sellerId: userId, status: { in: ['Pending', 'Paid'] } } }),
        prisma.order.count({ where: { sellerId: userId, status: 'In Progress' } }),
        prisma.order.aggregate({
          where: {
            sellerId: userId,
            status: { in: ['Paid', 'In Progress', 'Completed'] },
            createdAt: { gte: monthStart },
          },
          _sum: { price: true },
        }),
        prisma.order.findMany({
          where: { sellerId: userId },
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: {
            id: true,
            status: true,
            price: true,
            gig: { select: { title: true } },
            buyer: { select: { name: true } },
          },
        }),
      ])

      const recentOrders = recent as SellerRecentOrder[]

      const payload: WidgetPayload = {
        role: 'seller',
        greeting: name ? `Hola, ${name}` : 'Su panel',
        city: (session.user as { city?: string }).city ?? null,
        stats: [
          { label: 'Nuevos', value: String(newOrders), href: WIDGET_DEEP_LINKS.sellerOrders },
          { label: 'En curso', value: String(inProgress), href: WIDGET_DEEP_LINKS.sellerOrders },
          { label: 'Mes', value: money(Number(monthPaid._sum?.price || 0)), href: WIDGET_DEEP_LINKS.seller },
        ],
        items: recentOrders.map((o) => ({
          title: o.gig?.title || 'Pedido',
          subtitle: o.buyer?.name || 'Comprador',
          badge: o.status,
          href: `${WIDGET_DEEP_LINKS.home}/orders/${o.id}`,
        })),
        primary: { label: 'Pedidos', href: WIDGET_DEEP_LINKS.sellerOrders },
        secondary: { label: 'Publicar gig', href: WIDGET_DEEP_LINKS.sellerNewGig },
        updatedAt: new Date().toISOString(),
      }
      return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
    }

    const [inProgress, pendingReviews, recent] = await Promise.all([
      prisma.order.count({
        where: { buyerId: userId, status: { in: ACTIVE_ORDER } },
      }),
      prisma.order.count({
        where: {
          buyerId: userId,
          status: 'Completed',
          reviews: { none: { reviewerId: userId } },
        },
      }).catch(async () =>
        prisma.order.count({ where: { buyerId: userId, status: 'Completed' } }),
      ),
      prisma.order.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true,
          status: true,
          price: true,
          gig: { select: { title: true } },
          seller: { select: { name: true, businessName: true } },
        },
      }),
    ])

    const recentOrders = recent as BuyerRecentOrder[]

    const payload: WidgetPayload = {
      role: 'buyer',
      greeting: name ? `Hola, ${name}` : 'Hola',
      stats: [
        { label: 'En curso', value: String(inProgress), href: WIDGET_DEEP_LINKS.orders },
        { label: 'Reseñas', value: String(pendingReviews), href: WIDGET_DEEP_LINKS.orders },
      ],
      items: recentOrders.map((o) => ({
        title: o.gig?.title || 'Servicio',
        subtitle: o.seller?.businessName || o.seller?.name || 'Profesional',
        badge: o.status,
        href: `${WIDGET_DEEP_LINKS.home}/orders/${o.id}`,
      })),
      primary: { label: 'Buscar servicio', href: WIDGET_DEEP_LINKS.gigs },
      secondary: { label: 'Mis pedidos', href: WIDGET_DEEP_LINKS.buyer },
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[widget]', err)
    return NextResponse.json(guestWidget(), { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}
