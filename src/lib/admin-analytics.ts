import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status'
import { prisma } from '@/lib/prisma'

export type AnalyticsIntegration = {
  id: string
  name: string
  description: string
  enabled: boolean
  status: 'active' | 'configured' | 'missing'
  dashboardUrl: string | null
  detail?: string
}

export type FunnelStep = {
  id: string
  label: string
  eventName: string
  count: number
  last7d: number
  last30d: number
  conversionFromPrevious: number | null
}

export type DailyTrendPoint = {
  date: string
  signups: number
  orders: number
  completedOrders: number
}

export type AdminAnalyticsPayload = {
  generatedAt: string
  siteUrl: string
  integrations: AnalyticsIntegration[]
  funnel: FunnelStep[]
  dailyTrends: DailyTrendPoint[]
  trackedEvents: Array<{ name: string; description: string; source: string }>
}

const TRACKED_EVENTS = [
  { name: 'signup_completed', description: 'User finished registration', source: '/signup' },
  { name: 'become_seller', description: 'Buyer upgraded to seller', source: '/profile' },
  { name: 'gig_created', description: 'Seller published a new gig', source: '/create-gig' },
  { name: 'checkout_started', description: 'Buyer opened checkout', source: '/checkout/[gigId]' },
  { name: 'payment_initiated', description: 'Wompi payment flow started', source: '/checkout/[gigId]' },
  { name: 'payment_completed', description: 'Order marked paid or completed', source: '/checkout, /orders' },
] as const

function daysAgo(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

function buildDailyTrends(
  signups: Array<{ createdAt: Date }>,
  orders: Array<{ createdAt: Date; status: string }>,
  completedStatus: string
): DailyTrendPoint[] {
  const days = 30
  const buckets = new Map<string, DailyTrendPoint>()

  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, { date: key, signups: 0, orders: 0, completedOrders: 0 })
  }

  for (const user of signups) {
    const key = user.createdAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (bucket) bucket.signups += 1
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.orders += 1
    if (order.status === completedStatus) bucket.completedOrders += 1
  }

  return Array.from(buckets.values())
}

export function getAnalyticsIntegrations(): AnalyticsIntegration[] {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  const vercelAnalyticsUrl =
    process.env.ADMIN_VERCEL_ANALYTICS_URL?.trim() || 'https://vercel.com/dashboard'
  const vercelSpeedUrl =
    process.env.ADMIN_VERCEL_SPEED_INSIGHTS_URL?.trim() || vercelAnalyticsUrl
  const gaDashboardUrl =
    process.env.ADMIN_GA_DASHBOARD_URL?.trim() || 'https://analytics.google.com/'

  return [
    {
      id: 'vercel-analytics',
      name: 'Vercel Web Analytics',
      description: 'Page views, visitors, and custom events via @vercel/analytics',
      enabled: true,
      status: 'active',
      dashboardUrl: vercelAnalyticsUrl,
      detail: 'Mounted globally in root layout',
    },
    {
      id: 'vercel-speed-insights',
      name: 'Vercel Speed Insights',
      description: 'Core Web Vitals and performance metrics',
      enabled: true,
      status: 'active',
      dashboardUrl: vercelSpeedUrl,
      detail: 'Mounted globally in root layout',
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics 4',
      description: 'Consent-gated funnel events and traffic analytics',
      enabled: !!gaId,
      status: gaId ? 'configured' : 'missing',
      dashboardUrl: gaDashboardUrl,
      detail: gaId ? `Measurement ID: ${gaId.slice(0, 6)}…` : 'Set NEXT_PUBLIC_GA_MEASUREMENT_ID',
    },
  ]
}

async function countGigs(where: { deletedAt: null; createdAt?: { gte: Date } } | { createdAt: { gte: Date } }) {
  try {
    return await prisma.gig.count({ where: where as { deletedAt: null; createdAt?: { gte: Date } } })
  } catch {
    const { deletedAt: _, ...rest } = where as { deletedAt: null; createdAt?: { gte: Date } }
    return await prisma.gig.count({ where: rest })
  }
}

export async function buildAdminAnalyticsPayload(): Promise<AdminAnalyticsPayload> {
  const now = new Date()
  const last7d = daysAgo(7)
  const last30d = daysAgo(30)
  const completedStatus = labelToPrismaStatus(OrderStatusLabel.Completed)
  const paidStatuses = [
    labelToPrismaStatus(OrderStatusLabel.Paid),
    labelToPrismaStatus(OrderStatusLabel.InProgress),
    completedStatus,
  ]

  const [
    totalSignups,
    signups7d,
    signups30d,
    totalSellers,
    sellers7d,
    sellers30d,
    totalGigs,
    gigs7d,
    gigs30d,
    totalCheckouts,
    checkouts7d,
    checkouts30d,
    totalPayments,
    payments7d,
    payments30d,
    totalCompleted,
    completed7d,
    completed30d,
    recentSignups,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last7d } } }),
    prisma.user.count({ where: { createdAt: { gte: last30d } } }),
    prisma.user.count({ where: { role: 'seller' } }),
    prisma.user.count({ where: { role: 'seller', createdAt: { gte: last7d } } }),
    prisma.user.count({ where: { role: 'seller', createdAt: { gte: last30d } } }),
    countGigs({ deletedAt: null }),
    countGigs({ deletedAt: null, createdAt: { gte: last7d } }),
    countGigs({ deletedAt: null, createdAt: { gte: last30d } }),
    prisma.order.count({ where: { status: { not: labelToPrismaStatus(OrderStatusLabel.Pending) } } }),
    prisma.order.count({
      where: {
        status: { not: labelToPrismaStatus(OrderStatusLabel.Pending) },
        createdAt: { gte: last7d },
      },
    }),
    prisma.order.count({
      where: {
        status: { not: labelToPrismaStatus(OrderStatusLabel.Pending) },
        createdAt: { gte: last30d },
      },
    }),
    prisma.order.count({ where: { status: { in: paidStatuses } } }),
    prisma.order.count({ where: { status: { in: paidStatuses }, createdAt: { gte: last7d } } }),
    prisma.order.count({ where: { status: { in: paidStatuses }, createdAt: { gte: last30d } } }),
    prisma.order.count({ where: { status: completedStatus } }),
    prisma.order.count({ where: { status: completedStatus, createdAt: { gte: last7d } } }),
    prisma.order.count({ where: { status: completedStatus, createdAt: { gte: last30d } } }),
    prisma.user.findMany({
      where: { createdAt: { gte: last30d } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: last30d } },
      select: { createdAt: true, status: true },
    }),
  ])

  const funnel: FunnelStep[] = [
    {
      id: 'signup',
      label: 'Signups',
      eventName: 'signup_completed',
      count: totalSignups,
      last7d: signups7d,
      last30d: signups30d,
      conversionFromPrevious: null,
    },
    {
      id: 'seller',
      label: 'Sellers',
      eventName: 'become_seller',
      count: totalSellers,
      last7d: sellers7d,
      last30d: sellers30d,
      conversionFromPrevious: pct(totalSellers, totalSignups),
    },
    {
      id: 'gig',
      label: 'Gigs created',
      eventName: 'gig_created',
      count: totalGigs,
      last7d: gigs7d,
      last30d: gigs30d,
      conversionFromPrevious: pct(totalGigs, totalSellers),
    },
    {
      id: 'checkout',
      label: 'Checkouts started',
      eventName: 'checkout_started',
      count: totalCheckouts,
      last7d: checkouts7d,
      last30d: checkouts30d,
      conversionFromPrevious: pct(totalCheckouts, totalGigs),
    },
    {
      id: 'payment',
      label: 'Payments initiated',
      eventName: 'payment_initiated',
      count: totalPayments,
      last7d: payments7d,
      last30d: payments30d,
      conversionFromPrevious: pct(totalPayments, totalCheckouts),
    },
    {
      id: 'completed',
      label: 'Payments completed',
      eventName: 'payment_completed',
      count: totalCompleted,
      last7d: completed7d,
      last30d: completed30d,
      conversionFromPrevious: pct(totalCompleted, totalPayments),
    },
  ]

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return {
    generatedAt: now.toISOString(),
    siteUrl,
    integrations: getAnalyticsIntegrations(),
    funnel,
    dailyTrends: buildDailyTrends(recentSignups, recentOrders, completedStatus),
    trackedEvents: TRACKED_EVENTS.map((e) => ({ ...e })),
  }
}